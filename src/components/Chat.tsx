'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import { useChat, UIMessage } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai';
import { useSession } from 'next-auth/react';
import { SelectChangeEvent } from '@mui/material/Select';
import { IconButton } from '@mui/material';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { resizeImage } from '@/components/utils/resizeImage';
import HeaderAppBar from '@/components/HeaderAppBar';
import MessagesContainer from '@/components/MessagesContainer';
import SendMessageContainer from '@/components/SendMessageContainer';
import { Model, Status } from '@/types/types';
import {
	MAX_IMAGES,
	MAX_FILES,
	models,
	temperatures,
	reasoningEfforts,
	getReasoningEfforts,
	textVerbosities,
} from '@/components/utils/constants';

const STORAGE_KEYS = {
	CHAT_HISTORY: 'sofosChatHistory',
	MODEL: 'sofosModel',
	TEMPERATURE: 'sofosTemperature',
	REASONING_EFFORT: 'sofosReasoningEffort',
	TEXT_VERBOSITY: 'sofosTextVerbosity',
	CURRENT_CHAT_INDEX: 'sofosCurrentChatIndex',
} as const;

const saveChatHistoryToLocalStorage = (chatHistory: UIMessage[][]): void => {
	if (!chatHistory) return;

	const filteredChatHistory = chatHistory.filter(
		chat => chat !== null && chat !== undefined
	);

	try {
		localStorage.setItem(
			STORAGE_KEYS.CHAT_HISTORY,
			JSON.stringify(filteredChatHistory, (key, value) => {
				if (key === 'createdAt' && value instanceof Date) {
					return value.toISOString();
				}
				if (key === 'experimental_attachments' && value) {
					return null;
				}
				return value;
			})
		);
	} catch (error) {
		console.error('Error saving chat history to localStorage:', error);
	}
};

const Chat: React.FC = () => {
	const [model, setModel] = useState<Model>(models[0]);
	const hasMinimalEffort = !model.value.startsWith('o');
	const updatedReasoningEfforts = getReasoningEfforts(hasMinimalEffort);
	const [temperature, setTemperature] = useState<number>(temperatures[0].value);
	const [reasoningEffort, setReasoningEffort] = useState<string>(updatedReasoningEfforts[0].value);
	const [textVerbosity, setTextVerbosity] = useState<string>(textVerbosities[1].value);
	const [isScrolling, setIsScrolling] = useState<boolean>(false);
	const [images, setImages] = useState<File[]>([]);
	const [files, setFiles] = useState<File[]>([]);
	const [chatHistory, setChatHistory] = useState<UIMessage[][]>([]);
	const [currentChatIndex, setCurrentChatIndex] = useState<number>(-1);
	const [open, setOpen] = useState(false);
	const [distanceFromBottom, setDistanceFromBottom] = useState<number | null>(null);
	const [input, setInput] = useState('');

	const {
		status, // submitted, streaming, ready, error
		messages,
		sendMessage,
		setMessages,
		regenerate,
		stop,
		error,
	} = useChat(
		{
			transport: new DefaultChatTransport({
				api: '/api/use-stream-text',
			}),
			onFinish: ({ message }) => {
				onFinishCallback(message);
			},
			// Prevent "Maximum update depth exceeded" error
			experimental_throttle: 100,
		}
	);

	const scrollableGridRef = useRef(null);
	const { data: session } = useSession();
	const user = session?.user;
	const hasImages = images.length > 0;
	const hasFiles = files.length > 0;
	const isLoading = status === Status.SUBMITTED || status === Status.STREAMING;
	const isDisabled = isLoading || !!error;

	useEffect(() => {
		const storedModelValue = localStorage.getItem(STORAGE_KEYS.MODEL);
		const storedTemperature = localStorage.getItem(STORAGE_KEYS.TEMPERATURE);
		const storedReasoningEffort = localStorage.getItem(STORAGE_KEYS.REASONING_EFFORT);
		const storedTextVerbosity = localStorage.getItem(STORAGE_KEYS.TEXT_VERBOSITY);
		const storedChatHistory = localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
		const storedCurrentChatIndex = localStorage.getItem(STORAGE_KEYS.CURRENT_CHAT_INDEX);

		if (storedModelValue) {
			const foundModel = models.find(model => model.value === storedModelValue);

			if (foundModel) {
				setModel(foundModel);
			}
		}

		if (storedTemperature) {
			setTemperature(Number(storedTemperature));
		}

		if (storedReasoningEffort) {
			setReasoningEffort(storedReasoningEffort);
		}

		if (storedTextVerbosity) {
			setTextVerbosity(storedTextVerbosity);
		}

		if (storedChatHistory && storedCurrentChatIndex) {
			setCurrentChatIndex(Number(storedCurrentChatIndex));

			const parsedChatHistory: UIMessage[][] = JSON.parse(storedChatHistory, (key, value) => {
				if (key === 'createdAt' && typeof value === 'string') {
					return new Date(value);
				}
				return value;
			});

			if (parsedChatHistory?.length > 0) {
				setChatHistory(parsedChatHistory);

				const parsedMessages = parsedChatHistory[Number(storedCurrentChatIndex)];

				if (parsedMessages?.length > 0) {
					setMessages(parsedMessages);
				}
			}
		}

		const handleAutoScroll = (event: WheelEvent) => {
			const grid = scrollableGridRef.current as HTMLDivElement | null;

			if (!grid) return;

			const bounding = grid.getBoundingClientRect();

			if (event.clientY >= bounding.top && event.clientY <= bounding.bottom) {
				grid.scrollTop += event.deltaY;
			}
		};

		window.addEventListener('wheel', handleAutoScroll, { passive: false });

		return () => {
			window.removeEventListener('wheel', handleAutoScroll);
		};
	}, []);

	const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		const allFiles = [...images, ...files];
		const dataTransfer = new DataTransfer();

		allFiles.forEach(file => dataTransfer.items.add(file));

		const fileList = dataTransfer.files;

		handleSubmit(e, fileList);

		setImages([]);
		setFiles([]);
	};

	const handleFilesChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
		if (!event.target.files) return;

		const fileArray = Array.from(event.target.files);
		const newImages = fileArray.filter(file => file.type.startsWith('image/'));
		const newFiles = fileArray.filter(file => !file.type.startsWith('image/'));
		const resizedImages: File[] = [];

		for (const image of newImages) {
			try {
				const resizedImage = await resizeImage(image, 2048);
				resizedImages.push(resizedImage);
			} catch (error) {
				console.error(`Error resizing image ${image.name}:`, error);
			}
		}

		setImages(prevImages => {
			const updatedImages = [...prevImages, ...resizedImages].slice(0, MAX_IMAGES);

			if (resizedImages.length > MAX_IMAGES) {
				console.warn(`You can only upload up to ${MAX_IMAGES} images.`);
			}
			return updatedImages;
		});

		setFiles(prevFiles => {
			const updatedFiles = [...prevFiles, ...newFiles].slice(0, MAX_FILES);

			if (newFiles.length > MAX_FILES) {
				console.warn(`You can only upload up to ${MAX_FILES} files.`);
			}

			return updatedFiles;
		});
	}, []);

	const handleRemoveImage = useCallback((index: number) => {
		setImages(prevImages => prevImages.filter((_, i) => i !== index));
	}, []);

	const handleRemoveFile = useCallback((index: number) => {
		setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
	}, []);

	const handleModelChange = useCallback((event: SelectChangeEvent) => {
		const { value } = event.target;
		const selectedModel = models.find(model => model.value === value);

		if (!selectedModel) return;

		setModel(selectedModel);

		try {
			localStorage.setItem(STORAGE_KEYS.MODEL, value);
		} catch (error) {
			console.error('Error saving model to localStorage:', error);
		}

		if (value.startsWith('o') && reasoningEffort === reasoningEfforts[0].value) {
			const newReasoningEffort = reasoningEfforts[1].value;
			setReasoningEffort(newReasoningEffort);

			try {
				localStorage.setItem(STORAGE_KEYS.REASONING_EFFORT, newReasoningEffort);
			} catch (error) {
				console.error('Error saving reasoning effort to localStorage:', error);
			}
		}
	}, [reasoningEffort]);

	const handleTemperatureChange = useCallback((event: SelectChangeEvent) => {
		const { value } = event.target;
		setTemperature(Number(value));

		try {
			localStorage.setItem(STORAGE_KEYS.TEMPERATURE, value);
		} catch (error) {
			console.error('Error saving temperature to localStorage:', error);
		}
	}, []);

	const handleReasoningEffortChange = useCallback((event: SelectChangeEvent) => {
		const { value } = event.target;
		setReasoningEffort(value);

		try {
			localStorage.setItem(STORAGE_KEYS.REASONING_EFFORT, value);
		} catch (error) {
			console.error('Error saving reasoning effort to localStorage:', error);
		}
	}, []);

	const handleTextVerbosityChange = useCallback((event: SelectChangeEvent) => {
		const { value } = event.target;
		setTextVerbosity(value);

		try {
			localStorage.setItem(STORAGE_KEYS.TEXT_VERBOSITY, value);
		} catch (error) {
			console.error('Error saving text verbosity to localStorage:', error);
		}
	}, []);

	const handleDrawerOpen = useCallback(() => {
		setOpen(true);
	}, []);

	const handleDrawerClose = useCallback(() => {
		setOpen(false);
	}, []);

	const autoScroll = useCallback(() => {
		setIsScrolling(true);
		setTimeout(() => setIsScrolling(false), 2000);
	}, []);

	const onFinishCallback = useCallback((message: UIMessage) => {
		if (error) return;

		setMessages((prevMessages: UIMessage[]): UIMessage[] => {
			const isNewChat = prevMessages.length <= 2;
			(message as any).createdAt = new Date();

			setModel((prevModel) => {
				(message as any).modelId = prevModel.label;
				return prevModel;
			});

				const updatedMessages: UIMessage[] = [...prevMessages];
				// For some reason the last assistant message is incomplete after
				// importing 'useChat' from '@ai-sdk/react' instead of 'ai'
				updatedMessages[updatedMessages.length - 1] = message;

				if (updatedMessages && updatedMessages.length > 0) {
					// Update chat history in the state and local storage
					setChatHistory((prevChatHistory: UIMessage[][]) => {
						setCurrentChatIndex((prevCurrentChatIndex) => {
							const index = isNewChat ? prevChatHistory.length : prevCurrentChatIndex;

							// Only update currentChatIndex if it's a new chat
							if (isNewChat) {
								try {
									localStorage.setItem(STORAGE_KEYS.CURRENT_CHAT_INDEX, index.toString());
								} catch (error) {
									console.error('Error saving current chat index to localStorage:', error);
								}
								return index;
							}

							return prevCurrentChatIndex;
						});

						const updatedChatHistory = [...prevChatHistory];

						if (isNewChat) {
							updatedChatHistory.push(updatedMessages);
						} else {
							// For existing chats, update at the current index
							// Note: we need to get the current index again since we can't access it directly
							// We'll use the length check to determine if we should push or update
							if (prevChatHistory.length === 0) {
								updatedChatHistory.push(updatedMessages);
							} else {
								// Update the last chat in history for existing chats
								updatedChatHistory[updatedChatHistory.length - 1] = updatedMessages;
							}
						}

						// Keep only the last 20 conversations
						const finalChatHistory = updatedChatHistory.slice(-20);
						saveChatHistoryToLocalStorage(finalChatHistory);

						return finalChatHistory;
					});
				}

			return updatedMessages;
		});
	}, [error, setMessages]);

	const handleSubmit = useCallback((e: React.FormEvent<HTMLFormElement>, fileList: FileList) => {
		e.preventDefault();

		const messageOptions = {
			body: { model, temperature, reasoningEffort, textVerbosity },
		};

		const messageData = fileList?.length > 0
			? { text: input, files: fileList }
			: { text: input };

		sendMessage(messageData, messageOptions).then();
		setInput('');
	}, [input, model, temperature, reasoningEffort, textVerbosity, sendMessage]);

	return (
		<div onClick={handleDrawerClose}>
			<HeaderAppBar
				models={models}
				handleModelChange={handleModelChange}
				model={model}
				temperatures={temperatures}
				handleTemperatureChange={handleTemperatureChange}
				temperature={temperature}
				reasoningEfforts={updatedReasoningEfforts}
				reasoningEffort={reasoningEffort}
				handleReasoningEffortChange={handleReasoningEffortChange}
				textVerbosities={textVerbosities}
				textVerbosity={textVerbosity}
				handleTextVerbosityChange={handleTextVerbosityChange}
				messages={messages}
				setMessages={setMessages}
				chatHistory={chatHistory}
				setChatHistory={setChatHistory}
				currentChatIndex={currentChatIndex}
				setCurrentChatIndex={setCurrentChatIndex}
				setModel={setModel}
				open={open}
				handleDrawerOpen={handleDrawerOpen}
				saveChatHistoryToLocalStorage={saveChatHistoryToLocalStorage}
				isDisabled={isDisabled}
				isLoading={isLoading}
			/>
			{user && (
				<Box
						className="chatContainer"
						sx={{
							maxWidth: 1200,
							marginLeft: "auto",
							marginRight: "auto",
							display: 'flex',
							flexDirection: 'column',
							justifyContent: 'space-between',
							overflow: 'hidden',
							mt: '40px',
							pb: 5,
							height: {
								xs: 'calc(91vh - 60px)', // On extra-small devices
								sm: 'calc(94vh - 60px)', // On small devices and up
							},
							position: 'relative',
							}}
					>
						<MessagesContainer
							hasAttachments={hasFiles || hasImages}
							messages={messages}
							isScrolling={isScrolling}
							autoScroll={autoScroll}
							setDistanceFromBottom={setDistanceFromBottom}
							status={status}
							error={error}
						/>
						{distanceFromBottom && distanceFromBottom < 80 &&
							<IconButton
								edge="end"
								color="primary"
								onClick={() => autoScroll()}
							>
								<ArrowDownwardIcon
									sx={{
										height: '20px',
										width: '20px',
										left: '50%',
										transform: 'translateX(-50%)',
										position: 'absolute',
										bottom: 30,
										color: 'white',
										backgroundColor: 'rgba(82, 82, 82, 0.7)',
										borderRadius: '50%',
										padding: '10px',
										'&:hover': {
											backgroundColor: 'rgba(64, 64, 64, 0.7)',
										}
									}}
								/>
							</IconButton>
						}
						<SendMessageContainer
							hasImages={hasImages}
							hasFiles={hasFiles}
							images={images}
							files={files}
							isDisabled={isDisabled}
							handleRemoveImage={handleRemoveImage}
							handleRemoveFile={handleRemoveFile}
							input={input}
							handleInputChange={setInput}
							onSubmit={onSubmit}
							handleFilesChange={handleFilesChange}
							isUploadDisabled={false}
							isLoading={isLoading}
							messages={messages}
							reload={regenerate}
							stop={stop}
							error={error}
					/>
				</Box>
			)}
		</div>
	);
};

export default Chat;
