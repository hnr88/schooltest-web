import { act, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, test, vi } from 'vitest';

import enMessages from '@/i18n/messages/en.json';
import { StudentDrillDownBody } from '@/modules/teacher/components/StudentDrillDownBody';
import { t2ResultAmara, t2ResultDilnoza } from '@/modules/teacher/lib/v2/__fixtures__/t2';
import { studentDetail } from '@/modules/teacher/lib/v2/student-detail';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

// The Reading body over the recorded t2 results (GET /api/results/:id, 2026-09-10/11),
// through `studentDetail()` exactly as the page builds it.
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

const texts = (scope: ParentNode, selector: string) =>
  [...scope.querySelectorAll(selector)].map((element) => element.textContent);

describe('student page body — recorded Dilnoza (reliable fall, 8 sittings)', () => {
  const view = studentDetail(t2ResultDilnoza);

  test('progress: ACARA phase chip, one chart point per scored sitting and the four tiles', () => {
    const page = render(<StudentDrillDownBody view={view} firstName="Dilnoza" onCopy={vi.fn()} />);
    const panel = page.querySelector('[data-slot="student-progress"]');
    expect(panel?.querySelector('h2')?.textContent).toBe('Reading progress over time');
    expect(texts(page, '[data-slot="student-progress"] > div:first-child [data-slot="status-pill"]')).toEqual([
      'ACARA: Beginning phase',
    ]);
    expect(page.querySelectorAll('[data-slot="student-chart-point"]')).toHaveLength(view.chart.points.length);
    expect(texts(page, '[data-tile] dt')).toEqual(['Baseline (Sep)', 'Latest (Sep)', 'Growth', 'Sittings']);
    expect(texts(page, '[data-tile] dd')).toEqual(['76%', '41%', '−45 pts', '8 since Sep']);
    const growth = page.querySelector<HTMLElement>('[data-tile="growth"] dd');
    expect(growth?.style.color).toBe('rgb(180, 35, 24)');
  });

  test('seven subskill cards carry the server movement, tags, bands and strands', () => {
    const page = render(<StudentDrillDownBody view={view} firstName="Dilnoza" onCopy={vi.fn()} />);
    const card = (skill: string) => `[data-slot="student-subskill"][data-skill="${skill}"]`;
    expect(page.querySelectorAll('[data-slot="student-subskill"]')).toHaveLength(7);
    expect(texts(page, `${card('Decoding')} h3`)).toEqual(['Decoding']);
    expect(texts(page, `${card('Decoding')} [data-slot="status-pill"]`)).toEqual(['Focus area', 'Not yet']);
    expect(texts(page, `${card('Decoding')} [data-slot="student-subskill-delta"]`)).toEqual(['Secure → Not yet']);
    expect(texts(page, `${card('Decoding')} [data-slot="student-subskill-score"]`)).toEqual(['25%']);
    expect(texts(page, `${card('Inference')} [data-slot="status-pill"]`)).toContain('Strength');
    expect(texts(page, `${card('Vocabulary')} [data-slot="student-subskill-delta"]`)).toEqual(['↓ −65']);
    expect(texts(page, `${card('Vocabulary')} [data-slot="student-subskill-strands"]`)).toEqual(['A2 25% · B1 25%']);
    expect(page.querySelector(`${card('Critical')} [data-slot="student-subskill-delta"]`)).toBeNull();
  });

  test('the analysis card: three paragraphs from the result, and Copy hands over the plain text', () => {
    const onCopy = vi.fn();
    const page = render(<StudentDrillDownBody view={view} firstName="Dilnoza" onCopy={onCopy} />);
    const paragraphs = texts(page, '[data-slot="student-analysis"] p');
    expect(paragraphs).toHaveLength(3);
    expect(paragraphs[0]).toMatch(/^Dilnoza’s overall reading score is 41%, placing them in the Beginning phase/);
    expect(paragraphs[2]).toBe('Everyday vocabulary is at A2 25% and academic vocabulary at B1 25%.');
    act(() => page.querySelector<HTMLButtonElement>('[data-slot="student-analysis"] button')?.click());
    expect(onCopy).toHaveBeenCalledWith(paragraphs.join('\n\n'));
  });
});

describe('student page body — recorded Amara (server "steady")', () => {
  test('steady is the server word in grey, never a number', () => {
    const page = render(<StudentDrillDownBody view={studentDetail(t2ResultAmara)} firstName="Amara" onCopy={vi.fn()} />);
    const growth = page.querySelector<HTMLElement>('[data-tile="growth"] dd');
    expect(growth?.textContent).toBe('steady');
    expect(growth?.style.color).toBe('rgb(156, 163, 175)');
    expect(page.querySelector('[data-slot="student-analysis"] p')?.textContent).toContain('held steady');
  });
});
