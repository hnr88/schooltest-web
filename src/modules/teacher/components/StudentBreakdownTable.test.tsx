import { act, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, test } from 'vitest';

import type { AssessedBand, ResultView } from '@schooltest/scoring-contracts';

import enMessages from '@/i18n/messages/en.json';
import { StudentBreakdownTable } from '@/modules/teacher/components/StudentBreakdownTable';
import { buildStudentDrillDownView } from '@/modules/teacher/lib/student-drill-down-view';
import { t2ResultAmara } from '@/modules/teacher/lib/v2/__fixtures__/t2';

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

const vm = enMessages.TeacherPortal.viewModel;
const kit = enMessages.TeacherPortal.kit;
const student = enMessages.TeacherPortal.student;

function table(view: ResultView) {
  return render(<StudentBreakdownTable view={buildStudentDrillDownView(view)} />);
}

function rows(page: HTMLElement) {
  return [...page.querySelectorAll('[data-slot="student-breakdown-row"]')];
}

function rowOf(page: HTMLElement, skill: string) {
  return page.querySelector(`[data-slot="student-breakdown-row"][data-skill="${skill}"]`);
}

function withAcademicBand(base: ResultView, band: AssessedBand | null): ResultView {
  return { ...base, academic_vocab: { ...base.academic_vocab, band, provisional_cut: true } };
}

function withGate(base: ResultView, passed: boolean | null): ResultView {
  return { ...base, gate: { ...base.gate, passed } };
}

describe('student breakdown table — the Spec 02 nine-row table', () => {
  test('EXACTLY nine rows in the canonical display order', () => {
    const page = table(t2ResultAmara);
    expect(rows(page).map((row) => row.getAttribute('data-skill'))).toEqual([
      'Decoding',
      'Vocab_A2',
      'Grammar',
      'Vocab_B1',
      'Gist',
      'Detail',
      'Inference',
      'Vocab_B2',
      'Critical',
    ]);
    expect(page.querySelector('[data-slot="student-breakdown"]')?.textContent).toContain(
      student.breakdown.title,
    );
  });

  test('rows 1-8 carry the server band as a traffic-light pill; a null band is the kit dash', () => {
    const page = table(t2ResultAmara);
    const notAssessed = rowOf(page, 'Decoding')?.querySelector('[data-slot="student-breakdown-phase"]');
    expect(notAssessed?.textContent).toBe(kit.noValue);

    const banded = rowOf(page, 'Gist')?.querySelector('[data-slot="student-breakdown-phase"] [data-tone="danger"]');
    expect(banded?.textContent).toBe(vm.band.notYet);
  });

  test('Academic vocabulary is a BAND row with its provisional-cut caveat, never an exit gate', () => {
    const page = table(withAcademicBand(t2ResultAmara, 'developing'));
    const cell = rowOf(page, 'Vocab_B2')?.querySelector('[data-slot="student-breakdown-phase"]');
    expect(cell?.textContent).toBe(vm.band.developing);
    expect(rowOf(page, 'Vocab_B2')?.textContent).toContain(student.breakdown.provisionalNote);
    expect(rowOf(page, 'Vocab_B2')?.textContent).not.toContain(vm.gate.notYet);
  });

  test('Critical reading is the ONLY exit-gate pill, straight from the server gate', () => {
    for (const [passed, expected] of [
      [true, vm.gate.passed],
      [false, vm.gate.notYet],
      [null, kit.noValue],
    ] as const) {
      const page = table(withGate(t2ResultAmara, passed));
      const cell = rowOf(page, 'Critical')?.querySelector('[data-slot="student-breakdown-phase"]');
      expect(cell?.textContent).toBe(expected);
    }
    const page = table(t2ResultAmara);
    const gateRows = rows(page).filter((row) => row.textContent?.includes(vm.gate.notYet));
    expect(gateRows.map((row) => row.getAttribute('data-skill'))).toEqual(['Critical']);
  });
});
