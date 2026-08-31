import { TEACHER_EXPORT_PROMPT_HEADING } from '@/modules/teacher/schemas/teacher-export.schema';

import type {
  TeacherConfirmDismissReason,
  TeacherConfirmVariant,
} from '@/modules/teacher/types/end-session.types';

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
