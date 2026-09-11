import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { createElement, type ReactElement } from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import { NextIntlClientProvider } from 'next-intl';

const enMessages = JSON.parse(
  readFileSync(resolve(process.cwd(), 'src/i18n/messages/en.json'), 'utf8'),
) as Record<string, unknown>;

/** createElement-friendly provider: children as an argument satisfies both TS and the lint rule. */
const IntlProvider = NextIntlClientProvider as unknown as (
  props: Record<string, unknown>,
) => ReactElement;

import { resultViewSchema } from '@schooltest/scoring-contracts';

import { StudentResultScreen } from '@/modules/results';
import { DISPLAY_SKILL_ORDER } from '@/modules/results';

/**
 * Task 30 — Screen C part 1 rendered against the REAL contract fixture
 * (mvp/contracts/scoring/fixtures/result-view.json — the ResultView-shaped
 * payload; the golden/ directory is score-resp/1 R output, not Views).
 *
 * The assertions are the HONESTY GUARDRAILS (data contract §8), because those
 * are the point of this screen: a not-assessed skill is a visible GAP (never
 * 0), the Critical card shows a GATE STATE rather than a synthesised band,
 * growth renders delta_display verbatim, and no audit field (prob/theta)
 * reaches the DOM.
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

describe('Screen C part 1 — header, confidence, trend, seven cards', () => {
  test('header renders the overall domain score, verbatim growth, ACARA badge and gate badge', () => {
    const screen = renderScreen(view);
    expect(screen.querySelector('[data-slot="overall-score"]')?.textContent).toBe('74%');
    const pill = screen.querySelector('[data-slot="growth-pill"]');
    expect(pill?.textContent).toContain('+15 pts');
    expect(screen.querySelector('[data-slot="acara-badge"]')?.textContent).toBe('ACARA: developing');
    expect(screen.querySelector('[data-slot="gate-badge"]')?.textContent).toBe('Exit gate: not yet');
  });

  test('the confidence strip uses the §4.2 copy with the session fields', () => {
    const screen = renderScreen(view);
    const strip = screen.querySelector('[data-slot="confidence-strip"]');
    expect(strip?.getAttribute('data-variant')).toBe('normal');
    expect(strip?.textContent).toContain('Effort valid · Normal confidence · 72 of 78 items answered · 43 min');
  });

  test('low_confidence true AND low_confidence null BOTH warn — null means cannot compute, not fine', () => {
    const warned = renderScreen({ ...view, low_confidence: true });
    expect(warned.querySelector('[data-slot="confidence-strip"]')?.getAttribute('data-variant')).toBe('warning');
    const unknown = renderScreen({ ...view, low_confidence: null, effort_valid: null });
    const strip = unknown.querySelector('[data-slot="confidence-strip"]');
    expect(strip?.getAttribute('data-variant')).toBe('warning');
    expect(strip?.getAttribute('data-low-confidence')).toBe('unknown');
    expect(strip?.getAttribute('data-effort-valid')).toBe('unknown');
  });

  test('the trend renders the real history points and the §4.3 summary strip', () => {
    const screen = renderScreen(view);
    expect(screen.querySelectorAll('[data-slot="trend-chart"] circle')).toHaveLength(2);
    const summary = screen.querySelector('[data-slot="trend-summary"]')?.textContent ?? '';
    expect(summary).toContain('2 sittings since February 2026');
    expect(summary).toContain('+15 pts (reliable)');
    expect(summary).toContain('Best gain: Inference +15 pts');
  });

  test('a single sitting is one dot plus the first-sitting caption, never a fabricated line', () => {
    const screen = renderScreen({ ...view, history: view.history?.slice(0, 1) });
    expect(screen.querySelector('[data-slot="trend-first-sitting"]')?.textContent)
      .toBe('First sitting — trend appears from the second test');
    expect(screen.querySelector('[data-slot="trend-chart"]')).toBeNull();
  });

  test('seven cards render in the canonical order', () => {
    const screen = renderScreen(view);
    const cards = [...screen.querySelectorAll('[data-slot="skill-card"]')];
    expect(cards.map((card) => card.getAttribute('data-skill'))).toEqual([...DISPLAY_SKILL_ORDER]);
  });

  test('GUARDRAIL: a not-assessed skill is a visible gap — no score, no bar, never 0', () => {
    const screen = renderScreen(view);
    const gist = screen.querySelector('[data-slot="skill-card"][data-skill="Gist"]');
    expect(gist?.getAttribute('data-assessed')).toBe('false');
    expect(gist?.textContent).toContain('Not yet assessed');
    expect(gist?.querySelector('[data-slot="skill-score"]')).toBeNull();
    expect(gist?.querySelector('[data-slot="skill-bar"]')).toBeNull();
    expect(gist?.textContent?.includes('%')).toBe(false);
    // The gap card carries no band chip either — absence is not a band.
    expect(gist?.getAttribute('data-band')).toBeNull();
  });

  test('GUARDRAIL: the Critical card shows a GATE STATE, never a synthesised band', () => {
    const screen = renderScreen(view);
    const critical = screen.querySelector('[data-slot="skill-card"][data-skill="Critical"]');
    expect(critical?.getAttribute('data-band')).toBeNull();
    const state = critical?.querySelector('[data-slot="gate-state"]');
    expect(state?.getAttribute('data-gate')).toBe('not_yet');
    expect(state?.textContent).toBe('Exit gate: not yet');
  });

  test('Section 3 not reached: header badge hidden and the critical card says so', () => {
    const notReached = renderScreen({ ...view, gate: { ...view.gate, passed: null, domain_score: null } });
    expect(notReached.querySelector('[data-slot="gate-badge"]')).toBeNull();
    const state = notReached.querySelector('[data-slot="gate-state"]');
    expect(state?.getAttribute('data-gate')).toBe('not_reached');
    expect(state?.textContent).toBe('Section 3 not reached');
  });

  test('band chips carry data-band in the four-band vocabulary; growth renders verbatim', () => {
    const screen = renderScreen(view);
    expect(screen.querySelector('[data-slot="skill-card"][data-skill="Decoding"]')?.getAttribute('data-band')).toBe('secure');
    expect(screen.querySelector('[data-slot="skill-card"][data-skill="Detail"]')?.getAttribute('data-band')).toBe('developing');
    expect(screen.querySelector('[data-slot="skill-card"][data-skill="Vocab_B1"]')).toBeNull();
    const inferenceDelta = screen.querySelector('[data-slot="skill-card"][data-skill="Inference"] [data-slot="skill-delta"]');
    expect(inferenceDelta?.textContent).toContain('+15 pts');
    const vocabDelta = screen.querySelector('[data-slot="skill-card"][data-skill="Vocabulary"] [data-slot="skill-delta"]');
    expect(vocabDelta?.getAttribute('data-delta')).toBe('steady');
  });

  test('band movement renders as "{band_before} → {band_after}" on the card that carries it', () => {
    const screen = renderScreen(view);
    const decodingDelta = screen.querySelector('[data-slot="skill-card"][data-skill="Decoding"] [data-slot="skill-delta"]');
    expect(decodingDelta?.getAttribute('data-delta')).toBe('band_movement');
    expect(decodingDelta?.textContent).toBe('Developing → Secure');
  });

  test('vocab strand lines: both strands normally, the honest gap when single-strand', () => {
    const screen = renderScreen(view);
    expect(screen.querySelector('[data-slot="vocab-strand-line"]')?.textContent).toBe('A2 90% · B1 54%');
    const single = renderScreen({
      ...view,
      vocab: { ...view.vocab, single_strand: 'a2' },
    });
    expect(single.querySelector('[data-slot="vocab-strand-line"]')?.textContent).toBe('A2 90% · B1 not assessed this sitting');
  });

  test('strength/focus tags appear with ≥4 assessed and never sit on the gate card', () => {
    const screen = renderScreen(view);
    expect(screen.querySelector('[data-slot="skill-card"][data-skill="Decoding"]')?.getAttribute('data-tag')).toBe('strength');
    expect(screen.querySelector('[data-slot="skill-card"][data-skill="Grammar"]')?.getAttribute('data-tag')).toBe('focus');
    expect(screen.querySelector('[data-slot="skill-card"][data-skill="Critical"]')?.getAttribute('data-tag')).toBeNull();
  });

  test('scoring failed renders the failure panel and NO score cards', () => {
    const failed = renderScreen({ ...view, status: 'scoring_failed' });
    expect(failed.querySelector('[data-slot="result-screen"]')?.getAttribute('data-state')).toBe('scoring_failed');
    expect(failed.querySelector('[data-slot="scoring-failed"]')?.textContent).toContain('Scoring failed');
    expect(failed.querySelector('[data-slot="skill-card-grid"]')).toBeNull();
  });

  test('GUARDRAIL: no audit field name reaches the DOM (prob, prob_se, theta)', () => {
    const screen = renderScreen(view);
    expect(/prob|theta/i.test(screen.textContent ?? '')).toBe(false);
  });
});
