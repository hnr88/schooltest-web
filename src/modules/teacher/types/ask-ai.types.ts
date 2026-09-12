import type { z } from 'zod';

import type {
  askGroundingSchema,
  askHistoryTurnSchema,
  teacherAskBodySchema,
  teacherAskResponseSchema,
} from '@/modules/teacher/schemas/teacher-ask.schema';

export type AskHistoryTurn = z.infer<typeof askHistoryTurnSchema>;
export type TeacherAskBody = z.infer<typeof teacherAskBodySchema>;
export type AskGrounding = z.infer<typeof askGroundingSchema>;
export type TeacherAskResponse = z.infer<typeof teacherAskResponseSchema>;

/**
 * How an AI turn reads. `answer` and `refused` are both 200s from C-TA-1 — a
 * refusal is the model saying what this data does cover, not a failure. `error`
 * is the endpoint's own refusal (503 gateway down, 429 budget spent, 400 an id
 * pasted into the box); it carries the server's sentence, never an invented one.
 */
export type AskAiTone = 'answer' | 'refused' | 'error';

/** One bubble: the teacher's question, or an answer with its optional title. */
export interface AskAiMessage {
  id: number;
  role: 'teacher' | 'ai';
  title: string | null;
  body: string;
  tone: AskAiTone;
  /** The cohort C-TA-1 built this answer on; `null` on questions and errors. */
  grounding: AskGrounding | null;
}

/** What a refused request means for the drawer, from the status the API sent. */
export interface AskAiFailure {
  kind: 'unavailable' | 'rateLimited' | 'rejected' | 'offline';
  /** The server's own sentence when it sent one, otherwise empty. */
  message: string;
  retryAfterSeconds: number | null;
}

export interface AskAiSuggestion {
  key: string;
  label: string;
  question: string;
}

/** The scope-specific copy each drawer hands the shared shell. */
export interface AskAiStrings {
  title: string;
  grounded: string;
  intro: string;
  placeholder: string;
  groundingNote: (grounding: AskGrounding) => string;
  suggestions: readonly AskAiSuggestion[];
}

/** `useAskAi`: the drawer's thread, composer and the two speech modes. */
export interface AskAi {
  messages: readonly AskAiMessage[];
  query: string;
  setQuery: (query: string) => void;
  send: (question?: string) => void;
  /** A request is in flight — the composer is disabled and the thread shows it. */
  isPending: boolean;
  speak: boolean;
  toggleSpeak: () => void;
  listening: boolean;
  listen: () => void;
  /** Stops any answer being read aloud (the drawer closing). */
  silence: () => void;
}

export interface AskAiDrawerProps {
  open: boolean;
  onClose: () => void;
  strings: AskAiStrings;
  ask: AskAi;
}

export interface AskAiThreadProps {
  intro: string;
  messages: readonly AskAiMessage[];
  isPending: boolean;
  groundingNote: (grounding: AskGrounding) => string;
}

export interface AskAiComposerProps {
  ask: AskAi;
  placeholder: string;
  suggestions: readonly AskAiSuggestion[];
}

/** The slice of the Web Speech recognition API the mic uses (Chromium ships it prefixed). */
export interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
}

export type SpeechRecognitionCtor = new () => SpeechRecognitionLike;
