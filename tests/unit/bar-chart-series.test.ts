import { createElement, type ReactElement } from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import { BarChart } from '@/modules/design-system/components/bar-chart';
import { BAR_CHART_SERIES_CLASSES } from '@/modules/design-system/constants/bar-chart.constants';
import type { BarChartItem } from '@/modules/design-system/types/record.types';
import { FigureCard } from '@/modules/eald/components/FigureCard';

/**
 * Task 01 (landing-pages figure kit) — the grouped-series BarChart and the
 * FigureCard chrome. The load-bearing assertions:
 * - omitting `series`/`bands` renders EXACTLY the markup the single-series
 *   chart shipped before this task (byte-identical outerHTML, pinned below);
 * - 1–4 series per category render grouped bars, a legend and per-series
 *   screen-reader rows, coloured only from the --chart-1..5 tokens;
 * - the y-axis takes an ordered band list (ACARA bottom→top, or a numeric
 *   ladder with its ceiling label on top);
 * - FigureCard composes DataPanel (the surface is DataPanel's, never its own)
 *   and its caption is not a heading.
 */

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLElement | undefined;
let root: Root | undefined;

function render(node: ReactElement): HTMLElement {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root!.render(node));
  return host;
}

beforeEach(() => {
  host = undefined;
  root = undefined;
});

afterEach(() => {
  if (root !== undefined && host !== undefined) {
    act(() => root!.unmount());
    host.remove();
  }
});

const SINGLE_ITEMS = [
  { label: 'Mar', value: 62, display: '62%' },
  { label: 'Apr', value: 71, display: '71%', current: true },
] as const;

const EXPECTED_SINGLE_WITH_CLASS =
  '<ul data-slot="bar-chart" aria-label="Monthly scores" class="flex h-35 items-stretch gap-3.5 mt-2"><li class="flex min-w-0 flex-1 flex-col items-center gap-1.75"><span class="sr-only">Mar: 62%</span><span aria-hidden="true" class="flex min-h-0 w-full flex-1 items-end justify-center"><span class="block w-full max-w-9.5 rounded-t-lg rounded-b-xs transition-[height] duration-700 ease-out-expo motion-reduce:transition-none bg-blue-100" style="height: 87.32394366197182%;"></span></span><span aria-hidden="true" class="w-full truncate text-center text-overline text-muted-foreground">Mar</span></li><li class="flex min-w-0 flex-1 flex-col items-center gap-1.75"><span class="sr-only">Apr: 71%</span><span aria-hidden="true" class="flex min-h-0 w-full flex-1 items-end justify-center"><span class="block w-full max-w-9.5 rounded-t-lg rounded-b-xs transition-[height] duration-700 ease-out-expo motion-reduce:transition-none bg-primary shadow-primary-glow" style="height: 100%;"></span></span><span aria-hidden="true" class="w-full truncate text-center text-overline font-semibold text-primary">Apr</span></li></ul>';

const EXPECTED_SINGLE_WITH_MAX =
  '<ul data-slot="bar-chart" aria-label="One skill" class="flex h-35 items-stretch gap-3.5"><li class="flex min-w-0 flex-1 flex-col items-center gap-1.75"><span class="sr-only">Reading: 42</span><span aria-hidden="true" class="flex min-h-0 w-full flex-1 items-end justify-center"><span class="block w-full max-w-9.5 rounded-t-lg rounded-b-xs transition-[height] duration-700 ease-out-expo motion-reduce:transition-none bg-blue-100" style="height: 42%;"></span></span><span aria-hidden="true" class="w-full truncate text-center text-overline text-muted-foreground">Reading</span></li></ul>';

describe('BarChart — the no-series render is untouched', () => {
  test('omitting series and bands renders byte-identically to the shipped single-series chart', () => {
    const screen = render(
      createElement(BarChart, {
        items: SINGLE_ITEMS,
        ariaLabel: 'Monthly scores',
        className: 'mt-2',
      }),
    );
    expect(screen.querySelector('ul[data-slot="bar-chart"]')?.outerHTML).toBe(
      EXPECTED_SINGLE_WITH_CLASS,
    );
  });

  test('the max-only caller is byte-identical too, and the ul stays the render root', () => {
    const screen = render(
      createElement(BarChart, {
        items: [{ label: 'Reading', value: 42, display: '42' }],
        ariaLabel: 'One skill',
        max: 100,
      }),
    );
    expect(screen.firstElementChild?.tagName).toBe('UL');
    expect(screen.querySelector('ul[data-slot="bar-chart"]')?.outerHTML).toBe(
      EXPECTED_SINGLE_WITH_MAX,
    );
  });
});

function groupedItems(barsPerItem: number): readonly BarChartItem[] {
  return ['Reading', 'Listening'].map((label) => ({
    label,
    value: 0,
    display: '',
    bars: Array.from({ length: barsPerItem }, (_, index) => ({
      value: 10 * (index + 1),
      display: String(10 * (index + 1)),
    })),
  }));
}

describe('BarChart — grouped series', () => {
  test('renders 1, 2, 3 and 4 series per category with one legend entry and one bar each', () => {
    for (const count of [1, 2, 3, 4]) {
      const screen = render(
        createElement(BarChart, {
          items: groupedItems(count),
          series: Array.from({ length: count }, (_, index) => `Series ${index + 1}`),
          ariaLabel: 'Grouped',
        }),
      );
      expect(screen.querySelectorAll('[data-slot="bar-chart"] li').length).toBe(2);
      expect(screen.querySelectorAll('[data-slot="bar-chart"] li span[style]').length).toBe(
        2 * count,
      );
      const wrapper = screen.firstElementChild?.firstElementChild as HTMLElement;
      expect(wrapper.children[0].children.length).toBe(count);
      expect(wrapper.children[0].textContent).toContain(`Series ${count}`);
      act(() => root!.unmount());
      host!.remove();
      root = undefined;
      host = undefined;
    }
  });

  test('every value in every series reaches screen readers as "series category: display"', () => {
    const screen = render(
      createElement(BarChart, {
        items: groupedItems(2),
        series: ['Term 1 · placement', 'Term 2 · retest'],
        ariaLabel: 'Grouped',
      }),
    );
    const spoken = Array.from(screen.querySelectorAll('.sr-only')).map((node) => node.textContent);
    expect(spoken).toEqual([
      'Term 1 · placement Reading: 10',
      'Term 2 · retest Reading: 20',
      'Term 1 · placement Listening: 10',
      'Term 2 · retest Listening: 20',
    ]);
  });

  test('bar and swatch colours come only from the chart-token palette, in series order', () => {
    expect(BAR_CHART_SERIES_CLASSES.every((cls) => /^bg-chart-[1-5]$/.test(cls))).toBe(true);
    const screen = render(
      createElement(BarChart, {
        items: groupedItems(3),
        series: ['One', 'Two', 'Three'],
        ariaLabel: 'Grouped',
      }),
    );
    const firstBars = screen.querySelectorAll('[data-slot="bar-chart"] li:first-child span[style]');
    firstBars.forEach((bar, index) => {
      expect(bar.className).toContain(BAR_CHART_SERIES_CLASSES[index]);
    });
  });

  test('grouped heights respect an explicit max', () => {
    const screen = render(
      createElement(BarChart, {
        items: groupedItems(2),
        series: ['One', 'Two'],
        ariaLabel: 'Grouped',
        max: 10,
      }),
    );
    const firstBar = screen.querySelector('[data-slot="bar-chart"] li span[style]');
    expect(firstBar?.getAttribute('style')).toBe('height: 100%;');
  });

  test('the legend sits above the plot', () => {
    const screen = render(
      createElement(BarChart, { items: groupedItems(2), series: ['One', 'Two'], ariaLabel: 'G' }),
    );
    const wrapper = screen.firstElementChild?.firstElementChild as HTMLElement;
    expect(wrapper.firstElementChild?.textContent).toContain('One');
    expect(wrapper.querySelector('[data-slot="bar-chart"]')).not.toBeNull();
  });

  test('values above the ceiling stay inside the grouped plot', () => {
    const screen = render(
      createElement(BarChart, {
        items: groupedItems(2),
        series: ['One', 'Two'],
        ariaLabel: 'G',
        max: 10,
      }),
    );
    const heights = Array.from(screen.querySelectorAll<HTMLElement>('li span[style]'));
    expect(heights.map((bar) => bar.style.height)).toEqual(['100%', '100%', '100%', '100%']);
  });
});

describe('BarChart — the banded / numeric y-axis', () => {
  test('renders the ordered band list right-aligned, topmost band first', () => {
    const bands = ['Beginning', 'Emerging', 'Developing', 'Consolidating', 'Independent'];
    const screen = render(
      createElement(BarChart, { items: groupedItems(1), series: ['One'], bands, ariaLabel: 'G' }),
    );
    const axis = screen.querySelectorAll('.whitespace-nowrap');
    expect(Array.from(axis).map((node) => node.textContent)).toEqual([...bands].reverse());
  });

  test('a numeric ladder puts the ceiling label at the top', () => {
    const screen = render(
      createElement(BarChart, {
        items: groupedItems(1),
        series: ['One'],
        bands: ['0', '2', '4', '6', '8', '10 students'],
        ariaLabel: 'G',
      }),
    );
    const axis = screen.querySelectorAll('.whitespace-nowrap');
    expect(Array.from(axis).map((node) => node.textContent)).toEqual([
      '10 students',
      '8',
      '6',
      '4',
      '2',
      '0',
    ]);
  });
});

describe('FigureCard', () => {
  test('renders figure + figcaption and composes DataPanel for its surface', () => {
    const screen = render(
      createElement(
        FigureCard,
        {
          title: 'Figure 1 — Phase by skill',
          context: 'Year 9 · three sittings',
          footnote: 'Illustrative sample data.',
        },
        createElement(BarChart, { items: SINGLE_ITEMS, ariaLabel: 'Inner' }),
      ),
    );
    expect(screen.querySelector('figure[data-slot="figure-card"]')).not.toBeNull();
    expect(screen.querySelector('figcaption')?.textContent).toContain('Figure 1 — Phase by skill');
    expect(screen.querySelector('figcaption')?.textContent).toContain('Year 9 · three sittings');
    expect(screen.querySelector('figure > figcaption')).not.toBeNull();
    expect(screen.querySelector('figcaption [data-slot="panel-header-row"]')).not.toBeNull();
    expect(screen.querySelector('[data-slot="data-panel"]')).not.toBeNull();
    expect(screen.querySelector('[data-slot="figure-card-footnote"]')?.textContent).toBe(
      'Illustrative sample data.',
    );
    expect(screen.querySelector('[data-slot="bar-chart"]')).not.toBeNull();
  });

  test('the panel surface classes exist only on the composed DataPanel, the caption is no heading, and wide bodies scroll in place', () => {
    const screen = render(
      createElement(FigureCard, { title: 'T' }, createElement('p', null, 'body')),
    );
    screen.querySelectorAll('[data-slot="figure-card"] *').forEach((node) => {
      if (node.getAttribute('data-slot') === 'data-panel') return;
      expect(node.className).not.toContain('rounded-panel');
      expect(node.className).not.toContain('shadow-sm');
    });
    expect(screen.querySelector('figcaption h1, figcaption h2, figcaption h3')).toBeNull();
    const body = screen.querySelector('[data-slot="figure-card-body"]');
    expect(body?.className).toContain('overflow-x-auto');
    expect(screen.querySelector('figcaption')?.textContent).not.toContain('undefined');
  });

  test('context and footnote are optional', () => {
    const screen = render(createElement(FigureCard, { title: 'T' }, createElement('p', null, 'b')));
    expect(screen.querySelector('figcaption')?.textContent).toBe('T');
    expect(screen.querySelector('[data-slot="figure-card-footnote"]')).toBeNull();
  });
});
