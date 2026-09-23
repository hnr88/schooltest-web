import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, expect, test } from 'vitest';

import { resultViewSchema, type ResultView } from '@schooltest/scoring-contracts';

import enMessages from '@/i18n/messages/en.json';
import { ConsolidatingChecklist } from '@/modules/results/components/ConsolidatingChecklist';
import amara from '@/modules/teacher/lib/v2/__fixtures__/t2-result-amara.json';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

/**
 * Spec 4 — the Path to Consolidating checklist gains the Academic Vocabulary row:
 * reading v6's Consolidating rung also requires Academic secure, so the row sits
 * after the four Section 2 rows and before the gate, reads `academic_vocab`
 * (never `attributes`), and says "not assessed" rather than inventing a score.
 */
const recorded = resultViewSchema.parse(amara);
const withAcademic = (academic: ResultView['academic_vocab'], phase: ResultView['acara_phase'] = 'developing'): ResultView => ({
  ...recorded,
  acara_phase: phase,
  academic_vocab: academic,
});

let root: Root | null = null;
let host: HTMLDivElement | null = null;

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
});

function render(view: ResultView): HTMLDivElement {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => {
    root?.render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <ConsolidatingChecklist view={view} />
      </NextIntlClientProvider>,
    );
  });
  return host;
}

const rowsOf = (el: HTMLElement) => [...el.querySelectorAll('[data-slot="checklist-row"]')] as HTMLElement[];

test('the Academic Vocabulary row sits after the four Section 2 rows and before the gate', () => {
  const el = render(withAcademic({ domain_score: 61, se: 0.6, band: 'developing', items_seen: 12, provisional_cut: true }));
  expect(rowsOf(el).map((row) => row.dataset.row)).toEqual(['Inference', 'Vocab_B1', 'Gist', 'Detail', 'Vocab_B2', 'gate']);
  const academic = el.querySelector('[data-row="Vocab_B2"]') as HTMLElement;
  expect(academic.textContent).toContain('Academic Vocabulary');
  expect(academic.textContent).toContain('61%');
  expect(academic.dataset.met).toBe('false');
});

test('Academic is met only when its band is secure', () => {
  const el = render(withAcademic({ domain_score: 74, se: 0.5, band: 'secure', items_seen: 12, provisional_cut: true }));
  const academic = el.querySelector('[data-row="Vocab_B2"]') as HTMLElement;
  expect(academic.dataset.met).toBe('true');
  expect(academic.textContent).toContain('✓');
});

test('not reached or unbanded: "not assessed this sitting", never a zero', () => {
  const el = render(withAcademic({ domain_score: null, se: null, band: null, items_seen: 0, provisional_cut: true }));
  const academic = el.querySelector('[data-row="Vocab_B2"]') as HTMLElement;
  expect(academic.textContent).toContain('not assessed this sitting');
  expect(academic.textContent).not.toContain('0%');
  expect(academic.dataset.met).toBe('false');
});

test('a consolidating result shows the meets-all-requirements banner instead of the rows', () => {
  const el = render(withAcademic({ domain_score: 74, se: 0.5, band: 'secure', items_seen: 12, provisional_cut: true }, 'consolidating'));
  expect(rowsOf(el)).toHaveLength(0);
  expect(el.querySelector('[data-slot="consolidating-banner"]')).not.toBeNull();
});
