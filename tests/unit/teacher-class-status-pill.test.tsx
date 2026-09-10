import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { NextIntlClientProvider } from 'next-intl';
import { vi, type Mock } from 'vitest';

import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import enMessages from '@/i18n/messages/en.json';
import { ResultsClassRow } from '@/modules/teacher/components/ResultsClassRow';
import type { DashboardClass } from '@/modules/teacher/types/teacher.types';

vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock('@/modules/teacher/components/TeacherClassCompletionRow', () => ({
  TeacherClassCompletionRow: ({ label, completion }: { label: string; completion: { completed: number; total: number } }) => (
    <span>
      {label} {completion.completed} / {completion.total}
    </span>
  ),
}));

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

// teacher/06 — the derived-status rendering on ONE class row: the pill and the
// LIVE NOW badge are mutually exclusive (design :3082–3085), the n > 1 overflow
// is spelled from the served count, and the badge/meta are the client
// derivations logic.md#payloads names. No query runs here — the row takes the
// contract card as a prop, so this is pure presentation over a wire shape.

const BASE: DashboardClass = {
  class_document_id: 'aaaaaaaaaaaaaaaaaaaaaaaa',
  name: '7A EAL/D',
  year_band: 'Year 7',
  student_count: 24,
  test_a: { completed: 12, total: 24 },
  test_b: { completed: 8, total: 24 },
  top_gap: null,
  status: 'complete',
  open_session_count: 0,
};

let host: HTMLElement | undefined;
let root: Root | undefined;

function renderRow(ui: React.ReactElement): void {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => {
    root!.render(
      <NextIntlClientProvider locale="en" messages={enMessages} timeZone="UTC">
        {ui}
      </NextIntlClientProvider>,
    );
  });
}

beforeEach(() => {
  host = undefined;
  root = undefined;
});

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
});

describe('teacher/06 — the class row renders the server status, never its own cut', () => {
  test('a class with an open sitting shows LIVE NOW and NO status pill, with the N-sessions overflow', () => {
    renderRow(
      <ResultsClassRow
        classCard={{ ...BASE, status: 'sitting_now', open_session_count: 2 }}
        variant="tile"
      />,
    );
    const badge = host!.querySelector('[data-slot="results-live-badge"]');
    expect(badge).not.toBeNull();
    expect(badge!.textContent).toContain('LIVE NOW');
    // The n > 1 overflow: the served count spelled out, never a bare pill.
    expect(badge!.getAttribute('title')).toBe('2 sessions live');
    expect(host!.querySelector('[data-slot="results-status"]')).toBeNull();
    expect(host!.querySelector('[data-slot="status-pill"]')).toBeNull();
    // The live card treatment (design :3083–3084) rides on the same condition.
    expect(host!.querySelector('[data-slot="results-class-row"]')!.getAttribute('data-live')).toBe(
      'true',
    );
  });

  test('a class without an open sitting shows the pill and NO badge, with the served label', () => {
    renderRow(<ResultsClassRow classCard={BASE} variant="tile" />);
    expect(host!.querySelector('[data-slot="results-live-badge"]')).toBeNull();
    const pill = host!.querySelector('[data-slot="status-pill"]');
    expect(pill).not.toBeNull();
    expect(pill!.textContent).toBe('Complete');
  });

  test('scheduled and no_tests_yet render their own words — the four contract values are renderable', () => {
    renderRow(
      <ResultsClassRow classCard={{ ...BASE, status: 'no_tests_yet' }} variant="tile" />,
    );
    expect(host!.querySelector('[data-slot="status-pill"]')!.textContent).toBe('No tests yet');
    act(() => root!.unmount());
    renderRow(<ResultsClassRow classCard={{ ...BASE, status: 'scheduled' }} variant="tile" />);
    expect(host!.querySelector('[data-slot="status-pill"]')!.textContent).toBe('Scheduled');
  });

  test('the badge is the first two chars of the name and the meta names the cycle form (client derivations)', () => {
    renderRow(<ResultsClassRow classCard={BASE} variant="tile" />);
    expect(host!.textContent).toContain('7A');
    // test_b.completed > 0 → the class is on form B (logic.md#payloads).
    expect(host!.textContent).toContain('Year 7 · form B');
  });

  test('the cell variant keeps data-slot/data-class-id and adds no Link of its own', () => {
    renderRow(<ResultsClassRow classCard={BASE} variant="cell" />);
    const cell = host!.querySelector('[data-slot="results-class-row"]');
    expect(cell).not.toBeNull();
    expect(cell!.getAttribute('data-class-id')).toBe(BASE.class_document_id);
    // The whole-row anchor belongs to the kit's rowHref; nesting a second one
    // would be the interactive-nesting failure axe reports.
    expect(cell!.tagName).toBe('SPAN');
  });
});
