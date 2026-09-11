import type { StudentDetailView } from '@/modules/teacher/types/v2-student-detail.types';
import type { TextDescriptor } from '@/modules/teacher/types/student-drill-down.types';

/** The design's three suggestion topics (`studentVals` ask.answers): what changed, focus, vocabulary. */
export type StudentAskTopic = 'change' | 'focus' | 'vocab';

export type StudentAskIntent = StudentAskTopic | 'generic';

/** A topic's keywords from the active catalog, `|`-separated ("focus|next|improve"). */
export type StudentAskKeywords = Readonly<Record<StudentAskTopic, string>>;

export interface StudentAskAnswer {
  title: TextDescriptor;
  body: TextDescriptor[];
}

/** One bubble of the thread: the teacher's question, or an answer with its title. */
export interface StudentAskMessage {
  id: number;
  role: 'teacher' | 'ai';
  title: string | null;
  body: string;
}

export interface StudentAskSuggestion {
  intent: StudentAskTopic;
  label: string;
  question: string;
}

/** `useStudentAskAi`: the drawer's thread, composer, suggestions and the two speech modes. */
export interface StudentAskAi {
  messages: readonly StudentAskMessage[];
  query: string;
  setQuery: (query: string) => void;
  send: (question?: string, intent?: StudentAskIntent) => void;
  suggestions: readonly StudentAskSuggestion[];
  speak: boolean;
  toggleSpeak: () => void;
  listening: boolean;
  listen: () => void;
  /** Stops any answer being read aloud (the drawer closing). */
  silence: () => void;
}

export interface StudentAskAiDrawerProps {
  view: StudentDetailView;
  firstName: string;
  studentDocumentId: string;
}

export interface StudentAskThreadProps {
  firstName: string;
  sittings: number;
  messages: readonly StudentAskMessage[];
}

export interface StudentAskComposerProps {
  ask: StudentAskAi;
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
