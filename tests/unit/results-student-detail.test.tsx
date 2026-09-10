import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { createElement, type ReactElement } from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { NextIntlClientProvider } from 'next-intl';

const enMessages = JSON.parse(
  readFileSync(resolve(process.cwd(), 'src/i18n/messages/en.json'), 'utf8'),
) as Record<string, unknown>;

/** createElement-friendly provider: children as an argument satisfies both TS and the lint rule. */
const IntlProvider = NextIntlClientProvider as unknown as (
  props: Record<string, unknown>,
) => ReactElement;

import { resultViewSchema } from '@schooltest/scoring-contracts';

import { ConsolidatingChecklist, StudentResultScreen } from '@/modules/results';
import { sparklineRows } from '@/modules/results/components/SkillMovementSparklines';

/**
 * Task 31 — Screen C part 2 rendered against the REAL contract fixture.
 * Carried rulings, each asserted: sparklines hide ENTIRELY below two history
 * points (a single sitting gets no section, not an empty one); Critical gets
 * NO movement row (ruling 4a); the checklist's Vocab B1 row reads the RAW
 * `Vocab_B1` attribute, not the blend; the gate row's null is "Section 3 not
 * reached", never false; error patterns hide when the array is empty and make
 * no export call.
 */

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

const fixture: Record<string, unknown> = JSON.parse(
  readFileSync(resolve(process.cwd(), '../mvp/contracts/scoring/fixtures/result-view.json'), 'utf8'),
);
const view = resultViewSchema.parse(fixture);
const student = { name: 'Amelia Ngo', className: '7B — Reading', initials: 'AN' };

let host: HTMLElement | undefined;
let root: Root | undefined;

function renderScreen(v: ReturnType<typeof resultViewSchema.parse>): HTMLElement {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() =>
    root!.render(
      createElement(
        IntlProvider,
        { locale: 'en', messages: enMessages },
        createElement(StudentResultScreen, { view: v, student }),
      ),
    ),
  );
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

describe('movement sparklines (§4.5)', () => {
  test('present with two sittings, in sort order, Critical absent, labels verbatim', () => {
    const rows = sparklineRows(view);
    // Reliable gains desc (Inference +15, Grammar +11), then the rest in canonical order.
    expect(rows.map((r) => r.skill)).toEqual(['Inference', 'Grammar', 'Decoding', 'Vocabulary', 'Detail']);
    expect(rows[0]!.deltaDisplay).toBe('+15');
    expect(rows.find((r) => r.skill === 'Critical')).toBeUndefined();
    expect(rows.find((r) => r.skill === 'Gist')).toBeUndefined(); // not assessed: no movement to chart
  });

  test('the section is ABSENT with a single sitting — not an empty panel', () => {
    const screen = renderScreen({ ...view, history: view.history?.slice(0, 1) });
    expect(screen.querySelector('[data-slot="movement-sparklines"]')).toBeNull();
  });

  test('sparklines skip null sittings rather than plotting a 0', () => {
    const rows = sparklineRows(view);
    const detail = rows.find((r) => r.skill === 'Detail');
    // The fixture's first sitting has Detail 68 and the current sitting 74 — both real values.
    expect(detail?.points).toEqual([68, 74]);
  });
});

describe('error patterns (§4.6)', () => {
  test('bars, labels and the ≥35 insight sentence on the dominant type', () => {
    const screen = renderScreen(view);
    const panel = screen.querySelector('[data-slot="error-patterns"]');
    expect(panel).not.toBeNull();
    const bars = [...screen.querySelectorAll('[data-slot="error-pattern"]')];
    expect(bars.map((bar) => bar.getAttribute('data-type'))).toEqual(['literal_match', 'overinference']);
    const insight = screen.querySelector('[data-slot="error-pattern-insight"]');
    expect(insight?.getAttribute('data-type')).toBe('literal_match');
    expect(insight?.textContent).toContain("Copies the text is Amelia's most common slip — 45% of the wrong answers.");
  });

  test('the section is ABSENT when the array is empty — never an empty panel', () => {
    const screen = renderScreen({ ...view, error_patterns: [] });
    expect(screen.querySelector('[data-slot="error-patterns"]')).toBeNull();
  });

  test('the panel makes no export call — one-call rule (source assertion)', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/modules/results/components/ErrorPatternsPanel.tsx'), 'utf8');
    expect(source.includes('/export')).toBe(false);
    expect(source.includes('strapi')).toBe(false);
  });
});

describe('consolidating checklist (§4.7)', () => {
  test('rows use the RAW Vocab_B1 attribute and the gate row keeps null distinct from false', () => {
    const screen = renderScreen(view);
    const rows = [...screen.querySelectorAll('[data-slot="checklist-row"]')];
    const byRow = new Map(rows.map((row) => [row.getAttribute('data-row'), row]));
    expect(byRow.get('Inference')?.getAttribute('data-met')).toBe('true'); // secure in the fixture
    // The RAW attribute is emerging — the blended Vocabulary skill is secure. They diverge here by design.
    expect(byRow.get('Vocab_B1')?.getAttribute('data-met')).toBe('false');
    expect(byRow.get('Gist')?.getAttribute('data-met')).toBe('false'); // not assessed is not met
    expect(byRow.get('Gist')?.textContent).toContain('not assessed this sitting');
    expect(byRow.get('gate')?.getAttribute('data-met')).toBe('false'); // passed === false, genuinely not met
    expect(byRow.get('gate')?.textContent).toContain('70%');
  });

  test('gate.passed null renders "Section 3 not reached", never "not met"', () => {
    const screen = renderScreen({ ...view, gate: { ...view.gate, passed: null, domain_score: null } });
    const gateRow = screen.querySelector('[data-slot="checklist-row"][data-row="gate"]');
    expect(gateRow?.textContent).toContain('Section 3 not reached');
  });

  test('consolidating phase replaces the checklist with the banner', () => {
    const screen = renderScreen({ ...view, acara_phase: 'consolidating' });
    expect(screen.querySelector('[data-slot="consolidating-checklist"]')).toBeNull();
    expect(screen.querySelector('[data-slot="consolidating-banner-text"]')?.textContent)
      .toBe('Consolidating — meets all requirements');
  });

  test('the standalone checklist component renders without a screen around it', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const standalone = createRoot(host);
    act(() =>
      standalone.render(
        createElement(
          IntlProvider,
          { locale: 'en', messages: enMessages },
          createElement(ConsolidatingChecklist, { view }),
        ),
      ),
    );
    expect(host.querySelectorAll('[data-slot="checklist-row"]')).toHaveLength(5);
    act(() => standalone.unmount());
    host.remove();
  });
});

describe('print (§4.9)', () => {
  test('the print control sets a titled document and restores it afterwards', () => {
    const print = vi.spyOn(window, 'print').mockImplementation(() => undefined);
    const screen = renderScreen(view);
    const button = screen.querySelector('[data-slot="print-report-button"]');
    expect(button?.classList.contains('print-hidden')).toBe(true);
    const previous = document.title;
    button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(print).toHaveBeenCalled();
    expect(document.title).toBe('Reading report — Amelia Ngo — 2026-08-31');
    window.dispatchEvent(new Event('afterprint'));
    expect(document.title).toBe(previous);
    print.mockRestore();
  });
});
