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
	const {
		input,
		isLoading,
		handleInputChange,
		handleSubmit,
		messages,
		reload,
		stop,
	} = useChat();
	const [model, setModel] = useState<string>(models[0].value);
	const [samplingParameter, setSamplingParameter] = useState<number>(samplingParameters[0].value);
	const [images, setImages] = useState<File[]>([]);
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

		const dataTransfer = new DataTransfer();
		images.forEach(file => dataTransfer.items.add(file));
		const fileList = dataTransfer.files;

		handleSubmit(e, {
			data: {
				model: model,
				samplingParameter: samplingParameter,
			},
			experimental_attachments: fileList.length > 0 ? fileList : undefined,
		});

		setImages([]);
	};

	const handleRemoveImage = (index: number) => {
		setImages(prevImages => prevImages && prevImages.filter((_, i) => i !== index));
	};

	const handleFilesChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.files) {
			const newImages: File[] = Array.from(event.target.files).filter(file => file.type.startsWith('image/'));
			const resizedImages: File[] = [];

			for (const file of newImages) {
				try {
					const resizedImage = await resizeImage(file, 2048);
					resizedImages.push(resizedImage);
				} catch (error) {
					console.error(`Error resizing image ${file.name}:`, error);
				}
			}

			setImages(prevImages => {
				const updatedImages = [...prevImages, ...resizedImages].slice(0, MAX_IMAGES);

				if (resizedImages.length > MAX_IMAGES) {
					console.log(`You can only upload up to ${MAX_IMAGES} images.`);
				}
				return updatedImages;
			});
		}
	};

	const handleButtonClick = () => {
		document.getElementById('file-input')?.click();
	};

	const handleModelChange = (event: SelectChangeEvent) => {
		setModel(event.target.value);
	};

	const handleSamplingParameterChange = (event: SelectChangeEvent) => {
		setSamplingParameter(Number(event.target.value));
	};

	const hasImages = images.length > 0;

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
						xs: 'calc(85vh - 62px)', // On extra-small devices
						sm: 'calc(94vh - 60px)', // On small devices and up
					},
					position: 'relative',
				}}>
                <MessagesContainer hasImages={hasImages} messages={messages} models={models} />
                <ActionButton hasImages={hasImages} messages={messages} isLoading={isLoading} reload={reload} stop={stop} />
                <SendMessageContainer
                  hasImages={hasImages}
                  images={images}
                  isLoading={isLoading}
                  handleRemoveImage={handleRemoveImage}
                  input={input}
                  handleInputChange={handleInputChange}
                  onSubmit={onSubmit}
                  handleButtonClick={handleButtonClick}
                  handleFilesChange={handleFilesChange}
                />
              </Box>
			}
		</>
	)
		;
}
