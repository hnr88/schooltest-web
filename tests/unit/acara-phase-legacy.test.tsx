import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, test } from 'vitest';

import { NextIntlClientProvider } from 'next-intl';

import { CrosswalkFactPanel } from '@/modules/report/components/CrosswalkFactPanel';
import { DisplayLabelPanel } from '@/modules/report/components/DisplayLabelPanel';
import { ParentReportView } from '@/modules/report/components/ParentReportView';
import { ACARA_PHASE_CODES, acaraPhaseText } from '@/modules/report/lib/acara-phase';
import { buildFamilyPreview } from '@/modules/report/lib/parent-view-model';
import { resultViewSchema } from '@/modules/report/schemas/result-view.schema';
import type { ResultView } from '@/modules/report/types/report.types';

// Results scored under reading v4 keep `developing_to_consolidating` after v5
// is active (8 reading results in the dev database hold it). Every report
// surface names a stored phase code in words — the legacy one by its v4 label —
// and never prints the raw key.

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

const LOCALES = ['en', 'zh', 'ms', 'ko', 'vi', 'th'] as const;
const catalogue = (locale: string) =>
  JSON.parse(readFileSync(resolve(process.cwd(), `src/i18n/messages/${locale}.json`), 'utf8')) as {
    Report: { acaraPhases: Record<string, string> };
  };
const en = catalogue('en');

const fixture = resultViewSchema.parse(
  JSON.parse(readFileSync(resolve(process.cwd(), 'vendor/contracts/scoring/fixtures/result-view.json'), 'utf8')),
) as ResultView;
const withPhase = (acara_phase: string): ResultView => ({ ...fixture, acara_phase });

let root: Root | null = null;
let host: HTMLDivElement | null = null;
function mount(ui: React.ReactElement) {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() =>
    root!.render(
      <NextIntlClientProvider locale="en" messages={en} timeZone="Australia/Sydney">
        {ui}
      </NextIntlClientProvider>,
    ),
  );
}
afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
});

describe('acaraPhaseText', () => {
  const label = (code: string) => en.Report.acaraPhases[code] ?? '';
  test('every stored code has words; the v4 code reads as its v4 label', () => {
    expect(acaraPhaseText('developing_to_consolidating', label)).toBe('Developing → Consolidating');
    expect(acaraPhaseText('consolidating', label)).toBe('Consolidating');
    expect(acaraPhaseText(' Developing ', label)).toBe('Developing');
  });
  test('a value that is not a code is already words and stays verbatim', () => {
    expect(acaraPhaseText('Developing to Consolidating', label)).toBe('Developing to Consolidating');
  });
});

describe('report surfaces over a v4-stored phase', () => {
  test('the headline names it, never the raw key', () => {
    mount(<DisplayLabelPanel result={withPhase('developing_to_consolidating')} evidence={null} />);
    expect(host!.querySelector('[data-slot="report-display-label-value"]')?.textContent).toBe('Developing → Consolidating');
    expect(host!.textContent).not.toContain('developing_to_consolidating');
  });

  test('the headline names a current code in words too', () => {
    mount(<DisplayLabelPanel result={withPhase('developing')} evidence={null} />);
    expect(host!.querySelector('[data-slot="report-display-label-value"]')?.textContent).toBe('Developing');
  });

  test('the crosswalk facts panel names it', () => {
    mount(<CrosswalkFactPanel result={withPhase('developing_to_consolidating')} evidence={null} />);
    expect(host!.textContent).toContain('Developing → Consolidating');
    expect(host!.textContent).not.toContain('developing_to_consolidating');
  });

  test('the parent view names it', () => {
    mount(<ParentReportView view={buildFamilyPreview(withPhase('developing_to_consolidating'))} />);
    expect(host!.querySelector('[data-slot="report-parent-phase"]')?.textContent).toBe(
      'ACARA phase: Developing → Consolidating',
    );
  });
});

describe('the catalogue — six locales, every code', () => {
  for (const locale of LOCALES) {
    test(`${locale}: Report.acaraPhases carries every stored code`, () => {
      const phases = catalogue(locale).Report.acaraPhases;
      expect(Object.keys(phases).sort()).toEqual([...ACARA_PHASE_CODES].sort());
      for (const value of Object.values(phases)) expect(value.length).toBeGreaterThan(0);
      expect(phases.developing_to_consolidating).toBe(`${phases.developing} → ${phases.consolidating}`);
    });
  }
});
