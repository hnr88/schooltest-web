import { expect, type Page } from '@playwright/test';

import type { MasteryBand } from '@/modules/teacher/types/teacher.types';
import type { StudentDrillDownResponse } from '@/modules/teacher/types/teacher-result.types';

// BRIEF FLOW 16 — "subskill tiles are green ≥80%, amber 50-79%, red <50%".
//
// The 80 and the 50 are SERVER-SIDE (`Config.teacher_mastery_bands`), so this
// harness never writes them down. It proves the chain instead:
//   the tile's `data-band` IS C-TR-2's `status`   (the UI re-thresholds nothing)
//   that status agrees with the cuts C-TR-2 echoes (the cuts really drive it)
//   the painted INK sits in that band's hue family (green / amber / red)
// Retune the Config row and every expectation here retunes with it, which is what
// brief flow 28 has to be able to demonstrate.

export interface TilePaint {
  attribute: string;
  band: string;
  tint: readonly number[];
  ink: readonly number[];
}

type ServerBands = StudentDrillDownResponse['bands'];

/** `lab(L a b)` as Chromium computes an OKLCH token → `[L, a, b]`. */
function parseLab(value: string): readonly number[] {
  const numbers = value.match(/-?\d+(\.\d+)?/g);
  if (!numbers || numbers.length < 3) throw new Error(`[e2e] not a lab() colour: ${value}`);
  return numbers.slice(0, 3).map(Number);
}

/** Every tile's band plus its REAL painted surface + ink, read out of the browser. */
export async function readTilePaint(page: Page): Promise<TilePaint[]> {
  const raw = await page.evaluate(() =>
    Array.from(document.querySelectorAll('[data-slot="subskill-tile"]')).map((node) => {
      const style = getComputedStyle(node);
      return {
        attribute: node.getAttribute('data-attribute') ?? '',
        band: node.getAttribute('data-band') ?? '',
        tint: style.backgroundColor,
        ink: style.color,
      };
    }),
  );
  return raw.map((entry) => ({
    attribute: entry.attribute,
    band: entry.band,
    tint: parseLab(entry.tint),
    ink: parseLab(entry.ink),
  }));
}

/** CIE Lab hue angle in degrees: red ≈ 0-45, amber ≈ 45-90, green ≈ 90-200. */
export const labHue = ([, a, b]: readonly number[]): number =>
  (Math.atan2(b, a) * (180 / Math.PI) + 360) % 360;

/** The hue family each band's own WORD promises a teacher. */
const BAND_HUE_WINDOW: Partial<Record<MasteryBand, readonly [number, number]>> = {
  mastered: [90, 200],
  approaching: [45, 90],
  not_yet: [0, 45],
};

/**
 * The band the SERVER's echoed cuts imply for a printed likelihood. `status` is
 * derived from the raw posterior while `likelihood` is `round(prob * 100)`, so a
 * value within half a point of a cut may legitimately land either side: those
 * return both admissible bands rather than a false expectation.
 */
export function bandFromServerCuts(likelihood: number | null, bands: ServerBands): MasteryBand[] {
  if (likelihood === null) return ['not_assessed'];
  const mastered = bands.mastered_cut * 100;
  const approaching = bands.approaching_cut * 100;
  if (Math.abs(likelihood - mastered) <= 0.5) return ['mastered', 'approaching'];
  if (Math.abs(likelihood - approaching) <= 0.5) return ['approaching', 'not_yet'];
  if (likelihood > mastered) return ['mastered'];
  if (likelihood > approaching) return ['approaching'];
  return ['not_yet'];
}

/**
 * One drill-down page, tile by tile, against its own C-TR-2 body. `seen` collects
 * band -> painted ink across pages so the caller can prove all three colour bands
 * were genuinely exhibited by real data AND that each band keeps ONE colour.
 */
export async function expectTilesPaintedByServerBand(
  page: Page,
  drill: StudentDrillDownResponse,
  seen: Map<string, string>,
): Promise<void> {
  const latest = drill.tests[0];
  const painted = await readTilePaint(page);
  expect(painted.map((entry) => entry.attribute)).toEqual(
    latest.subskills.map((subskill) => subskill.attribute),
  );

  for (const subskill of latest.subskills) {
    const paint = painted.find((entry) => entry.attribute === subskill.attribute);
    if (!paint) throw new Error(`[e2e] no tile painted for ${subskill.attribute}`);

    expect(paint.band, `${subskill.attribute} tile band`).toBe(subskill.status);
    expect(bandFromServerCuts(subskill.likelihood, drill.bands)).toContain(subskill.status);

    const window = BAND_HUE_WINDOW[subskill.status];
    if (!window) throw new Error(`[e2e] band ${subskill.status} has no promised hue family`);
    const hue = labHue(paint.ink);
    expect(hue, `${subskill.attribute} ${subskill.status} ink hue ${hue}`).toBeGreaterThanOrEqual(
      window[0],
    );
    expect(hue, `${subskill.attribute} ${subskill.status} ink hue ${hue}`).toBeLessThan(window[1]);

    const previous = seen.get(subskill.status);
    if (previous) expect(paint.ink.join(), `${subskill.status} changed colour`).toBe(previous);
    seen.set(subskill.status, paint.ink.join());
  }
}
