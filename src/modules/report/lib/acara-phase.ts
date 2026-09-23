// A stored ACARA phase is a crosswalk CODE ("developing") and results keep the
// code they were scored with, forever. Reading v5 writes four codes; reading v4
// also wrote `developing_to_consolidating`, which stays on those results. Every
// code gets a catalogue label (the v4 one named by its v4 display label,
// "Developing → Consolidating"); a value that is not a code — the retired
// v1–v3 models stored human labels such as "Developing to Consolidating" — is
// already words and renders verbatim.
export const ACARA_PHASE_CODES = [
  'beginning',
  'emerging',
  'developing',
  'developing_to_consolidating',
  'consolidating',
] as const;

export type AcaraPhaseCode = (typeof ACARA_PHASE_CODES)[number];

export function acaraPhaseCode(value: string): AcaraPhaseCode | null {
  const code = value.trim().toLowerCase();
  return (ACARA_PHASE_CODES as readonly string[]).includes(code) ? (code as AcaraPhaseCode) : null;
}

/** The phase in words: a code through `label` (the `Report.acaraPhases` catalogue), anything else verbatim. */
export function acaraPhaseText(value: string, label: (code: AcaraPhaseCode) => string): string {
  const code = acaraPhaseCode(value);
  return code === null ? value : label(code);
}

/**
 * The rung a phase-ladder crosswalk (reading v4 on) wrote. It stores the rung's
 * CODE exactly, and its display label ("Consolidating English") only names that
 * rung in English, so the label can be said again in the reader's language from
 * the code. The v1–v3 models stored a Title-Cased phase ("Emerging") beside an
 * unrelated display label ("Sentence Reader"), so only an exact code is a rung.
 */
export function acaraRungCode(value: string | null): AcaraPhaseCode | null {
  return value !== null && (ACARA_PHASE_CODES as readonly string[]).includes(value) ? (value as AcaraPhaseCode) : null;
}
