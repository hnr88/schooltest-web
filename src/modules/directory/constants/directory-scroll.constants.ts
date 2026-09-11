/**
 * ops grid — the body region IS the design's white card (radius 24, soft
 * shadow, internal scroll under a capped height). There is no THEAD to pin any
 * more, so the sticky and non-sticky recipes are the same card; the region
 * keeps its focus ring because the rows hold interactive elements but the
 * overflow itself must stay keyboard-reachable (axe scrollable-region-focusable,
 * WCAG 2.1.1).
 */
export const DIRECTORY_STICKY_SCROLL_CLASS =
  'ops-grid-scroll rounded-[24px] bg-card shadow-[0_1px_2px_rgba(14,35,80,0.04)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none';

export const DIRECTORY_TABLE_SCROLL_CLASS = DIRECTORY_STICKY_SCROLL_CLASS;
