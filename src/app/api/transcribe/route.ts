import { experimental_transcribe as transcribe } from 'ai';
import { openai } from '@ai-sdk/openai';

export const runtime = 'nodejs';
export const maxDuration = 60;

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
		const buffer = Buffer.from(ab);

		// Audio is already converted to WAV in the browser
		console.log(`Processing audio file: ${audioFile.type}`);

		const { text: transcription } = await transcribe({
			model: openai.transcription('gpt-4o-mini-transcribe'),
			audio: buffer,
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
