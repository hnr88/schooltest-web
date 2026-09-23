import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, test } from 'vitest';

import { NextIntlClientProvider } from 'next-intl';

import { resultViewSchema, type ResultView } from '@schooltest/scoring-contracts';

import { AttributePanel } from '@/modules/report/components/AttributePanel';
import { buildAttributePanel } from '@/modules/report/lib/attribute-view-model';

// Spec 4 §7 — the Academic Vocabulary row renders through the SAME row machinery as
// the CDM attributes: the four-step band pill and the evidence count, no delta, and a
// hatched not-assessed arm.
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

const en = JSON.parse(readFileSync(resolve(process.cwd(), 'src/i18n/messages/en.json'), 'utf8')) as {
  Report: { attributes: Record<string, string>; attributeStatus: Record<string, string> };
} & Record<string, unknown>;

const fixture: ResultView = resultViewSchema.parse(
  JSON.parse(readFileSync(resolve(process.cwd(), 'vendor/contracts/scoring/fixtures/result-view.json'), 'utf8')),
);

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function mount(result: ResultView): HTMLDivElement {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() =>
    root!.render(
      <NextIntlClientProvider locale="en" messages={en}>
        <AttributePanel view={buildAttributePanel(result)} />
      </NextIntlClientProvider>,
    ),
  );
  return host;
}

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
});

describe('AttributePanel — the Academic Vocabulary row', () => {
  test('renders after Classroom Vocabulary as a banded row with evidence and no delta', () => {
    const page = mount(fixture);
    const rows = [...page.querySelectorAll('[data-slot="report-attribute-row"]')];
    const names = rows.map((row) => row.getAttribute('data-attribute'));
    expect(names.indexOf('Vocab_B2')).toBeGreaterThan(names.indexOf('Vocab_B1'));
    expect(names.at(-1)).toBe('Vocab_B2');

    const academic = page.querySelector('[data-slot="report-attribute-row"][data-attribute="Vocab_B2"]');
    expect(academic?.getAttribute('data-state')).toBe('assessed');
    expect(academic?.textContent).toContain(en.Report.attributes.Vocab_B2);
    expect(academic?.textContent).toContain(en.Report.attributeStatus.developing);
    expect(academic?.querySelector('[data-slot="report-evidence-count"]')?.getAttribute('data-items-seen')).toBe('12');
    expect(academic?.textContent).not.toMatch(/since the previous sitting/);
  });

  test('a strand with no band renders the not-assessed arm', () => {
    const page = mount({ ...fixture, academic_vocab: { ...fixture.academic_vocab, domain_score: null, band: null } });
    const academic = page.querySelector('[data-slot="report-attribute-row"][data-attribute="Vocab_B2"]');
    expect(academic?.getAttribute('data-state')).toBe('not_assessed');
    expect(academic?.querySelector('[data-slot="report-attribute-not-assessed-note"]')).not.toBeNull();
    expect(academic?.querySelector('[data-slot="report-evidence-count"]')).toBeNull();
  });
});
