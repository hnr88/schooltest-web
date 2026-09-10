/**
 * The ACTIVE-SCHOOL holder — the axios boundary's source of truth for the
 * multi-tenant school switcher. Framework-free on purpose: `strapi.ts` (the
 * axios instance) reads it for every `/api/schools/me/**` request, and the
 * zustand store mirrors it into React state, so the two can never disagree
 * without a module cycle (the store imports the axios boundary, not the
 * reverse).
 *
 * Lifecycle: set by `use-switch-school` when the rail switcher picks a school,
 * persisted by the store, and CLEARED on every auth change (sign-out, 401
 * invalidation) — a teacher signing in after a school_admin must never
 * inherit a stale school header.
 */
let activeSchoolDocumentId: string | null = null;

export function getActiveSchoolDocumentId(): string | null {
  return activeSchoolDocumentId;
}

export function setActiveSchoolDocumentId(documentId: string | null): void {
  activeSchoolDocumentId = documentId;
}
