import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, test } from 'vitest';

import { NextIntlClientProvider } from 'next-intl';

import { resultViewSchema, type ResultView } from '@schooltest/scoring-contracts';

import { AttributeMasteryRow } from '@/modules/report/components/AttributeMasteryRow';
import { ParentReportView } from '@/modules/report/components/ParentReportView';
import { PHASE_LADDER_FILL } from '@/modules/report/constants/mastery.constants';
import { resolveAttributeRow } from '@/modules/report/lib/attribute-view-model';
import { buildFamilyPreview } from '@/modules/report/lib/parent-view-model';
import type { AssessedBand, ResultViewAttribute } from '@/modules/report/schemas/result-view.schema';

// Phase Model & EAL/D Alignment (spec 3): the teacher report's per-attribute
// percentage bar becomes a four-step ACARA phase ladder, and the family lines
// drop the {score}% token. Rendered against the shipped catalogue.

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

const LOCALES = ['en', 'zh', 'ms', 'ko', 'vi', 'th'] as const;
const catalogue = (locale: string) =>
  JSON.parse(readFileSync(resolve(process.cwd(), `src/i18n/messages/${locale}.json`), 'utf8')) as {
    Report: Record<string, unknown> & { attributeStatus: Record<string, string> };
  };
const en = catalogue('en');

const fixture = resultViewSchema.parse(
  JSON.parse(readFileSync(resolve(process.cwd(), 'vendor/contracts/scoring/fixtures/result-view.json'), 'utf8')),
) as ResultView;

const scored = fixture.attributes.Decoding;
if (scored === undefined || scored.status === 'not_assessed') throw new Error('fixture Decoding must be scored');
const DOMAIN_SCORE = 73;

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
  document.body.innerHTML = '';
});

const row = (entry: ResultViewAttribute) => (
  <ul>
    <AttributeMasteryRow row={resolveAttributeRow('Decoding', entry)} scaleMax={20} revealed index={0} />
  </ul>
);

describe('teacher report row — the four-step ACARA phase ladder', () => {
  const ladder: { band: AssessedBand; phase: string; step: number }[] = [
    { band: 'not_yet', phase: 'Beginning', step: 1 },
    { band: 'emerging', phase: 'Emerging', step: 2 },
    { band: 'developing', phase: 'Developing', step: 3 },
    { band: 'secure', phase: 'Consolidating', step: 4 },
  ];

  for (const { band, phase, step } of ladder) {
    test(`${band} reads "${phase}" and lights ${step} of 4 steps, with no score`, () => {
      mount(row({ ...scored, status: band, domain_score: DOMAIN_SCORE, delta_display: null }));
      const li = host!.querySelector('[data-slot="report-attribute-row"]')!;
      expect(li.querySelector('[data-slot="status-pill"]')?.textContent).toBe(phase);

      const track = li.querySelector('[data-slot="report-attribute-track"]')!;
      expect(track.getAttribute('data-step')).toBe(String(step));
      expect(track.getAttribute('aria-label')).toBe(`Decoding: ${phase}, step ${step} of 4 on the ACARA phase ladder`);
      const steps = [...track.querySelectorAll('[data-slot="report-attribute-ladder-step"]')];
      expect(steps.map((s) => s.getAttribute('data-band'))).toEqual(['not_yet', 'emerging', 'developing', 'secure']);
      expect(steps.map((s) => s.getAttribute('title'))).toEqual(['Beginning', 'Emerging', 'Developing', 'Consolidating']);
      expect(steps.filter((s) => s.getAttribute('data-reached') === 'true')).toHaveLength(step);
      for (const [position, s] of steps.entries()) {
        expect(s.classList.contains(PHASE_LADDER_FILL[band])).toBe(position < step);
        expect(s.classList.contains('bg-divider')).toBe(position >= step);
      }
      expect(steps.filter((s) => s.getAttribute('data-current') === 'true').map((s) => s.getAttribute('data-band'))).toEqual([band]);

      expect(li.querySelector('[data-slot="report-attribute-score"]')).toBeNull();
      expect(li.textContent).not.toContain(String(DOMAIN_SCORE));
      expect(li.textContent).not.toContain('%');
      expect(track.innerHTML).not.toContain('scaleX');
    });
  }

  test('a band movement reads in phase words', () => {
    mount(row(scored));
    expect(host!.textContent).toContain('Developing → Consolidating since the previous sitting');
  });

  test('a not-assessed attribute keeps its hatched gap: no step, no ladder', () => {
    mount(row({ status: 'not_assessed', items_seen: 0, insufficient_evidence: true } as ResultViewAttribute));
    const li = host!.querySelector('[data-slot="report-attribute-row"]')!;
    expect(li.getAttribute('data-state')).toBe('not_assessed');
    expect(li.querySelector('[data-slot="report-attribute-track"]')?.getAttribute('data-state')).toBe('not_assessed');
    expect(li.querySelectorAll('[data-slot="report-attribute-ladder-step"]')).toHaveLength(0);
    expect(li.querySelector('[data-slot="status-pill"]')?.textContent).toBe('Not assessed');
  });
});

describe('parent lines — no {score}% token', () => {
  test('strength and focus lines name the skill and the phrase, never a percentage', () => {
    const view = buildFamilyPreview(fixture);
    expect(view.strengths.length).toBeGreaterThan(0);
    mount(<ParentReportView view={view} />);

    const lines = [
      ...host!.querySelectorAll('[data-slot="report-family-strength"], [data-slot="report-family-next-step"]'),
    ].map((el) => el.textContent ?? '');
    expect(lines.length).toBeGreaterThan(0);
    for (const line of lines) expect(line).not.toMatch(/%|\{score\}/);
    for (const strength of view.strengths) {
      expect(lines).toContain(
        `${(en.Report.attributes as Record<string, string>)[strength.skill]} — ${
          (en.Report.parentStatePhrase as Record<string, string>)[strength.state]
        }`,
      );
      expect(lines.join('\n')).not.toContain(`${strength.score}`);
    }
  });
});

describe('the catalogue — six locales, same keys', () => {
  for (const locale of LOCALES) {
    test(`${locale}: four phase labels, the ladder label, and family lines without {score}`, () => {
      const report = catalogue(locale).Report;
      expect(Object.keys(report.attributeStatus)).toEqual(['secure', 'developing', 'emerging', 'not_yet', 'not_assessed']);
      for (const value of Object.values(report.attributeStatus)) expect(value.length).toBeGreaterThan(0);
      for (const token of ['{skill}', '{phase}', '{step}']) expect(String(report.attributeLadderLabel)).toContain(token);
      for (const key of ['familyStrengthLine', 'familyFocusLine']) {
        expect(String(report[key])).not.toContain('{score}');
        expect(String(report[key])).not.toContain('%');
        expect(String(report[key])).toContain('{skill}');
        expect(String(report[key])).toContain('{phrase}');
      }
    });
  }

  test('en reads Consolidating for secure and Beginning for not_yet', () => {
    expect(en.Report.attributeStatus).toMatchObject({
      secure: 'Consolidating',
      developing: 'Developing',
      emerging: 'Emerging',
      not_yet: 'Beginning',
    });
  });
});
