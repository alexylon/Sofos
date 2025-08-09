import { Model, ModelType, ReasoningEffort, SamplingParameter } from '@/types/types';

export const MAX_IMAGES = 5;
export const MAX_FILES = 5;

export const models: Model[] = [
	{
		value: 'gpt-5',
		label: 'GPT-5',
		provider: 'openAI',
		type: ModelType.REASONING,
	},
	{
		value: 'gpt-5-mini',
		label: 'GPT-5-mini',
		provider: 'openAI',
		type: ModelType.REASONING,
	},
	{
		value: 'claude-sonnet-4-0',
		label: 'Claude Sonnet 4',
		provider: 'anthropic',
		type: ModelType.REASONING,
	},
	{
		value: 'claude-opus-4-0',
		label: 'Claude Opus 4',
		provider: 'anthropic',
		type: ModelType.REASONING,
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
		value: 'minimal',
		label: 'Minimal',
	},
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

export const getReasoningEfforts = (hasMinimalEffort: boolean) => {
	if (hasMinimalEffort) {
		return reasoningEfforts;
	}
	return reasoningEfforts.slice(1);
}
