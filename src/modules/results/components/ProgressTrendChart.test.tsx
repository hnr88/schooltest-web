import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, expect, test } from 'vitest';

import { resultViewSchema, type ResultView } from '@schooltest/scoring-contracts';

import enMessages from '@/i18n/messages/en.json';
import { ProgressTrendChart } from '@/modules/results/components/ProgressTrendChart';
import dilnoza from '@/modules/teacher/lib/v2/__fixtures__/t2-result-dilnoza.json';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

// The recorded t2 result for Dilnoza (2026-09-11), with ONE change: Grammar carries a
// reliable +12 so it is the best gain. Every other attribute keeps its recorded delta.
const recorded = resultViewSchema.parse(dilnoza);
const grammarGain: ResultView = {
  ...recorded,
  attributes: {
    ...recorded.attributes,
    Grammar: { ...recorded.attributes.Grammar, delta: 12, delta_reliable: true, delta_display: '+12' } as ResultView['attributes']['Grammar'],
  },
};

let root: Root | null = null;
let host: HTMLDivElement | null = null;

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
});

test('the best-gain line names Grammar by its label, never a raw "Results.Grammar" key', () => {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => {
    root?.render(
      <NextIntlClientProvider locale="en" messages={enMessages} timeZone="UTC" onError={() => undefined}>
        <ProgressTrendChart view={grammarGain} />
      </NextIntlClientProvider>,
    );
  });
  expect(host.textContent).toContain('Best gain: Grammar +12 pts');
  expect(host.textContent).not.toContain('Results.');
});
