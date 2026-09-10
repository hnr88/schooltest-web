import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { NextIntlClientProvider } from 'next-intl';

const enMessages = JSON.parse(
  readFileSync(resolve(process.cwd(), 'src/i18n/messages/en.json'), 'utf8'),
) as Record<string, unknown>;

import { DirectoryBulkBar } from '@/modules/directory/components/DirectoryBulkBar';
import { partitionSelection } from '@/modules/directory/lib/directory-eligibility';
import { DIRECTORY_DEFAULT_LABELS } from '@/modules/directory/constants/directory.constants';
import type {
  DirectoryBulkAction,
  DirectorySelectionApi,
} from '@/modules/directory/types/directory.types';
import { selectedRows, selectedTargets, type OpsActionTarget } from '@/modules/ops/actions';
import { OPS_SELECTION_MAX } from '@/modules/ops/actions/constants/ops-action.constants';

interface Row {
  name: string;
  active: boolean;
}

const targetOf = (row: Row): OpsActionTarget => ({ kind: 'class', documentId: row.name });

function row(name: string, active = true): Row {
  return { name, active };
}

function bulkAction(overrides: Partial<DirectoryBulkAction<Row>> = {}): DirectoryBulkAction<Row> {
  return {
    label: 'Suspend',
    onRun: vi.fn(),
    ...overrides,
  };
}

function selectionOf(
  page: readonly Row[],
  selected: ReadonlySet<string>,
): DirectorySelectionApi<Row> {
  const targets = selectedTargets(selected, page.map(targetOf));
  return {
    count: selected.size,
    atCap: false,
    headerState: 'some',
    targets,
    selectedRows: selectedRows(selected, page, targetOf),
    isSelected: (candidate: Row) => selected.has(targetOf(candidate).documentId),
    toggleRow: () => undefined,
    toggleAllOnPage: () => undefined,
    clear: () => undefined,
  };
}

describe('partitionSelection', () => {
  test('without eligible, the whole selection is eligible and nothing is skipped', () => {
    const rows = [row('a'), row('b')];
    const { eligible, skipped } = partitionSelection(rows, bulkAction());
    expect(eligible).toEqual(rows);
    expect(skipped).toEqual([]);
  });

  test('with eligible, both halves preserve the page order', () => {
    const rows = [row('a', false), row('b'), row('c', false), row('d')];
    const { eligible, skipped } = partitionSelection(rows, bulkAction({
      eligible: (candidate) => candidate.active,
    }));
    expect(eligible.map((r) => r.name)).toEqual(['b', 'd']);
    expect(skipped.map((r) => r.name)).toEqual(['a', 'c']);
  });

  test('an empty selection partitions to two empty halves', () => {
    const { eligible, skipped } = partitionSelection([], bulkAction({ eligible: () => true }));
    expect(eligible).toEqual([]);
    expect(skipped).toEqual([]);
  });
});

describe('selectedRows and selectedTargets parity', () => {
  test('same rows, same order, same cap on a page longer than OPS_SELECTION_MAX', () => {
    const page = Array.from({ length: OPS_SELECTION_MAX + 5 }, (_, i) => row(`row-${i}`));
    const keys = new Set(page.map((r) => `class:${targetOf(r).documentId}`));
    const rows = selectedRows(keys, page, targetOf);
    const targets = selectedTargets(keys, page.map(targetOf));

    expect(rows).toHaveLength(OPS_SELECTION_MAX);
    expect(targets).toHaveLength(OPS_SELECTION_MAX);
    expect(rows.map((r) => targetOf(r).documentId)).toEqual(targets.map((t) => t.documentId));
    expect(targets[0].documentId).toBe('row-0');
    expect(targets[targets.length - 1].documentId).toBe(`row-${OPS_SELECTION_MAX - 1}`);
  });
});

describe('DirectoryBulkBar zero-eligible dispatch', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  function renderBar(
    selection: DirectorySelectionApi<Row>,
    bulkActions: readonly DirectoryBulkAction<Row>[],
  ): void {
    act(() => {
      root.render(
        <NextIntlClientProvider locale="en" messages={enMessages}>
          <DirectoryBulkBar<Row>
            selection={selection}
            bulkActions={bulkActions}
            labels={DIRECTORY_DEFAULT_LABELS}
          />
        </NextIntlClientProvider>,
      );
    });
  }

  function clickButton(labelFragment: string): void {
    const button = container
      .querySelectorAll('button')
      .item(0) instanceof HTMLButtonElement
      ? Array.from(container.querySelectorAll('button')).find((b) =>
          b.textContent?.includes(labelFragment),
        )
      : undefined;
    if (button === undefined) throw new Error(`no button containing "${labelFragment}"`);
    act(() => {
      button.click();
    });
  }

  test('a none-eligible selection still dispatches onRun([], []) exactly once', () => {
    const page = [row('a', false), row('b', false)];
    const selected = new Set(['class:a', 'class:b']);
    const onRun = vi.fn();

    renderBar(selectionOf(page, selected), [
      bulkAction({
        eligible: (candidate) => candidate.active,
        skipLabel: (skipped) => `${skipped} selected classes are skipped: only active classes.`,
        onRun,
      }),
    ]);

    expect(container.textContent).toContain('(0 of 2)');
    clickButton('(0 of 2)');

    expect(onRun).toHaveBeenCalledTimes(1);
    expect(onRun).toHaveBeenCalledWith([], []);
    expect(
      container.querySelector('[data-slot="directory-bulk-skip"]')?.textContent,
    ).toBe('2 selected classes are skipped: only active classes.');
  });

  test('a partial selection dispatches only the eligible rows with the skip sentence beside', () => {
    const page = [row('a', false), row('b'), row('c')];
    const selected = new Set(['class:a', 'class:b', 'class:c']);
    const onRun = vi.fn();

    renderBar(selectionOf(page, selected), [
      bulkAction({
        eligible: (candidate) => candidate.active,
        skipLabel: (skipped) => `${skipped} selected classes are skipped: only active classes.`,
        onRun,
      }),
    ]);

    expect(container.textContent).toContain('(2 of 3)');
    expect(
      container.querySelector('[data-slot="directory-bulk-skip"]')?.textContent,
    ).toBe('1 selected classes are skipped: only active classes.');

    clickButton('(2 of 3)');
    expect(onRun).toHaveBeenCalledTimes(1);
    expect(onRun).toHaveBeenCalledWith(
      [page[1], page[2]],
      [targetOf(page[1]), targetOf(page[2])],
    );
  });

  test('no skip sentence renders when nothing was skipped', () => {
    const page = [row('a'), row('b')];
    const selected = new Set(['class:a', 'class:b']);

    renderBar(selectionOf(page, selected), [bulkAction()]);

    expect(container.querySelector('[data-slot="directory-bulk-skip"]')).toBeNull();
    expect(container.textContent).not.toContain('skipped');
  });
});
