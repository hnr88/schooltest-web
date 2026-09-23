import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, test } from 'vitest';

import { NextIntlClientProvider } from 'next-intl';

import { StudentSubskillCard } from '@/modules/teacher/components/StudentSubskillCard';
import { SuggestedPairingsCard } from '@/modules/teacher/components/SuggestedPairingsCard';
import { t2ResultAmara, t2ResultDilnoza, t2Roster } from '@/modules/teacher/lib/v2/__fixtures__/t2';
import { peerPairings } from '@/modules/teacher/lib/v2/pairings';
import { studentDetail } from '@/modules/teacher/lib/v2/student-detail';
import type { SubskillCard } from '@/modules/teacher/types/v2-student-detail.types';

// Phase Model (spec 3), the remaining teacher surfaces: the drill-down subskill
// card and the class Insights pairings state the ACARA phase, never a subskill
// percentage. Rendered against the recorded t2 results and the shipped catalogue.

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

const cardOf = (cards: readonly SubskillCard[], skill: string): SubskillCard => {
  const found = cards.find((entry) => entry.skill === skill);
  if (!found) throw new Error(`no ${skill} card`);
  return found;
};

describe('drill-down subskill card — phase and ladder, no percentage', () => {
  const dilnoza = studentDetail(t2ResultDilnoza).subskills;

  test('an Emerging subskill (Inference, stored 49) reads Emerging with 2 of 4 steps lit', () => {
    mount(<StudentSubskillCard card={cardOf(dilnoza, 'Inference')} />);
    const card = host!.querySelector('[data-slot="student-subskill"]')!;
    expect(card.querySelector('[data-slot="student-subskill-phase"]')?.textContent).toBe('Emerging');
    const ladder = card.querySelector('[data-slot="student-subskill-ladder"]')!;
    expect(ladder.getAttribute('data-step')).toBe('2');
    expect(ladder.getAttribute('aria-label')).toBe('Inference: Emerging, step 2 of 4 on the ACARA phase ladder');
    expect(ladder.querySelectorAll('[data-reached="true"]')).toHaveLength(2);
    expect(card.textContent).not.toMatch(/\d+%/);
    expect(card.textContent).not.toContain('49');
    expect(card.querySelector('[style*="width"]')).toBeNull();
  });

  test('a band move reads in phase words', () => {
    mount(<StudentSubskillCard card={cardOf(dilnoza, 'Decoding')} />);
    expect(host!.querySelector('[data-slot="student-subskill-delta"]')?.textContent).toBe('Consolidating → Beginning');
  });

  test('Critical reading is not on the ladder: the exit gate, never its score', () => {
    const amara = studentDetail(t2ResultAmara).subskills;
    mount(<StudentSubskillCard card={cardOf(amara, 'Critical')} />);
    const card = host!.querySelector('[data-slot="student-subskill"]')!;
    expect(card.querySelector('[data-slot="student-subskill-ladder"]')).toBeNull();
    expect(card.textContent).toContain('Exit gate: not yet');
    expect(card.textContent).not.toContain('47');
  });

  test('an unassessed subskill shows the dash and an unlit ladder', () => {
    const amara = studentDetail(t2ResultAmara).subskills;
    mount(<StudentSubskillCard card={cardOf(amara, 'Vocab_A2')} />);
    const card = host!.querySelector('[data-slot="student-subskill"]')!;
    expect(card.getAttribute('data-assessed')).toBe('false');
    expect(card.querySelector('[data-slot="student-subskill-ladder"]')?.getAttribute('data-step')).toBe('0');
    expect(card.querySelectorAll('[data-reached="true"]')).toHaveLength(0);
  });
});

describe('class Insights pairings — each side by phase', () => {
  test('the recorded Inference pairs carry each student’s band', () => {
    const view = peerPairings(t2Roster, 'Inference');
    expect(view.pairs.map((pair) => [pair.strong.firstName, pair.strong.band, pair.support.firstName, pair.support.band])).toEqual([
      ['Oluwaseun', 'emerging', 'Farida', 'not_yet'],
      ['Mihail', 'emerging', 'Kaveh', 'not_yet'],
      ['Dilnoza', 'emerging', 'Eitan', 'not_yet'],
      ['Ines', 'emerging', 'Tenzin', 'not_yet'],
    ]);
  });

  test('the card says "Emerging · strong" / "Beginning · support", never a percentage', () => {
    mount(<SuggestedPairingsCard pairings={peerPairings(t2Roster, 'Inference')} />);
    const pairs = [...host!.querySelectorAll('[data-slot="insights-pair"]')];
    expect(pairs).toHaveLength(4);
    for (const pair of pairs) {
      expect(pair.textContent).toContain('Emerging · strong');
      expect(pair.textContent).toContain('Beginning · support');
      expect(pair.textContent).not.toMatch(/\d+%/);
    }
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
