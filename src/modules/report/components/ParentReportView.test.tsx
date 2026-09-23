import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, test } from 'vitest';

import { NextIntlClientProvider } from 'next-intl';

import { ParentReportView } from '@/modules/report/components/ParentReportView';
import { buildFamilyPreview, type FamilyPreviewInput } from '@/modules/report/lib/parent-view-model';

// "Focus next: Inference — uses this skill reliably" named a SECURE skill as the
// thing to work on. With every skill secure the family reads a truthful
// keep-extending line in its own language, and no focus line at all.

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

type Catalogue = { Report: Record<string, unknown> & { familyExtendLine: string; familyPracticeLine: string } };
const catalogue = (locale: string) =>
  JSON.parse(readFileSync(resolve(process.cwd(), `src/i18n/messages/${locale}.json`), 'utf8')) as Catalogue;

const allSecure: FamilyPreviewInput = {
  overall: { domain_score: 87 },
  acara_phase: 'consolidating',
  skill: 'reading',
  published_at: '2026-09-15T00:00:00.000Z',
  attributes: Object.fromEntries(
    ['Decoding', 'Vocab_A2', 'Grammar', 'Vocab_B1', 'Gist', 'Detail', 'Inference'].map((skill, index) => [
      skill,
      { status: 'secure' as const, domain_score: 95 - index * 2 },
    ]),
  ),
};

let root: Root | null = null;
let host: HTMLDivElement | null = null;
afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
});

function mount(locale: string, input: FamilyPreviewInput): HTMLDivElement {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() =>
    root!.render(
      <NextIntlClientProvider locale={locale} messages={catalogue(locale)} timeZone="Australia/Sydney">
        <ParentReportView view={buildFamilyPreview(input)} />
      </NextIntlClientProvider>,
    ),
  );
  return host;
}

describe('the family next steps when nothing is below secure', () => {
  for (const locale of ['en', 'zh', 'ko', 'ms', 'th', 'vi']) {
    test(`${locale}: a keep-extending line, then the practice line — no focus skill`, () => {
      const lines = [...mount(locale, allSecure).querySelectorAll('[data-slot="report-family-next-step"]')];
      const { familyExtendLine, familyPracticeLine } = catalogue(locale).Report;
      expect(lines.map((line) => line.getAttribute('data-kind'))).toEqual(['extend', 'practice']);
      expect(lines.map((line) => line.textContent)).toEqual([familyExtendLine, familyPracticeLine]);
    });
  }

  test('a skill below secure is still named as the focus', () => {
    const input = {
      ...allSecure,
      attributes: { ...allSecure.attributes, Detail: { status: 'developing' as const, domain_score: 60 } },
    };
    const focus = mount('en', input).querySelector('[data-kind="focus"]');
    expect(focus?.textContent).toBe('Focus next: Detail — is getting there and benefits from support');
  });
});
