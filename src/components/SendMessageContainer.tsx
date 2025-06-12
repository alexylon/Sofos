import React, { useEffect, useRef } from 'react';
import { Box, Grid, IconButton, InputAdornment, TextField } from '@mui/material';
import { TextareaAutosize } from '@mui/base';
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import ArrowCircleUpOutlinedIcon from '@mui/icons-material/ArrowCircleUpOutlined';
import { styled } from '@mui/material/styles';
import AttachmentsContainer from '@/components/AttachmentsContainer';
import { Message } from '@ai-sdk/react'
import ActionButton from '@/components/ActionButton';
import { useMediaQuery } from 'react-responsive';

interface SendMessageContainerProps {
	hasImages: boolean;
	hasFiles: boolean;
	images: File[];
	files: File[];
	isDisabled: boolean;
	handleRemoveImage: (index: number) => void;
	handleRemoveFile: (index: number) => void;
	input: string;
	handleInputChange: any;
	onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
	handleFilesChange: any;
	isUploadDisabled: boolean;
	isLoading: boolean;
	messages: Message[];
	reload: () => void;
	stop: () => void;
	error?: Error;
}

const SendMessageContainer = ({
								  hasImages,
								  hasFiles,
								  images,
								  files,
								  handleRemoveImage,
								  handleRemoveFile,
								  isDisabled,
								  input,
								  handleInputChange,
								  onSubmit,
								  handleFilesChange,
								  isUploadDisabled,
								  isLoading,
								  messages,
								  reload,
								  stop,
							  }: SendMessageContainerProps) => {
	const inputRef = useRef<HTMLInputElement>(null);
	const isMobile = useMediaQuery({ maxWidth: 767 });

	useEffect(() => {
		if (isLoading || !inputRef.current || isMobile) {
			return;
		}

		const element = inputRef.current;
		const timeout = setTimeout(() => {
			element.focus();
		}, 100);

		return () => {
			clearTimeout(timeout);
		};
	}, [isLoading]);

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

	return (
		<Grid
			className="send-message-container"
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
						<AttachmentsContainer
							hasImages={hasImages}
							hasFiles={hasFiles}
							images={images}
							files={files}
							handleRemoveImage={handleRemoveImage}
							handleRemoveFile={handleRemoveFile}
						/>
						<TextField
							inputRef={inputRef}
							fullWidth
							id="user-input"
							label={!isDisabled && !input ? "Send a message..." : ""}
							multiline
							disabled={isDisabled}
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
									'&.Mui-focused': {
										color: '#7d7d7d',
									},
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
								startAdornment: !isDisabled && (
									<IconButton
										edge="start"
										onClick={handleButtonClick} disabled={isUploadDisabled}
									>
										<AddCircleOutlineOutlinedIcon
											sx={{
												height: '26px',
												width: '26px',
											}}
										/>
										<VisuallyHiddenInput
											id="file-input"
											type="file"
											// accept="image/jpeg,image/jpg,image/png"
											onChange={handleFilesChange}
											multiple
										/>
									</IconButton>
								),
								endAdornment: (
									<InputAdornment position="end">
										{
											!isDisabled && input &&
												<IconButton
													edge="end"
													color="primary"
													onClick={(event: any) => {
												if (!!input?.trim()) {
													onSubmit(event);
												}
											}}
												>
													<ArrowCircleUpOutlinedIcon
														sx={{
															height: '30px',
															width: '30px',
											 			}}
													/>
												</IconButton>
										}
										<ActionButton messages={messages} isLoading={isLoading} reload={reload} stop={stop} />
									</InputAdornment>
								),
							}}
							sx={{
								borderRadius: '13px',
								minHeight: '59px',
								backgroundColor: isDisabled ? '#F0F0F0' : '#FAFAFA',
								'& .MuiOutlinedInput-root': {
									borderRadius: '13px',
									minHeight: '59px',
									'&:hover fieldset': {
										borderRadius: '13px',
										minHeight: '53px',
									},
									'&.Mui-focused fieldset': {
										borderRadius: '13px',
										minHeight: '59px',
									},
								},
							}}
						/>
					</Box>
				</Grid>
			</Box>
		</Grid>
	);
};

export default SendMessageContainer;
