// import OpenAI from 'openai';
import { experimental_transcribe as transcribe } from 'ai';
import { openai } from '@ai-sdk/openai';
import { spawn } from 'child_process';


export const runtime = 'nodejs';
export const maxDuration = 60;

function convertAudioToWav(input: Buffer, inputFormat: string): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		let ffmpegInputFormat = 'webm';

		if (inputFormat.includes('mp4') || inputFormat.includes('m4a')) {
			ffmpegInputFormat = 'mp4';
		} else if (inputFormat.includes('webm')) {
			ffmpegInputFormat = 'webm';
		} else if (inputFormat.includes('wav')) {
			ffmpegInputFormat = 'wav';
		} else if (inputFormat.includes('ogg')) {
			ffmpegInputFormat = 'ogg';
		} else if (inputFormat.includes('3gp')) {
			ffmpegInputFormat = '3gp';
		}

		console.log(`Converting audio from ${inputFormat} (${ffmpegInputFormat || 'auto-detect'}) to WAV`);

		const ffmpegArgs = [];
		if (ffmpegInputFormat) {
			ffmpegArgs.push('-f', ffmpegInputFormat);
		}
		ffmpegArgs.push(
			'-i', 'pipe:0',
			'-ac', '1',           // mono
			'-ar', '16000',       // 16kHz sample rate
			'-f', 'wav',
			'pipe:1'
		);

		const ff = spawn('ffmpeg', ffmpegArgs);

		const chunks: Buffer[] = [];
		const errorChunks: Buffer[] = [];

		ff.stdout.on('data', (d) => chunks.push(d as Buffer));
		ff.stderr.on('data', (d) => errorChunks.push(d as Buffer));

		ff.on('close', (code) => {
			if (code === 0) {
				console.log('Audio conversion successful');
				resolve(Buffer.concat(chunks));
			} else {
				const errorOutput = Buffer.concat(errorChunks).toString();
				console.error('ffmpeg conversion failed:', { code, error: errorOutput });
				reject(new Error(`ffmpeg exited ${code}: ${errorOutput}`));
			}
		});

		ff.on('error', (err) => {
			console.error('ffmpeg spawn error:', err);
			reject(err);
		});

		ff.stdin.end(input);
	});
}

export async function POST(req: Request) {
	try {
		const formData = await req.formData();
		const audioFile = formData.get('audio') as File;

		if (!audioFile) {
			console.error('No audio file provided');
			return new Response('No audio file provided', { status: 400 });
		}

		console.log('Received audio file:', {
			name: audioFile.name,
			type: audioFile.type,
			size: audioFile.size
		});

		const ab = await audioFile.arrayBuffer();
		let buffer = Buffer.from(ab);

		// Convert audio if it's not already in a format that Whisper can handle directly
		const audioType = audioFile.type.toLowerCase();
		const needsConversion = audioType.includes('webm') || audioType.includes('mp4') || audioType.includes('ogg');

		if (needsConversion) {
			console.log(`Converting audio file of type: ${audioType}`);
			buffer = await convertAudioToWav(buffer, audioType);
		} else {
			console.log(`Using audio file directly without conversion: ${audioType}`);
		}

		const { text: transcription } = await transcribe({
			model: openai.transcription('whisper-1'),
			audio: buffer,
			// Optional: language hint if you know it
			// language: 'en',
		});

		return new Response(JSON.stringify({ text: transcription }), {
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (error) {
		console.error('Transcription error details:', {
			error: error instanceof Error ? error.message : error,
			stack: error instanceof Error ? error.stack : undefined
		});
		return new Response(
			JSON.stringify({
				error: 'Failed to transcribe audio',
				message: error instanceof Error ? error.message : error }),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			}
		);
	}
}
