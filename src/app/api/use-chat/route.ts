import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { convertToCoreMessages, StreamData, streamText, StreamTextResult } from 'ai';

// maxDuration streaming response time is 60 seconds
export const maxDuration = 60;

export async function POST(req: Request) {
	// Extract the data from the body of the request
	const { messages, model, samplingParameter, reasoningEffort, hybridParameter } = await req.json();

	const modelName = model.provider === 'anthropic'
		? anthropic(model.value)
		: openai(model.value);

	let providerOptions;
	let temperature = samplingParameter;
	let topP = samplingParameter;

	if (model.provider === 'openAI' && model.type === 'REASONING') {
		providerOptions = { openai: { reasoningEffort } };
		temperature = undefined;
		topP = undefined;
	}

	if (model.provider === 'anthropic' && model.type === 'HYBRID' && hybridParameter > 1000) {
		providerOptions = {
			anthropic: {
				thinking: { type: 'enabled', budgetTokens: hybridParameter },
			},
		};

		temperature = undefined;
		topP = undefined;
	}

	if (model.provider === 'anthropic' && model.type === 'HYBRID' && hybridParameter < 2) {
		providerOptions = {
			anthropic: {
				thinking: { type: 'disabled' },
			},
		};

		temperature = hybridParameter;
		topP = hybridParameter;
	}

	try {
		const result: StreamTextResult<any, any> = streamText({
			model: modelName,
			messages: convertToCoreMessages(messages),
			temperature,
			topP,
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
