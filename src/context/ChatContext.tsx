'use client';

import React, { createContext, useContext, useCallback, useEffect, useMemo, useRef, useState, ReactNode } from 'react';
import { useChat, UIMessage } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { SelectChangeEvent } from '@mui/material/Select';
import { useRouter } from 'next/navigation';
import { Model, Status } from '@/types/types';
import {
	STORAGE_KEYS,
	MAX_IMAGES,
	MAX_FILES,
	models,
	getReasoningEfforts,
	textVerbosities,
} from '@/components/utils/constants';
import { indexedDBStorage } from '@/components/utils/indexedDBStorage';
import { resizeImage } from '@/components/utils/resizeImage';

type MessageWithOptionalAttachments = UIMessage & { experimental_attachments?: unknown };

const sanitizeChatHistory = (history: UIMessage[][]): UIMessage[][] =>
	history
		.filter((chat): chat is UIMessage[] => Array.isArray(chat))
		.map(chat =>
			chat
				.filter((message): message is UIMessage => Boolean(message))
				.map(message => {
					const sanitizedMessage = { ...message } as MessageWithOptionalAttachments;

					if (sanitizedMessage.experimental_attachments) {
						sanitizedMessage.experimental_attachments = undefined;
					}

					return sanitizedMessage;
				})
		);

const saveChatHistoryToStorage = async (chatHistory: UIMessage[][]): Promise<void> => {
	if (!chatHistory) return;

	const sanitizedChatHistory = sanitizeChatHistory(chatHistory);

	try {
		await indexedDBStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, sanitizedChatHistory);
	} catch (error) {
		console.error('Error saving chat history to IndexedDB:', error);
	}
};

interface ChatContextType {
	// State
	model: Model;
	reasoningEffort: string;
	textVerbosity: string;
	images: File[];
	files: File[];
	chatHistory: UIMessage[][];
	currentChatIndex: number;
	open: boolean;
	input: string;
	messages: UIMessage[];
	status: string;
	error?: Error;
	isLoading: boolean;
	isDisabled: boolean;
	hasImages: boolean;
	hasFiles: boolean;
	updatedReasoningEfforts: Array<{ value: string; label: string }>;
	messagesEndRef: React.RefObject<HTMLDivElement>;
	scrollContainerRef: React.RefObject<HTMLDivElement>;

	// Setters
	setModel: React.Dispatch<React.SetStateAction<Model>>;
	setMessages: (messages: UIMessage[]) => void;
	setChatHistory: React.Dispatch<React.SetStateAction<UIMessage[][]>>;
	setCurrentChatIndex: React.Dispatch<React.SetStateAction<number>>;
	setInput: React.Dispatch<React.SetStateAction<string>>;

	// Handlers
	handleModelChange: (event: SelectChangeEvent<string | number>, child: ReactNode) => void;
	handleReasoningEffortChange: (event: SelectChangeEvent<string | number>, child: ReactNode) => void;
	handleTextVerbosityChange: (event: SelectChangeEvent<string | number>, child: ReactNode) => void;
	handleDrawerOpen: () => void;
	handleDrawerClose: () => void;
	handleStartNewChat: () => void;
	handleFilesChange: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
	handleRemoveImage: (index: number) => void;
	handleRemoveFile: (index: number) => void;
	onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
	scrollToBottom: () => void;
	saveChatHistory: (history: UIMessage[][]) => void;

	// useChat functions
	regenerate: () => void;
	stop: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChatContext = () => {
	const context = useContext(ChatContext);
	if (!context) {
		throw new Error('useChatContext must be used within ChatProvider');
	}
	return context;
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const router = useRouter();
	const [model, setModel] = useState<Model>(models[0]);
	const hasNoneEffort = useMemo(() => {
		return !model.value.includes('codex') && !model.value.startsWith('gemini');
	}, [model.value]);

	const updatedReasoningEfforts = useMemo(() => {
		return getReasoningEfforts(hasNoneEffort);
	}, [hasNoneEffort]);

	const [reasoningEffort, setReasoningEffort] = useState<string>(updatedReasoningEfforts[0].value);
	const [textVerbosity, setTextVerbosity] = useState<string>(textVerbosities[1].value);
	const [images, setImages] = useState<File[]>([]);
	const [files, setFiles] = useState<File[]>([]);
	const [chatHistory, setChatHistory] = useState<UIMessage[][]>([]);
	const [currentChatIndex, setCurrentChatIndex] = useState<number>(-1);
	const [open, setOpen] = useState(false);
	const [input, setInput] = useState('');
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const scrollContainerRef = useRef<HTMLDivElement>(null);

	const {
		status,
		messages,
		sendMessage,
		setMessages,
		regenerate,
		stop,
		error,
	} = useChat({
		transport: new DefaultChatTransport({
			api: '/api/use-stream-text',
		}),
		onFinish: ({ message }) => {
			onFinishCallback(message);
		},
		experimental_throttle: 100,
	});

	const hasImages = images.length > 0;
	const hasFiles = files.length > 0;
	const isLoading = status === Status.SUBMITTED || status === Status.STREAMING;
	const isDisabled = isLoading || !!error;

	// Update reasoning effort if current value is not available for the selected model
	useEffect(() => {
		const availableEffortValues = updatedReasoningEfforts.map(effort => effort.value);

		if (!availableEffortValues.includes(reasoningEffort)) {
			const newReasoningEffort = updatedReasoningEfforts[0].value;
			setReasoningEffort(newReasoningEffort);
			void indexedDBStorage.setItem(STORAGE_KEYS.REASONING_EFFORT, newReasoningEffort);
		}
	}, [updatedReasoningEfforts, reasoningEffort]);

	useEffect(() => {
		let isMounted = true;

		const loadPersistedState = async () => {
			try {
				const [
					storedModelValue,
					storedReasoningEffort,
					storedTextVerbosity,
					storedChatHistory,
					storedCurrentChatIndex,
				] = await Promise.all([
					indexedDBStorage.getItem<string>(STORAGE_KEYS.MODEL),
					indexedDBStorage.getItem<string>(STORAGE_KEYS.REASONING_EFFORT),
					indexedDBStorage.getItem<string>(STORAGE_KEYS.TEXT_VERBOSITY),
					indexedDBStorage.getItem<UIMessage[][]>(STORAGE_KEYS.CHAT_HISTORY),
					indexedDBStorage.getItem<number>(STORAGE_KEYS.CURRENT_CHAT_INDEX),
				]);

				if (!isMounted) {
					return;
				}

				if (storedModelValue) {
					const foundModel = models.find(modelItem => modelItem.value === storedModelValue);

					if (foundModel) {
						setModel(foundModel);
					}
				}

				if (storedReasoningEffort) {
					setReasoningEffort(storedReasoningEffort);
				}

				if (storedTextVerbosity) {
					setTextVerbosity(storedTextVerbosity);
				}

				const persistedChatHistory = Array.isArray(storedChatHistory) ? storedChatHistory : null;
				const persistedCurrentChatIndex = !Number.isNaN(storedCurrentChatIndex) ? storedCurrentChatIndex : null;

				if (persistedChatHistory && persistedChatHistory.length > 0 && persistedCurrentChatIndex !== null) {
					const normalizedChatHistory = sanitizeChatHistory(persistedChatHistory);
					setCurrentChatIndex(persistedCurrentChatIndex);
					setChatHistory(normalizedChatHistory);

					if (persistedCurrentChatIndex >= 0 && persistedCurrentChatIndex < normalizedChatHistory.length) {
						const persistedMessages = normalizedChatHistory[persistedCurrentChatIndex];

						if (persistedMessages?.length > 0) {
							setMessages(persistedMessages);
						}
					}
				}
			} catch (error) {
				console.error('Error loading data from IndexedDB:', error);
			}
		};

		loadPersistedState().catch(error => {
			console.error('Unexpected error loading persisted state:', error);
		});

		return () => {
			isMounted = false;
		};
	}, [setMessages]);

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

	const handleModelChange = useCallback((event: SelectChangeEvent<string | number>, child: ReactNode) => {
		const { value } = event.target;
		const valueStr = String(value);
		const selectedModel = models.find(model => model.value === valueStr);

		if (!selectedModel) return;

		setModel(selectedModel);

		void indexedDBStorage.setItem(STORAGE_KEYS.MODEL, valueStr);

		if ((valueStr.startsWith('o') || valueStr.startsWith('gemini')) && reasoningEffort === 'none') {
			const newReasoningEffort = 'low';
			setReasoningEffort(newReasoningEffort);

			void indexedDBStorage.setItem(STORAGE_KEYS.REASONING_EFFORT, newReasoningEffort);
		}
	}, [reasoningEffort]);

	const handleReasoningEffortChange = useCallback((event: SelectChangeEvent<string | number>, child: ReactNode) => {
		const { value } = event.target;
		const valueStr = String(value);
		setReasoningEffort(valueStr);

		void indexedDBStorage.setItem(STORAGE_KEYS.REASONING_EFFORT, valueStr);
	}, []);

	const handleTextVerbosityChange = useCallback((event: SelectChangeEvent<string | number>, child: ReactNode) => {
		const { value } = event.target;
		const valueStr = String(value);
		setTextVerbosity(valueStr);

		void indexedDBStorage.setItem(STORAGE_KEYS.TEXT_VERBOSITY, valueStr);
	}, []);

	const handleDrawerOpen = useCallback(() => {
		setOpen(true);
	}, []);

	const handleDrawerClose = useCallback(() => {
		setOpen(false);
	}, []);

	const scrollToBottom = useCallback(() => {
		const container = scrollContainerRef.current;

		if (container) {
			const innerWindowHeight = window ? window.innerHeight : 0;
			const offsetHeight = innerWindowHeight * 0.6;

			container.scrollTo({
				top: container.scrollHeight - container.clientHeight - offsetHeight,
				behavior: 'smooth'
			});
		}
	}, []);

	const saveChatHistory = useCallback((history: UIMessage[][]) => {
		void saveChatHistoryToStorage(history);
	}, []);

	const handleStartNewChat = useCallback(() => {
		setMessages([]);
		setCurrentChatIndex(-1);

		void indexedDBStorage.setItem(STORAGE_KEYS.CURRENT_CHAT_INDEX, -1);

		router.push('/new');
	}, [router, setMessages]);

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
			updatedMessages[updatedMessages.length - 1] = message;

			if (updatedMessages && updatedMessages.length > 0) {
				setChatHistory((prevChatHistory: UIMessage[][]) => {
					setCurrentChatIndex((prevCurrentChatIndex) => {
						const index = isNewChat ? prevChatHistory.length : prevCurrentChatIndex;

						if (isNewChat) {
							void indexedDBStorage.setItem(STORAGE_KEYS.CURRENT_CHAT_INDEX, index);
							return index;
						}

						return prevCurrentChatIndex;
					});

					const updatedChatHistory = [...prevChatHistory];

					if (isNewChat) {
						updatedChatHistory.push(updatedMessages);
					} else {
						if (prevChatHistory.length === 0) {
							updatedChatHistory.push(updatedMessages);
						} else {
							updatedChatHistory[updatedChatHistory.length - 1] = updatedMessages;
						}
					}

					const finalChatHistory = updatedChatHistory.slice(-20);
					void saveChatHistoryToStorage(finalChatHistory);

					return finalChatHistory;
				});
			}

			return updatedMessages;
		});
	}, [error, setMessages]);

	const onSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		const allFiles = [...images, ...files];
		const dataTransfer = new DataTransfer();

		allFiles.forEach(file => dataTransfer.items.add(file));

		const fileList = dataTransfer.files;

		const messageOptions = {
			body: { model, reasoningEffort, textVerbosity },
		};

		const messageData = fileList?.length > 0
			? { text: input, files: fileList }
			: { text: input };

		sendMessage(messageData, messageOptions).then();
		setInput('');
		setImages([]);
		setFiles([]);
	}, [input, images, files, model, reasoningEffort, textVerbosity, sendMessage]);

	const value: ChatContextType = {
		model,
		reasoningEffort,
		textVerbosity,
		images,
		files,
		chatHistory,
		currentChatIndex,
		open,
		input,
		messages,
		status,
		error,
		isLoading,
		isDisabled,
		hasImages,
		hasFiles,
		updatedReasoningEfforts,
		messagesEndRef,
		scrollContainerRef,
		setModel,
		setMessages,
		setChatHistory,
		setCurrentChatIndex,
		setInput,
		handleModelChange,
		handleReasoningEffortChange,
		handleTextVerbosityChange,
		handleDrawerOpen,
		handleDrawerClose,
		handleStartNewChat,
		handleFilesChange,
		handleRemoveImage,
		handleRemoveFile,
		onSubmit,
		scrollToBottom,
		saveChatHistory,
		regenerate,
		stop,
	};

	return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
