// import OpenAI from 'openai';
import { experimental_transcribe as transcribe } from 'ai';
import { openai } from '@ai-sdk/openai';
import { spawn } from 'child_process';


export const runtime = 'nodejs';
export const maxDuration = 60;

function convertWebmToWav(input: Buffer): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		const ff = spawn('ffmpeg', [
			'-f', 'webm',
			'-i', 'pipe:0',
			'-ac', '1',
			'-ar', '16000',
			'-f', 'wav',
			'pipe:1',
		]);
		const chunks: Buffer[] = [];
		ff.stdout.on('data', (d) => chunks.push(d as Buffer));
		ff.stderr.on('data', () => {}); // optionally log
		ff.on('close', (code) => code === 0 ? resolve(Buffer.concat(chunks)) : reject(new Error(`ffmpeg exited ${code}`)));
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

		buffer = audioFile.type === 'audio/webm' ? await convertWebmToWav(buffer) : buffer;

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
