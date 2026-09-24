import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import {
  OG_CJK_FONT_FAMILY,
  OG_CJK_FONTS,
  OG_FONT_FAMILY,
  OG_FONT_FETCH_TIMEOUT_MS,
  OG_FONT_FILES,
} from '@/modules/seo/constants/og.constants';
import { extractFontFileUrl, googleFontCssUrl } from '@/modules/seo/lib/og-text';
import type { OgFont } from '@/modules/seo/types/og.types';

let brandFonts: Promise<OgFont[]> | null = null;

function toArrayBuffer(data: Uint8Array): ArrayBuffer {
  return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
}

/** Google Sans Regular + Bold, read once per server process. */
function loadBrandFonts(): Promise<OgFont[]> {
  brandFonts ??= Promise.all(
    OG_FONT_FILES.map(async ({ path, weight }) => ({
      name: OG_FONT_FAMILY,
      data: toArrayBuffer(await readFile(join(process.cwd(), path))),
      weight,
      style: 'normal' as const,
    })),
  );
  return brandFonts;
}

async function fetchCjkWeight(family: string, weight: 400 | 700, text: string): Promise<OgFont | null> {
  try {
    const signal = AbortSignal.timeout(OG_FONT_FETCH_TIMEOUT_MS);
    const css = await fetch(googleFontCssUrl(family, weight, text), { signal }).then((r) => r.text());
    const fileUrl = extractFontFileUrl(css);
    if (!fileUrl) return null;
    const response = await fetch(fileUrl, { signal });
    if (!response.ok) return null;
    return { name: OG_CJK_FONT_FAMILY, data: await response.arrayBuffer(), weight, style: 'normal' };
  } catch (error) {
    console.warn(`[og] ${family} ${weight} unavailable; next/og falls back to its own loader`, error);
    return null;
  }
}

/**
 * Every font a card needs: Google Sans for Latin, Vietnamese and Thai, plus
 * Noto Sans SC / KR for zh / ko, subset to the card's own text at the weight
 * each line is set in. A failed CJK fetch degrades to next/og's built-in
 * Google Fonts fallback (regular weight) rather than failing the image.
 */
export async function loadOgFonts(
  locale: string,
  text: { bold: string; regular: string },
): Promise<OgFont[]> {
  const brand = await loadBrandFonts();
  const cjk = OG_CJK_FONTS[locale];
  if (!cjk) return brand;
  const extra = await Promise.all([
    fetchCjkWeight(cjk.family, 700, text.bold),
    fetchCjkWeight(cjk.family, 400, text.regular),
  ]);
  return [...brand, ...extra.filter((font): font is OgFont => font !== null)];
}
