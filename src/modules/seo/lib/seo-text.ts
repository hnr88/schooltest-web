import {
  DESCRIPTION_MAX_LENGTH,
  TITLE_MAX_LENGTH,
  TITLE_SEPARATOR,
} from '@/modules/seo/constants/seo.constants';

const ELLIPSIS = '…';

/** Cuts `text` to `max` characters on a word boundary, marking the cut with an ellipsis. */
export function clampText(text: string, max: number): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const hard = clean.slice(0, max - ELLIPSIS.length);
  const lastSpace = hard.lastIndexOf(' ');
  const cut = lastSpace > max * 0.6 ? hard.slice(0, lastSpace) : hard;
  return `${cut.replace(/[\s,;:.\-–—·]+$/, '')}${ELLIPSIS}`;
}

/**
 * The full `<title>`: `Page · Brand` when that fits the 60-char budget, the
 * page title alone when it does not (the brand is the part a searcher can
 * lose), and a clamped page title as the last resort.
 */
export function composeDocumentTitle(title: string, siteName: string, isSiteRoot = false): string {
  const clean = title.replace(/\s+/g, ' ').trim();
  if (isSiteRoot || clean.includes(siteName)) return clampText(clean, TITLE_MAX_LENGTH);
  const branded = `${clean}${TITLE_SEPARATOR}${siteName}`;
  return branded.length <= TITLE_MAX_LENGTH ? branded : clampText(clean, TITLE_MAX_LENGTH);
}

export function clampDescription(description: string): string {
  return clampText(description, DESCRIPTION_MAX_LENGTH);
}
