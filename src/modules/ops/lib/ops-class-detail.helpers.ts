'use client';

/** A school staff member selectable as a class teacher (from the ops staff directory). */
export interface OpsClassTeacherOption {
  documentId: string;
  label: string;
}

/** The teacher shape the ops class detail reads (or the staff directory row). */
export interface OpsClassTeacher {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

/** Display name for a teacher, falling back to their email. */
export function opsTeacherLabel(teacher: OpsClassTeacher): string {
  const name = `${teacher.first_name ?? ''} ${teacher.last_name ?? ''}`.trim();
  return name || teacher.email || '—';
}

/** Roster/summary value for an optional field — absent renders as the no-value dash. */
export function noValueIfMissing(value: string | number | null | undefined): string {
  return value === null || value === undefined ? '—' : String(value);
}
