import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { convertToCoreMessages, streamText } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
	// Extract the `messages` from the body of the request
	const { messages, data } = await req.json();

	const model = data.model.startsWith("claude")
		? anthropic(data.model)
		: openai(data.model);

	// Enable 'vision' memory
	const updatedMessages = messages.map((message: any) => {
		if (message.experimental_attachments && message.experimental_attachments.length > 0 && message.experimental_attachments[0]?.url) {
			return {
				...message,
				content: [
					{ type: 'text', text: message.content },
					{ type: 'image', image: new URL(message.experimental_attachments[0].url) },
				],
			};
		}
		return message;
	});

	const result = await streamText({
		model: model,
		messages: updatedMessages,
		temperature: 0.2,
		topP: 0.2,
		async onFinish({ text, toolCalls, toolResults, usage, finishReason }) {
			// implement your own logic here, e.g. for storing messages
			// or recording token usage
		},
	});

	// Respond with the stream
	return result.toDataStreamResponse();
}
