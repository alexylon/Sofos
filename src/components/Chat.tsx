'use client'

import React, { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import { useChat, Message } from '@ai-sdk/react'
import { useSession } from "next-auth/react"
import { resizeImage } from '@/components/utils/resizeImage';
import HeaderAppBar from '@/components/HeaderAppBar';
import { SelectChangeEvent } from '@mui/material/Select';
import { Model, Status } from '@/types/types';
import MessagesContainer from '@/components/MessagesContainer';
import SendMessageContainer from '@/components/SendMessageContainer';
import { IconButton } from '@mui/material';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import {
	MAX_IMAGES,
	MAX_FILES,
	models,
	samplingParameters,
	reasoningEfforts,
	hybridParameters
} from '@/components/utils/constants';

const saveChatHistoryToLocalStorage = (chatHistory: Message[][]) => {
	if (chatHistory) {
		const filteredChatHistory = chatHistory.filter(chat => chat !== null && chat !== undefined);

		try {
			localStorage.setItem(
				'sofosChatHistory',
				JSON.stringify(filteredChatHistory, (key, value) => {
					if (key === 'createdAt' && value instanceof Date) {
						return value.toISOString();
					}

					if (key === 'experimental_attachments' && value) {
						value = null;
					}

					return value;
				})
			);
		} catch (error) {
			console.error('Error saving chat history to localStorage:', error);
		}
	}
};

export default function Chat() {
	const [model, setModel] = useState<Model>(models[0]);
	const [samplingParameter, setSamplingParameter] = useState<number>(samplingParameters[0].value);
	const [reasoningEffort, setReasoningEffort] = useState<string>(reasoningEfforts[0].value);
	const [hybridParameter, setHybridParameter] = useState<number>(hybridParameters[0].value);
	const [isScrolling, setIsScrolling] = useState<boolean>(false);
	const [images, setImages] = useState<File[]>([]);
	const [files, setFiles] = useState<File[]>([]);
	const [chatHistory, setChatHistory] = useState<Message[][]>([]);
	const [currentChatIndex, setCurrentChatIndex] = useState<number>(-1);
	const [open, setOpen] = useState(false);
	const [distanceFromBottom, setDistanceFromBottom] = useState<number | null>(null);

	const {
		input,
		status, // submitted, streaming, ready, error
		handleInputChange,
		handleSubmit,
		messages,
		setMessages,
		reload,
		stop,
		error,
	} = useChat(
		{
			api: '/api/use-chat',
			streamProtocol: 'data',
			body: { model, samplingParameter, reasoningEffort, hybridParameter },
			onFinish: (message) => {
				onFinishCallback(message);
			},
			// Prevent "Maximum update depth exceeded" error
			experimental_throttle: 50,
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
		// Initialize from localStorage
		const storedModelValue = localStorage.getItem('sofosModel');
		const storedSamplingParameter = localStorage.getItem('sofosSamplingParameter');
		const storedReasoningEffort = localStorage.getItem('sofosReasoningEffort');
		const storedHybridParameter = localStorage.getItem('sofosHybridParameter');
		const storedChatHistory = localStorage.getItem('sofosChatHistory');
		const storedCurrentChatIndex = localStorage.getItem('sofosCurrentChatIndex');

		if (storedModelValue) {
			const foundModel = models.find(model => model.value === storedModelValue);

			if (foundModel) {
				setModel(foundModel);
			}
		}

		if (storedSamplingParameter) {
			setSamplingParameter(Number(storedSamplingParameter));
		}

		if (storedReasoningEffort) {
			setReasoningEffort(storedReasoningEffort);
		}

		if (storedHybridParameter) {
			setHybridParameter(Number(storedHybridParameter));
		}

		if (storedChatHistory && storedCurrentChatIndex) {
			setCurrentChatIndex(Number(storedCurrentChatIndex));

			const parsedChatHistory: Message[][] = JSON.parse(storedChatHistory, (key, value) => {
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

		// Capture all scroll events across the entire viewport
		const autoScroll = (event: WheelEvent) => {
			const grid = scrollableGridRef.current as HTMLDivElement | null;

			// Check if the scrollableGridRef is currently in the viewport
			if (grid) {
				const bounding = grid.getBoundingClientRect();

				// Check if the vertical position of the mouse is within the grid's boundaries
				if (event.clientY >= bounding.top && event.clientY <= bounding.bottom) {
					grid.scrollTop += event.deltaY;
				}
			}
		};

		window.addEventListener('wheel', autoScroll, { passive: false });

		return () => {
			window.removeEventListener('wheel', autoScroll);
		};
	}, []);

	const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		const allFiles = [...images, ...files];
		const dataTransfer = new DataTransfer();

		allFiles.forEach(file => dataTransfer.items.add(file));

		const fileList = dataTransfer.files;

		handleSubmit(e, {
			experimental_attachments: fileList.length > 0 ? fileList : undefined,
		});

		setImages([]);
		setFiles([]);
	};

	const handleFilesChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.files) {
			const newImages: File[] = Array.from(event.target.files).filter(file => file.type.startsWith('image/'));
			const newFiles: File[] = Array.from(event.target.files).filter(file => !file.type.startsWith('image/'));
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
		}
	};

	const handleRemoveImage = (index: number) => {
		setImages(prevImages => prevImages && prevImages.filter((_, i) => i !== index));
	};

	const handleRemoveFile = (index: number) => {
		setFiles(prevFiles => prevFiles && prevFiles.filter((_, i) => i !== index));
	};

	const handleModelChange = (event: SelectChangeEvent) => {
		const { value } = event.target;
		const modelValue = models.find(model => model.value === value);

		if (modelValue) {
			setModel(modelValue);

			try {
				localStorage.setItem('sofosModel', value);
			} catch (error) {
				console.error('Error saving model to localStorage:', error);
			}
		}
	};

	const handleSamplingParameterChange = (event: SelectChangeEvent) => {
		const { value } = event.target;

		setSamplingParameter(Number(value));

		try {
			localStorage.setItem('sofosSamplingParameter', value);
		} catch (error) {
			console.error('Error saving sampling parameter to localStorage:', error);
		}
	};

	const handleReasoningEffortChange = (event: SelectChangeEvent) => {
		setReasoningEffort(event.target.value);

		try {
			localStorage.setItem('sofosReasoningEffort', event.target.value);
		} catch (error) {
			console.error('Error saving reasoning effort to localStorage:', error);
		}
	};

	const handleHybridParameterChange = (event: SelectChangeEvent) => {
		const { value } = event.target;

		setHybridParameter(Number(value));

		try {
			localStorage.setItem('sofosHybridParameter', value);
		} catch (error) {
			console.error('Error saving hybrid parameter to localStorage:', error);
		}
	};


	const handleDrawerOpen = () => {
		setOpen(true);
	};

	const handleDrawerClose = () => {
		setOpen(false);
	};

	const autoScroll = () => {
		setIsScrolling(true);

		setTimeout(() => {
			setIsScrolling(false);
		}, 2000);
	}

	// Callback to be executed after 'assistant' message is received
	const onFinishCallback = (message: Message) => {
		if (!error) {
			setMessages((prevMessages: Message[]): Message[] => {
				const isNewChat = prevMessages.length <= 2;
				const index = isNewChat ? chatHistory.length : currentChatIndex;

				if (isNewChat) {
					setCurrentChatIndex(index);

					try {
						localStorage.setItem('sofosCurrentChatIndex', (index).toString());
					} catch (error) {
						console.error('Error saving current chat index to localStorage:', error);
					}
				}

				const updatedMessages: Message[] = [...prevMessages];
				// For some reason the last assistant message is incomplete after
				// importing 'useChat' from '@ai-sdk/react' instead of 'ai'
				updatedMessages[updatedMessages.length - 1] = message;

				if (updatedMessages && updatedMessages.length > 0) {
					// Update chat history in the state and local storage
					setChatHistory((prevChatHistory: Message[][]) => {
						const updatedChatHistory = [...prevChatHistory].slice(-20);

						updatedChatHistory[index] = updatedMessages;
						saveChatHistoryToLocalStorage(updatedChatHistory);

						return updatedChatHistory;
					});
				}

				return updatedMessages || [];
			});
		}
	}

	return (
		<div onClick={handleDrawerClose}>
			<HeaderAppBar
				models={models}
				handleModelChange={handleModelChange}
				model={model}
				samplingParameters={samplingParameters}
				handleSamplingParameterChange={handleSamplingParameterChange}
				samplingParameter={samplingParameter}
				reasoningEfforts={reasoningEfforts}
				reasoningEffort={reasoningEffort}
				handleReasoningEffortChange={handleReasoningEffortChange}
				hybridParameters={hybridParameters}
				handleHybridParameterChange={handleHybridParameterChange}
				hybridParameter={hybridParameter}
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
			{user &&
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
							models={models}
							isScrolling={isScrolling}
							autoScroll={autoScroll}
							setDistanceFromBottom={setDistanceFromBottom}
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
							handleInputChange={handleInputChange}
							onSubmit={onSubmit}
							handleFilesChange={handleFilesChange}
							isUploadDisabled={false}
							isLoading={isLoading}
							messages={messages}
							reload={reload}
							stop={stop}
							error={error}
						/>
					</Box>
			}
		</div>
	);
}
