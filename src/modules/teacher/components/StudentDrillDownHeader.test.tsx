import { act, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, test, vi } from 'vitest';

import enMessages from '@/i18n/messages/en.json';
import { StudentDrillDownHeader } from '@/modules/teacher/components/StudentDrillDownHeader';
import { buildStudentDrillDownView } from '@/modules/teacher/lib/student-drill-down-view';
import { t2ResultAmara, t2ResultDilnoza } from '@/modules/teacher/lib/v2/__fixtures__/t2';
import type { StudentDetailActions } from '@/modules/teacher/types/student-drill-down.types';
import type { ResultHistoryPoint, ResultView } from '@schooltest/scoring-contracts';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function render(ui: ReactElement): HTMLDivElement {
  const container = document.createElement('div');
  document.body.appendChild(container);
  host = container;
  root = createRoot(container);
  act(() => {
    root?.render(
      <NextIntlClientProvider locale="en" messages={enMessages} timeZone="UTC">
        {ui}
      </NextIntlClientProvider>,
    );
  });
  return container;
}

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
});

const EMPTY_ATTRIBUTES: ResultHistoryPoint['attributes'] = {
  Decoding: null,
  Vocab_A2: null,
  Grammar: null,
  Vocab_B1: null,
  Gist: null,
  Detail: null,
  Inference: null,
  Vocab_B2: null,
  Critical: null,
};

function viewWithHistory(overalls: readonly (number | null)[]): ReturnType<typeof buildStudentDrillDownView> {
  return buildStudentDrillDownView({
    ...t2ResultAmara,
    history: overalls.map((overall, index): ResultHistoryPoint => ({
      sat_at: `2026-01-${String(index + 1).padStart(2, '0')}`,
      overall,
      attributes: EMPTY_ATTRIBUTES,
    })),
  });
}

const name = 'Bui Thi Mai';
const student = enMessages.TeacherPortal.student;
const button = (page: HTMLElement, label: string) =>
  [...page.querySelectorAll('button')].find((element) => element.textContent === label);
const handlers = (overrides: Partial<StudentDetailActions> = {}): StudentDetailActions => ({
  exportPending: false,
  exportFailed: false,
  exportMarkdown: vi.fn(),
  askAiOpen: false,
  askAi: vi.fn(),
  copy: vi.fn(),
  ...overrides,
});

function header(view: ReturnType<typeof buildStudentDrillDownView>, actions: StudentDetailActions | null = handlers()) {
  return render(
    <StudentDrillDownHeader
      studentName={name}
      className="7A EAL/D"
      view={view}
      actions={actions}
      skill="reading"
      onValueChange={vi.fn()}
    />,
  );
}

describe('student page header — the Spec 02 banner', () => {
  test('the banner holds the name, the class subline and THREE stat cards', () => {
    const page = header(viewWithHistory([40, 55]));
    const banner = page.querySelector<HTMLElement>('[data-slot="student-drill-down-header"]');
    expect(banner?.className).toContain('bg-gradient-to-br');
    expect(page.querySelector('h1')?.textContent).toBe(name);
    expect(page.querySelector('[data-slot="student-meta"]')?.textContent).toBe('7A EAL/D · Reading');
    expect(page.querySelectorAll('[data-slot="student-stat-cards"] > div')).toHaveLength(3);
    expect(page.querySelector('[data-slot="student-stat-overall"]')?.textContent).toContain(student.statOverall);
    expect(page.querySelector('[data-slot="student-stat-phase"]')?.textContent).toContain(student.statAcaraPhase);
    expect(page.querySelector('[data-slot="student-stat-momentum"]')?.textContent).toContain(student.statMomentum);
  });

  test('the overall card prints the served score with the growth pill in its direction colour', () => {
    // The score is the served overall (42); the pill is the history's own 40 → 55 delta.
    const up = header(viewWithHistory([40, 55]));
    expect(up.querySelector('[data-slot="student-overall-score"]')?.textContent).toBe('42%');
    expect(up.querySelector('[data-slot="student-overall-delta"]')?.textContent).toBe('↑ +15 pts');
    expect(up.querySelector('[data-slot="student-overall-delta"]')?.className).toContain('text-[#1F7A4D]');

    const down = header(viewWithHistory([80, 60]));
    expect(down.querySelector('[data-slot="student-overall-delta"]')?.textContent).toBe('↓ −20 pts');
    expect(down.querySelector('[data-slot="student-overall-delta"]')?.className).toContain('text-[#B42318]');

    const flat = header(viewWithHistory([55, 55]));
    expect(flat.querySelector('[data-slot="student-overall-delta"]')?.textContent).toBe('→ ±0 pts');
  });

  test('under two scored sittings there is no growth pill and no momentum pill — but the note stays', () => {
    const page = header(viewWithHistory([70]));
    expect(page.querySelector('[data-slot="student-overall-delta"]')).toBeNull();
    expect(page.querySelector('[data-slot="student-stat-momentum"]')?.textContent).toContain(
      student.momentumNote.none,
    );
  });

  test('a null served overall prints the kit dash, never a %, and no overall growth pill', () => {
    const page = header(
      buildStudentDrillDownView({
        ...t2ResultAmara,
        overall: { ...t2ResultAmara.overall, domain_score: null, delta: null, delta_reliable: null, delta_display: null },
        history: [null, null].map((overall, index): ResultHistoryPoint => ({
          sat_at: `2026-01-0${index + 1}`,
          overall,
          attributes: EMPTY_ATTRIBUTES,
        })),
      }),
    );
    const score = page.querySelector('[data-slot="student-overall-score"]');
    expect(score?.textContent).toBe(enMessages.TeacherPortal.kit.noValue);
    expect(score?.textContent).not.toMatch(/%/);
    expect(page.querySelector('[data-slot="student-overall-delta"]')).toBeNull();
    expect(page.querySelector('[data-slot="student-stat-momentum-value"]')).toBeNull();
  });

  test('momentum names the 5/10 provisional states and carries its note', () => {
    const accelerating = header(viewWithHistory([40, 55]));
    expect(accelerating.querySelector('[data-slot="student-stat-momentum"]')?.textContent).toContain(
      student.momentum.accelerating,
    );
    expect(accelerating.querySelector('[data-slot="student-stat-momentum"]')?.textContent).toContain(
      student.momentumNote.accelerating,
    );

    const holding = header(viewWithHistory([55, 55]));
    expect(holding.querySelector('[data-slot="student-stat-momentum"]')?.textContent).toContain(
      student.momentum.holding,
    );
  });

  test('the ACARA phase is the server string as large text (no chip); no phase prints the kit dash', () => {
    const dilnoza = header(buildStudentDrillDownView(t2ResultDilnoza));
    const value = dilnoza.querySelector('[data-slot="student-stat-phase-value"]');
    expect(value?.textContent).toBe(enMessages.TeacherPortal.kit.phase.beginning);
    expect(value?.getAttribute('data-phase')).toBe('beginning');
    expect(dilnoza.querySelector('[data-slot="student-stat-phase"] [data-tone]')).toBeNull();

    const amara = header(buildStudentDrillDownView(t2ResultAmara));
    expect(amara.querySelector('[data-slot="student-stat-phase-value"]')?.textContent).toBe(
      enMessages.TeacherPortal.kit.noValue,
    );
    expect(amara.querySelector('[data-slot="student-stat-phase-value"]')?.hasAttribute('data-phase')).toBe(false);
  });

  test('a refused export is said in text beside the actions', () => {
    const page = header(viewWithHistory([40, 55]), handlers({ exportFailed: true }));
    expect(page.querySelector('[role="alert"]')?.textContent).toBe(enMessages.Teacher.results.export.failed);
  });

  test('no actions: no export and no Ask AI buttons', () => {
    const page = header(viewWithHistory([40, 55]), null);
    expect(button(page, 'Export for LLM')).toBeUndefined();
    expect(button(page, 'Ask AI')).toBeUndefined();
  });
});
