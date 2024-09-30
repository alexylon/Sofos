'use client'

import React, { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import { Button, Grid, IconButton, InputAdornment, TextField, Typography } from '@mui/material';
import Completion from "@/components/Completion";
import { TextareaAutosize } from "@mui/base";
import { useChat } from 'ai/react'
import { useSession } from "next-auth/react"
import SendIcon from '@mui/icons-material/Send';
import ReplayIcon from '@mui/icons-material/Replay';
import CancelIcon from '@mui/icons-material/Cancel';
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import ClearOutlinedIcon from '@mui/icons-material/ClearOutlined';
import { styled } from '@mui/material/styles';
import ImageBox from '@/components/ImageBox';
import { resizeImage } from '@/components/utils/resizeImage';
import HeaderAppBar from '@/components/HeaderAppBar';
import { SelectChangeEvent } from '@mui/material/Select';


const MAX_IMAGES = 5;

const models = [
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

export default function Chat() {
	const {
		input,
		isLoading,
		handleInputChange,
		handleSubmit,
		messages,
		reload,
		setInput,
		stop
	} = useChat();
	const [model, setModel] = useState<string>('gpt-4o');
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

	const VisuallyHiddenInput = styled('input')({
		clip: 'rect(0 0 0 0)',
		clipPath: 'inset(50%)',
		height: 1,
		overflow: 'hidden',
		position: 'absolute',
		bottom: 0,
		left: 0,
		whiteSpace: 'nowrap',
		width: 1,
	});

	const handleButtonClick = () => {
		document.getElementById('file-input')?.click();
	};

	const handleModelChange = (event: SelectChangeEvent) => {
		setModel(event.target.value);
	};

	const hasImages = images.length > 0;

	return (
		<>
			<HeaderAppBar options={models} handleChange={handleModelChange} value={model} />
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
								<Grid
									className="messageContainer"
									container
									sx={{
					  width: '100%',
				  }}
								>
									<Grid
										ref={scrollableGridRef}
										item xs={12}
										sx={{
						height: hasImages
							? {
								xs: 'calc(81vh - 118px)', // On extra-small devices
								sm: 'calc(90vh - 110px)', // On small devices and up
							}
							: {
								xs: 'calc(81vh - 62px)', // On extra-small devices
								sm: 'calc(90vh - 60px)', // On small devices and up
							},
						overflow: 'auto',
						width: '100%',
						'&::-webkit-scrollbar': {
							display: 'none', // Hide scrollbar for WebKit browsers
						},
						scrollbarWidth: 'none', // Hide scrollbar for Firefox
						msOverflowStyle: 'none', // Hide scrollbar for IE 10+
					}}
									>
					  {messages.length
						  ?
						  <Box sx={{
							  p: 1,
							  flex: 1,
							  overflow: 'auto',
						  }}>
							  <Completion messages={messages} />
						  </Box>
						  :
						  <Box sx={{
							  mt: 25,
						  }}>
							  <Typography
								  variant="h2"
								  component="h2"
								  color="#D1D5DB"
								  align="center"
								  fontWeight="bold"
								  sx={{
									  userSelect: 'none',
								  }}
							  >
								  sofos
							  </Typography>
						  </Box>
					  }
									</Grid>
								</Grid>
				  {!hasImages &&
										<Grid className="actionButton" item xs={6} md={6}>
											<Box sx={{ display: 'flex', justifyContent: 'center' }}>
						  {messages.length > 0 &&
														<Button
															variant="outlined"
															color="primary"
															size="small"
															startIcon={
								  isLoading
									  ? <CancelIcon sx={{ color: "red", mt: 0 }} />
									  : <ReplayIcon color="primary" />
							  }
															onClick={isLoading ? stop as () => void : reload as () => void}
															sx={{
								  width: "180px",
								  height: "30px",
								  position: 'absolute',
								  bottom: 77,
								  backgroundColor: '#fafafa',
								  borderColor: '#bfbfbf',
								  ':hover': {
									  backgroundColor: '#fafafa',
									  borderColor: '#000000',
								  },
							  }}
															disabled={messages.length < 1}
														>
								{isLoading
									?
									<Typography
										color="red"
										sx={{
											userSelect: 'none',
										}}
									>
										Abort
									</Typography>
									:
									<Typography
										sx={{
											userSelect: 'none',
										}}
									>
										Regenerate
									</Typography>
								}
														</Button>
						  }
											</Box>
										</Grid>
				  }
								<Grid
									className="sendMessageContainer"
									container
									sx={{ width: '100%' }}
								>
									<Box
										sx={{
						position: 'absolute',
						bottom: 0,
						left: 0,
						right: 0,
					}}>
										<Grid item xs={12}>
											<Box sx={{ p: 1 }}>
						  {hasImages &&
														<Box sx={{ display: 'flex', flexDirection: 'row', mb: -2 }}>
								{
									images.map((file: File, index: number) => {
										const fileURL = URL.createObjectURL(file);
										return (
											<div key={index}>
												<ImageBox index={index} file={file} fileURL={fileURL} />
												<IconButton
													sx={{
														transform: 'translate(+210%, -250%)',
														backgroundColor: 'rgba(255, 255, 255, 0.5)',
														borderRadius: '50%',
														boxShadow: 1,
														height: '20px',
														width: '20px',
														ml: -2,
													}}
													size='small'
													onClick={() => handleRemoveImage(index)}
												>
													<ClearOutlinedIcon />
												</IconButton>
											</div>
										);
									})
								}
														</Box>
						  }
												<TextField
													fullWidth
													id="user-input"
													label={!isLoading && !input ? "Send a message..." : ""}
													multiline
													disabled={isLoading}
													size="small"
													value={input}
													onChange={handleInputChange}
													variant="outlined"
													InputLabelProps={{
							  shrink: false,
							  sx: {
								  marginLeft: '30px',
								  display: 'flex',
								  alignItems: 'center',
								  height: '70%',
							  },
						  }}
													InputProps={{
							  inputComponent: TextareaAutosize,
							  inputProps: {
								  minRows: 1,
								  maxRows: 10,
								  style: { resize: 'none' },
								  onKeyDown: (event) => {
									  if (event.key === 'Enter' && !event.shiftKey) {
										  // Prevent default action
										  event.preventDefault();

										  if (!input?.trim()) {
											  return;
										  }

										  // Create synthetic FormEvent for TypeScript compatibility
										  const formEvent: React.FormEvent<HTMLFormElement> = event as unknown as React.FormEvent<HTMLFormElement>;

										  onSubmit(formEvent);
									  }
								  },
								  onWheel: (event) => {
									  event.stopPropagation();
								  },
							  },
							  startAdornment: (
								  <IconButton sx={{ ml: '-10px' }} onClick={handleButtonClick}>
									  <AddPhotoAlternateOutlinedIcon />
									  <VisuallyHiddenInput
										  id="file-input"
										  type="file"
										  accept="image/jpeg,image/jpg,image/png"
										  onChange={handleFilesChange}
										  multiple
									  />
								  </IconButton>
							  ),
							  endAdornment: !isLoading && (
								  <InputAdornment position="end">
									  <IconButton
										  edge="end"
										  color="primary"
										  onClick={(event: any) => {
											  if (!!input?.trim()) {
												  onSubmit(event);
											  }
										  }}
									  >
										  <SendIcon />
									  </IconButton>
								  </InputAdornment>
							  ),
						  }}
													sx={
							  isLoading
								  ? { borderRadius: '5px', backgroundColor: '#F0F0F0' }
								  : { borderRadius: '5px', backgroundColor: '#FAFAFA' }
						  }
												/>
											</Box>
										</Grid>
									</Box>
								</Grid>
							</Box>
			}
		</>
	)
		;
}
