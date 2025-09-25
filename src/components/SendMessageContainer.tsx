import React, { useEffect, useRef, useState } from 'react';
import { Box, Grid, IconButton, InputAdornment, TextField } from '@mui/material';
import { TextareaAutosize } from '@mui/base';
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import ArrowCircleUpOutlinedIcon from '@mui/icons-material/ArrowCircleUpOutlined';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import { styled } from '@mui/material/styles';
import AttachmentsContainer from '@/components/AttachmentsContainer';
import { UIMessage } from '@ai-sdk/react';
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

	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const streamRef = useRef<MediaStream | null>(null);

	// Audio analysis
	const audioCtxRef = useRef<AudioContext | null>(null);
	const analyserRef = useRef<AnalyserNode | null>(null);
	const rafRef = useRef<number | null>(null);

	// Silence control
	const lastSoundTimeRef = useRef<number>(0);
	const isCurrentlySilentRef = useRef<boolean>(true);
	const silenceStartRef = useRef<number | null>(null);

	// Chunk management
	const chunksRef = useRef<Blob[]>([]);
	const pendingSilenceChunksRef = useRef<Blob[]>([]); // up to 2s kept silence
	const timesliceMsRef = useRef<number>(250); // granularity for chunking and silence buffer

	// UI state
	const recordingStartTimeRef = useRef<number>(0);
	const [isRecording, setIsRecording] = useState(false);
	const [isTranscribing, setIsTranscribing] = useState(false);
	const isMobile = useMediaQuery({ maxWidth: 767 });

	// Tunables
	const SILENCE_THRESHOLD = 0.01; // ~-40 dBFS
	const MAX_KEPT_SILENCE_MS = 2000; // keep up to 2s of silence in final audio
	const INACTIVITY_STOP_MS = 5000; // stop after 5s of continuous silence

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

	function pickMimeType(): string {
		let mimeType = 'audio/webm;codecs=opus';
		if (!MediaRecorder.isTypeSupported(mimeType)) {
			mimeType = 'audio/webm';
			if (!MediaRecorder.isTypeSupported(mimeType)) {
				mimeType = 'audio/mp4';
				if (!MediaRecorder.isTypeSupported(mimeType)) {
					mimeType = ''; // let browser choose
				}
			}
		}
		return mimeType;
	}

	function setupAudioAnalysis(stream: MediaStream) {
		const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
		const source = audioCtx.createMediaStreamSource(stream);
		const analyser = audioCtx.createAnalyser();
		analyser.fftSize = 2048;
		source.connect(analyser);

		audioCtxRef.current = audioCtx;
		analyserRef.current = analyser;

		lastSoundTimeRef.current = Date.now();
		isCurrentlySilentRef.current = true;
		silenceStartRef.current = Date.now();

		const data = new Uint8Array(analyser.frequencyBinCount);

		const loop = () => {
			analyser.getByteTimeDomainData(data);

			// Compute normalized RMS (0..1) from 8-bit PCM bytes (128 is center)
			let sumSquares = 0;
			for (let i = 0; i < data.length; i++) {
				const v = (data[i] - 128) / 128; // -1..1
				sumSquares += v * v;
			}
			const rms = Math.sqrt(sumSquares / data.length); // 0..1

			const now = Date.now();
			if (rms > SILENCE_THRESHOLD) {
				// speech detected
				lastSoundTimeRef.current = now;
				if (isCurrentlySilentRef.current) {
					// transitioning from silence -> speech
					isCurrentlySilentRef.current = false;
					silenceStartRef.current = null;

					// Flush up to 2s of kept silence into main chunks
					if (pendingSilenceChunksRef.current.length) {
						chunksRef.current.push(...pendingSilenceChunksRef.current);
						pendingSilenceChunksRef.current = [];
					}
				}
			} else {
				// silence
				if (!isCurrentlySilentRef.current) {
					// speech -> silence transition
					isCurrentlySilentRef.current = true;
					silenceStartRef.current = now;
				}

				// If we’ve been silent for 5s, stop the recording (auto-stop on inactivity)
				if (now - lastSoundTimeRef.current >= INACTIVITY_STOP_MS) {
					// Will stop in a microtask to avoid state change within RAF
					Promise.resolve().then(() => stopRecording(true));
				}
			}

			rafRef.current = requestAnimationFrame(loop);
		};

		rafRef.current = requestAnimationFrame(loop);
	}

	const startRecording = async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: {
					sampleRate: 16000,
					channelCount: 1,
					echoCancellation: true,
					noiseSuppression: true,
				},
			});

			streamRef.current = stream;
			setupAudioAnalysis(stream);

			const mimeType = pickMimeType();
			const timeslice = timesliceMsRef.current; // 250ms

			const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
			mediaRecorderRef.current = recorder;

			chunksRef.current = [];
			pendingSilenceChunksRef.current = [];

			recorder.ondataavailable = (event) => {
				if (!event.data || event.data.size === 0) return;

				const now = Date.now();

				if (isCurrentlySilentRef.current) {
					// We're in silence: keep at most the last 2 seconds
					pendingSilenceChunksRef.current.push(event.data);

					// Drop oldest if we exceed the 2s window
					const maxChunks = Math.ceil(MAX_KEPT_SILENCE_MS / timeslice);
					if (pendingSilenceChunksRef.current.length > maxChunks) {
						pendingSilenceChunksRef.current.splice(
							0,
							pendingSilenceChunksRef.current.length - maxChunks,
						);
					}

					// If continuous silence exceeds 5s, we'll stop via the analyser loop (auto-stop)
					// We still collect up to 2s in pending buffer during that time.
				} else {
					// We're speaking: push chunk directly
					chunksRef.current.push(event.data);
				}

				// Safety: if total recording exceeds ~2 minutes, stop (prevents runaway)
				const elapsed = now - recordingStartTimeRef.current;
				if (elapsed > 2 * 60 * 1000) {
					stopRecording(true);
				}
			};

			recorder.onstop = async () => {
				// If we stopped while silent, append the kept silence (up to 2s)
				if (pendingSilenceChunksRef.current.length) {
					chunksRef.current.push(...pendingSilenceChunksRef.current);
					pendingSilenceChunksRef.current = [];
				}

				const finalChunks = chunksRef.current.slice();
				chunksRef.current = [];

				cleanupAudio();

				if (finalChunks.length > 0) {
					const finalType = mimeType || 'audio/webm';
					const audioBlob = new Blob(finalChunks, { type: finalType });
					await transcribeAudio(audioBlob);
				}

				// Clean up stream
				if (streamRef.current) {
					streamRef.current.getTracks().forEach((t) => t.stop());
					streamRef.current = null;
				}
			};

			recorder.start(timeslice); // collect data every 250ms
			recordingStartTimeRef.current = Date.now();
			setIsRecording(true);
		} catch (error) {
			console.error('Error starting recording:', error);
			cleanupAudio(true);
		}
	};

	function cleanupAudio(closeCtx = false) {
		if (rafRef.current != null) {
			cancelAnimationFrame(rafRef.current);
			rafRef.current = null;
		}
		if (closeCtx && audioCtxRef.current) {
			try {
				audioCtxRef.current.close();
			} catch {}
		}
		audioCtxRef.current = null;
		analyserRef.current = null;
		isCurrentlySilentRef.current = true;
		silenceStartRef.current = null;
	}

	const stopRecording = (fromAutoStop = false) => {
		const recorder = mediaRecorderRef.current;
		if (!recorder || recorder.state === 'inactive') return;

		// Enforce minimum 1s capture (optional)
		const recordingDuration = Date.now() - recordingStartTimeRef.current;
		const remaining = Math.max(0, 1000 - recordingDuration);

		const doStop = () => {
			try {
				recorder.stop();
			} catch (e) {
				console.warn('MediaRecorder stop error:', e);
			} finally {
				mediaRecorderRef.current = null;
				setIsRecording(false);
			}
		};

		if (remaining > 0 && !fromAutoStop) {
			setTimeout(doStop, remaining);
		} else {
			doStop();
		}
	};

	const transcribeAudio = async (audioBlob: Blob) => {
		try {
			setIsTranscribing(true);

			const formData = new FormData();
			const fileExtension = audioBlob.type.includes('mp4') ? 'mp4' : 'webm';
			formData.append('audio', audioBlob, `recording.${fileExtension}`);

			const response = await fetch('/api/transcribe', {
				method: 'POST',
				body: formData,
			});

			if (response.ok) {
				const result = await response.json();
				if (result.text && result.text.trim()) {
					handleInputChange(input + (input ? ' ' : '') + result.text.trim());
				}
			} else {
				const errorText = await response.text();
				console.error('Transcription failed:', response.status, errorText);
			}
		} catch (error) {
			console.error('Error transcribing audio:', error);
		} finally {
			setIsTranscribing(false);
		}
	};

	const handleMicClick = () => {
		if (isRecording) {
			stopRecording();
		} else {
			startRecording();
		}
	};

	return (
		<Grid className="send-message-container" container sx={{ width: '100%' }}>
			<Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
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
										<AddCircleOutlineOutlinedIcon sx={{ height: '26px', width: '26px' }} />
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
											<IconButton onClick={handleMicClick} disabled={isTranscribing} color={isRecording ? 'error' : 'default'}>
												{isRecording ? (
													<MicOffIcon sx={{ height: '24px', width: '24px' }} />
												) : (
													<MicIcon sx={{ height: '24px', width: '24px', opacity: isTranscribing ? 0.5 : 1 }} />
												)}
											</IconButton>
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
								borderRadius: '13px',
								minHeight: '59px',
								backgroundColor: isDisabled ? '#F0F0F0' : '#FAFAFA',
								'& .MuiOutlinedInput-root': {
									borderRadius: '13px',
									minHeight: '59px',
									'&:hover fieldset': { borderRadius: '13px', minHeight: '53px' },
									'&.Mui-focused fieldset': { borderRadius: '13px', minHeight: '59px' },
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
