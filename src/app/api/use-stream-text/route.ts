import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, streamText, StreamTextResult } from 'ai';
import { SharedV2ProviderOptions } from '@ai-sdk/provider';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { z } from 'zod';

// maxDuration streaming response time is 60 seconds
export const maxDuration = 60;

// Initialize MCP client
let mcpClient: Client | null = null;

async function getMCPClient() {
	if (!mcpClient) {
		// Log environment variables being passed (without sensitive data)
		console.log('MCP Server Environment Check:', {
			API_URL: process.env.API_URL ? 'SET' : 'MISSING',
			DRIVE_URL: process.env.DRIVE_URL ? 'SET' : 'MISSING',
			CLIENT_ID: process.env.CLIENT_ID ? 'SET' : 'MISSING',
			WP_TOKEN: process.env.WP_TOKEN ? 'SET' : 'MISSING',
			DRIVE_TOKEN: process.env.DRIVE_TOKEN ? 'SET' : 'MISSING',
		});

		const transport = new StdioClientTransport({
			command: '/Users/alex/git/aal/mcp-webpublication-server/target/release/mcp-webpublication-server',
			args: [],
			env: {
				...process.env,
				API_URL: process.env.API_URL || '',
				DRIVE_URL: process.env.DRIVE_URL || '',
				CLIENT_ID: process.env.CLIENT_ID || '',
				WP_TOKEN: process.env.WP_TOKEN || '',
				DRIVE_TOKEN: process.env.DRIVE_TOKEN || '',
			}
		});

		mcpClient = new Client({
			name: 'sofos-client',
			version: '1.0.0',
		}, {
			capabilities: {}
		});

		await mcpClient.connect(transport);
		console.log('MCP client connected successfully');
	}

	return mcpClient;
}

// Manually define MCP tools to avoid schema issues from rmcp library
function getMCPTools() {
	// Manually define tools based on the MCP server implementation
	// DON'T connect to MCP client yet to avoid schema pollution
	const toolDefinitions = [
		{
			name: 'get_resource',
			description: 'Get a resource/publication from the Webpublication API',
			schema: z.object({ resource_gid: z.number() })
		},
		{
			name: 'get_publication_settings',
			description: 'Get the publication settings from the Webpublication API',
			schema: z.object({ resource_gid: z.number() })
		},
		{
			name: 'get_recent_resources',
			description: 'Get the 20 most recent publications from the Webpublication API',
			schema: z.object({})
		},
		{
			name: 'toggle_wishlist',
			description: 'Toggle wishlist status for a publication',
			schema: z.object({
				publication_gid: z.number(),
				wishlist_enabled: z.boolean()
			})
		},
		{
			name: 'get_cover_image',
			description: 'Get the cover image of the publication',
			schema: z.object({ rel_url: z.string() })
		}
	];

	const mcpTools: Record<string, any> = {};

	for (const toolDef of toolDefinitions) {
		console.log(`Registering MCP tool: ${toolDef.name}`);

		mcpTools[toolDef.name] = {
			description: toolDef.description,
			parameters: toolDef.schema,
			execute: async (args: any) => {
				console.log(`Executing ${toolDef.name} with:`, args);
				try {
					// Connect to MCP client only when executing
					const client = await getMCPClient();
					const result = await client.callTool({
						name: toolDef.name,
						arguments: args || {},
					});

					const content = result.content as Array<{ type: string; text?: string }>;
					return content
						.filter((item) => item.type === 'text')
						.map((item) => item.text || '')
						.join('\n');
				} catch (error) {
					console.error(`Error executing ${toolDef.name}:`, error);
					throw error;
				}
			},
		};
	}

	console.log('All MCP tools registered:', Object.keys(mcpTools));
	return mcpTools;
}

export async function POST(req: Request) {
	// Extract the data from the body of the request
	const requestBody = await req.json();
	const { messages, model, temperature, reasoningEffort, textVerbosity } = requestBody;

	// Define MCP tools (connection happens lazily on execution)
	const mcpTools = getMCPTools();

	let modelName;
	let tools;

	if (model.provider === 'anthropic') {
		modelName = anthropic(model.value);
		// Add MCP tools for Anthropic models - create fresh object
		tools = Object.assign({}, mcpTools);
	} else if (model.provider === 'openAI') {
		modelName = openai.responses(model.value);

		if (reasoningEffort !== 'minimal') {
			// Create fresh tools object with web search
			tools = Object.assign({
				web_search_preview: openai.tools.webSearchPreview({
					searchContextSize: 'high',
					userLocation: {
						type: 'approximate',
					},
				}),
			}, mcpTools);
		} else {
			// Add MCP tools even when reasoning effort is minimal
			tools = Object.assign({}, mcpTools);
		}
	} else {
		modelName = openai(model.value);
		// Add MCP tools for other OpenAI models
		tools = Object.assign({}, mcpTools);
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
		providerOptions = {
			openai: {
				reasoningEffort,
				textVerbosity,
				include: ['reasoning.encrypted_content'],
			}
		};
	}

	// Log tools before passing to streamText
	if (tools) {
		console.log('=== TOOLS CHECK ===');
		console.log('Tool names:', Object.keys(tools));
		console.log('=== END TOOLS CHECK ===');
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
