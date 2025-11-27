export interface Model {
	value: string;
	label: string;
	provider: string;
	type: ModelType;
}

export enum ModelType {
	STANDARD = "STANDARD",
	REASONING = "REASONING",
	HYBRID = "HYBRID",
}

export interface ReasoningEffort {
	value: string;
	label: string;
}

export interface TextVerbosity {
	value: string;
	label: string;
}

export enum Status {
	SUBMITTED = "submitted",
	STREAMING = "streaming",
	READY = "ready",
	ERROR = "error",
}

export type StatusType = "submitted" | "streaming" | "ready" | "error";
