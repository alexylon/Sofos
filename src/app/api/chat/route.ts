import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { convertToCoreMessages, StreamData, streamText, StreamTextResult } from 'ai';

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

export async function POST(req: Request) {
	// Extract the `messages` from the body of the request
	const { messages, data } = await req.json();

	const model = data.model.startsWith("claude")
		? anthropic(data.model)
		: openai(data.model);

	const result: StreamTextResult<any> = await streamText({
		model: model,
		messages: convertToCoreMessages(messages),
		temperature: data.samplingParameter,
		topP: data.samplingParameter,
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
	streamData.appendMessageAnnotation({ model: data.model });
	await streamData.close();

	return result.toDataStreamResponse({ data: streamData });
}
