import type { TeacherClassRef } from '@schooltest/ops-contracts';

/**
 * C-OPS-PORTAL-021 (OPS-031) presentation helpers. Pure, so the directory row
 * stays a renderer and the same label logic is exercised by the specs.
 */

/**
 * The Class column label. Falls back to the class `documentId` when a class has
 * no name, so a nameless class is still identifiable — the label is never used
 * as the relation key, which stays `documentId` on both sides.
 */
export function teacherClassLabel(classes: readonly TeacherClassRef[]): string {
  return classes.map((klass) => klass.name ?? klass.documentId).join(', ');
}

/**
 * The Last activity column. The stored value is an authenticated-login stamp;
 * `null` means no session has been recorded and the caller renders its empty
 * fallback. The calendar date is taken from the ISO string itself rather than
 * a locale clock, so a fixed-clock visual run is byte-stable.
 */
export function teacherLastActiveLabel(lastActiveAt: string | null): string | null {
  return lastActiveAt === null ? null : lastActiveAt.slice(0, 10);
}
