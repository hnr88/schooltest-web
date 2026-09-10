import { describe, expect, test } from 'vitest';

import {
  parseDirectoryParams,
  preserveNamedParams,
  serializeDirectoryParams,
} from '@/modules/directory/lib/directory-url';
import type { DirectoryFilterDef } from '@/modules/directory/types/directory.types';

// ops/34 — the `prefix` argument namespaces a kit instance's slice of the
// query string so one page can host SEVERAL lists (the Progress tab's two
// watch lists). The additive contract pinned here: with no prefix the
// functions behave byte-for-byte as before every existing consumer's params,
// and a prefixed instance neither reads nor writes the unprefixed keys.

const FILTERS: readonly DirectoryFilterDef[] = [
  {
    key: 'phase',
    label: 'Phase',
    options: [
      { value: 'all', label: 'All' },
      { value: 'Beginning', label: 'Beginning' },
    ],
  },
];

const STATE = { q: 'ana', filters: { phase: 'Beginning' }, sort: 'name:asc', page: 3, layout: '' };

describe('serializeDirectoryParams prefix', () => {
  test('no prefix writes the historical unprefixed keys (additive default)', () => {
    const params = serializeDirectoryParams(STATE, 'reason');
    expect([...params.keys()].sort()).toEqual(['page', 'phase', 'q', 'sort']);
    expect(params.get('q')).toBe('ana');
    expect(params.get('sort')).toBe('name:asc');
  });

  test('a prefix namespaces q, sort, page AND every filter key', () => {
    const params = serializeDirectoryParams(STATE, 'reason', 'watch-gains-');
    expect(params.get('watch-gains-q')).toBe('ana');
    expect(params.get('watch-gains-sort')).toBe('name:asc');
    expect(params.get('watch-gains-page')).toBe('3');
    expect(params.get('watch-gains-phase')).toBe('Beginning');
    // and it writes NOTHING unprefixed — the two instances cannot collide
    expect([...params.keys()].every((key) => key.startsWith('watch-gains-'))).toBe(true);
  });
});

describe('parseDirectoryParams prefix', () => {
  const SORTS = ['reason', 'name:asc', 'name:desc'];

  test('reads only its own prefixed keys and validates the sort', () => {
    const params = new URLSearchParams({
      'watch-support-q': 'li',
      'watch-support-phase': 'Beginning',
      'watch-support-page': '2',
      'watch-support-sort': 'name:desc',
      q: 'OTHER',
      phase: 'Beginning',
    });
    const state = parseDirectoryParams(params, FILTERS, 'reason', 'watch-support-', undefined, undefined, SORTS);
    expect(state.q).toBe('li');
    expect(state.filters.phase).toBe('Beginning');
    expect(state.page).toBe(2);
    expect(state.sort).toBe('name:desc');
  });

  test('a sort value outside the surface list degrades to the default', () => {
    const params = new URLSearchParams({ 'watch-support-sort': 'hostile:sort' });
    const state = parseDirectoryParams(params, FILTERS, 'reason', 'watch-support-', undefined, undefined, SORTS);
    expect(state.sort).toBe('reason');
  });

  test('a default-prefix parse ignores prefixed keys entirely', () => {
    const params = new URLSearchParams({ 'watch-gains-q': 'li', q: '' });
    const state = parseDirectoryParams(params, FILTERS, 'reason');
    expect(state.q).toBe('');
    expect(state.filters.phase).toBe('all');
  });
});

describe('two-instance survival (the Progress tab pairs gains + support)', () => {
  test('a gains write preserves the support instance’s live keys', () => {
    const current = new URLSearchParams({
      'watch-gains-q': 'ana',
      'watch-support-q': 'ben',
      'watch-support-sort': 'name:asc',
      'watch-support-page': '2',
    });
    const gainsWrite = serializeDirectoryParams(
      { q: 'ana', filters: {}, sort: 'reason', page: 1, layout: '' },
      'reason',
      'watch-gains-',
    );
    // Without the preserve list the fresh build would drop every sibling key.
    const merged = preserveNamedParams(
      gainsWrite,
      current,
      ['watch-support-q', 'watch-support-sort', 'watch-support-page'],
    );
    expect(merged.get('watch-gains-q')).toBe('ana');
    expect(merged.get('watch-support-q')).toBe('ben');
    expect(merged.get('watch-support-sort')).toBe('name:asc');
    expect(merged.get('watch-support-page')).toBe('2');
  });

  test('the preserve list never resurrects a key the sibling cleared', () => {
    // The sibling CLEARED its search, so the URL carries no watch-support-q;
    // a gains write must not fabricate one — only copy keys that exist.
    const current = new URLSearchParams({ 'watch-gains-q': 'ana' });
    const gainsWrite = serializeDirectoryParams(
      { q: 'ana', filters: {}, sort: 'reason', page: 1, layout: '' },
      'reason',
      'watch-gains-',
    );
    const merged = preserveNamedParams(
      gainsWrite,
      current,
      ['watch-support-q', 'watch-support-sort', 'watch-support-page'],
    );
    expect([...merged.keys()]).toEqual(['watch-gains-q']);
  });
});
