import { act, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, test } from 'vitest';

import enMessages from '@/i18n/messages/en.json';
import { ProgressWatchList } from '@/modules/teacher/components/ProgressWatchList';
import { t2Roster } from '@/modules/teacher/lib/v2/__fixtures__/t2';
import { classProgress } from '@/modules/teacher/lib/v2/class-progress';

// The Class progress list cards (Teacher Portal v2 `:923–952`), rendered from the RECORDED
// t2 roster through the view model: one row per mover in the view model's order, first
// name, latest score, the server's step or "steady" — and the words, never a filler row,
// when a list is empty.

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

const view = classProgress(t2Roster);

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
});

const texts = (container: HTMLElement, slot: string) =>
  Array.from(container.querySelectorAll(`[data-slot="${slot}"]`), (node) => node.textContent);

const moverIds = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('[data-slot="progress-mover"]'), (node) => node.getAttribute('data-student-id'));

describe('ProgressWatchList — recorded t2 roster', () => {
  test('Top progress: the reliable gains in order, a signed step then the server’s "steady"', () => {
    const list = render(<ProgressWatchList variant="gains" movers={view.topProgress} />);
    expect(list.querySelector('h3')?.textContent).toBe('Top progress');
    expect(moverIds(list)).toEqual(view.topProgress.map((mover) => mover.studentDocumentId));
    expect(texts(list, 'progress-mover-name')).toEqual(['Rosa', 'Amara']);
    expect(texts(list, 'progress-mover-score')).toEqual(['45%', '42%']);
    expect(texts(list, 'progress-mover-delta')).toEqual(['+5', 'steady']);
  });

  test('Students to watch: the reliable decline first, printed with a true minus', () => {
    const list = render(<ProgressWatchList variant="support" movers={view.watch} />);
    expect(list.querySelector('h3')?.textContent).toBe('Students to watch');
    expect(moverIds(list)).toEqual(view.watch.map((mover) => mover.studentDocumentId));
    expect(texts(list, 'progress-mover-name')).toEqual(['Dilnoza', 'Tenzin', 'Jae-won']);
    const [decline] = view.watch;
    expect(decline.growth.kind).toBe('down');
    expect(list.querySelector('[data-slot="progress-mover"]')?.getAttribute('data-growth')).toBe('down');
    expect(texts(list, 'progress-mover-delta')[0]).toBe(`−${Math.abs(decline.growth.points ?? Number.NaN)}`);
  });

  test('an empty list (the recorded roster with every row removed) says so and draws no row', () => {
    const list = render(<ProgressWatchList variant="gains" movers={classProgress(t2Roster.slice(0, 0)).topProgress} />);
    expect(list.querySelectorAll('[data-slot="progress-mover"]')).toHaveLength(0);
    expect(list.querySelector('[data-slot="progress-watch-empty"]')?.textContent).toBe('No reliable gains yet.');
  });
});
