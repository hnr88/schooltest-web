import type { SyntheticEvent } from 'react';

import { TEACHER_EXPORT_PROMPT_HEADING } from '@/modules/teacher/schemas/teacher-export.schema';

import type { AskAiTarget } from '@/modules/teacher/types/class-overlays.types';
import type {
  TeacherConfirmDismissReason,
  TeacherConfirmVariant,
} from '@/modules/teacher/types/end-session.types';

/** A click handler hands `openAskAi` its event; anything without a scope asks about the class. */
export function askAiTargetOf(value: AskAiTarget | SyntheticEvent | undefined): AskAiTarget {
  return value !== undefined && 'scope' in value ? value : { scope: 'class' };
}

export function extractTeacherExportPrompt(body: string): string {
  const marker = `\n${TEACHER_EXPORT_PROMPT_HEADING}\n`;
  const promptStart = body.lastIndexOf(marker);
  if (promptStart === -1) throw new Error('Teacher export has no Prompt section');
  return body.slice(promptStart + marker.length).trim();
}

export function shouldApplyConfirmOpenChange(
  variant: TeacherConfirmVariant,
  open: boolean,
  reason: TeacherConfirmDismissReason,
): boolean {
  if (open || variant === 'neutral') return true;
  return reason !== 'escape-key' && reason !== 'outside-press';
}
