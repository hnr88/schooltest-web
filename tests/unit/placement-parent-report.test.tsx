import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NextIntlClientProvider } from 'next-intl';

vi.mock('@/lib/axios/strapi', () => ({
  strapi: { get: vi.fn() },
  onAuthInvalid: vi.fn(),
}));

import { strapi } from '@/lib/axios/strapi';

import { PlacementReportBody } from '@/modules/report/components/PlacementReportBody';
import { fetchMyStudentResults } from '@/modules/report/queries/use-my-student-results.query';
import type { LegacyResultView } from '@/modules/report/schemas/result-view.schema';
import { fetchStudentResult } from '@/modules/results/queries/use-student-result.query';

/**
 * A placement parent (scope=combined) whose reading child is a CURRENT-MODEL
 * result. The API now nests that child as the shared v2 view its own C-4 read
 * serves (it used to answer 400 and drop the parent from C-11). The parent
 * envelopes are live captures (`fixtures/placement-parent.live.json`); the v2
 * child is the contract package's own fixture, so this test follows the v2
 * schema as it evolves rather than a frozen copy of it.
 */

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

const read = (path: string): unknown => JSON.parse(readFileSync(resolve(process.cwd(), path), 'utf8'));
const live = read('tests/unit/fixtures/placement-parent.live.json') as {
  current: Record<string, unknown> & { combined_children: Array<Record<string, unknown>> };
  preRewrite: Record<string, unknown>;
};
const v2Child = read('vendor/contracts/scoring/fixtures/result-view.json') as Record<string, unknown>;
const currentParent = { ...live.current, combined_children: [v2Child] };

const en = read('src/i18n/messages/en.json') as Record<string, unknown>;
const get = vi.mocked(strapi.get);

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function mount(view: LegacyResultView): HTMLDivElement {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() =>
    root!.render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <NextIntlClientProvider locale="en" messages={en} timeZone="Australia/Sydney">
          <PlacementReportBody view={view} />
        </NextIntlClientProvider>
      </QueryClientProvider>,
    ),
  );
  return host;
}

beforeEach(() => get.mockReset());

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
});

describe('placement parent — C-4 read, C-11 list and the report body', () => {
  test('the live capture nests the reading child as the v2 view', () => {
    const [child] = live.current.combined_children;
    expect(live.current).toMatchObject({ scope: 'combined', skill: null, attributes: null });
    expect(child).toMatchObject({ scope: 'receptive', skill: 'reading', model_version: 'reading-3model/1' });
  });

  test('C-4: a parent with a current-model child parses as the legacy envelope with a v2 child', async () => {
    get.mockResolvedValueOnce({ data: currentParent });

    const result = await fetchStudentResult('hd1b5exabll5wf6vzvcqc6sd');

    expect(result.kind).toBe('legacy');
    const children = result.kind === 'legacy' ? result.view.combined_children ?? [] : [];
    expect(children).toHaveLength(1);
    expect('overall' in children[0]!).toBe(true);
  });

  test('C-11: the list parses with the placement parent in it', async () => {
    get.mockResolvedValueOnce({ data: [currentParent, v2Child, live.preRewrite] });

    const rows = await fetchMyStudentResults();

    expect(rows.map((row) => row.document_id)).toEqual([
      live.current.document_id,
      v2Child.document_id,
      live.preRewrite.document_id,
    ]);
  });

  test('the report renders the current-model child with the teacher blocks, not the legacy caveat', async () => {
    get.mockResolvedValueOnce({ data: currentParent });
    const result = await fetchStudentResult('hd1b5exabll5wf6vzvcqc6sd');
    if (result.kind !== 'legacy') throw new Error('expected the legacy envelope');

    const el = mount(result.view);

    const child = el.querySelector('[data-surface="placement-report"] [data-slot="placement-child"][data-skill="reading"]');
    expect(child).not.toBeNull();
    expect(child!.textContent).toContain('Reading');
    expect(child!.querySelector('[data-slot="report-teacher-view"]')).not.toBeNull();
    expect(el.querySelector('[data-surface="legacy-report"]')).toBeNull();
  });

  test('a pre-rewrite child keeps its legacy statements', async () => {
    get.mockResolvedValueOnce({ data: live.preRewrite });
    const result = await fetchStudentResult('gldqbpxowrtwy1m6evnpkw2i');
    if (result.kind !== 'legacy') throw new Error('expected the legacy envelope');

    const el = mount(result.view);

    const child = el.querySelector('[data-slot="placement-child"][data-skill="reading"]');
    expect(child!.querySelector('[data-surface="legacy-report"]')).not.toBeNull();
    expect(child!.querySelector('[data-slot="report-teacher-view"]')).toBeNull();
  });
});
