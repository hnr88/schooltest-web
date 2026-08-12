import type { StartTestSessionFormValues } from '@/modules/teacher/types/session-setup.types';

/**
 * DS §06 "Select", the app-screen dialect, applied from the consumer for the
 * reason `TestSessionSelect` documents: 1px input border, radius 10, 44px tall
 * (also the WCAG 2.2 AA target floor), card fill, chevron right, 3px focus ring.
 * The `data-[size=default]` variant has to be repeated or the vendored trigger's
 * own 32px rule wins on specificity and a plain `h-11` silently does nothing.
 */
export const TEST_SESSION_SELECT_TRIGGER_CLASS =
  'min-h-11 w-full justify-between rounded-lg border-input bg-card px-3.5 text-lede font-medium text-foreground data-[size=default]:h-11 disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100';

/** Empty = "the teacher has not chosen yet"; both pickers start on their placeholder. */
export const START_TEST_SESSION_DEFAULTS: StartTestSessionFormValues = {
  class_document_id: '',
  form_document_id: '',
};
