import {
  GOOGLE_FONTS_CSS_URL,
  OG_MARK_INK,
  OG_MARK_PATH,
  OG_MARK_TRANSFORM,
  OG_TILE_FROM,
  OG_TILE_MID,
  OG_TILE_TO,
  OG_TITLE_SIZES,
} from '@/modules/seo/constants/og.constants';
import {
  OG_NO_BREAK_SLASH,
  THAI_NARROW_FORMS,
  THAI_SEMI_TALL_CONSONANTS,
  THAI_SEMI_TALL_NARROW_MARKS,
  THAI_SMALL_FORMS,
  THAI_TALL_CONSONANTS,
  THAI_TONE_MARKS,
  THAI_UPPER_VOWELS,
} from '@/modules/seo/constants/og-thai.constants';

const WIDE_CHAR = /[ᄀ-ᇿ⺀-鿿가-힯豈-﫿＀-｠]/u;
const THAI_MARK = /[ัิ-ฺ็-๎]/u;

/**
 * Rewrites Thai upper marks to the positioned glyph forms the card's font
 * carries (see og-thai.constants.ts), because next/og cannot position marks:
 * a tone mark after an upper vowel takes the raised `.small` form, and marks
 * on ป ฝ (all) and ฟ ฬ (tone marks, ั, ็) take the left-shifted `.narrow` form.
 */
export function shapeThaiForOg(text: string): string {
  let out = '';
  let base = 0;
  let previous = 0;
  for (const char of text) {
    const cp = char.codePointAt(0) ?? 0;
    let mapped = cp;
    if (THAI_TONE_MARKS.includes(cp) && THAI_UPPER_VOWELS.includes(previous)) {
      mapped = THAI_SMALL_FORMS[cp] ?? cp;
    } else if (
      (THAI_TALL_CONSONANTS.includes(base) && cp in THAI_NARROW_FORMS) ||
      (THAI_SEMI_TALL_CONSONANTS.includes(base) && THAI_SEMI_TALL_NARROW_MARKS.includes(cp))
    ) {
      mapped = THAI_NARROW_FORMS[cp] ?? cp;
    }
    if (!THAI_MARK.test(char)) base = cp;
    previous = cp;
    out += String.fromCodePoint(mapped);
  }
  return out;
}

/**
 * Thai is written without spaces and next/og only breaks lines at UAX #14
 * opportunities, so a Thai headline would run off the card. A zero-width
 * space between dictionary words (Intl.Segmenter) gives it break points.
 */
export function insertThaiBreaks(text: string): string {
  if (!/[\u0E00-\u0E7F]/u.test(text)) return text;
  const words = [...new Intl.Segmenter('th', { granularity: 'word' }).segment(text)];
  return words
    .map(({ segment }, index) => {
      const next = words[index + 1]?.segment ?? '';
      return /[\u0E00-\u0E7F]$/u.test(segment) && /^[\u0E00-\u0E7F]/u.test(next) ? `${segment}\u200B` : segment;
    })
    .join('');
}

/** Keeps a slash between letters or digits (EAL/D) from becoming a line break. */
export function joinSlashes(text: string): string {
  return text.replace(/(?<=[\p{L}\p{N}])\/(?=[\p{L}\p{N}])/gu, String.fromCodePoint(OG_NO_BREAK_SLASH));
}

/** Card-ready text: clamped, unbreakable slashes, Thai line breaks, Thai marks positioned. */
export function prepareOgText(text: string, maxUnits: number): string {
  return shapeThaiForOg(insertThaiBreaks(joinSlashes(clampOgText(text, maxUnits))));
}

/** Visual width in "Latin character" units: Han, Hangul and fullwidth count double. */
export function textUnits(text: string): number {
  let units = 0;
  for (const char of text) units += WIDE_CHAR.test(char) ? 2 : THAI_MARK.test(char) ? 0 : 1;
  return units;
}

/** Collapses whitespace and cuts at `maxUnits`, on a word boundary when one is near. */
export function clampOgText(text: string, maxUnits: number): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (textUnits(clean) <= maxUnits) return clean;
  let cut = '';
  let units = 0;
  for (const char of clean) {
    units += textUnits(char);
    if (units > maxUnits - 1) break;
    cut += char;
  }
  const space = cut.lastIndexOf(' ');
  const trimmed = space > cut.length * 0.7 ? cut.slice(0, space) : cut;
  return `${trimmed.replace(/[\s,.;:–—-]+$/u, '')}…`;
}

/** Headline size for the card: long titles step down so three lines always fit. */
export function ogTitleFontSize(title: string): number {
  const units = textUnits(title);
  const step = OG_TITLE_SIZES.find((size) => units <= size.maxUnits);
  return (step ?? OG_TITLE_SIZES[OG_TITLE_SIZES.length - 1]).fontSize;
}

/** Google Fonts CSS2 URL for one static weight, subset to exactly `text`'s characters. */
export function googleFontCssUrl(family: string, weight: number, text: string): string {
  const chars = [...new Set(text.replace(/\s/g, ''))].sort().join('');
  const familyParam = `${family.replace(/ /g, '+')}:wght@${weight}`;
  return `${GOOGLE_FONTS_CSS_URL}?family=${familyParam}&text=${encodeURIComponent(chars)}`;
}

/** The TTF/OTF file URL out of a Google Fonts CSS response, or null. */
export function extractFontFileUrl(css: string): string | null {
  const match = css.match(/src:\s*url\(([^)]+)\)\s*format\('(?:opentype|truetype)'\)/);
  return match ? match[1] : null;
}

/**
 * The kangaroo mark as an SVG data URI next/og can draw at any size: the
 * app-icon tile by default, or the bare glyph (for the background watermark).
 */
export function ogMarkDataUri(variant: 'tile' | 'glyph' = 'tile'): string {
  const tile =
    `<defs><linearGradient id="t" x1="96" y1="48" x2="928" y2="976" gradientUnits="userSpaceOnUse">` +
    `<stop offset="0" stop-color="${OG_TILE_FROM}"/><stop offset="0.55" stop-color="${OG_TILE_MID}"/>` +
    `<stop offset="1" stop-color="${OG_TILE_TO}"/></linearGradient></defs>` +
    `<rect x="48" y="48" width="928" height="928" rx="216" fill="url(#t)"/>`;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">${variant === 'tile' ? tile : ''}` +
    `<g transform="${OG_MARK_TRANSFORM}"><path fill="${OG_MARK_INK}" fill-rule="evenodd" d="${OG_MARK_PATH}"/></g></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}
