/**
 * The Start-new-session modal's open state (Teacher Portal v2 `:1350–1599`).
 * Any teacher screen opens it through `useStartSessionStore().open(...)`; the
 * modal chunk mounts once and reads this store.
 */
export type StartSessionMode = 'now' | 'later' | 'demo';

export interface StartSessionOptions {
  /** Pre-selects the class to test. */
  classId?: string;
  /** "Start now" | "Schedule a window" | "Teacher demo". */
  mode?: StartSessionMode;
  /** Pre-selects these students (the "Selected students" scope). */
  studentIds?: readonly string[];
}

export interface StartSessionState {
  isOpen: boolean;
  classId: string | null;
  mode: StartSessionMode | null;
  studentIds: readonly string[];
  open: (options?: StartSessionOptions) => void;
  close: () => void;
}
