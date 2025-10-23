import React, { useEffect, useRef} from 'react';
import { Box, Grid, IconButton, InputAdornment, TextField, useTheme } from '@mui/material';
import { TextareaAutosize } from '@mui/base';
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import ArrowCircleUpOutlinedIcon from '@mui/icons-material/ArrowCircleUpOutlined';
import { styled } from '@mui/material/styles';
import AttachmentsContainer from '@/components/AttachmentsContainer';
import AudioRecorder from '@/components/AudioRecorder';
import { UIMessage } from '@ai-sdk/react';
import ActionButton from '@/components/ActionButton';
import { useMediaQuery } from 'react-responsive';
import { useThemeMode } from '@/theme/ThemeProvider';
import { messageColors } from '@/theme/theme';

interface SendMessageContainerProps {
	hasImages: boolean;
	hasFiles: boolean;
	images: File[];
	files: File[];
	isDisabled: boolean;
	handleRemoveImage: (index: number) => void;
	handleRemoveFile: (index: number) => void;
	input: string;
	handleInputChange: (value: string) => void;
	onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
	handleFilesChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
	isUploadDisabled: boolean;
	isLoading: boolean;
	messages: UIMessage[];
	reload: () => void;
	stop: () => void;
	error?: Error;
}

const SendMessageContainer: React.FC<SendMessageContainerProps> = ({
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
}) => {
	const inputRef = useRef<HTMLInputElement>(null);
	const isMobile = useMediaQuery({ maxWidth: 767 });
	const { mode } = useThemeMode();
	const theme = useTheme();
	const colors = messageColors[mode];

	useEffect(() => {
		if (isLoading || !inputRef.current || isMobile) return;

		const element = inputRef.current;
		const timeout = setTimeout(() => {
			element.focus();
		}, 100);

		return () => clearTimeout(timeout);
	}, [isLoading, isMobile]);

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

	const handleTranscriptionResult = (text: string) => {
		console.log('SendMessageContainer handleTranscriptionResult called:', {
			receivedText: text,
			currentInput: input,
			textType: typeof text,
			textLength: text?.length || 0,
			inputRefCurrent: inputRef.current,
			inputRefValue: inputRef.current?.value
		});

		try {
			const newText = input + (input ? ' ' : '') + text;
			console.log('Updating input from:', input, 'to:', newText);

			// Primary method: update through React state
			handleInputChange(newText);

			// iOS fallback: also update the input element directly
			const isIOSSafari = /iPad|iPhone|iPod/.test(navigator.userAgent) && /Safari/.test(navigator.userAgent);
			const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
						 (window.navigator as any).standalone === true;

			if ((isIOSSafari || isPWA) && inputRef.current) {
				console.log('iOS fallback: updating input element directly');

				// Focus the input first to ensure it's active
				try {
					inputRef.current.focus();
				} catch (e) {
					console.warn('Could not focus input:', e);
				}

				// Update the value
				inputRef.current.value = newText;

				// Trigger input event to ensure React picks up the change
				const inputEvent = new Event('input', { bubbles: true });
				inputRef.current.dispatchEvent(inputEvent);

				// Also try triggering change event
				const changeEvent = new Event('change', { bubbles: true });
				inputRef.current.dispatchEvent(changeEvent);

				// Try to trigger React's onChange handler directly if available
				const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
					window.HTMLTextAreaElement.prototype,
					'value'
				)?.set;

				if (nativeInputValueSetter) {
					nativeInputValueSetter.call(inputRef.current, newText);
					const reactEvent = new Event('input', { bubbles: true });
					inputRef.current.dispatchEvent(reactEvent);
				}

				console.log('iOS fallback complete, input value is now:', inputRef.current.value);
			}

			console.log('handleInputChange called successfully');
		} catch (error) {
			console.error('Error in handleTranscriptionResult:', error);
		}
	};

	const handleTranscriptionError = (error: string) => {
		console.error('Transcription error:', error);
	};

	return (
		<Grid className="send-message-container" container sx={{ width: '100%', backgroundColor: 'transparent' }}>
			<Box sx={{ position: 'absolute', bottom: -8, left: 0, right: 0, backgroundColor: 'transparent' }}>
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
							label={!isDisabled && !input ? 'Send a message...' : ''}
							multiline
							disabled={isDisabled}
							size="small"
							value={input}
							onChange={(e) => handleInputChange(e.target.value)}
							variant="outlined"
							InputLabelProps={{
								shrink: false,
								sx: {
									marginLeft: '30px',
									display: 'flex',
									alignItems: 'center',
									height: '70%',
									'&.Mui-focused': { color: '#7d7d7d' },
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
											event.preventDefault();
											if (!input?.trim()) return;
											const formEvent = event as unknown as React.FormEvent<HTMLFormElement>;
											onSubmit(formEvent);
										}
									},
									onWheel: (event) => event.stopPropagation(),
								},
								startAdornment: !isDisabled && (
									<IconButton edge="start" onClick={handleButtonClick} disabled={isUploadDisabled}>
										<AddCircleOutlineOutlinedIcon sx={{ height: '26px', width: '26px', color: theme.palette.text.secondary }} />
										<VisuallyHiddenInput
											id="file-input"
											type="file"
											onChange={handleFilesChange}
											multiple
										/>
									</IconButton>
								),
								endAdornment: (
									<InputAdornment position="end">
										{!isDisabled && (
											<AudioRecorder
												disabled={isDisabled}
												onTranscriptionResult={handleTranscriptionResult}
												onError={handleTranscriptionError}
											/>
										)}
										{!isDisabled && input && (
											<IconButton
												edge="end"
												color="primary"
												onClick={(event: any) => {
													if (!!input?.trim()) onSubmit(event);
												}}
											>
												<ArrowCircleUpOutlinedIcon sx={{ height: '30px', width: '30px' }} />
											</IconButton>
										)}
										<ActionButton messages={messages} isLoading={isLoading} reload={reload} stop={stop} />
									</InputAdornment>
								),
							}}
							sx={{
								borderRadius: theme.shape.borderRadius,
								minHeight: '59px',
								backgroundColor: isDisabled ? colors.inputDisabled : colors.inputBackground,
								'& .MuiOutlinedInput-root': {
									borderRadius: theme.shape.borderRadius,
									minHeight: '59px',
									'&:hover fieldset': { borderRadius: theme.shape.borderRadius, minHeight: '53px' },
									'&.Mui-focused fieldset': { borderRadius: theme.shape.borderRadius, minHeight: '59px' },
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
