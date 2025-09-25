import React, { useRef, useState, useEffect } from 'react';
import { IconButton } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';

interface AudioRecorderProps {
	disabled?: boolean;
	onTranscriptionResult: (text: string) => void;
	onError?: (error: string) => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({
	disabled = false,
	onTranscriptionResult,
	onError
}) => {
	// Media recorder and stream refs
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
	const [recordingError, setRecordingError] = useState<string | null>(null);
	const [hint, setHint] = useState<string | null>(null);

	// Tunables
	const SILENCE_THRESHOLD = 0.01; // ~-40 dBFS
	const MAX_KEPT_SILENCE_MS = 2000; // keep up to 2s of silence in final audio
	const INACTIVITY_STOP_MS = 5000; // stop after 5s of continuous silence

	// Debug function for PWA troubleshooting
	const debugPWARecording = () => {
		const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
					 (window.navigator as any).standalone === true;
		const isIOSSafari = /iPad|iPhone|iPod/.test(navigator.userAgent) && /Safari/.test(navigator.userAgent);

		const debugInfo = {
			isPWA,
			isIOSSafari,
			userAgent: navigator.userAgent,
			displayMode: window.matchMedia('(display-mode: standalone)').matches,
			standalone: (window.navigator as any).standalone,
			hasMediaDevices: !!navigator.mediaDevices,
			hasGetUserMedia: !!navigator.mediaDevices?.getUserMedia,
			hasMediaRecorder: !!window.MediaRecorder,
			hasAudioContext: !!(window.AudioContext || (window as any).webkitAudioContext),
			mediaRecorderSupport: {
				basic: window.MediaRecorder ? MediaRecorder.isTypeSupported('') : false,
				webm: window.MediaRecorder ? MediaRecorder.isTypeSupported('audio/webm') : false,
				mp4: window.MediaRecorder ? MediaRecorder.isTypeSupported('audio/mp4') : false,
			},
			isRecording,
			mediaRecorderState: mediaRecorderRef.current?.state || 'none',
			streamActive: streamRef.current?.active || false,
			audioContextState: audioCtxRef.current?.state || 'none'
		};

		console.table(debugInfo);
		return debugInfo;
	};

	// Make debug function available globally
	useEffect(() => {
		(window as any).debugPWARecording = debugPWARecording;
		return () => {
			delete (window as any).debugPWARecording;
		};
	}, [isRecording]);

	function pickMimeType(): string {
		// iOS Safari prefers mp4 format
		const isIOSSafari = /iPad|iPhone|iPod/.test(navigator.userAgent) && /Safari/.test(navigator.userAgent);

		if (isIOSSafari) {
			if (MediaRecorder.isTypeSupported('audio/mp4')) {
				return 'audio/mp4';
			}
		}

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
		const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;

		// PWA may need different AudioContext initialization
		const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
					 (window.navigator as any).standalone === true;

		const audioCtx = new AudioContextClass(
			isPWA ? {} : { sampleRate: 16000 } // PWA: use default settings
		);

		// iOS Safari and PWA require AudioContext to be resumed after user gesture
		// For PWA, we need to be more aggressive about resuming
		if (audioCtx.state === 'suspended') {
			const resumeAudio = async () => {
				try {
					await audioCtx.resume();
					console.log('AudioContext resumed successfully');
				} catch (error) {
					console.error('Failed to resume AudioContext:', error);
				}
			};

			// Try multiple times for PWA
			if (isPWA) {
				resumeAudio();
				setTimeout(resumeAudio, 100);
				setTimeout(resumeAudio, 500);
			} else {
				resumeAudio();
			}
		}

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

				// Check if we should auto-stop (avoid auto-stop on iOS Safari/PWA due to user gesture requirements)
				const isIOSSafari = /iPad|iPhone|iPod/.test(navigator.userAgent) && /Safari/.test(navigator.userAgent);
				const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
							 (window.navigator as any).standalone === true;

				if (now - lastSoundTimeRef.current >= INACTIVITY_STOP_MS) {
					if (!isIOSSafari && !isPWA) {
						// Only auto-stop on non-iOS Safari or non-PWA environments
						Promise.resolve().then(() => stopRecording(true));
					} else {
						// For iOS Safari/PWA, just log that we would auto-stop but don't do it
						console.log('Would auto-stop due to inactivity, but disabled for iOS Safari/PWA. Please stop manually.');
					}
				}
			}

			rafRef.current = requestAnimationFrame(loop);
		};

		rafRef.current = requestAnimationFrame(loop);
	}

	const startSimplifiedRecording = async () => {
		try {
			console.log('Starting simplified recording for PWA...');
			setRecordingError(null);

			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			streamRef.current = stream;

			const recorder = new MediaRecorder(stream);
			mediaRecorderRef.current = recorder;

			const chunks: Blob[] = [];

			recorder.ondataavailable = (event) => {
				if (event.data.size > 0) {
					chunks.push(event.data);
					console.log('Simple recording chunk:', event.data.size, 'bytes');
				}
			};

			recorder.onstop = async () => {
				console.log('Simple recording stopped, chunks:', chunks.length);
				if (chunks.length > 0) {
					// Try to determine the correct MIME type for PWA
					const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
								 (window.navigator as any).standalone === true;
					const isIOSSafari = /iPad|iPhone|iPod/.test(navigator.userAgent) && /Safari/.test(navigator.userAgent);

					let mimeType = 'audio/webm';
					if (isPWA && isIOSSafari) {
						// PWA on iOS often records in MP4 format
						mimeType = MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : 'audio/webm';
					}

					console.log('Using MIME type for simple recording:', mimeType);
					const audioBlob = new Blob(chunks, { type: mimeType });
					await transcribeAudio(audioBlob, mimeType);
				}

				// Clean up stream
				if (streamRef.current) {
					streamRef.current.getTracks().forEach((t) => t.stop());
					streamRef.current = null;
				}
			};

			recorder.onerror = (event) => {
				console.error('Simple MediaRecorder error:', event);
				setIsRecording(false);
				setRecordingError('Recording failed');
			};

			recorder.start();
			setIsRecording(true);
			recordingStartTimeRef.current = Date.now();

			// Show manual stop hint for iOS Safari/PWA users
			const isIOSSafari = /iPad|iPhone|iPod/.test(navigator.userAgent) && /Safari/.test(navigator.userAgent);
			const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
						 (window.navigator as any).standalone === true;

			if (isIOSSafari || isPWA) {
				setHint('Tap the microphone to stop recording');
				setTimeout(() => setHint(null), 5000);
			}

			// Auto-stop after 30 seconds (simplified recording doesn't have silence detection)
			setTimeout(() => {
				if (mediaRecorderRef.current?.state === 'recording') {
					mediaRecorderRef.current.stop();
				}
			}, 30000);

			console.log('Simple recording started successfully');
		} catch (error) {
			console.error('Simple recording failed:', error);
			setHint(`Simple recording failed: ${error}`);
			setTimeout(() => setHint(null), 5000);
			setRecordingError(`Recording failed: ${error}`);
			if (streamRef.current) {
				streamRef.current.getTracks().forEach((t) => t.stop());
				streamRef.current = null;
			}
		}
	};

	const startRecording = async () => {
		try {
			// Detect iOS Safari and PWA mode
			const isIOSSafari = /iPad|iPhone|iPod/.test(navigator.userAgent) && /Safari/.test(navigator.userAgent);
			const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
						 (window.navigator as any).standalone === true;

			console.log('startRecording called:', { isIOSSafari, isPWA });

			// Check if getUserMedia is available
			if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
				throw new Error('getUserMedia is not supported in this environment');
			}

			// PWA in iOS requires even simpler constraints
			const audioConstraints = (isIOSSafari && isPWA)
				? true // Most basic constraints for PWA
				: isIOSSafari
				? {
					echoCancellation: true,
					noiseSuppression: true,
				}
				: {
					sampleRate: 16000,
					channelCount: 1,
					echoCancellation: true,
					noiseSuppression: true,
				};

			console.log('Using audio constraints:', audioConstraints);

			// For PWA, check permissions first
			if (isPWA && navigator.permissions) {
				try {
					const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
					console.log('Microphone permission state:', permission.state);
					if (permission.state === 'denied') {
						throw new Error('Microphone permission denied');
					}
				} catch (e) {
					console.warn('Permission check failed:', e);
				}
			}

			console.log('Requesting getUserMedia...');
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: audioConstraints,
			});
			console.log('getUserMedia successful, stream:', stream);

			streamRef.current = stream;
			setupAudioAnalysis(stream);

			console.log('Setting up MediaRecorder...');
			const mimeType = pickMimeType();
			const timeslice = timesliceMsRef.current; // 250ms

			console.log('Selected MIME type:', mimeType);

			// Check if MediaRecorder is supported
			if (!window.MediaRecorder) {
				throw new Error('MediaRecorder is not supported in this browser');
			}

			// Test MediaRecorder support with various options
			console.log('MediaRecorder support test:', {
				basic: MediaRecorder.isTypeSupported(''),
				webm: MediaRecorder.isTypeSupported('audio/webm'),
				mp4: MediaRecorder.isTypeSupported('audio/mp4'),
				selectedType: mimeType ? MediaRecorder.isTypeSupported(mimeType) : 'no type selected'
			});

			const recorderOptions = mimeType ? { mimeType } : undefined;
			console.log('MediaRecorder options:', recorderOptions);

			// Additional check for iOS Safari and PWA MediaRecorder support
			let recorder: MediaRecorder;
			try {
				console.log('Attempting MediaRecorder with options...');
				recorder = new MediaRecorder(stream, recorderOptions);
				console.log('MediaRecorder created successfully with options');
			} catch (error) {
				console.warn('MediaRecorder with options failed:', error);
				try {
					console.log('Attempting MediaRecorder without options...');
					recorder = new MediaRecorder(stream);
					console.log('MediaRecorder created successfully without options');
				} catch (fallbackError) {
					console.error('Basic MediaRecorder failed:', fallbackError);
					if (isPWA) {
						try {
							console.log('Attempting PWA minimal MediaRecorder approach...');
							recorder = new MediaRecorder(stream, { mimeType: '' });
							console.log('PWA minimal MediaRecorder created successfully');
						} catch (pwaError) {
							console.error('PWA minimal MediaRecorder failed:', pwaError);
							throw new Error(`MediaRecorder failed in PWA: ${pwaError}`);
						}
					} else {
						throw fallbackError;
					}
				}
			}

			// Add error handling to MediaRecorder
			recorder.onerror = (event) => {
				console.error('MediaRecorder error:', event);
				setIsRecording(false);
				cleanupAudio(true);
			};

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
					console.log('Added speech chunk, total speech chunks:', chunksRef.current.length);
				}

				// Safety: if total recording exceeds ~2 minutes, stop (prevents runaway)
				const elapsed = now - recordingStartTimeRef.current;
				if (elapsed > 2 * 60 * 1000) {
					console.log('Recording stopped due to 2 minute timeout');
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
					// Determine the final MIME type based on what was actually used
					let finalType = mimeType || 'audio/webm';

					// If we fell back to no options, try to determine type from the recorded data
					if (!mimeType && finalChunks.length > 0) {
						const isIOSSafari = /iPad|iPhone|iPod/.test(navigator.userAgent) && /Safari/.test(navigator.userAgent);
						finalType = isIOSSafari ? 'audio/mp4' : 'audio/webm';
					}

					const audioBlob = new Blob(finalChunks, { type: finalType });

					await transcribeAudio(audioBlob, finalType);
				}

				// Clean up stream
				if (streamRef.current) {
					streamRef.current.getTracks().forEach((t) => t.stop());
					streamRef.current = null;
				}
			};

			console.log('Starting MediaRecorder with timeslice:', timeslice);
			recorder.start(timeslice); // collect data every 250ms
			recordingStartTimeRef.current = Date.now();
			setIsRecording(true);

			// Show manual stop hint for iOS Safari/PWA users since auto-stop is disabled
			if (isIOSSafari || isPWA) {
				setHint('Tap the microphone to stop recording');
				setTimeout(() => setHint(null), 5000);
			}

			console.log('Recording started successfully, state:', recorder.state);
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
		if (!recorder || recorder.state === 'inactive') {
			console.log('stopRecording called but recorder not active');
			setIsRecording(false);
			return;
		}

		console.log('Stopping recording, current state:', recorder.state);

		// For simplified recording, just stop immediately
		if (recorder.stream && !analyserRef.current) {
			// This is simplified recording (no audio analysis)
			try {
				recorder.stop();
				setIsRecording(false);
				setHint(null); // Clear the hint when stopping
				mediaRecorderRef.current = null;
			} catch (e) {
				console.warn('Simple MediaRecorder stop error:', e);
				setIsRecording(false);
				setHint(null);
			}
			return;
		}

		// Original complex recording logic
		const recordingDuration = Date.now() - recordingStartTimeRef.current;
		const remaining = Math.max(0, 1000 - recordingDuration);

		const doStop = () => {
			try {
				recorder.stop();
				console.log('MediaRecorder stop called successfully');
			} catch (e) {
				console.warn('MediaRecorder stop error:', e);
			} finally {
				mediaRecorderRef.current = null;
				setIsRecording(false);
				setHint(null); // Clear the hint when stopping
			}
		};

		if (remaining > 0 && !fromAutoStop) {
			console.log('Waiting', remaining, 'ms before stopping to meet minimum duration');
			setTimeout(doStop, remaining);
		} else {
			doStop();
		}
	};

	const transcribeAudio = async (audioBlob: Blob, mimeType?: string) => {
		try {
			setIsTranscribing(true);
			setRecordingError(null);

			const formData = new FormData();
			const blobType = mimeType || audioBlob.type;
			const fileExtension = blobType.includes('mp4') ? 'mp4' : 'webm';

			console.log('Transcribing audio:', {
				blobSize: audioBlob.size,
				blobType: audioBlob.type,
				providedMimeType: mimeType,
				finalMimeType: blobType,
				fileExtension
			});

			// Create the file with explicit MIME type
			const audioFile = new File([audioBlob], `recording.${fileExtension}`, { type: blobType });
			formData.append('audio', audioFile);

			const response = await fetch('/api/transcribe', {
				method: 'POST',
				body: formData,
			});

			if (response.ok) {
				const result = await response.json();
				console.log('Transcription successful:', result);

				// iOS-specific debugging
				const isIOSSafari = /iPad|iPhone|iPod/.test(navigator.userAgent) && /Safari/.test(navigator.userAgent);
				const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
							 (window.navigator as any).standalone === true;

				console.log('iOS Transcription Debug:', {
					isIOSSafari,
					isPWA,
					resultText: result.text,
					textTrimmed: result.text?.trim(),
					textLength: result.text?.trim()?.length || 0,
					onTranscriptionResultType: typeof onTranscriptionResult
				});

				if (result.text && result.text.trim()) {
					const trimmedText = result.text.trim();
					console.log('Calling onTranscriptionResult with:', trimmedText);

					try {
						// For iOS, ensure the callback runs in the next tick
						if (isIOSSafari || isPWA) {
							// Show visual feedback that transcription completed on iOS
							console.log('🎙️ Transcription completed on iOS:', trimmedText);
							setHint(`trimmedText: ${trimmedText}`);
							setTimeout(() => setHint(null), 5000);

							setTimeout(() => {
								console.log('iOS delayed callback execution');
								onTranscriptionResult(trimmedText);
								console.log('iOS onTranscriptionResult called successfully');
							}, 0);
						} else {
							onTranscriptionResult(trimmedText);
							console.log('onTranscriptionResult called successfully');
						}
					} catch (error) {
						setHint(`Error in onTranscriptionResult callback:: ${error}`);
						setTimeout(() => setHint(null), 5000);
						console.error('Error in onTranscriptionResult callback:', error);
					}
				} else {
					console.warn('Transcription result was empty or invalid:', result);
				}
			} else {
				const errorText = await response.text();
				console.error('Transcription failed:', {
					status: response.status,
					statusText: response.statusText,
					errorText
				});

				try {
					const errorJson = JSON.parse(errorText);
					const errorMessage = `Transcription failed: ${errorJson.message || errorJson.error || 'Unknown error'}`;
					setRecordingError(errorMessage);
					onError?.(errorMessage);
				} catch {
					const errorMessage = `Transcription failed: ${response.status} ${response.statusText}`;
					setRecordingError(errorMessage);
					onError?.(errorMessage);
				}
			}
		} catch (error) {
			console.error('Error transcribing audio:', error);
			const errorMessage = `Transcription error: ${error instanceof Error ? error.message : 'Unknown error'}`;
			setRecordingError(errorMessage);
			onError?.(errorMessage);
		} finally {
			setIsTranscribing(false);
		}
	};

	const handleMicClick = async () => {
		if (isRecording) {
			stopRecording();
		} else {
			// Comprehensive PWA debugging
			const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
						 (window.navigator as any).standalone === true;
			const isIOSSafari = /iPad|iPhone|iPod/.test(navigator.userAgent) && /Safari/.test(navigator.userAgent);

			console.log('PWA Recording Debug:', {
				isPWA,
				isIOSSafari,
				userAgent: navigator.userAgent,
				displayMode: window.matchMedia('(display-mode: standalone)').matches,
				standalone: (window.navigator as any).standalone,
				hasMediaDevices: !!navigator.mediaDevices,
				hasGetUserMedia: !!navigator.mediaDevices?.getUserMedia,
				hasMediaRecorder: !!window.MediaRecorder,
				hasAudioContext: !!(window.AudioContext || (window as any).webkitAudioContext)
			});

			if (isPWA) {
				// Create an immediate AudioContext to establish user gesture
				try {
					const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
					const tempCtx = new AudioContextClass();
					console.log('Temp AudioContext state:', tempCtx.state);

					if (tempCtx.state === 'suspended') {
						await tempCtx.resume();
						console.log('Temp AudioContext resumed, new state:', tempCtx.state);
					}
					await tempCtx.close();
				} catch (e) {
					console.error('Failed to establish user gesture context:', e);
				}
			}

			try {
				// For PWA with iOS Safari, try simplified approach first
				if (isPWA && isIOSSafari) {
					console.log('Using simplified recording for iOS PWA');
					await startSimplifiedRecording();
				} else {
					await startRecording();
				}
			} catch (error) {
				console.error('Recording failed in handleMicClick:', error);

				// Fallback: try simplified recording if main recording fails
				if (!isPWA || !isIOSSafari) {
					console.log('Main recording failed, trying simplified approach...');
					try {
						await startSimplifiedRecording();
						return;
					} catch (fallbackError) {
						console.error('Fallback recording also failed:', fallbackError);
					}
				}

				// Show user-friendly error
				const errorMessage = `Recording failed: ${error || 'Unknown error'}`;
				setRecordingError(errorMessage);
				onError?.(errorMessage);
				alert(`${errorMessage}. Please ensure microphone permissions are granted.`);
			}
		}
	};

	// Clean up on unmount
	useEffect(() => {
		return () => {
			if (isRecording) {
				stopRecording();
			}
			cleanupAudio(true);
		};
	}, []);

	return (
		<>
			{/* Manual stop hint for iOS Safari/PWA */}
			{hint && (
				<div style={{
					position: 'absolute',
					bottom: '100%',
					left: '50%',
					transform: 'translateX(-50%)',
					backgroundColor: 'rgba(0, 0, 0, 0.8)',
					color: 'white',
					padding: '8px 16px',
					borderRadius: '8px',
					fontSize: '14px',
					whiteSpace: 'nowrap',
					zIndex: 1000,
					marginBottom: '8px'
				}}>
					{hint}
				</div>
			)}
			<IconButton
				onClick={handleMicClick}
				disabled={disabled || isTranscribing}
				color={isRecording ? 'error' : recordingError ? 'warning' : 'default'}
				title={recordingError || (isRecording ? 'Stop recording' : 'Start recording')}
			>
				{isRecording ? (
					<MicOffIcon sx={{ height: '24px', width: '24px' }} />
				) : (
					<MicIcon sx={{
						height: '24px',
						width: '24px',
						opacity: isTranscribing ? 0.5 : 1,
						color: recordingError ? 'orange' : 'inherit'
					}} />
				)}
			</IconButton>
		</>
	);
};

export default AudioRecorder;
