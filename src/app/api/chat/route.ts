import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { convertToCoreMessages, StreamData, streamText, StreamTextResult } from 'ai';

// Allow streaming response up to 60 seconds
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

				// const modelId = response.modelId;
				// console.log('modelId', modelId);
				// const streamData = new StreamData();
				// // streamData.appendMessageAnnotation({ modelId: "TEST2" });
				// await streamData.close();
			},
		});

		const streamData = new StreamData();
		streamData.appendMessageAnnotation({ model });
		await streamData.close();

		return result.toDataStreamResponse({ data: streamData });
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
