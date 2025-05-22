import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { convertToCoreMessages, StreamData, streamText, StreamTextResult } from 'ai';

// maxDuration streaming response time is 60 seconds
export const maxDuration = 60;

export async function POST(req: Request) {
	// Extract the data from the body of the request
	const { messages, model, samplingParameter, reasoningEffort, hybridParameter } = await req.json();

	let modelName;
	let tools;

	if (model.provider === 'anthropic') {
		modelName = anthropic(model.value);
	} else if (model.provider === 'openAI' && (model.value === 'gpt-4.1' || model.value === 'gpt-4.1-mini')) {
		modelName = openai.responses(model.value);
		tools = {
			web_search_preview: openai.tools.webSearchPreview({
				// optional configuration:
				searchContextSize: 'high',
				userLocation: {
					type: 'approximate',
				},
			}),
		};
	} else {
		modelName = openai(model.value);
	}

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
			system: `When presenting any code examples (in any programming language) or data tables in your responses, always format them using markdown code blocks. 
					For code, use triple backticks (\`\`\`) at the beginning and end of the code block, and specify the language when applicable for proper syntax highlighting (e.g., \`\`\`python, \`\`\`javascript, \`\`\`rust). 
					For tables, also enclose them within triple backticks (e.g., \`\`\`markdown). Never present code or tables as plain text without proper markdown formatting.`,
			temperature,
			topP,
			providerOptions,
			tools,
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
