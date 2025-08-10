import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, streamText, StreamTextResult } from 'ai';
import { SharedV2ProviderOptions } from '@ai-sdk/provider';

// maxDuration streaming response time is 60 seconds
export const maxDuration = 60;

export async function POST(req: Request) {
	// Extract the data from the body of the request
	const requestBody = await req.json();
	const { messages, model, temperature, reasoningEffort, textVerbosity } = requestBody;

	let modelName;
	let tools;

	if (model.provider === 'anthropic') {
		modelName = anthropic(model.value);
	} else if (model.provider === 'openAI') {
		modelName = openai.responses(model.value);

		if (reasoningEffort !== 'minimal') {
			tools = {
				web_search_preview: openai.tools.webSearchPreview({
					// optional configuration:
					searchContextSize: 'high',
					userLocation: {
						type: 'approximate',
					},
				}),
			};
		}
	} else {
		modelName = openai(model.value);
	}

	let providerOptions: SharedV2ProviderOptions;

	if (model.provider === 'anthropic') {
		if (reasoningEffort === 'minimal') {
			providerOptions = {
				anthropic: {
					thinking: { type: 'disabled' },
				},
			};
		} else {
			let budgetTokens = 0;

			if (reasoningEffort === 'low') {
				budgetTokens = 12000;
			}

			if (reasoningEffort === 'medium') {
				budgetTokens = 24000;
			}

			if (reasoningEffort === 'high') {
				budgetTokens = 36000;
			}

			providerOptions = {
				anthropic: {
					thinking: { type: 'enabled', budgetTokens },
				},
			};
		}
	} else {
		providerOptions = { openai: { reasoningEffort, textVerbosity } };
	}

	try {
		const result: StreamTextResult<any, any> = streamText({
			model: modelName,
			messages: convertToModelMessages(messages),
			system: `When presenting any code examples (in any programming language) or data tables in your responses, always format them using markdown code blocks. 
					For code, use triple backticks (\`\`\`) at the beginning and end of the code block, and specify the language when applicable for proper syntax highlighting (e.g., \`\`\`java, \`\`\`javascript, \`\`\`rust). 
					For tables, also enclose them within triple backticks (e.g., \`\`\`markdown). Never present code or tables as plain text without proper markdown formatting.`,
			temperature,
			topP: 0.8,
			providerOptions,
			tools,
			async onStepFinish({ response }) {
			},
			async onFinish({ text, toolCalls, toolResults, usage, finishReason, response }) {
				// implement your own logic here, e.g. for storing messages
				// or recording token usage
			},
			async onError({ error }) {
				if (error instanceof Error) {
					console.error('Error:', error.message);
				}
			}
		});

		return result.toUIMessageStreamResponse();
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
