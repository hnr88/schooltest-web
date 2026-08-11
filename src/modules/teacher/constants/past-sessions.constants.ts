import type { StatusPillTone } from '@/modules/design-system';
import type { SittingStatus } from '@/modules/teacher/types/teacher-session.types';

// C-TS-2 returns active AND past sittings in one list, so a row is tagged with
// the sitting's OWN `status` word. Nothing is derived here: no date is compared
// to `now` to guess whether a session is still running, and a closed row is
// never inferred from a non-null `closed_at`.
export const PAST_SESSION_STATUS_TONE: Record<SittingStatus, StatusPillTone> = {
  open: 'success',
  closed: 'neutral',
};

// WCAG 2.2 AA 1.4.1: the tone above is never the only carrier — every row prints
// its status word from these keys under `Teacher.testSessions.pastSessions`.
export const PAST_SESSION_STATUS_LABEL_KEY: Record<SittingStatus, string> = {
  open: 'statusLive',
  closed: 'statusClosed',
};

/** 56px rows so the completion track and the status pill clear the row's ink. */
export const PAST_SESSIONS_ROW_CLASS = 'h-14 border-border';

/**
 * The history is unbounded (this instance already holds 158 real sittings), so
 * the panel scrolls instead of truncating: every row the server sent stays
 * reachable, and no "+N more" device hides a session a teacher may need.
 */
export const PAST_SESSIONS_SCROLL_CLASS =
  'max-h-96 overflow-y-auto rounded-lg border border-border';
