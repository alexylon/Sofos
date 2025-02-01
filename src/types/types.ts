export interface Model {
	value: string;
	label: string;
	provider: string;
	isReasoning: boolean;
}

export interface SamplingParameter {
	value: number;
	label: string;
}

export interface ReasoningEffort {
	value: string;
	label: string;
}
