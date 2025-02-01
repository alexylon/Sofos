'use client'

import React, { useEffect, useRef, useState } from 'react';
import { Message } from 'ai';
import Box from '@mui/material/Box';
import { useChat } from 'ai/react'
import { useSession } from "next-auth/react"
import { resizeImage } from '@/components/utils/resizeImage';
import HeaderAppBar from '@/components/HeaderAppBar';
import { SelectChangeEvent } from '@mui/material/Select';
import { Model, ReasoningEffort, SamplingParameter } from '@/types/types';
import MessagesContainer from '@/components/MessagesContainer';
import ActionButton from '@/components/ActionButton';
import SendMessageContainer from '@/components/SendMessageContainer';


const MAX_IMAGES = 5;
const MAX_FILES = 5;

const models: Model[] = [
	{
		value: 'gpt-4o',
		label: 'GPT-4o',
	},
	{
		value: 'gpt-4o-mini',
		label: 'GPT-4o mini',
	},
	{
		value: 'claude-3-5-sonnet-latest',
		label: 'Claude 3.5 Sonnet',
	},
	{
		value: 'claude-3-5-haiku-latest',
		label: 'Claude 3.5 Haiku',
	},
	{
		value: 'o1',
		label: 'o1',
	},
	{
		value: 'o3-mini',
		label: 'o3-mini',
	},
];

const samplingParameters: SamplingParameter[] = [
	{
		value: 0.2,
		label: 'Focused',
	},
	{
		value: 0.5,
		label: 'Balanced',
	},
	{
		value: 0.7,
		label: 'Creative',
	},
];

const reasoningEfforts: ReasoningEffort[] = [
	{
		value: 'low',
		label: 'Low',
	},
	{
		value: 'medium',
		label: 'Medium',
	},
	{
		value: 'high',
		label: 'High',
	},
];

const saveChatHistoryToLocalStorage = (chatHistory: Message[][]) => {
	if (chatHistory) {
		const filteredChatHistory = chatHistory.filter(chat => chat !== null && chat !== undefined);

		localStorage.setItem(
			'sofosChatHistory',
			JSON.stringify(filteredChatHistory, (key, value) => {
				if (key === 'createdAt' && value instanceof Date) {
					return value.toISOString();
				}
				return value;
			})
		);
	}
};

export default function Chat() {
	const [model, setModel] = useState<string>(models[0].value);
	const [samplingParameter, setSamplingParameter] = useState<number>(samplingParameters[0].value);
	const [reasoningEffort, setReasoningEffort] = useState<string>(reasoningEfforts[0].value);
	const [images, setImages] = useState<File[]>([]);
	const [files, setFiles] = useState<File[]>([]);
	const [chatHistory, setChatHistory] = useState<Message[][]>([]);
	const [currentChatIndex, setCurrentChatIndex] = useState<number>(-1);
	const [open, setOpen] = React.useState(false);

	const {
		input,
		isLoading,
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
			keepLastMessageOnError: true,
			body: { model, samplingParameter, reasoningEffort },
			onFinish: (message) => {
				onFinishCallback();
			},
		}
	);

	const scrollableGridRef = useRef(null);
	const { data: session } = useSession();
	const user = session?.user;
	const hasImages = images.length > 0;
	const hasFiles = files.length > 0;
	const isDisabled = isLoading || !!error;

	useEffect(() => {
		// Initialize from localStorage
		const storedModel = localStorage.getItem('sofosModel');
		const storedSamplingParameter = localStorage.getItem('sofosSamplingParameter');
		const storedReasoningEffort = localStorage.getItem('sofosReasoningEffort');
		const storedChatHistory = localStorage.getItem('sofosChatHistory');
		const storedCurrentChatIndex = localStorage.getItem('sofosCurrentChatIndex');

		if (storedModel) {
			setModel(storedModel);
		}

		if (storedSamplingParameter) {
			setSamplingParameter(Number(storedSamplingParameter));
		}

		if (storedReasoningEffort) {
			setReasoningEffort(storedReasoningEffort);
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
		const handleScroll = (event: WheelEvent) => {
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

		window.addEventListener('wheel', handleScroll, { passive: false });

		return () => {
			window.removeEventListener('wheel', handleScroll);
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
		setModel(event.target.value);
		localStorage.setItem('sofosModel', event.target.value);
	};

	const handleSamplingParameterChange = (event: SelectChangeEvent) => {
		setSamplingParameter(Number(event.target.value));
		localStorage.setItem('sofosSamplingParameter', event.target.value);
	};

	const handleReasoningEffortChange = (event: SelectChangeEvent) => {
		setReasoningEffort(event.target.value);
		localStorage.setItem('sofosReasoningEffort', event.target.value);
	};

	const handleDrawerOpen = () => {
		setOpen(true);
	};

	const handleDrawerClose = () => {
		setOpen(false);
	};

	// Callback to be executed after 'assistant' message is received
	const onFinishCallback = () => {
		if (!error) {
			const isNewChat = currentChatIndex === -1;
			const index = isNewChat ? chatHistory.length : currentChatIndex;

			if (isNewChat) {
				setCurrentChatIndex(index);
				localStorage.setItem('sofosCurrentChatIndex', (index).toString());
			}

			// Update chat history in the state and local storage
			setMessages((prevMessages: Message[]): Message[] => {
				const updatedMessages: Message[] = [...prevMessages];

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
				}}>
								<MessagesContainer
									hasAttachments={hasFiles || hasImages}
									messages={messages}
									models={models}
									error={error}
								/>
								<ActionButton messages={messages} isLoading={isLoading} reload={reload} stop={stop} />
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
									isUploadDisabled={model.startsWith('o1')}
									error={error}
								/>
							</Box>
			}
		</div>
	)
		;
}
