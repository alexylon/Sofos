import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { convertToCoreMessages, StreamData, streamText, StreamTextResult } from 'ai';

// maxDuration streaming response time is 60 seconds
export const maxDuration = 60;

export async function POST(req: Request) {
	// Extract the data from the body of the request
	const { messages, model, samplingParameter, reasoningEffort } = await req.json();

	const modelName = model.provider === 'anthropic'
		? anthropic(model.value)
		: openai(model.value);

	const providerOptions = model.provider === 'openAI' && model.isReasoning
		? { openai: { reasoningEffort } }
		: undefined;

	try {
		const result: StreamTextResult<any, any> = streamText({
			model: modelName,
			messages: convertToCoreMessages(messages),
			temperature: samplingParameter,
			topP: samplingParameter,
			providerOptions,
			async onFinish({ text, toolCalls, toolResults, usage, finishReason, response }) {
				// implement your own logic here, e.g. for storing messages
				// or recording token usage
			},
		});

		const streamData = new StreamData();
		streamData.appendMessageAnnotation({ modelValue: model.value });
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
