import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { OG_FONT_FILES } from '@/modules/seo/constants/og.constants';
import {
  OG_NO_BREAK_SLASH,
  THAI_NARROW_FORMS,
  THAI_SMALL_FORMS,
} from '@/modules/seo/constants/og-thai.constants';
import { buildOgImageSet, ogCardPathname, ogImagePathFor } from '@/modules/seo/lib/og-image-url';
import {
  clampOgText,
  extractFontFileUrl,
  googleFontCssUrl,
  insertThaiBreaks,
  joinSlashes,
  ogTitleFontSize,
  prepareOgText,
  shapeThaiForOg,
  textUnits,
} from '@/modules/seo/lib/og-text';

const cps = (text: string): string[] => [...text].map((c) => c.codePointAt(0)!.toString(16));

describe('shapeThaiForOg', () => {
  it('raises a tone mark that follows an upper vowel', () => {
    expect(cps(shapeThaiForOg('ที่'))).toEqual(['e17', 'e35', 'f700']);
    expect(cps(shapeThaiForOg('ชั้น'))).toEqual(['e0a', 'e31', 'f701', 'e19']);
  });

  it('keeps a tone mark on a bare consonant as is', () => {
    expect(shapeThaiForOg('ไม่ได้')).toBe('ไม่ได้');
  });

  it('shifts marks on the tall consonants left', () => {
    expect(cps(shapeThaiForOg('ป่'))).toEqual(['e1b', 'f716']);
    expect(cps(shapeThaiForOg('ปี'))).toEqual(['e1b', 'f712']);
    expect(cps(shapeThaiForOg('ฟ้'))).toEqual(['e1f', 'f717']);
    expect(shapeThaiForOg('ฟิ')).toBe('ฟิ');
  });

  it('leaves Latin, CJK and Hangul untouched', () => {
    expect(shapeThaiForOg('EAL/D 诊断 진단 Đánh giá')).toBe('EAL/D 诊断 진단 Đánh giá');
  });
});

describe('insertThaiBreaks', () => {
  it('puts a zero-width space between Thai words only', () => {
    expect(insertThaiBreaks('ทุกครั้งที่ทดสอบ').split('\u200B')).toEqual(['ทุก', 'ครั้ง', 'ที่', 'ทดสอบ']);
    expect(insertThaiBreaks('One sitting')).toBe('One sitting');
    expect(insertThaiBreaks('ระยะ ACARA')).toBe('ระยะ ACARA');
  });
});

describe('joinSlashes', () => {
  it('glues a slash inside a word but leaves spaced slashes breakable', () => {
    expect(joinSlashes('EAL/D teaching')).toBe('EAL\uF720D teaching');
    expect(joinSlashes('A / B')).toBe('A / B');
  });
});

describe('text measuring and clamping', () => {
  it('counts Han and Hangul double and Thai marks as zero', () => {
    expect(textUnits('abc')).toBe(3);
    expect(textUnits('诊断')).toBe(4);
    expect(textUnits('진단')).toBe(4);
    expect(textUnits('ที่')).toBe(1);
  });

  it('returns short text unchanged and cuts long text on a word with an ellipsis', () => {
    expect(clampOgText('  One   sitting ', 40)).toBe('One sitting');
    const cut = clampOgText('alpha beta gamma delta epsilon', 20);
    expect(cut).toBe('alpha beta gamma…');
    expect(textUnits(cut)).toBeLessThanOrEqual(20);
  });

  it('steps the headline size down as the title grows', () => {
    expect(ogTitleFontSize('Short title')).toBe(76);
    expect(ogTitleFontSize('x'.repeat(60))).toBe(64);
    expect(ogTitleFontSize('x'.repeat(100))).toBe(54);
    expect(ogTitleFontSize('x'.repeat(149))).toBe(46);
    expect(ogTitleFontSize('诊'.repeat(40))).toBe(54);
  });

  it('prepares Thai text with breaks before positioning marks', () => {
    expect(prepareOgText('ทุกครั้งที่', 40)).toBe('ทุก\u200Bคร\u0E31\uF701ง\u200Bท\u0E35\uF700');
  });
});

describe('Google Fonts helpers', () => {
  it('requests one weight subset to the unique characters of the text', () => {
    expect(googleFontCssUrl('Noto Sans SC', 700, '诊断 诊')).toBe(
      `https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@700&text=${encodeURIComponent('断诊')}`,
    );
  });

  it('pulls the TrueType URL out of the CSS response', () => {
    const css = "@font-face { src: url(https://fonts.gstatic.com/l/font?kit=abc) format('truetype'); }";
    expect(extractFontFileUrl(css)).toBe('https://fonts.gstatic.com/l/font?kit=abc');
    expect(extractFontFileUrl("src: url(x.woff2) format('woff2')")).toBeNull();
  });
});

describe('card URLs', () => {
  it('maps a pathname to its own card or the locale root card', () => {
    expect(ogCardPathname('/diagnose')).toBe('/diagnose');
    expect(ogCardPathname('/diagnose/')).toBe('/diagnose');
    expect(ogCardPathname('/articles/hello-world')).toBe('/articles/hello-world');
    expect(ogCardPathname('/articles/a/b')).toBe('/');
    expect(ogCardPathname('/sign-in')).toBe('/');
  });

  it('prefixes every locale but the default', () => {
    expect(ogImagePathFor('/', 'en')).toBe('/opengraph-image');
    expect(ogImagePathFor('/', 'zh')).toBe('/zh/opengraph-image');
    expect(ogImagePathFor('/teach', 'th', 'twitter-image')).toBe('/th/teach/twitter-image');
    expect(ogImagePathFor('/articles/x', 'ko')).toBe('/ko/articles/x/opengraph-image');
  });

  it('describes the generated card with every og:image field', () => {
    const set = buildOgImageSet({ pathname: '/predict', locale: 'vi', alt: 'Predict' });
    expect(set.openGraph).toEqual({
      url: 'http://localhost:3000/vi/predict/opengraph-image',
      width: 1200,
      height: 630,
      type: 'image/png',
      alt: 'Predict',
    });
    expect(set.twitter.url).toBe('http://localhost:3000/vi/predict/twitter-image');
  });

  it('adds secure_url only for https and prefers a CMS image', () => {
    const set = buildOgImageSet({
      pathname: '/articles/x',
      locale: 'en',
      alt: 'Title',
      override: { url: 'https://cdn.example.com/og.jpg', width: 1200, height: 630, type: 'image/jpeg' },
    });
    expect(set.openGraph).toEqual({
      url: 'https://cdn.example.com/og.jpg',
      secureUrl: 'https://cdn.example.com/og.jpg',
      width: 1200,
      height: 630,
      type: 'image/jpeg',
      alt: 'Title',
    });
    expect(set.twitter).toEqual(set.openGraph);
  });
});

function cmapFormat12(font: Buffer): Map<number, number> {
  const count = font.readUInt16BE(4);
  const map = new Map<number, number>();
  for (let i = 0; i < count; i += 1) {
    if (font.toString('latin1', 12 + i * 16, 16 + i * 16) !== 'cmap') continue;
    const cmap = font.subarray(font.readUInt32BE(20 + i * 16));
    const sub = cmap.subarray(cmap.readUInt32BE(8));
    for (let g = 0; g < sub.readUInt32BE(12); g += 1) {
      const [start, end, gid] = [0, 4, 8].map((o) => sub.readUInt32BE(16 + g * 12 + o));
      for (let cp = start; cp <= end; cp += 1) map.set(cp, gid + cp - start);
    }
  }
  return map;
}

describe('card font subsets', () => {
  it.each(OG_FONT_FILES)('$path maps every PUA presentation form and the Latin/Thai text', ({ path }) => {
    const cmap = cmapFormat12(readFileSync(join(process.cwd(), path)));
    for (const pua of [...Object.values(THAI_SMALL_FORMS), ...Object.values(THAI_NARROW_FORMS), OG_NO_BREAK_SLASH]) {
      expect(cmap.get(pua), pua.toString(16)).toBeGreaterThan(0);
    }
    for (const char of 'AzĐệกู่\u200B–') expect(cmap.get(char.codePointAt(0)!)).toBeGreaterThan(0);
  });
});
