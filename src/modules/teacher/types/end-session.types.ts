import type { MonitorSitting } from '@/modules/teacher/types/teacher-session.types';

/**
 * What POST /api/teacher/test-sessions/:documentId/close actually answered.
 *
 * `already_closed` is C-TS-4's documented 400 ("sitting is already closed
 * (E2-11)") — a benign race when a second tab, or the other teacher on the same
 * class, closed the sitting first. The server state it reports is the state the
 * teacher asked for, so it is NOT a failure. Everything else is.
 */
export type EndSessionOutcome = 'closed' | 'already_closed' | 'failed';

/** The failure half of the outcome — what `classifyEndSessionError` can return. */
export type EndSessionFailure = Exclude<EndSessionOutcome, 'closed'>;

export type TeacherConfirmVariant = 'neutral' | 'destructive';
export type TeacherConfirmDismissReason =
  | 'trigger-press'
  | 'outside-press'
  | 'escape-key'
  | 'close-press'
  | 'focus-out'
  | 'imperative-action'
  | 'none';

export interface EndSessionState {
  isConfirmOpen: boolean;
  isPending: boolean;
  openConfirm: () => void;
  setConfirmOpen: (open: boolean) => void;
  confirm: () => void;
}

export interface EndSessionControlProps {
  sitting: MonitorSitting;
}

export interface EndSessionDialogProps {
  /** The CLASS's name (not a CSS class) — the dialog names what is being ended. */
  sessionClassName: string;
  open: boolean;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}
