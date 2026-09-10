// teacher/04 (D-71). Deep path, deliberately: `directory-scroll.constants.ts`
// is PUBLIC surface — the kit barrel exports it — and, unlike the barrel, it
// is leaf-pure (zero imports). This constants file is imported in the
// Playwright RUNNER process by `tests/e2e/helpers/teacher-past-sessions.ts`,
// and going through the barrel there pulls the whole component graph
// (next-intl/navigation) into Node, which fails to resolve. The barrel export
// line remains the public entry for every component-space consumer.
import { DIRECTORY_STICKY_SCROLL_CLASS } from '@/modules/directory/constants/directory-scroll.constants';
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
 * teacher/04 (D-71): the kit's sticky recipe, re-exported under the name this
 * panel's render site has always used. The class itself and its 27-line
 * rationale moved to `directory/constants/directory-scroll.constants.ts` —
 * one recipe, two names, zero divergence. The barrel line
 * (`teacher/index.ts:60`) and the one render site (`PastSessionsPanel.tsx:73`)
 * needed no edit.
 */
export const PAST_SESSIONS_SCROLL_CLASS = DIRECTORY_STICKY_SCROLL_CLASS;
