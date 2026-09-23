import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, test } from 'vitest';

import { NextIntlClientProvider } from 'next-intl';

import { useRungHeading } from '@/modules/report/hooks/useRungHeading';
import { ACARA_PHASE_CODES, acaraRungCode } from '@/modules/report/lib/acara-phase';

// The parent report's heading was the crosswalk's English rung label
// ("Consolidating English") rendered verbatim, so /zh read CONSOLIDATING
// ENGLISH. It is now said from the stored rung CODE in the reader's language.

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

const LOCALES = ['en', 'zh', 'ko', 'ms', 'th', 'vi'] as const;
type Catalogue = { Report: { acaraPhases: Record<string, string>; family: Record<string, string> } };
const catalogue = (locale: string) =>
  JSON.parse(readFileSync(resolve(process.cwd(), `src/i18n/messages/${locale}.json`), 'utf8')) as Catalogue;

let root: Root | null = null;
let host: HTMLDivElement | null = null;
afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
});

function Heading({ phase }: { phase: string | null }) {
  return <p>{useRungHeading()(phase) ?? 'NONE'}</p>;
}

function render(locale: string, phase: string | null): string {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() =>
    root!.render(
      <NextIntlClientProvider locale={locale} messages={catalogue(locale)} timeZone="Australia/Sydney">
        <Heading phase={phase} />
      </NextIntlClientProvider>,
    ),
  );
  const text = host.textContent ?? '';
  act(() => root?.unmount());
  host.remove();
  root = null;
  host = null;
  return text;
}

describe('the parent report rung heading', () => {
  test('en keeps the crosswalk wording, "Consolidating English"', () => {
    expect(render('en', 'consolidating')).toBe('Consolidating English');
    expect(render('en', 'beginning')).toBe('Beginning English');
  });

  test('every locale says every rung in its own words, from the shared phase words', () => {
    for (const locale of LOCALES) {
      const messages = catalogue(locale).Report;
      for (const code of ACARA_PHASE_CODES) {
        const heading = render(locale, code);
        expect(heading).toContain(messages.acaraPhases[code]);
        if (locale !== 'en') expect(heading, `${locale}/${code}`).not.toMatch(/English/);
      }
    }
    expect(render('zh', 'consolidating')).toBe('英语巩固阶段');
  });

  test('a stored value that is not a rung code keeps the caller fallback', () => {
    expect(acaraRungCode('Emerging')).toBeNull();
    expect(acaraRungCode('Developing to Consolidating')).toBeNull();
    expect(acaraRungCode(null)).toBeNull();
    expect(render('zh', 'Emerging')).toBe('NONE');
    expect(render('zh', null)).toBe('NONE');
  });
});
