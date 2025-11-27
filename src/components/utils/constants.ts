import { Model, ModelType, ReasoningEffort, TextVerbosity } from '@/types/types';

export const MAX_IMAGES = 5;
export const MAX_FILES = 5;

export const STORAGE_KEYS = {
	CHAT_HISTORY: 'sofosChatHistory',
	MODEL: 'sofosModel',
	REASONING_EFFORT: 'sofosReasoningEffort',
	TEXT_VERBOSITY: 'sofosTextVerbosity',
	CURRENT_CHAT_INDEX: 'sofosCurrentChatIndex',
};

export const models: Model[] = [
	{
		value: 'gpt-5.1',
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
		value: 'claude-sonnet-4-5',
		label: 'Claude Sonnet 4',
		provider: 'anthropic',
		type: ModelType.REASONING,
	},
	{
		value: 'claude-opus-4-1',
		label: 'Claude Opus 4',
		provider: 'anthropic',
		type: ModelType.REASONING,
	},
	{
		value: 'gemini-3-pro-preview',
		label: 'Gemini 3 Pro',
		provider: 'google',
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

export const reasoningEfforts: ReasoningEffort[] = [
	{
		value: 'none',
		label: 'None',
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

export const getReasoningEfforts = (hasMinimalEffort: boolean): ReasoningEffort[] => {
	return hasMinimalEffort ? reasoningEfforts : reasoningEfforts.slice(1);
}

export const textVerbosities: TextVerbosity[] = [
	{
		value: 'low',
		label: 'Short',
	},
	{
		value: 'medium',
		label: 'Normal',
	},
	{
		value: 'high',
		label: 'Long',
	},
];
