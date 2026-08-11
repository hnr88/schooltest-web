import { expect, type Locator, type Page } from '@playwright/test';

import type { MonitorState } from '@/modules/teacher/types/teacher.types';

// Task 053 — the COLOUR half of the tile-state harness (brief flows 9-12). Each
// flow names a colour ("grey", "blue", "green", "amber"), and colour is checked
// here TWICE and never alone: the painted value must be the design token
// .qa/DESIGN.md maps that state to, AND it must sit in the perceptual hue family
// the flow's word claims. The tokens are authored in OKLCH, so Chrome answers them
// as CIE `lab()` — which makes the family check a real perceptual read (a*/b* →
// LCH hue + chroma) rather than a hex comparison. Nothing is inferred from a class
// name: every number is read off the element the browser rendered. The TEXT half
// of each state lives in teacher-monitor-tiles.ts, because colour on its own would
// be both an accessibility failure and an untrustworthy assertion.

export interface TileInk {
  background: string;
  borderColor: string;
  borderStyle: string;
  color: string;
}

/** The computed paint of one tile, read off the rendered element. */
export async function tileInk(tile: Locator): Promise<TileInk> {
  return tile.evaluate((element) => {
    const style = window.getComputedStyle(element);
    return {
      background: style.backgroundColor,
      borderColor: style.borderTopColor,
      borderStyle: style.borderTopStyle,
      color: style.color,
    };
  });
}

/**
 * One design token resolved to the exact string this page paints. The probe
 * inherits a sentinel ink, so a token that does not exist resolves to the
 * sentinel and THROWS here — never quietly compares two inherited colours.
 */
export async function resolveToken(page: Page, token: string): Promise<string> {
  const painted = await page.evaluate((name) => {
    const parent = document.createElement('div');
    parent.style.color = 'rgb(1, 2, 3)';
    const probe = document.createElement('span');
    probe.style.color = `var(${name})`;
    parent.appendChild(probe);
    document.body.appendChild(parent);
    const value = window.getComputedStyle(probe).color;
    parent.remove();
    return value;
  }, token);
  if (painted === 'rgb(1, 2, 3)') throw new Error(`design token ${token} is not defined here`);
  return painted;
}

export interface Perceptual {
  lightness: number;
  chroma: number;
  hue: number;
  alpha: number;
}

const LAB = /^lab\(\s*([\d.-]+)%?\s+([\d.-]+)\s+([\d.-]+)\s*(?:\/\s*([\d.]+)\s*)?\)$/;
const RGB = /^rgba?\(\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\s*\)$/;

/**
 * A painted CSS colour as LCH-ish numbers. `lab()` (what Chrome answers for an
 * OKLCH token) converts exactly; a fully transparent `rgba(…, 0)` is the "no
 * fill" case flow 9 needs. Any other form THROWS rather than being guessed at.
 */
export function perceptual(colour: string): Perceptual {
  const lab = LAB.exec(colour);
  if (lab) {
    const [lightness, a, b] = [Number(lab[1]), Number(lab[2]), Number(lab[3])];
    const degrees = (Math.atan2(b, a) * 180) / Math.PI;
    return {
      lightness,
      chroma: Math.hypot(a, b),
      hue: degrees < 0 ? degrees + 360 : degrees,
      alpha: lab[4] === undefined ? 1 : Number(lab[4]),
    };
  }
  const rgb = RGB.exec(colour);
  if (rgb && Number(rgb[4] ?? '1') === 0) return { lightness: 0, chroma: 0, hue: 0, alpha: 0 };
  throw new Error(`unreadable painted colour: ${colour}`);
}

export interface HueFamily {
  hue: readonly [number, number];
  chroma: readonly [number, number];
}

/**
 * The perceptual envelope each colour WORD in the brief has to land in. Amber and
 * green carry real chroma, so their words are checkable on hue alone; the two
 * cool near-neutrals (the pale blue fill and the grey border) overlap in hue, so
 * for those the spec ALSO pins the token identity and, for grey, the absence of
 * any fill — which is what visually separates them on the wireframe.
 */
export const FAMILY = {
  amber: { hue: [55, 110], chroma: [15, 80] },
  green: { hue: [110, 190], chroma: [10, 60] },
  blue: { hue: [215, 305], chroma: [2, 60] },
  grey: { hue: [0, 360], chroma: [0, 8] },
} as const satisfies Record<string, HueFamily>;

/** Asserts a painted colour really is the family the flow's word claims. */
function expectFamily(colour: string, family: HueFamily, label: string): Perceptual {
  const read = perceptual(colour);
  const seen = `${label}: hue ${read.hue.toFixed(1)}deg chroma ${read.chroma.toFixed(1)} (${colour})`;
  expect(read.alpha, `${seen} is transparent, so it paints no colour`).toBeGreaterThan(0);
  expect(read.hue, seen).toBeGreaterThanOrEqual(family.hue[0]);
  expect(read.hue, seen).toBeLessThanOrEqual(family.hue[1]);
  expect(read.chroma, seen).toBeGreaterThanOrEqual(family.chroma[0]);
  expect(read.chroma, seen).toBeLessThanOrEqual(family.chroma[1]);
  return read;
}

interface StatePaint {
  /** The fill token, or null for the one state the design leaves unfilled. */
  fill: string | null;
  border?: string;
  ink?: string;
  dashed?: boolean;
  family: HueFamily;
}

/**
 * State → the tint .qa/DESIGN.md § Live monitoring assigns it, declared here from
 * the DESIGN table rather than imported from the app's own
 * `MONITOR_STATE_THEME` — importing the component's choice would make this
 * assertion agree with any future change to it, which is not a test.
 */
const STATE_PAINT: Record<MonitorState, StatePaint> = {
  not_joined: {
    fill: null,
    border: '--color-portal-input',
    ink: '--color-body',
    dashed: true,
    family: FAMILY.grey,
  },
  joined: { fill: '--color-surface-inset', family: FAMILY.grey },
  in_progress: { fill: '--color-blue-50', family: FAMILY.blue },
  submitted: { fill: '--color-success-soft-2', family: FAMILY.green },
  stalled: { fill: '--color-warning-soft', border: '--color-warning-strong', family: FAMILY.amber },
};

/**
 * Asserts one tile's PAINT twice — token identity, then perceptual family — and
 * returns the colour that carries the state, so the caller can prove the five
 * states never collide on one ink.
 */
export async function expectStatePaint(
  page: Page,
  tile: Locator,
  state: MonitorState,
  label: string,
): Promise<string> {
  const paint = STATE_PAINT[state];
  const ink = await tileInk(tile);
  if (paint.fill === null) {
    expect(ink.background, `${label}: this state is painted with no fill at all`).toBe(
      'rgba(0, 0, 0, 0)',
    );
  } else {
    expect(ink.background, `${label}: fill must be var(${paint.fill})`).toBe(
      await resolveToken(page, paint.fill),
    );
    expectFamily(ink.background, paint.family, `${label} fill`);
  }
  if (paint.dashed === true) {
    expect(ink.borderStyle, `${label}: outline must be dashed`).toBe('dashed');
  }
  if (paint.border !== undefined) {
    expect(ink.borderColor, `${label}: outline must be var(${paint.border})`).toBe(
      await resolveToken(page, paint.border),
    );
    expectFamily(ink.borderColor, paint.family, `${label} outline`);
  }
  if (paint.ink !== undefined) {
    expect(ink.color, `${label}: text must be var(${paint.ink})`).toBe(
      await resolveToken(page, paint.ink),
    );
  }
  return paint.fill === null ? ink.borderColor : ink.background;
}

/** Colour is decorative, but two states must never land on the same ink. */
export function expectDistinctPaints(paints: Partial<Record<MonitorState, string>>): void {
  const painted = Object.values(paints);
  expect(painted.length, 'a flow recorded no paint at all').toBe(4);
  expect(new Set(painted).size, `two states share one ink: ${painted.join(' ')}`).toBe(4);
}
