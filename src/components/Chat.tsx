'use client'

import React, { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import { useChat } from 'ai/react'
import { useSession } from "next-auth/react"
import { resizeImage } from '@/components/utils/resizeImage';
import HeaderAppBar from '@/components/HeaderAppBar';
import { SelectChangeEvent } from '@mui/material/Select';
import { Model, SamplingParameter } from '@/types/types';
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
		value: 'claude-3-5-sonnet-20240620',
		label: 'Claude 3.5 Sonnet',
	},
	{
		value: 'o1-preview',
		label: 'o1-preview',
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

export default function Chat() {
	const [model, setModel] = useState<string>(models[0].value);
	const [samplingParameter, setSamplingParameter] = useState<number>(samplingParameters[0].value);
	const [images, setImages] = useState<File[]>([]);
	const [files, setFiles] = useState<File[]>([]);

	const {
		input,
		isLoading,
		handleInputChange,
		handleSubmit,
		messages,
		reload,
		stop,
		error,
	} = useChat(
		{
			keepLastMessageOnError: true,
			body: { model, samplingParameter },
		}
	);

	const scrollableGridRef = useRef(null);
	const { data: session } = useSession();
	const user = session?.user;

	// Capture all scroll events across the entire viewport
	useEffect(() => {
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
					console.log(`You can only upload up to ${MAX_IMAGES} images.`);
				}
				return updatedImages;
			});

			setFiles(prevFiles => {
				const updatedFiles = [...prevFiles, ...newFiles].slice(0, MAX_FILES);

				if (newFiles.length > MAX_FILES) {
					console.log(`You can only upload up to ${MAX_FILES} files.`);
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
	};

	const handleSamplingParameterChange = (event: SelectChangeEvent) => {
		setSamplingParameter(Number(event.target.value));
	};

	const hasImages = images.length > 0;
	const hasFiles = files.length > 0;

	return (
		<>
			<HeaderAppBar
				models={models}
				handleModelChange={handleModelChange}
				model={model}
				samplingParameters={samplingParameters}
				handleSamplingParameterChange={handleSamplingParameterChange}
				samplingParameter={samplingParameter}
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
									isLoading={isLoading}
									handleRemoveImage={handleRemoveImage}
									handleRemoveFile={handleRemoveFile}
									input={input}
									handleInputChange={handleInputChange}
									onSubmit={onSubmit}
									handleFilesChange={handleFilesChange}
									error={error}
								/>
							</Box>
			}
		</>
	)
		;
}
