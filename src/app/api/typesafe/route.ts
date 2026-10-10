import { APIConnectionError, APIError, APITimeoutError, TypeSafeClient, TypeSafeError } from '@typesafe-ai/sdk';
import type { NextRequest } from 'next/server';
import { requireAllowedUser } from '@/app/api/auth/allowedUser';
import type { JevAnswer } from '@/types/types';

// Jev answers in under a second, so this only catches a stalled connection.
const ATTEMPT_TIMEOUT_MS = 15000;
// The SDK ignores Retry-After waits longer than this and retries after its usual
// short delay, so a long wait can't hold up the reply.
const MAX_RETRY_AFTER_MS = 5000;

export const maxDuration = 60;

let client: TypeSafeClient | undefined;

export async function POST(req: NextRequest) {
	const denied = await requireAllowedUser(req);
	if (denied) return denied;

	const request = await req.json().catch(() => null);

	if (!request) {
		return Response.json({ error: 'The request body is not valid JSON' }, { status: 400 });
	}

	const { model, state, question } = request;
	const apiKey = process.env.TYPESAFE_API_KEY;

	if (!apiKey) {
		return Response.json({ error: 'TYPESAFE_API_KEY is not set on the server' }, { status: 500 });
	}

	// Without a question, the SDK throws an unclear error.
	if (typeof question !== 'object' || question === null) {
		return Response.json({ error: 'The request has no question' }, { status: 400 });
	}

	// Outside the try, so a setup mistake shows as a server error, not a bad question.
	// The SDK retries failures itself; asking again has no side effects.
	client ??= new TypeSafeClient({
		apiKey,
		timeout: ATTEMPT_TIMEOUT_MS,
		retry: { maxRetryAfterMs: MAX_RETRY_AFTER_MS },
	});

	let answer: JevAnswer | undefined;

	try {
		const result = await client.systemOne({ model, state, questions: { answer: question } });

		answer = result?.answers?.answer as JevAnswer | undefined;
	} catch (error) {
		console.error('TypeSafe error:', error);
		return failure(error);
	}

	if (!isDrawable(answer, question.type)) {
		console.error('TypeSafe sent an unexpected response:', answer);
		return Response.json({ error: 'TypeSafe sent an unexpected response' }, { status: 502 });
	}

	return Response.json({ answer });
}

function failure(error: unknown): Response {
	// The SDK's message starts with the status, such as "400 Unknown model: x".
	if (error instanceof APIError) {
		const message = hasReadableMessage(error.body) ? error.message : String(error.status);
		return Response.json({ error: `TypeSafe answered HTTP ${message}` }, { status: error.status });
	}

	if (error instanceof APIConnectionError) {
		return Response.json({ error: `TypeSafe is unreachable: ${describeFailure(error)}` }, { status: 502 });
	}

	// The SDK rejects some invalid questions before sending them.
	if (error instanceof TypeSafeError) return Response.json({ error: error.message }, { status: 400 });

	return Response.json({ error: 'Unexpected error while asking TypeSafe' }, { status: 500 });
}

// The fetch error only says "fetch failed"; the real network error is its cause.
function describeFailure(error: APIConnectionError): string {
	if (error instanceof APITimeoutError) return `no answer within ${error.timeoutMs / 1000} seconds`;

	const fetchError = error.cause;

	if (!(fetchError instanceof Error)) return error.message;

	const cause = fetchError.cause instanceof Error ? fetchError.cause.message : undefined;
	return cause ? `${fetchError.message} (${cause})` : fetchError.message;
}

// The screen reads these fields directly; a reply without them would crash it.
function isDrawable(answer: JevAnswer | undefined, type: string | undefined): answer is JevAnswer {
	if (!answer || answer.type !== type) return false;

	switch (answer.type) {
		case 'noul':
			return typeof answer.noul === 'number';
		case 'choice':
			return typeof answer.choice === 'string' && isRecord(answer.probabilities)
				&& typeof answer.confidence === 'number';
		case 'score':
			return typeof answer.score === 'number' && isRecord(answer.legend) && isRecord(answer.probabilities)
				&& typeof answer.confidence === 'number';
	}
}

// The SDK builds its message from one of these fields. Without them it falls back
// to the raw body, such as a proxy's HTML page, which isn't worth showing.
function hasReadableMessage(body: unknown): boolean {
	return isRecord(body) && ['detail', 'message', 'error'].some(field => field in body);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}
