import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, test } from 'vitest';

import { NextIntlClientProvider } from 'next-intl';

import type { RosterRow } from '@/modules/results';
import { StudentBreakdownTable } from '@/modules/teacher/components/StudentBreakdownTable';
import { TeachingInsightsPanel } from '@/modules/teacher/components/TeachingInsightsPanel';
import { buildStudentDrillDownView } from '@/modules/teacher/lib/student-drill-down-view';
import { t2ResultAmara, t2ResultDilnoza, t2Roster } from '@/modules/teacher/lib/v2/__fixtures__/t2';
import { teachingPlan } from '@/modules/teacher/lib/v2/teaching/view';

// Phase Model (spec 3), the shipped teacher surfaces: the student report's
// subskill breakdown table and the Teaching tab's Reading pairs state the ACARA
// phase, never a subskill percentage. Rendered against the recorded t2 results
// and roster and the shipped catalogue.

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

const LOCALES = ['en', 'zh', 'ms', 'ko', 'vi', 'th'] as const;
type Catalogue = {
  TeacherPortal: {
    viewModel: { band: Record<string, string> };
    student: { analysis: Record<string, string>; subskills: Record<string, string> };
    insights: { pairings: Record<string, string> };
  };
};
const catalogue = (locale: string) =>
  JSON.parse(readFileSync(resolve(process.cwd(), `src/i18n/messages/${locale}.json`), 'utf8')) as Catalogue;
const en = JSON.parse(readFileSync(resolve(process.cwd(), 'src/i18n/messages/en.json'), 'utf8')) as Record<string, unknown>;
const BAND_WORDS = Object.values(catalogue('en').TeacherPortal.viewModel.band);

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

const rawScores = (view: typeof t2ResultDilnoza): string[] =>
  Object.values(view.attributes)
    .map((attribute) => ('domain_score' in attribute ? attribute.domain_score : null))
    .filter((score): score is number => typeof score === 'number')
    .map(String);

describe('student breakdown table — phase words, no percentage', () => {
  for (const [name, result] of [
    ['Dilnoza', t2ResultDilnoza],
    ['Amara', t2ResultAmara],
  ] as const) {
    test(`${name}: every row reads a phase/gate word or the dash, never a score or %`, () => {
      mount(<StudentBreakdownTable view={buildStudentDrillDownView(result)} />);
      const table = host!.querySelector('[data-slot="student-breakdown"]')!;
      expect(table.textContent).not.toMatch(/\d+\s*%/);
      const rows = [...table.querySelectorAll('[data-slot="student-breakdown-row"]')];
      expect(rows).toHaveLength(9);
      for (const row of rows) {
        const phase = row.querySelector('[data-slot="student-breakdown-phase"]')!.textContent ?? '';
        expect(phase).not.toMatch(/\d/);
      }
      for (const score of rawScores(result)) {
        for (const row of rows) expect(row.textContent).not.toMatch(new RegExp(`\\b${score}\\b`));
      }
      expect(table.querySelector('[style*="width"]')).toBeNull();
    });
  }

  test('an Emerging subskill (Dilnoza Inference, stored 49) reads the band word "Emerging"', () => {
    mount(<StudentBreakdownTable view={buildStudentDrillDownView(t2ResultDilnoza)} />);
    const row = host!.querySelector('[data-slot="student-breakdown-row"][data-skill="Inference"]')!;
    expect(row.querySelector('[data-slot="student-breakdown-phase"]')?.textContent).toBe('Emerging');
    expect(row.textContent).not.toContain('49');
  });

  test('banded rows print only the four ACARA band words', () => {
    mount(<StudentBreakdownTable view={buildStudentDrillDownView(t2ResultDilnoza)} />);
    const phases = [...host!.querySelectorAll('[data-slot="student-breakdown-row"]:not([data-skill="Critical"]) [data-slot="student-breakdown-phase"]')]
      .map((cell) => cell.textContent ?? '')
      .filter((text) => text !== '—');
    expect(phases.length).toBeGreaterThan(0);
    for (const phase of phases) expect(BAND_WORDS).toContain(phase);
  });
});

// The recorded t2 roster's lowest-mean skill (Vocab_A2) is flat at 25, so it pairs
// no one. Lift every non-Inference subskill by 40 points: Inference (mean ≈36)
// becomes the largest-gap skill and the recorded Inference spread (49 vs 25) pairs.
const LIFT = 40;
const pairingRoster: RosterRow[] = t2Roster.map((row) =>
  row.result === null
    ? row
    : {
        ...row,
        result: {
          ...row.result,
          attributes: Object.fromEntries(
            Object.entries(row.result.attributes).map(([skill, attribute]) => [
              skill,
              skill !== 'Inference' && 'domain_score' in attribute && typeof attribute.domain_score === 'number'
                ? { ...attribute, domain_score: attribute.domain_score + LIFT }
                : attribute,
            ]),
          ) as typeof row.result.attributes,
        },
      },
);

describe('Teaching tab Reading pairs — no percentage', () => {
  test('the fixture roster pairs on Inference and the pairs carry names only, no % anywhere on the tab', () => {
    const plan = teachingPlan(pairingRoster);
    expect(plan.pairings.skill?.skill).toBe('Inference');
    mount(<TeachingInsightsPanel rows={pairingRoster} classDocumentId="t2" />);
    const pairs = [...host!.querySelectorAll('[data-slot="teaching-pair"]')];
    expect(pairs.map((pair) => [pair.getAttribute('data-lead'), pair.getAttribute('data-learner')])).toEqual([
      ['Oluwaseun', 'Farida'],
      ['Mihail', 'Kaveh'],
      ['Dilnoza', 'Eitan'],
      ['Ines', 'Tenzin'],
    ]);
    for (const pair of pairs) {
      expect(pair.textContent).not.toMatch(/\d/);
      expect(pair.textContent).not.toMatch(/%/);
    }
    expect(host!.querySelector('[data-slot="teaching-pairs"]')?.textContent).not.toMatch(/%/);
    expect(host!.querySelector('[data-slot="teaching-insights"]')?.textContent).not.toMatch(/\d+\s*%/);
  });
});

describe('the catalogue — six locales', () => {
  for (const locale of LOCALES) {
    test(`${locale}: subskill copy carries phases, not percentages`, () => {
      const tp = catalogue(locale).TeacherPortal;
      for (const key of ['strengthFocus', 'vocabBoth', 'vocabA2Only', 'vocabB1Only']) {
        expect(tp.student.analysis[key]).not.toContain('%');
      }
      expect(tp.student.analysis.strengthFocus).toContain('{strongestPhase}');
      expect(tp.student.analysis.strengthFocus).toContain('{weakestPhase}');
      for (const key of ['strong', 'support']) {
        expect(tp.insights.pairings[key]).toContain('{phase}');
        expect(tp.insights.pairings[key]).not.toContain('%');
      }
      for (const token of ['{skill}', '{phase}', '{step}']) expect(tp.student.subskills.ladderLabel).toContain(token);
      expect(Object.keys(tp.viewModel.band).sort()).toEqual(['developing', 'emerging', 'notYet', 'secure']);
    });
  }
});
