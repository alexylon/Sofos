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

		if (!(reasoningEffort === 'none' && model.value === 'gpt-5-mini')) {
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
		if (reasoningEffort === 'none') {
			providerOptions = {
				anthropic: {
					thinking: { type: 'disabled' },
				},
			};
		} else {
			let budgetTokens = 0;

			if (reasoningEffort === 'low') {
				budgetTokens = 6000;
			}

			if (reasoningEffort === 'medium') {
				budgetTokens = 12000;
			}

			if (reasoningEffort === 'high') {
				budgetTokens = 24000;
			}

			providerOptions = {
				anthropic: {
					thinking: { type: 'enabled', budgetTokens },
				},
			};
		}
	} else {
		providerOptions = {
			openai: {
				reasoningEffort: reasoningEffort === 'none' && model.value === 'gpt-5-mini'
					? 'minimal'
					: reasoningEffort,
				textVerbosity,
				include: ['reasoning.encrypted_content'],
			}
		};
	}

	try {
		const result: StreamTextResult<any, any> = streamText({
			model: modelName,
			messages: convertToModelMessages(messages),
			system: `When presenting any code examples or data tables, always use Markdown code fences.
- Code: wrap with triple backticks and specify the language (e.g., \`\`\`python, \`\`\`rust). Never show code outside fences.
- Tables: wrap GitHub-flavored Markdown tables inside \`\`\`markdown fences.

Math formatting (compatible with remark-math + rehype-katex)

- Inline math: wrap with single dollar signs: $ ... $ (e.g., $y' + p(x)y = q(x)$).
- Display math: put on its own lines wrapped with double dollar signs:
  
  $$
  y(x)=e^{-\\int p}\\!\\left(C+\\int e^{\\int p} q\\,dx\\right)
  $$
  
  Leave a blank line before and after the block.

- Do NOT wrap LaTeX math in code fences. Avoid \\[ ... \\] and \\( ... \\).
- Use standard LaTeX commands only (e.g., \\partial, \\int, \\frac{a}{b}, ^, _); no Unicode math symbols.
- For multi-line/aligned display, use environments KaTeX supports inside $$ ... $$:
  \\begin{aligned} ... \\end{aligned}, \\begin{gathered} ... \\end{gathered}, \\begin{cases} ... \\end{cases}, matrices, etc.
- Don’t rely on equation numbering or \\tag; KaTeX typically renders unnumbered math.

Example:

Inline: The solution to $y'+p(x)y=q(x)$ is shown below.

Display:
$$
\\frac{\\partial u}{\\partial t}=\\kappa \\frac{\\partial^2 u}{\\partial x^2},\\quad
u(x,t)=(G_t * u_0)(x),\\quad
G_t(x)=\\frac{1}{\\sqrt{4\\pi \\kappa t}}\\,e^{-x^2/(4\\kappa t)}.
$$`,
			temperature,
			// topP: 0.8,
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
