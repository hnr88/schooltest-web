import { isAxiosError } from 'axios';

import {
  TEACHER_ASK_HISTORY_CONTENT_MAX,
  TEACHER_ASK_HISTORY_MAX,
} from '@/modules/teacher/schemas/teacher-ask.schema';
import { teacherErrorSchema } from '@/modules/teacher/schemas/teacher.schema';
import type {
  AskAiFailure,
  AskAiMessage,
  AskHistoryTurn,
} from '@/modules/teacher/types/ask-ai.types';

/**
 * The turns C-TA-1 is allowed to replay with a follow-up ("and the second
 * group?"). Only real conversation goes back: an `error` bubble is this portal
 * talking about a gateway, never something the model said, so replaying it would
 * feed the model its own outage notice. A refusal IS a model turn and stays.
 * The newest `TEACHER_ASK_HISTORY_MAX` turns survive; the contract caps both the
 * count and each turn's length, so both are applied here rather than discovered
 * as a 400.
 */
export function askHistory(messages: readonly AskAiMessage[]): AskHistoryTurn[] {
  return messages
    .filter((message) => message.tone !== 'error' && message.body.trim() !== '')
    .slice(-TEACHER_ASK_HISTORY_MAX)
    .map((message) => ({
      role: message.role,
      content: message.body.trim().slice(0, TEACHER_ASK_HISTORY_CONTENT_MAX),
    }));
}

/** `Retry-After` as the API sends it on a 429 (whole seconds), or `null`. */
function retryAfterOf(headers: unknown): number | null {
  if (headers === null || typeof headers !== 'object') return null;
  const raw = (headers as Record<string, unknown>)['retry-after'];
  const seconds = Number(typeof raw === 'string' || typeof raw === 'number' ? raw : Number.NaN);
  return Number.isFinite(seconds) && seconds >= 0 ? Math.ceil(seconds) : null;
}

/**
 * A refused ask → what the drawer says. Every branch keeps the SERVER's own
 * sentence: 503 already reads "The AI assistant could not be reached just now…",
 * 429 names the per-minute budget, and a 400 explains that a pasted id cannot be
 * sent to a model that is only ever given anonymised data. Nothing is invented,
 * and no branch falls back to an answer (RULE 0).
 */
export function describeAskFailure(error: unknown): AskAiFailure {
  if (!isAxiosError(error) || !error.response) {
    return { kind: 'offline', message: error instanceof Error ? error.message : '', retryAfterSeconds: null };
  }
  const { status, data, headers } = error.response;
  const envelope = teacherErrorSchema.safeParse(data);
  const message = envelope.success ? envelope.data.error.message : error.message;
  if (status === 503) return { kind: 'unavailable', message, retryAfterSeconds: null };
  if (status === 429) return { kind: 'rateLimited', message, retryAfterSeconds: retryAfterOf(headers) };
  return { kind: 'rejected', message, retryAfterSeconds: null };
}
