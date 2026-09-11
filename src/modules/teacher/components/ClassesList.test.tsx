import { act, type ReactElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, test, vi } from 'vitest';

import enMessages from '@/i18n/messages/en.json';
import { TeacherClassTiles } from '@/modules/teacher/components/TeacherClassTiles';
import { TeacherClassesTable } from '@/modules/teacher/components/TeacherClassesTable';
import fixtureTeacherDashboard from '@/modules/teacher/lib/__fixtures__/teacher-dashboard.fixture-teacher.json';
import t2Dashboard from '@/modules/teacher/lib/__fixtures__/teacher-dashboard.t2.json';
import { toClassRowView } from '@/modules/teacher/lib/classes-directory';
import { teacherDashboardResponseSchema } from '@/modules/teacher/schemas/teacher.schema';

vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, href, ...rest }: { children?: ReactNode; href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

// Rows come from GET /api/teacher/dashboard recorded live (t2@ and teacher@,
// 2026-09-11), through the web contract and the screen's own row mapping.
const liveRows = teacherDashboardResponseSchema.parse(t2Dashboard).classes.map(toClassRowView);
const idleRows = teacherDashboardResponseSchema.parse(fixtureTeacherDashboard).classes.map(toClassRowView);
const exports = { downloadPdf: vi.fn(), downloadLlm: vi.fn(), pending: null };

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
  vi.clearAllMocks();
});

describe('Classes list body', () => {
  test('a live class shows LIVE NOW and no status line; its exports run for that class', () => {
    const view = render(<TeacherClassesTable rows={liveRows} exports={exports} empty={null} />);
    const row = view.querySelector(`[data-class-id="${liveRows[0]?.id}"]`);
    expect(row?.querySelector('[data-slot="results-live-badge"]')?.textContent).toBe('LIVE NOW');
    expect(row?.querySelector('[data-slot="results-status"]')).toBeNull();
    expect(row?.querySelector('a')?.getAttribute('href')).toBe(liveRows[0]?.href);
    act(() => row?.querySelector<HTMLButtonElement>('[data-export="pdf"]')?.click());
    expect(exports.downloadPdf).toHaveBeenCalledWith(liveRows[0]);
  });

  test('idle classes show their status line and export only when scored', () => {
    const view = render(<TeacherClassesTable rows={idleRows} exports={exports} empty={null} />);
    const headers = [...view.querySelectorAll('thead th')].map((cell) => cell.textContent);
    expect(headers).toEqual(['Class', 'Reading', 'Listening', 'Writing', 'Speaking', 'Status', 'Export']);
    for (const row of idleRows) {
      const node = view.querySelector(`[data-class-id="${row.id}"]`);
      expect(node?.querySelector('[data-slot="results-live-badge"]')).toBeNull();
      expect(node?.querySelector('[data-slot="teacher-status-dot"]')?.getAttribute('data-status-key')).toBe(row.statusKey);
      expect(node?.querySelector('[data-export="llm"]') !== null).toBe(row.hasExport);
    }
  });

  test('no match keeps the header and draws the design line', () => {
    const view = render(
      <TeacherClassesTable rows={[]} exports={exports} empty={<p>{enMessages.TeacherPortal.classes.noMatch}</p>} />,
    );
    expect(view.querySelectorAll('thead th')).toHaveLength(7);
    expect(view.querySelector('tbody')?.textContent).toBe('No classes match those filters.');
  });

  test('tiles draw one card per class with the soon skills and the roster size', () => {
    const view = render(<TeacherClassTiles rows={idleRows} empty={null} />);
    const tiles = view.querySelectorAll('[data-layout="tiles"] [data-slot="results-class-row"]');
    expect(tiles).toHaveLength(idleRows.length);
    const first = tiles[0];
    expect(first?.getAttribute('href')).toBe(idleRows[0]?.href);
    expect(first?.textContent).toContain('Soon');
    expect(first?.textContent).toContain(String(idleRows[0]?.studentCount));
  });
});
