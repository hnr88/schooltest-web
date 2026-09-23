import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, test } from 'vitest';

import { NextIntlClientProvider } from 'next-intl';

import { resultViewSchema, type ResultView } from '@schooltest/scoring-contracts';

import { AttributeMasteryRow } from '@/modules/report/components/AttributeMasteryRow';
import {
  resolveAttributeDelta,
  resolveAttributeRow,
} from '@/modules/report/lib/attribute-view-model';
import type { ResultViewAttribute } from '@/modules/report/schemas/result-view.schema';

// J06 surfaces printed contract TOKENS as teacher copy: the report's attribute
// rows read "band_movement since the previous sitting", the skill cards
// "not_yet → not_yet", the trend caption "steady pts". `delta_display` is the
// server's claim — a signed step, `steady`, or a band movement carrying two
// band keys — and every surface must say it in words. Each shape is pinned here
// against the rendered English AND against the raw token.

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

const enMessages = JSON.parse(
  readFileSync(resolve(process.cwd(), 'src/i18n/messages/en.json'), 'utf8'),
) as Record<string, unknown>;

const fixture = resultViewSchema.parse(
  JSON.parse(
    readFileSync(resolve(process.cwd(), 'vendor/contracts/scoring/fixtures/result-view.json'), 'utf8'),
  ),
) as ResultView;

const scored = fixture.attributes.Decoding;
if (scored === undefined || scored.status === 'not_assessed') {
  throw new Error('the contract fixture must carry a scored Decoding band movement');
}
const decoding = scored;
const unbanded = { ...decoding };
delete unbanded.band_before;
delete unbanded.band_after;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function mount(ui: React.ReactElement) {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() =>
    root!.render(
      <NextIntlClientProvider locale="en" messages={enMessages}>{ui}</NextIntlClientProvider>,
    ),
  );
}

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
  document.body.innerHTML = '';
});

describe('report attribute rows say the movement in words', () => {
  test('the view model resolves every delta_display shape into a kind', () => {
    expect(resolveAttributeDelta(decoding)).toEqual({
      kind: 'bands',
      before: 'developing',
      after: 'secure',
    });
    expect(resolveAttributeDelta({ ...decoding, delta_display: 'steady' })).toEqual({ kind: 'steady' });
    expect(resolveAttributeDelta({ ...decoding, delta_display: '+15' })).toEqual({
      kind: 'points',
      display: '+15',
    });
    expect(resolveAttributeDelta(unbanded)).toEqual({ kind: 'band_movement' });
    expect(resolveAttributeDelta({ ...decoding, delta_display: null })).toBeNull();
  });

  const cases: { entry: ResultViewAttribute; sentence: string }[] = [
    { entry: decoding, sentence: 'Developing → Consolidating since the previous sitting' },
    { entry: { ...decoding, delta_display: 'steady' }, sentence: 'Steady since the previous sitting' },
    { entry: { ...decoding, delta_display: '+15' }, sentence: '+15 since the previous sitting' },
    { entry: unbanded, sentence: 'Band movement since the previous sitting' },
  ];
  for (const { entry, sentence } of cases) {
    test(`renders "${sentence}" and no contract token`, () => {
      mount(
        <ul>
          <AttributeMasteryRow
            row={resolveAttributeRow('Decoding', entry)}
            scaleMax={20}
            revealed
            index={0}
          />
        </ul>,
      );
      const text = host?.textContent ?? '';
      expect(text).toContain(sentence);
      expect(text).not.toMatch(/band_movement|not_yet|\bsteady\b/);
    });
  }
});
