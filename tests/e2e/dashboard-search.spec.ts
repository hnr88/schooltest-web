import { expect, test } from '@playwright/test';

import { loginAsParent } from './helpers/auth';
import { cat, loadMessages } from './helpers/i18n';
import { watchErrors } from './helpers/ui';

// Task 22 (depends on 18): integration e2e for C-STUDENT-SEARCH through the real
// dashboard search bar — login, type "mia", results panel shows Mia only (Jonas
// absent), click filters the students table to Mia, Clear restores both, "zzz"
// renders the translated no-results row, Escape closes the panel. A route
// watcher records every real GET /api/search/students the browser fires (by its
// `q` param) against the live api on :5500 to prove two contract-shaped facts
// the UI-only assertions above cannot: (1) the settled query really is "mia" on
// the wire — not just what the panel happens to render — and (2) the 300ms
// debounce (use-debounced-value.ts) collapses three fast keystrokes ("m", "mi",
// "mia") into exactly ONE network request for the settled value, never one per
// keystroke.
const en = loadMessages('en');
const DESKTOP = { width: 1280, height: 800 };
const KEYSTROKE_DELAY_MS = 50; // well under the 300ms debounce window

interface SearchStudentsResponseBody {
  data: { given_name: string; family_name: string }[];
  meta: { query: { q: string; count: number } };
}

function isSearchStudentsGet(url: URL, method: string, q: string): boolean {
  return (
    method === 'GET' && url.pathname === '/api/search/students' && url.searchParams.get('q') === q
  );
}

test('en: search debounces to one settled request per contract, filters, clears, no-results, Escape', async ({
  page,
}) => {
  const errors = watchErrors(page);
  await page.setViewportSize(DESKTOP);

  // Route watcher: every real GET /api/search/students the browser makes,
  // recorded by its q param. Attached before navigation so it also sees the
  // dashboard's own mount-time recents fetch (q=""), which we discard below —
  // this test cares only about requests caused by the keystrokes we drive.
  const searchRequestQueries: string[] = [];
  page.on('request', (request) => {
    if (request.method() !== 'GET') return;
    const url = new URL(request.url());
    if (url.pathname !== '/api/search/students') return;
    searchRequestQueries.push(url.searchParams.get('q') ?? '');
  });

  await loginAsParent(page);

  const search = page.getByRole('combobox', { name: cat(en, 'Dashboard.searchPlaceholder') });
  await expect(search).toBeVisible();

  // Drop the mount-time recents fetch(es) — only keystroke-driven requests
  // from here on are relevant to the debounce assertion.
  searchRequestQueries.length = 0;

  // Type "mia" one keystroke at a time, faster than the debounce window, so a
  // regression that fires per-keystroke (instead of per settled value) would
  // be caught by the request-count assertion below.
  const miaResponsePromise = page.waitForResponse((response) =>
    isSearchStudentsGet(new URL(response.url()), response.request().method(), 'mia'),
  );
  await search.pressSequentially('mia', { delay: KEYSTROKE_DELAY_MS });

  // Network truth: the real api answered the settled "mia" query with exactly
  // the C-STUDENT-SEARCH contract shape — Mia only, count 1.
  const miaResponse = await miaResponsePromise;
  expect(miaResponse.ok(), await miaResponse.text()).toBeTruthy();
  const miaBody = (await miaResponse.json()) as SearchStudentsResponseBody;
  expect(miaBody.meta.query).toEqual({ q: 'mia', count: 1 });
  expect(miaBody.data).toHaveLength(1);
  expect(`${miaBody.data[0].given_name} ${miaBody.data[0].family_name}`).toBe('Mia Keller');

  // UI truth mirrors it: results panel shows Mia only, Jonas absent.
  const miaOption = page.getByRole('option', { name: /Mia Keller/ });
  await expect(miaOption).toBeVisible();
  await expect(page.getByRole('option', { name: /Jonas Keller/ })).toHaveCount(0);

  // Debounce truth: despite 3 keystrokes ("m", "mi", "mia"), exactly ONE
  // request ever settled on the wire, and never for an intermediate value.
  await expect.poll(() => searchRequestQueries.filter((q) => q === 'mia').length).toBe(1);
  expect(searchRequestQueries).not.toContain('m');
  expect(searchRequestQueries).not.toContain('mi');

  // Click the result — StudentsSection's table narrows to Mia only.
  await miaOption.click();
  await expect(page.getByRole('option', { name: /Mia Keller/ })).toHaveCount(0);
  await expect(page.getByRole('row', { name: /Mia Keller/ })).toBeVisible();
  await expect(page.getByRole('row', { name: /Jonas Keller/ })).toHaveCount(0);

  // Clear — both the query and the table filter reset together.
  await page.getByRole('button', { name: cat(en, 'Dashboard.clearSearch') }).click();
  await expect(search).toHaveValue('');
  await expect(page.getByRole('row', { name: /Mia Keller/ })).toBeVisible();
  await expect(page.getByRole('row', { name: /Jonas Keller/ })).toBeVisible();

  // Real no-match query — the watcher confirms the wire truth (count 0) and
  // the UI renders the translated empty row, not a silent blank panel.
  const zzzResponsePromise = page.waitForResponse((response) =>
    isSearchStudentsGet(new URL(response.url()), response.request().method(), 'zzz'),
  );
  await search.pressSequentially('zzz', { delay: KEYSTROKE_DELAY_MS });
  const zzzResponse = await zzzResponsePromise;
  expect(zzzResponse.ok(), await zzzResponse.text()).toBeTruthy();
  const zzzBody = (await zzzResponse.json()) as SearchStudentsResponseBody;
  expect(zzzBody).toEqual({ data: [], meta: { query: { q: 'zzz', count: 0 } } });

  await expect(page.getByText(cat(en, 'Dashboard.noResultsTitle'))).toBeVisible();
  await expect(page.getByText(cat(en, 'Dashboard.noResultsSubtitle'))).toBeVisible();

  // Escape closes the panel without touching the query text.
  await search.press('Escape');
  await expect(page.locator('[data-slot="dashboard-search-panel"]')).toHaveCount(0);
  await expect(search).toHaveValue('zzz');

  expect(errors, errors.join('\n')).toEqual([]);
});
