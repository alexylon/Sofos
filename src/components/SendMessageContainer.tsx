import React from 'react';
import { Box, Grid, IconButton, InputAdornment, TextField } from '@mui/material';
import { TextareaAutosize } from '@mui/base';
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import SendIcon from '@mui/icons-material/Send';
import { styled } from '@mui/material/styles';
import AttachmentsContainer from '@/components/AttachmentsContainer';

interface SendMessageContainerProps {
	hasImages: boolean,
	hasFiles: boolean,
	images: File[],
	files: File[],
	isLoading: boolean,
	handleRemoveImage: any,
	handleRemoveFile: any,
	input: string,
	handleInputChange: any,
	onSubmit: any,
	handleFilesChange: any,
	error?: any,
}

const SendMessageContainer = ({
								  hasImages,
								  hasFiles,
								  images,
								  files,
								  handleRemoveImage,
								  handleRemoveFile,
								  isLoading,
								  input,
								  handleInputChange,
								  onSubmit,
								  handleFilesChange,
								  error,
							  }: SendMessageContainerProps) => {
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
							fullWidth
							id="user-input"
							label={!isLoading && !error && !input ? "Send a message..." : ""}
							multiline
							disabled={isLoading || !!error}
							size="small"
							value={input}
							onChange={handleInputChange}
							variant="outlined"
							InputLabelProps={{
								shrink: false,
								sx: {
									marginLeft: '32px',
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
								startAdornment: !isLoading && !error && (
									<IconButton sx={{ ml: '-10px' }} onClick={handleButtonClick}>
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
							sx={{
								borderRadius: '13px',
								minHeight: '59px',
								backgroundColor: isLoading ? '#F0F0F0' : '#FAFAFA',
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
