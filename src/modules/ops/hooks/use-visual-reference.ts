'use client';

/**
 * OPS-010 — the deterministic conditions every Ops Portal visual comparison
 * must run under.
 *
 * The reference is `mvp/ops/Ops Portal.dc.html`, pinned by sha256 in
 * mvp/tasks/ops/manifest.json (source_html_sha256). A capture taken at a
 * different viewport, scale or clock is not comparable to it, so those values
 * live here once and every visual task imports them instead of restating them.
 */
import { useMemo } from 'react';

/** sha256 of the unmodified reference HTML — mvp/tasks/ops/manifest.json. */
export const REFERENCE_HTML_SHA256 =
  '90c3b0d6c479661c78f973d6b69203acbee06c523976fdaf62deb7e0431b7897';

/** Desktop reference viewport from mvp/tasks/ops/test-strategy.md. */
export const REFERENCE_VIEWPORT = { width: 1440, height: 1000 } as const;

/** Mobile comparison width required alongside the desktop reference. */
export const MOBILE_VIEWPORT = { width: 375, height: 812 } as const;

/** Screenshots must not drift with device pixel ratio. */
export const REFERENCE_DEVICE_SCALE_FACTOR = 1;

/**
 * Frozen clock. The reference renders relative times ("2 days ago",
 * "Trial ends in 12 days"), so an unfrozen clock changes pixels between runs.
 */
export const REFERENCE_CLOCK_ISO = '2026-09-05T00:00:00.000Z';

/** The nine scenarios the reference's own switcher defines, in its order. */
export const REFERENCE_SCENARIOS = [
  'happy',
  'loading',
  'empty',
  'loadError',
  'slow',
  'flaky',
  'offline',
  'restricted',
  'expired',
] as const;
export type ReferenceScenario = (typeof REFERENCE_SCENARIOS)[number];

/** The five default tabs. Results is deliberately NOT a tab pill. */
export const REFERENCE_TABS = [
  'Overview',
  'Admins',
  'Teachers',
  'Classes',
  'Students',
] as const;
export type ReferenceTab = (typeof REFERENCE_TABS)[number];

/**
 * Reference photos the HTML asks for. They are NOT present in this repo, so a
 * visual task must record them as unresolved rather than substitute another
 * image and claim pixel parity (OPS-010 acceptance criterion 4).
 */
export const UNRESOLVED_REFERENCE_PHOTOS = [
  'photo-a',
  'photo-b',
  'photo-c',
  'photo-d',
  'photo-classroom',
] as const;

export interface VisualReferenceConfig {
  readonly htmlSha256: string;
  readonly viewport: { readonly width: number; readonly height: number };
  readonly mobileViewport: { readonly width: number; readonly height: number };
  readonly deviceScaleFactor: number;
  readonly clockIso: string;
  readonly scenarios: readonly ReferenceScenario[];
  readonly tabs: readonly ReferenceTab[];
  readonly unresolvedPhotos: readonly string[];
}

/**
 * The single source of the comparison conditions. Returned frozen so a caller
 * cannot quietly widen a tolerance for one screen.
 */
export function useVisualReference(): VisualReferenceConfig {
  return useMemo(
    () =>
      Object.freeze({
        htmlSha256: REFERENCE_HTML_SHA256,
        viewport: REFERENCE_VIEWPORT,
        mobileViewport: MOBILE_VIEWPORT,
        deviceScaleFactor: REFERENCE_DEVICE_SCALE_FACTOR,
        clockIso: REFERENCE_CLOCK_ISO,
        scenarios: REFERENCE_SCENARIOS,
        tabs: REFERENCE_TABS,
        unresolvedPhotos: UNRESOLVED_REFERENCE_PHOTOS,
      }),
    [],
  );
}
