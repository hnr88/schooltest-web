import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { BarChart } from '@/modules/design-system/components/bar-chart';
import { FigureCard } from '@/modules/eald/components/FigureCard';

// The markup half of tests/e2e/01-figure-kit-harness.spec.ts (proof tooling for
// landing-pages task 01). It lives in its own file because the spec is loaded
// by Playwright's transpiler — which rewrites JSX to its component-testing
// stub — while this file is loaded through Vite's SSR transform, which
// produces real React elements.

const ACARA_BANDS = ['Beginning', 'Emerging', 'Developing', 'Consolidating', 'Independent'];
const CATEGORIES = ['Reading', 'Listening', 'Writing', 'Speaking'];

function figure(seriesCount: number, title: string) {
  const series = Array.from({ length: seriesCount }, (_, index) => `Term ${index + 1}`);
  const items = CATEGORIES.map((label, category) => ({
    label,
    value: 0,
    display: '',
    bars: Array.from({ length: seriesCount }, (_, index) => ({
      value: seriesCount === 2 ? 3 + index + category : 30 + 15 * index + 5 * category,
      display: String(seriesCount === 2 ? 3 + index + category : 30 + 15 * index + 5 * category),
    })),
  }));
  return createElement(
    'div',
    { style: { minWidth: 0 } },
    createElement(
      FigureCard,
      {
        title,
        context: `Year 9 · ${seriesCount} sittings`,
        footnote: 'Illustrative sample data.',
      },
      createElement(
        'div',
        { style: { minWidth: '352px' } },
        createElement(BarChart, {
          items,
          series,
          bands: seriesCount === 2 ? ['0', '2', '4', '6', '8', '10 students'] : ACARA_BANDS,
          max: seriesCount === 2 ? 10 : 100,
          ariaLabel: `Grouped column chart with ${seriesCount} series over four skills`,
        }),
      ),
    ),
  );
}

export function buildFigureHarness(): string {
  return renderToStaticMarkup(
    createElement(
      'main',
      {
        style: {
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))',
          alignItems: 'start',
          gap: '24px',
          padding: '24px',
        },
      },
      figure(2, 'Figure 1 — Two series per category'),
      figure(3, 'Figure 2 — Three series per category'),
      figure(4, 'Figure 3 — Four series per category'),
    ),
  );
}
