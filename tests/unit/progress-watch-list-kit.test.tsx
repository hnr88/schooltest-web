import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { ProgressWatchList } from '@/modules/teacher/components/ProgressWatchList';
import type { RosterRow } from '@/modules/results/types/roster.types';

// ops/34 regression — the Progress tab crashed into the app error boundary the
// moment a scored roster rendered the watch lists: `DirectoryTable` derives row
// identity through `resolveRowKey`, which THROWS when a row has neither
// `getRowKey` nor `getRowTarget`, and this component initially passed neither.
// Pins the fix: a scored roster renders through the kit without throwing.

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) => {
    if (values === undefined) return key;
    return `${key}:${JSON.stringify(values)}`;
  },
  useFormatter: () => ({ number: (value: number) => String(value) }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/dashboard/results/x',
}));

vi.mock('@/modules/dashboard', () => ({
  useDebouncedValue: (value: unknown) => value,
}));

function rosterRow(name: string, score: number): RosterRow {
  return {
    student: { document_id: name, name, initials: name.slice(0, 2), eald_flag: false },
    result: {
      overall: { domain_score: score, delta: 5, delta_display: `+${5}` },
      acara_phase: 'Beginning',
    },
  } as unknown as RosterRow;
}

const SCORED_ROWS: readonly RosterRow[] = [rosterRow('Ana', 55), rosterRow('Ben', 70)];

let root: Root | null = null;
function mount(element: React.ReactElement): void {
  const container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root?.render(element);
  });
}

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  root = null;
  document.body.innerHTML = '';
});

describe('ProgressWatchList on the directory kit (ops/34)', () => {
  test('a scored roster renders both movers through the kit without crashing', () => {
    let thrown: unknown = null;
    try {
      mount(<ProgressWatchList variant="gains" rows={SCORED_ROWS} />);
    } catch (error) {
      thrown = error;
    }
    expect(
      thrown,
      `ProgressWatchList threw while rendering scored rows: ${
        thrown instanceof Error ? thrown.message : String(thrown)
      }`,
    ).toBeNull();
    expect(document.querySelector('[data-slot="progress-watch-list"]')).not.toBeNull();
    expect(document.querySelectorAll('[data-slot="progress-mover"]')).toHaveLength(2);
  });
});
