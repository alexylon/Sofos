import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { convertToCoreMessages, streamText, StreamTextResult } from 'ai';

// maxDuration streaming response time is 60 seconds
export const maxDuration = 60;

export async function POST(req: Request) {
	// Extract the data from the body of the request
	const { messages, model, samplingParameter } = await req.json();

	const modelName = model.startsWith("claude")
		? anthropic(model)
		: openai(model);

	try {
		const result: StreamTextResult<any> = await streamText({
			model: modelName,
			messages: convertToCoreMessages(messages),
			temperature: samplingParameter,
			topP: samplingParameter,
			async onFinish({ text, toolCalls, toolResults, usage, finishReason, response, responseMessages }) {
				// implement your own logic here, e.g. for storing messages
				// or recording token usage
			},
		});

		return result.toDataStreamResponse();
	} catch (error) {
		if (error instanceof Error) {
			return new Response("Server error: " + error.message, {
				status: 500,
				headers: { 'Content-Type': 'text/plain' }
			});
		} else {
			return new Response("Server error: unknown error", {
				status: 500,
				headers: { 'Content-Type': 'text/plain' }
			});
		}
	}
}
