import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, test } from 'vitest';

import { NextIntlClientProvider } from 'next-intl';

import type { RosterRow } from '@/modules/results';
import { FamilyReportDialogs } from '@/modules/teacher/components/FamilyReportDialogs';
import { t2Roster, t2Row } from '@/modules/teacher/lib/v2/__fixtures__/t2';
import { familyReportRows } from '@/modules/teacher/lib/v2/family-reports';
import type { FamilyConfirm, FamilyReportActions, FamilyReportsView } from '@/modules/teacher/types/v2-family.types';

const enMessages = JSON.parse(
  readFileSync(resolve(process.cwd(), 'src/i18n/messages/en.json'), 'utf8'),
) as Record<string, unknown>;

// TB-40 — the two bulk dialogs must account for a held result that carries no score: it is
// neither releasable nor "waiting on a re-sit / manual scoring / still sitting". Every count
// here comes from the recorded t2 roster (6 of its 20 held results have no `domain_score`),
// never from a hand-written number. The dialog renders through a portal, so the assertions
// read `document.body`.
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

const CLASS_NAME = 'Reading 8B — Alvarez';

function actionsWith(confirm: FamilyConfirm): FamilyReportActions {
  return {
    confirm,
    reason: '',
    error: null,
    pending: false,
    setReason: () => {},
    askRelease: () => {},
    askRecall: () => {},
    askReleaseAll: () => {},
    close: () => {},
    run: () => {},
  };
}

function openDialog(view: FamilyReportsView, confirm: FamilyConfirm): string {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() =>
    root!.render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <FamilyReportDialogs
          actions={actionsWith(confirm)}
          counts={view.counts}
          heldCount={view.releasableResultIds.length}
          className={CLASS_NAME}
        />
      </NextIntlClientProvider>,
    ),
  );
  return document.body.textContent ?? '';
}

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
  document.body.innerHTML = '';
});

describe('FamilyReportDialogs — "Release N held reports" counts the unscored rows', () => {
  const view = familyReportRows(t2Roster);

  test('the recorded roster: 14 releasable, 6 with no score, nothing open or blocked', () => {
    expect(view.releasableResultIds).toHaveLength(14);
    expect(view.counts).toMatchObject({ held: 14, unscored: 6, open: 0, blocked: 0 });
  });

  test('the body names the 6 unscored attempts, and no reason that is not true', () => {
    const text = openDialog(view, { kind: 'releaseAll' });
    expect(text).toContain('Carers of 14 students can read the band and next steps straight away.');
    expect(text).toContain('6 more have no score yet.');
    expect(text).toContain('Reports can be recalled, but not un-read.');
    expect(text).not.toContain('still sitting');
    expect(text).not.toContain('blocked on a re-sit');
  });

  test('open, unscored and blocked each get their line, in that order', () => {
    // Derived from recorded rows: Lucia keeps her scoreless held result, Rosa's becomes an
    // open attempt and Chen's a manual-scoring one — the three gap kinds at once.
    const roster: RosterRow[] = [
      t2Row('Dilnoza'),
      t2Row('Lucia'),
      { ...t2Row('Rosa'), result: null, release_state: 'open' },
      { ...t2Row('Chen'), release_state: 'manual' },
    ];
    const mixed = familyReportRows(roster);
    expect(mixed.counts).toMatchObject({ held: 1, unscored: 1, open: 1, blocked: 1, noResult: 3 });
    const text = openDialog(mixed, { kind: 'releaseAll' });
    const open = text.indexOf('1 student is still sitting');
    const unscored = text.indexOf('1 more has no score yet.');
    const blocked = text.indexOf('1 more is blocked on a re-sit or manual scoring.');
    expect(open).toBeGreaterThan(-1);
    expect(unscored).toBeGreaterThan(open);
    expect(blocked).toBeGreaterThan(unscored);
  });
});

describe('FamilyReportDialogs — "Nothing is being held back" names every reason', () => {
  // Only the recorded held rows that carry no score: nothing can be released, and the reason
  // is the missing score — not a re-sit, manual scoring or an open attempt.
  const unscoredOnly = familyReportRows(t2Roster.filter((row) => row.result?.overall.domain_score == null));

  test('nothing is releasable, and all 6 rows count as no result', () => {
    expect(unscoredOnly.releasableResultIds).toEqual([]);
    expect(unscoredOnly.counts).toMatchObject({ total: 6, held: 0, unscored: 6, noResult: 6 });
  });

  test('the body carries the fourth reason next to the other three', () => {
    const text = openDialog(unscoredOnly, { kind: 'nothingHeld' });
    expect(text).toContain(`Every scored report in ${CLASS_NAME} has already gone to its carer.`);
    expect(text).toContain('The 6 students without a report have no score yet');
    expect(text).toContain('are waiting on a re-sit or on manual scoring, or are still sitting');
    expect(text).toContain('cannot be released from here.');
  });

  test('a roster with nothing missing keeps the short sentence', () => {
    const complete = familyReportRows(t2Roster.filter((row) => row.result?.overall.domain_score != null));
    expect(complete.counts.noResult).toBe(0);
    const text = openDialog(complete, { kind: 'nothingHeld' });
    expect(text).toContain(`Every scored report in ${CLASS_NAME} has already gone to its carer.`);
    expect(text).not.toContain('without a report');
  });
});
