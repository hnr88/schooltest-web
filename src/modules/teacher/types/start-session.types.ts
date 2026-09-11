/**
 * The Start-new-session modal's open state (Teacher Portal v2 `:1350–1599`).
 * Any teacher screen opens it through `useStartSessionStore().open(...)`; the
 * modal chunk mounts once and reads this store.
 */
export type StartSessionMode = 'now' | 'later' | 'demo';

/** The modal's three tabs (`mTabs`); the demo mode shows the Test tab alone. */
export type StartSessionTab = 'test' | 'students' | 'settings';

export interface StartSessionOptions {
  /** Pre-selects the class to test. */
  classId?: string;
  /** "Start now" | "Schedule a window" | "Teacher demo". */
  mode?: StartSessionMode;
  /** Pre-selects these students (the "Selected students" scope). */
  studentIds?: readonly string[];
  /** Opens on this tab (a catch-up session opens on "students"). */
  tab?: StartSessionTab;
  /** Edits this booking ("Edit" on a scheduled card) instead of creating one. */
  editSittingId?: string;
}

export interface StartSessionState {
  isOpen: boolean;
  classId: string | null;
  mode: StartSessionMode | null;
  studentIds: readonly string[];
  tab: StartSessionTab | null;
  editSittingId: string | null;
  /** Bumps on every open() so the modal re-seeds its form for the new request. */
  openCount: number;
  open: (options?: StartSessionOptions) => void;
  close: () => void;
}
