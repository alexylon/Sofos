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


	function pickMimeType(): string {
		// Always try MP4 first, then webm as fallback
		if (MediaRecorder.isTypeSupported('audio/mp4')) {
			return 'audio/mp4';
		}

		if (MediaRecorder.isTypeSupported('audio/webm')) {
			return 'audio/webm';
		}

		return ''; // let browser choose
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
		if (audioCtx.state === 'suspended') {
			const resumeAudio = async () => {
				try {
					await audioCtx.resume();
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
					}
				}
			}

			rafRef.current = requestAnimationFrame(loop);
		};

		rafRef.current = requestAnimationFrame(loop);
	}


	const startRecording = async (forceSimplified = false) => {
		try {
			setRecordingError(null);

			// Detect environment
			const isIOSSafari = /iPad|iPhone|iPod/.test(navigator.userAgent) && /Safari/.test(navigator.userAgent);
			const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
						 (window.navigator as any).standalone === true;


			// Check basic support
			if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
				throw new Error('getUserMedia is not supported in this environment');
			}

			if (!window.MediaRecorder) {
				throw new Error('MediaRecorder is not supported in this browser');
			}

			// Use simplified recording for iOS PWA or when forced
			const useSimplified = forceSimplified || (isIOSSafari && isPWA);

			// Get user media with appropriate constraints
			const audioConstraints = useSimplified
				? true // Most basic constraints for simplified mode
				: isIOSSafari
				? { echoCancellation: true, noiseSuppression: true }
				: { sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true };


			const stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });
			streamRef.current = stream;

			// Set up audio analysis only if not simplified
			if (!useSimplified) {
				setupAudioAnalysis(stream);
			}

			// Always try MP4 first
			const mimeType = pickMimeType();

			// Create MediaRecorder with fallbacks
			let recorder: MediaRecorder;

			try {
				recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
			} catch (error) {
				recorder = new MediaRecorder(stream);
			}

			recorder.onerror = (event) => {
				console.error('MediaRecorder error:', event);
				setIsRecording(false);
				setRecordingError('Recording failed');
				setHint('Recording failed');
				setTimeout(() => setHint(null), 5000);

				if (!useSimplified) {
					cleanupAudio(true);
				}
			};

			mediaRecorderRef.current = recorder;

			if (useSimplified) {
				// Simplified recording: collect all chunks
				const chunks: Blob[] = [];

				recorder.ondataavailable = (event) => {
					if (event.data.size > 0) {
						chunks.push(event.data);
					}
				};

				recorder.onstop = async () => {
					if (chunks.length > 0) {
						const finalType = mimeType || (MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : 'audio/webm');
						const audioBlob = new Blob(chunks, { type: finalType });
						await transcribeAudio(audioBlob);
					}

					// Clean up stream
					if (streamRef.current) {
						streamRef.current.getTracks().forEach((t) => t.stop());
						streamRef.current = null;
					}
				};

				recorder.start();

				// Auto-stop after 30 seconds for simplified recording
				setTimeout(() => {
					if (mediaRecorderRef.current?.state === 'recording') {
						mediaRecorderRef.current.stop();
					}
				}, 30000);
			} else {
				// Advanced recording with silence detection
				chunksRef.current = [];
				pendingSilenceChunksRef.current = [];
				const timeslice = timesliceMsRef.current;

				recorder.ondataavailable = (event) => {
					if (!event.data || event.data.size === 0) {
						return;
					}

					if (isCurrentlySilentRef.current) {
						// Keep at most 2s of silence
						pendingSilenceChunksRef.current.push(event.data);
						const maxChunks = Math.ceil(MAX_KEPT_SILENCE_MS / timeslice);

						if (pendingSilenceChunksRef.current.length > maxChunks) {
							pendingSilenceChunksRef.current.splice(0, pendingSilenceChunksRef.current.length - maxChunks);
						}
					} else {
						// Active speech
						chunksRef.current.push(event.data);
					}

					// Safety timeout after 2 minutes
					if (Date.now() - recordingStartTimeRef.current > 2 * 60 * 1000) {
						stopRecording(true);
					}
				};

				recorder.onstop = async () => {
					// Append kept silence if any
					if (pendingSilenceChunksRef.current.length) {
						chunksRef.current.push(...pendingSilenceChunksRef.current);
						pendingSilenceChunksRef.current = [];
					}

					const finalChunks = chunksRef.current.slice();
					chunksRef.current = [];
					cleanupAudio();

					if (finalChunks.length > 0) {
						const finalType = mimeType || (MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : 'audio/webm');
						const audioBlob = new Blob(finalChunks, { type: finalType });
						await transcribeAudio(audioBlob);
					}

					// Clean up stream
					if (streamRef.current) {
						streamRef.current.getTracks().forEach((t) => t.stop());
						streamRef.current = null;
					}
				};

				recorder.start(timeslice);
			}

			recordingStartTimeRef.current = Date.now();
			setIsRecording(true);
			setHint('Recording now... Tap the microphone to stop');

		} catch (error) {
			console.error('Error starting recording:', error);

			setRecordingError(`Recording failed: ${error}`);

			if (!forceSimplified) {
				cleanupAudio(true);
			}

			throw error;
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
			setIsRecording(false);
			setHint(null);
			return;
		}


		const doStop = () => {
			try {
				recorder.stop();
			} catch (e) {
			} finally {
				mediaRecorderRef.current = null;
				setIsRecording(false);
				setHint(null);
			}
		};

		// For advanced recording with silence detection, ensure minimum 1s duration
		if (!fromAutoStop && analyserRef.current) {
			const recordingDuration = Date.now() - recordingStartTimeRef.current;
			const remaining = Math.max(0, 1000 - recordingDuration);

			if (remaining > 0) {
				setTimeout(doStop, remaining);
				return;
			}
		}

		doStop();
	};

	const convertToWav = async (audioBlob: Blob): Promise<Blob> => {
		// Decode the audio blob to raw PCM data
		const arrayBuffer = await audioBlob.arrayBuffer();
		const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
		const audioContext = new AudioContextClass();
		const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

		// Convert to mono 16kHz WAV
		const targetSampleRate = 16000;
		const numberOfChannels = 1;

		// Resample if needed
		let samples: Float32Array;
		if (audioBuffer.sampleRate === targetSampleRate) {
			samples = audioBuffer.getChannelData(0);
		} else {
			// Simple linear resampling
			const ratio = audioBuffer.sampleRate / targetSampleRate;
			const newLength = Math.round(audioBuffer.length / ratio);
			samples = new Float32Array(newLength);
			const channelData = audioBuffer.getChannelData(0);

			for (let i = 0; i < newLength; i++) {
				const srcIndex = i * ratio;
				const srcIndexFloor = Math.floor(srcIndex);
				const srcIndexCeil = Math.min(srcIndexFloor + 1, channelData.length - 1);
				const fraction = srcIndex - srcIndexFloor;
				samples[i] = channelData[srcIndexFloor] * (1 - fraction) + channelData[srcIndexCeil] * fraction;
			}
		}

		// Convert float32 samples to int16
		const int16Samples = new Int16Array(samples.length);
		for (let i = 0; i < samples.length; i++) {
			const s = Math.max(-1, Math.min(1, samples[i]));
			int16Samples[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
		}

		// Create WAV file
		const wavBuffer = createWavFile(int16Samples, targetSampleRate, numberOfChannels);
		return new Blob([wavBuffer], { type: 'audio/wav' });
	};

	const createWavFile = (samples: Int16Array, sampleRate: number, numChannels: number): ArrayBuffer => {
		const bytesPerSample = 2; // 16-bit
		const dataSize = samples.length * bytesPerSample;
		const buffer = new ArrayBuffer(44 + dataSize);
		const view = new DataView(buffer);

		// WAV header
		const writeString = (offset: number, str: string) => {
			for (let i = 0; i < str.length; i++) {
				view.setUint8(offset + i, str.charCodeAt(i));
			}
		};

		writeString(0, 'RIFF');
		view.setUint32(4, 36 + dataSize, true);
		writeString(8, 'WAVE');
		writeString(12, 'fmt ');
		view.setUint32(16, 16, true); // fmt chunk size
		view.setUint16(20, 1, true); // PCM format
		view.setUint16(22, numChannels, true);
		view.setUint32(24, sampleRate, true);
		view.setUint32(28, sampleRate * numChannels * bytesPerSample, true); // byte rate
		view.setUint16(32, numChannels * bytesPerSample, true); // block align
		view.setUint16(34, 16, true); // bits per sample
		writeString(36, 'data');
		view.setUint32(40, dataSize, true);

		// Write samples
		for (let i = 0; i < samples.length; i++) {
			view.setInt16(44 + i * 2, samples[i], true);
		}

		return buffer;
	};

	const transcribeAudio = async (audioBlob: Blob) => {
		try {
			setIsTranscribing(true);
			setRecordingError(null);

			// Convert to WAV in the browser for maximum compatibility
			const wavBlob = await convertToWav(audioBlob);

			const formData = new FormData();
			const audioFile = new File([wavBlob], 'recording.wav', { type: 'audio/wav' });
			formData.append('audio', audioFile);

			const response = await fetch('/api/transcribe', {
				method: 'POST',
				body: formData,
			});

			if (response.ok) {
				const result = await response.json();

				// iOS-specific debugging
				const isIOSSafari = /iPad|iPhone|iPod/.test(navigator.userAgent) && /Safari/.test(navigator.userAgent);
				const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
							 (window.navigator as any).standalone === true;

				if (result.text && result.text.trim()) {
					const trimmedText = result.text.trim();

					try {
						// For iOS, ensure the callback runs in the next tick
						if (isIOSSafari || isPWA) {
							setTimeout(() => {
								onTranscriptionResult(trimmedText);
							}, 0);
						} else {
							onTranscriptionResult(trimmedText);
						}
					} catch (error) {
						setHint(`Error in onTranscriptionResult callback:: ${error}`);
						setTimeout(() => setHint(null), 5000);
						console.error('Error in onTranscriptionResult callback:', error);
					}
				}
			} else {
				const errorText = await response.text();

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
			setHint(null);
		} else {
			// Establish user gesture for PWA
			const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
						 (window.navigator as any).standalone === true;

			if (isPWA) {
				try {
					const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
					const tempCtx = new AudioContextClass();

					if (tempCtx.state === 'suspended') {
						await tempCtx.resume();
					}

					await tempCtx.close();
				} catch (e) {
					// Silently fail user gesture establishment
				}
			}

			try {
				await startRecording();
			} catch (error) {
				console.error('Primary recording failed:', error);

				// Fallback to simplified recording
				try {
					await startRecording(true);
				} catch (fallbackError) {
					console.error('Simplified recording also failed:', fallbackError);
					const errorMessage = `Recording failed: ${fallbackError || 'Unknown error'}`;
					setRecordingError(errorMessage);
					onError?.(errorMessage);
				}
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
