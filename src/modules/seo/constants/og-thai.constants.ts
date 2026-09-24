/**
 * Thai mark presentation forms for the generated social card.
 *
 * next/og's text engine applies no GPOS mark positioning, so a tone mark that
 * follows an upper vowel (ที่, ชั้น) is drawn on top of the vowel and vanishes,
 * and marks on the tall consonants ป ฝ ฟ ฬ collide with the ascender. Google
 * Sans ships the positioned forms as `uniXXXX.small` / `uniXXXX.narrow`
 * glyphs; `scripts/build-og-fonts.ts` maps them to these Private Use Area code
 * points in the card's font subset, and `shapeThaiForOg` rewrites the text to
 * use them. The two tables are the single contract between the two.
 */
export const THAI_UPPER_VOWELS: readonly number[] = [0x0e31, 0x0e34, 0x0e35, 0x0e36, 0x0e37, 0x0e47];

export const THAI_TONE_MARKS: readonly number[] = [0x0e48, 0x0e49, 0x0e4a, 0x0e4b, 0x0e4c];

/** Tall consonants whose every upper mark takes the `.narrow` form. */
export const THAI_TALL_CONSONANTS: readonly number[] = [0x0e1b, 0x0e1d];

/** Tall consonants whose tone marks, mai han-akat and maitaikhu take `.narrow`. */
export const THAI_SEMI_TALL_CONSONANTS: readonly number[] = [0x0e1f, 0x0e2c];

export const THAI_SEMI_TALL_NARROW_MARKS: readonly number[] = [0x0e31, 0x0e47, ...THAI_TONE_MARKS];

/** Tone mark → PUA code point of its raised `.small` form. */
export const THAI_SMALL_FORMS: Readonly<Record<number, number>> = {
  0x0e48: 0xf700,
  0x0e49: 0xf701,
  0x0e4a: 0xf702,
  0x0e4b: 0xf703,
  0x0e4c: 0xf704,
};

/** Upper mark → PUA code point of its left-shifted `.narrow` form. */
export const THAI_NARROW_FORMS: Readonly<Record<number, number>> = {
  0x0e31: 0xf710,
  0x0e34: 0xf711,
  0x0e35: 0xf712,
  0x0e36: 0xf713,
  0x0e37: 0xf714,
  0x0e47: 0xf715,
  0x0e48: 0xf716,
  0x0e49: 0xf717,
  0x0e4a: 0xf718,
  0x0e4b: 0xf719,
  0x0e4c: 0xf71a,
};

/**
 * A slash inside a word (EAL/D) is a UAX #14 break opportunity, so next/og
 * wrapped "EAL/" and "D" onto two lines. This PUA code point maps to the same
 * slash glyph in the card's font but is unbreakable (line-break class AL).
 */
export const OG_NO_BREAK_SLASH = 0xf720;
