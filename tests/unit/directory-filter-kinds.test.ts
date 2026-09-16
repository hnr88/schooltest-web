import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { DirectoryFilters } from '@/modules/directory/components/DirectoryFilters';
import { DIRECTORY_ALL, DIRECTORY_DEFAULT_LABELS } from '@/modules/directory/constants/directory.constants';
import {
  DIRECTORY_TOGGLE_ON,
  directoryFilterParamOf,
  directoryFilterValueOf,
  equalityBy,
  type AnyDirectoryFilterDef,
} from '@/modules/directory/lib/directory-filter-kinds';

// school-admin/02 — §L-filters (U-07): ONE renderer dispatches all eight
// kinds; D-02 (counts render on counted ONLY, from meta, never rows);
// U-45 (pending options render disabled with the sentinel, never coerced);
// U-10 (the ListPredicates totality, pinned in BOTH directions — verified by
// `tsc --noEmit`, which compiles this file).

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLDivElement;
let root: Root | null = null;

function render(
  filters: readonly AnyDirectoryFilterDef[],
  values: Readonly<Record<string, string>> = {},
  onValueChange: (key: string, next: string) => void = vi.fn(),
): void {
  host = document.body.appendChild(document.createElement('div'));
  act(() => {
    root = createRoot(host);
    root.render(
      createElement(DirectoryFilters, {
        filters,
        value: (key: string) => values[key] ?? DIRECTORY_ALL,
        onValueChange,
        labels: DIRECTORY_DEFAULT_LABELS,
        idPrefix: 't',
      }),
    );
  });
}

afterEach(() => {
  if (root) act(() => root?.unmount());
  host?.remove();
  root = null;
});

function typeInto(input: HTMLInputElement, value: string): void {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  act(() => {
    setter?.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

const STATE_DEF: AnyDirectoryFilterDef = {
  key: 'state',
  label: 'State',
  options: [
    { value: DIRECTORY_ALL, label: 'All states' },
    { value: 'active', label: 'Active' },
  ],
};

describe('D-02 — counts render on counted ONLY and come from meta, never rows', () => {
  const COUNTED: AnyDirectoryFilterDef = {
    key: 'status',
    label: 'Status',
    kind: 'counted',
    options: STATE_DEF.options,
    counts: { active: 12 },
  };

  test('the counted arm renders the served tally beside the pill', () => {
    render([COUNTED]);
    const pill = host.querySelector('[data-slot="directory-filter-pill-active"]');
    expect(pill?.textContent).toContain('12');
  });

  test('counts absent render no number — never a zero that was not verified', () => {
    render([{ ...COUNTED, counts: undefined }]);
    const pills = host.querySelector('[data-slot="directory-filter-pills"]');
    expect(pills?.textContent).not.toMatch(/\d/);
  });

  test('counts on a non-counted kind render nothing — the renderer takes no rows at all', () => {
    render([{ ...STATE_DEF, counts: { active: 12 } }]);
    expect(host.querySelector('[data-slot="directory-filter-pills"]')).toBeNull();
    expect(host.querySelector('#t-filter-state')).not.toBeNull();
  });
});

describe('U-45 — pending options: disabled with the sentinel, never coerced', () => {
  test('a pending select renders disabled, shows the sentinel, and never writes', () => {
    const onValueChange = vi.fn();
    render([{ key: 'class', label: 'Class', options: undefined }], { class: 'abc123' }, onValueChange);
    const trigger = host.querySelector<HTMLButtonElement>('#t-filter-class');
    expect(trigger?.disabled).toBe(true);
    // The sentinel option renders under the kit's "All" label; its VALUE stays
    // DIRECTORY_ALL and the disabled trigger never writes (never coerced).
    expect(trigger?.textContent).toContain(DIRECTORY_DEFAULT_LABELS.chipAllLabel);
    act(() => trigger?.click());
    expect(onValueChange).not.toHaveBeenCalled();
  });

  test('a pending counted bar renders disabled pills with the sentinel shown', () => {
    render([{ key: 'status', label: 'Status', kind: 'counted', options: undefined }]);
    const pill = host.querySelector<HTMLButtonElement>('[data-slot="directory-filter-pill-all"]');
    expect(pill?.disabled).toBe(true);
  });
});

describe('the arms write through the ONE bridge, encoded by the kinds table', () => {
  test('toggle: on writes the ON literal, off writes the sentinel', () => {
    const onValueChange = vi.fn();
    render([{ key: 'archived', label: 'Archived', kind: 'toggle' }], {}, onValueChange);
    const button = host.querySelector<HTMLButtonElement>('[data-slot="directory-filter-toggle"]');
    act(() => button?.click());
    expect(onValueChange).toHaveBeenCalledWith('archived', DIRECTORY_TOGGLE_ON);
  });

  test('multi: pressed pills follow the joined value and writes stay option-filtered', () => {
    const onValueChange = vi.fn();
    render(
      [
        {
          key: 'levels',
          label: 'Levels',
          kind: 'multi',
          options: [
            { value: DIRECTORY_ALL, label: 'All' },
            { value: 'primary', label: 'Primary' },
            { value: 'secondary', label: 'Secondary' },
          ],
        },
      ],
      { levels: 'primary' },
      onValueChange,
    );
    const pills = host.querySelectorAll<HTMLButtonElement>('[data-slot="choice-pill-group"] button');
    expect(pills.length).toBe(2);
    act(() => pills[1]?.click());
    expect(onValueChange).toHaveBeenCalledWith('levels', 'primary,secondary');
  });

  test('text writes its field value', () => {
    const onValueChange = vi.fn();
    render([{ key: 'action', label: 'Action', kind: 'text' }], {}, onValueChange);
    typeInto(host.querySelector<HTMLInputElement>('#t-filter-action') as HTMLInputElement, 'login');
    expect(onValueChange).toHaveBeenCalledWith('action', 'login');
  });

  test('dateRange halves encode through the one key: from alone, then the sentinel when empty', () => {
    const onValueChange = vi.fn();
    render([{ key: 'window', label: 'Window', kind: 'dateRange' }], {}, onValueChange);
    typeInto(
      host.querySelector<HTMLInputElement>('#t-filter-window-from') as HTMLInputElement,
      '2026-01-01',
    );
    expect(onValueChange).toHaveBeenCalledWith('window', `2026-01-01${'..'}`);
  });
});

describe('the value codecs — the only place a kind URL string form lives', () => {
  const RANGE: AnyDirectoryFilterDef = { key: 'fee', label: 'Fee', kind: 'numberRange' };
  const MULTI: AnyDirectoryFilterDef = {
    key: 'levels',
    label: 'Levels',
    kind: 'multi',
    options: [
      { value: DIRECTORY_ALL, label: 'All' },
      { value: 'primary', label: 'Primary' },
    ],
  };

  test('a range serialises to one param, never a new convention', () => {
    expect(directoryFilterParamOf(RANGE, { from: '3' })).toBe('3..');
    expect(directoryFilterParamOf(RANGE, { to: '9' })).toBe('..9');
    expect(directoryFilterParamOf(RANGE, { from: '3', to: '9' })).toBe('3..9');
    expect(directoryFilterValueOf(RANGE, '3..9')).toStrictEqual({ from: '3', to: '9' });
  });

  test('an empty range collapses to the sentinel — never an object on the wire', () => {
    expect(directoryFilterParamOf(RANGE, {})).toBe(DIRECTORY_ALL);
    expect(directoryFilterValueOf(RANGE, DIRECTORY_ALL)).toStrictEqual({});
  });

  test('an empty multi collapses to the sentinel and unknown values never leave the kit', () => {
    expect(directoryFilterParamOf(MULTI, [])).toBe(DIRECTORY_ALL);
    expect(directoryFilterParamOf(MULTI, ['primary', 'rogue'])).toBe('primary');
    expect(directoryFilterValueOf(MULTI, 'primary')).toStrictEqual(['primary']);
  });

  test('equalityBy is the default client predicate for an equality kind', () => {
    const matches = equalityBy((row: { status: string }) => row.status);
    expect(matches({ status: 'active' }, 'active')).toBe(true);
    expect(matches({ status: 'archived' }, 'active')).toBe(false);
  });
});
