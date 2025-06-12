import { Model, ModelType, ReasoningEffort, SamplingParameter } from '@/types/types';

export const MAX_IMAGES = 5;
export const MAX_FILES = 5;

export const models: Model[] = [
	{
		value: 'gpt-4.1',
		label: 'GPT-4.1',
		provider: 'openAI',
		type: ModelType.STANDARD,
	},
	{
		value: 'gpt-4.1-mini',
		label: 'GPT-4.1 mini',
		provider: 'openAI',
		type: ModelType.STANDARD,
	},
	{
		value: 'claude-sonnet-4-0',
		label: 'Claude Sonnet 4',
		provider: 'anthropic',
		type: ModelType.HYBRID,
	},
	{
		value: 'claude-3-5-haiku-latest',
		label: 'Claude 3.5 Haiku',
		provider: 'anthropic',
		type: ModelType.STANDARD,
	},
	{
		value: 'claude-opus-4-0',
		label: 'Claude Opus 4',
		provider: 'anthropic',
		type: ModelType.HYBRID,
	},
	{
		value: 'o3',
		label: 'o3',
		provider: 'openAI',
		type: ModelType.REASONING,
	},
	{
		value: 'o3-pro',
		label: 'o3-pro',
		provider: 'openAI',
		type: ModelType.REASONING,
	},
	{
		value: 'o4-mini',
		label: 'o4-mini',
		provider: 'openAI',
		type: ModelType.REASONING,
	},
];

export const samplingParameters: SamplingParameter[] = [
	{
		value: 0.2,
		label: 'Focused',
	},
	{
		value: 0.5,
		label: 'Balanced',
	},
	{
		value: 0.7,
		label: 'Creative',
	},
];

export const reasoningEfforts: ReasoningEffort[] = [
	{
		value: 'low',
		label: 'Low',
	},
	{
		value: 'medium',
		label: 'Medium',
	},
	{
		value: 'high',
		label: 'High',
	},
];

export const hybridParameters: SamplingParameter[] = [
	...samplingParameters,
	{
		value: 12000,
		label: 'Low',
	},
	{
		value: 24000,
		label: 'Medium',
	},
	{
		value: 36000,
		label: 'High',
	},
];
