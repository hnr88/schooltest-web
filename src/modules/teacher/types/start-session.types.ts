import type { z } from 'zod';

import type {
  createDemoLinkBodySchema,
  createDemoLinkResponseSchema,
} from '@/modules/teacher/schemas/teacher-demo-link.schema';

/**
 * The Start-new-session modal's open state (Teacher Portal v2 `:1350–1599`).
 * Any teacher screen opens it through `useStartSessionStore().open(...)`; the
 * modal chunk mounts once and reads this store.
 */
export type StartSessionMode = 'now' | 'later' | 'demo';

export type CreateDemoLinkBody = z.infer<typeof createDemoLinkBodySchema>;
export type CreateDemoLinkResponse = z.infer<typeof createDemoLinkResponseSchema>;

/**
 * A minted C-TT-DEMO link plus the label of the form it is bound to (TB-17). The
 * label is the one GET /api/teacher/tests gave the picked card, so the dialog names
 * the test the teacher chose rather than rebuilding a name from skill + variant.
 */
export interface DemoLinkView {
  link: CreateDemoLinkResponse;
  testLabel: string;
}

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
  /** The demo link the server just minted, shown by the dialog the host mounts. */
  demoLink: DemoLinkView | null;
  open: (options?: StartSessionOptions) => void;
  close: () => void;
  /** A minted link replaces the modal with the demo dialog, as the design draws it. */
  showDemoLink: (demoLink: DemoLinkView) => void;
  clearDemoLink: () => void;
}
