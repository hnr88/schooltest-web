import type {
  AcaraPhaseKey,
  BandKey,
  DeltaDirection,
  DeltaFormat,
} from '@/modules/teacher/types/teacher-kit.types';

/**
 * Teacher Portal v2 kit — the pure helpers behind the presentational pieces.
 * No thresholds live here: a phase or band arrives from the server and is only
 * normalised to a kit key; a delta arrives from the server and is only spelled.
 */

const MINUS = '−';
const ARROWS = { up: '↑', down: '↓', flat: '→' } as const;
const SIGNS = { up: '+', down: MINUS, flat: '±' } as const;

/**
 * The square class badge's code: the first "7A"-shaped token of the name
 * ("7A" of "7A EAL/D", "8B" of "Reading 8B — Alvarez"), else the initials of
 * the first two words. Never longer than three characters.
 */
export function classBadgeCode(name: string): string {
  const tokens = name.trim().split(/\s+/).filter(Boolean);
  const code = tokens.find((token) => /^\d{1,2}[A-Za-z]{0,2}$/.test(token));
  if (code !== undefined) return code.toUpperCase();
  return tokens
    .slice(0, 2)
    .map((token) => token.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 3);
}

export interface DeltaDisplay {
  text: string;
  direction: DeltaDirection;
}

/**
 * Spells a server-sent difference the way the design does: `arrow` "↑4",
 * `signed` "+4" / "−2" (true minus) / "±0", `arrowSigned` "↑ +9". Rounded to a
 * whole number; a missing value is `emptyLabel` in the "none" grey.
 */
export function formatDelta(
  value: number | null | undefined,
  format: DeltaFormat,
  unit = '',
  emptyLabel = '—',
): DeltaDisplay {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return { text: emptyLabel, direction: 'none' };
  }
  const rounded = Math.round(value);
  const magnitude = Math.abs(rounded);
  const direction = rounded > 0 ? 'up' : rounded < 0 ? 'down' : 'flat';
  const arrow = ARROWS[direction];
  const signed = `${SIGNS[direction]}${magnitude}${unit}`;
  if (format === 'arrow') return { text: `${arrow}${magnitude}${unit}`, direction };
  if (format === 'signed') return { text: signed, direction };
  return { text: `${arrow} ${signed}`, direction };
}

const PHASE_KEYS: readonly AcaraPhaseKey[] = ['beginning', 'emerging', 'developing', 'consolidating'];

/** A served ACARA phase label ("Developing", "Developing phase") → kit key; `null` when unmeasured or unknown. */
export function acaraPhaseKey(value: string | null | undefined): AcaraPhaseKey | null {
  if (value === null || value === undefined) return null;
  const lower = value.trim().toLowerCase();
  return PHASE_KEYS.find((key) => lower.startsWith(key)) ?? null;
}

const BAND_ALIASES: Readonly<Record<string, BandKey>> = {
  secure: 'secure',
  developing: 'developing',
  emerging: 'emerging',
  not_yet: 'notYet',
  notyet: 'notYet',
  'not yet': 'notYet',
};

/** A served band ("secure", "not_yet") → kit key; `null` when unassessed or unknown. */
export function bandKey(value: string | null | undefined): BandKey | null {
  if (value === null || value === undefined) return null;
  return BAND_ALIASES[value.trim().toLowerCase()] ?? null;
}
