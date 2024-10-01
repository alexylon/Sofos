import Box from '@mui/material/Box';
import { Grid, IconButton, InputAdornment, TextField } from '@mui/material';
import ImageBox from '@/components/ImageBox';
import ClearOutlinedIcon from '@mui/icons-material/ClearOutlined';
import { TextareaAutosize } from '@mui/base';
import React from 'react';
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import SendIcon from '@mui/icons-material/Send';
import { styled } from '@mui/material/styles';

interface SelectedImagesContainerProps {
	hasImages: boolean,
	images: File[],
	isLoading: boolean,
	handleRemoveImage: any,
	input: string,
	handleInputChange: any,
	onSubmit: any,
	handleButtonClick: any,
	handleFilesChange: any,
}

const SendMessageContainer = ({
								  hasImages,
								  images,
								  handleRemoveImage,
								  isLoading,
								  input,
								  handleInputChange,
								  onSubmit,
								  handleButtonClick,
								  handleFilesChange,
							  }: SelectedImagesContainerProps) => {
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
	);
};

export default SendMessageContainer;
