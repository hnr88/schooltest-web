import type { SyntheticEvent } from 'react';

import type { ClassOverlaysState } from '@/modules/teacher/types/results-shell.types';

export type AskAiScope = 'class' | 'student';

/** What the Ask AI drawer is asked about: the whole class, or one student of it. */
export type AskAiTarget = { scope: 'class' } | { scope: 'student'; studentDocumentId: string };

/**
 * The overlays store: the class shell's state plus the Ask AI target. `openAskAi`
 * still takes no argument from the class header (a click handler's event lands
 * there and reads as the class scope); the student page passes a student target.
 */
export interface ClassOverlaysStoreState extends Omit<ClassOverlaysState, 'openAskAi'> {
  askAiTarget: AskAiTarget;
  openAskAi: (target?: AskAiTarget | SyntheticEvent) => void;
}
