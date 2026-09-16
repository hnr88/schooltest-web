import type { DialogSize } from '@/modules/design-system/types/primitives.types';

// The ONE modal sizing rule, shared by every dialog wrapper (ops chrome, the
// dialog primitive, the alert dialog): a modal is as wide as its content
// (`w-max`) between a floor and a cap, never a fixed width, and never wider
// than the viewport. The `sm:` twins replace the primitive's own `sm:max-w-*`.
//   confirm — a title, a sentence and buttons: a readable measure.
//   form    — fields: room for a two- or three-column row.
//   wide    — tables and previews (student import, rosters, error reports).
export const DIALOG_SIZE_CLASSES: Record<DialogSize, string> = {
  confirm:
    'w-max min-w-[min(22rem,calc(100vw-2rem))] max-w-[min(32rem,calc(100vw-2rem))] sm:max-w-[min(32rem,calc(100vw-2rem))]',
  form: 'w-max min-w-[min(32rem,calc(100vw-2rem))] max-w-[min(48rem,calc(100vw-2rem))] sm:max-w-[min(48rem,calc(100vw-2rem))]',
  wide: 'w-max min-w-[min(48rem,calc(100vw-2rem))] max-w-[min(72rem,90vw)] sm:max-w-[min(72rem,90vw)]',
};

// The alert dialog primitive scopes its widths by `data-size`, so its overrides
// carry the same variants (a plain `max-w-*` would lose on specificity).
export const ALERT_DIALOG_SIZE_CLASS =
  'w-max min-w-[min(22rem,calc(100vw-2rem))] data-[size=default]:max-w-[min(32rem,calc(100vw-2rem))] data-[size=sm]:max-w-[min(32rem,calc(100vw-2rem))] data-[size=default]:sm:max-w-[min(32rem,calc(100vw-2rem))] data-[size=sm]:sm:max-w-[min(32rem,calc(100vw-2rem))]';

// Tall content scrolls inside the modal, never past the viewport.
export const DIALOG_HEIGHT_CLASS = 'max-h-[calc(100dvh-4rem)] overflow-y-auto';
