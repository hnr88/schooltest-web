import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { createElement, type ReactElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { diagnosticExportSchema } from '@schooltest/scoring-contracts';

import { AskAiPanel } from '@/modules/results';
import { StudentCommentary } from '@/modules/results';
import { fallbackParagraphs } from '@/modules/results/lib/commentary-fallback';
import { deidentify } from '@/modules/results/lib/deidentify';
import { askClaude, llmPayload } from '@/modules/results/lib/llm-client';
import { renderStudentMarkdown } from '@/modules/results/lib/llm-export';

const enMessages = JSON.parse(
  readFileSync(resolve(process.cwd(), 'src/i18n/messages/en.json'), 'utf8'),
) as Record<string, unknown>;

/** English translator over the real en catalogue (Results scope) — also proves every key the fallback uses exists. */
function tEn(key: string, values?: Record<string, string | number>): string {
  const results = enMessages.Results as Record<string, unknown>;
  const found: unknown = key.split('.').reduce<unknown>(
    (node, part) => (node !== null && typeof node === 'object' ? (node as Record<string, unknown>)[part] : undefined),
    results,
  );
  if (typeof found !== 'string') throw new Error(`missing en message: Results.${key}`);
  let out = found;
  for (const [name, value] of Object.entries(values ?? {})) {
    out = out.replaceAll(`{${name}}`, String(value));
  }
  return out;
}

/** createElement-friendly alias: the provider's TS type demands children in props, the lint rule forbids it. */
const IntlProvider = NextIntlClientProvider as unknown as (props: Record<string, unknown>) => ReactElement;

/**
 * Task 32 — Screen C part 3, the privacy-critical surface. THE test is the
 * one that catches the D5 violation: both LLM features send the EXPORT BUNDLE
 * plus the prompt and NEVER ResultView fields, so the serialised request
 * carries no `prob`, no `theta` and no student name. Assertions run on
 * JSON.stringify(payload) — the bytes that would leave the browser — not on
 * the object we believe we passed.
 */

vi.mock('@/lib/axios/strapi', () => ({
  strapi: { post: vi.fn() },
}));

import { strapi } from '@/lib/axios/strapi';

const post = vi.mocked(strapi.post);

const bundle = diagnosticExportSchema.parse(
  JSON.parse(
    readFileSync(resolve(process.cwd(), '../mvp/contracts/scoring/fixtures/diagnostic-export.json'), 'utf8'),
  ),
);

beforeEach(() => {
  post.mockReset();
});

describe('the LLM payload — D5 leak guard (asserted on the serialised request)', () => {
  test('commentary payload: bundle + prompt only; no prob, no theta, no name', () => {
    const payload = llmPayload(bundle);
    const serialised = JSON.stringify(payload);
    expect(serialised).not.toMatch(/"prob"/);
    expect(serialised).not.toMatch(/theta/i);
    expect(serialised.toLowerCase()).not.toContain('amelia');
    expect(Object.keys(payload)).toEqual(['prompt', 'context']);
    expect(payload.context.skills.Critical).toMatchObject({ domain_score: 70 });
  });

  test('ask payload: exactly prompt + context + the question; still clean', () => {
    const payload = llmPayload(bundle, 'Which skills improved?');
    const serialised = JSON.stringify(payload);
    expect(Object.keys(payload)).toEqual(['prompt', 'context', 'question']);
    expect(serialised).not.toMatch(/"prob"/);
    expect(serialised).not.toMatch(/theta/i);
    expect(serialised.toLowerCase()).not.toContain('amelia');
    expect(payload.question).toBe('Which skills improved?');
  });

  test('the prompt itself carries the honesty guardrails', () => {
    const { prompt } = llmPayload(bundle);
    expect(prompt).toContain('DO NOT CLAIM GROWTH');
    expect(prompt).toContain('never with band words');
    expect(prompt).toContain('never recompute or estimate a delta');
  });

  test('the ResultView would LEAK — proving the bundle is the only safe context', () => {
    // The view the same sitting produces carries prob/prob_se. This documents
    // WHY D5 exists rather than asserting product behaviour.
    const view = JSON.parse(
      readFileSync(resolve(process.cwd(), '../mvp/contracts/scoring/fixtures/result-view.json'), 'utf8'),
    ) as { attributes: Record<string, { prob: number }> };
    expect(JSON.stringify(view)).toMatch(/"prob"/);
  });

  test('askClaude posts the payload to the marked endpoint and returns the text', async () => {
    post.mockResolvedValueOnce({ data: 'Three paragraphs about the sitting.' } as never);
    const answer = await askClaude(llmPayload(bundle));
    expect(answer).toBe('Three paragraphs about the sitting.');
    expect(post).toHaveBeenCalledWith('/api/ai/result-commentary', llmPayload(bundle), { responseType: 'text' });
  });
});

describe('the gated-fields fallback (LLM unavailable)', () => {
  test('three paragraphs, generated from the same gated fields', () => {
    const paragraphs = fallbackParagraphs(bundle, tEn);
    expect(paragraphs).toHaveLength(3);
    expect(paragraphs[0]).toContain('Overall reading stands at 74%');
    expect(paragraphs[0]).toContain('+15 points'); // delta_display verbatim — raw delta 13 is NOT recomputed
    expect(paragraphs[1]).toContain('Strongest skill: Decoding (92%)');
    expect(paragraphs[1]).toContain('Greatest need: Grammar (72%)'); // Critical excluded from the comparison (ruling 4a)
    expect(paragraphs[1]).toContain('Critical Reading scored 70% with the exit gate not yet met — a gate result, not a band');
    expect(paragraphs[1]).toContain('Copies the text (45% of wrong answers)');
    expect(paragraphs[2]).toContain('blends the two strands at 76% (A2 90%, B1 54%)');
  });

  test('DONE-WHEN: a steady fixture produces fallback copy that claims NO growth', () => {
    const steady = { ...bundle, overall: { ...bundle.overall, delta_display: 'steady' as const } };
    const [first] = fallbackParagraphs(steady, tEn);
    expect(first).toContain('steady against the previous official sitting');
    expect(first).not.toMatch(/\+\d+ points|rose|increased|improved/);
  });

  test('band movement is described as a band move, never a fabricated point figure', () => {
    const moved = { ...bundle, overall: { ...bundle.overall, delta_display: 'band_movement' as const } };
    const [first] = fallbackParagraphs(moved, tEn);
    expect(first).toContain('moved between bands');
    expect(first).not.toMatch(/\d+ points/);
  });
});

describe('deidentify — the copy-button guard', () => {
  test('replaces the full name and the bare first name', () => {
    const text = 'Amelia Ngo reads well. Amelia should keep practising inference.';
    expect(deidentify(text, 'Amelia Ngo')).toBe('The student reads well. The student should keep practising inference.');
  });

  test('a name that never appears leaves the text untouched', () => {
    expect(deidentify('Steady across strands.', 'Amelia Ngo')).toBe('Steady across strands.');
  });
});

describe('the LLM markdown download (§4.9)', () => {
  test('contains overall, seven skills and delta_display — and no name, prob or theta', () => {
    const markdown = renderStudentMarkdown(bundle);
    expect(markdown).toContain('## Overall');
    expect(markdown).toContain('74% — change: +15 pts');
    expect(markdown.match(/^## Skills$/m) !== null).toBe(true);
    expect(markdown).toContain('- Decoding: 92% (secure) — change: band movement');
    expect(markdown.toLowerCase()).not.toContain('amelia');
    expect(markdown).not.toMatch(/prob|theta/i);
    expect(markdown).toContain('steady (no change claimed)'); // Vocabulary's gated change, rendered verbatim
  });
});

describe('the components', () => {
  function render(node: ReactElement): { host: HTMLElement; unmount: () => void } {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    act(() => { root.render(node); });
    return { host, unmount: () => act(() => root.unmount()) };
  }

  test('StudentCommentary renders the gated-fields fallback; the copy button is print-hidden and de-identifies', async () => {
    const writeText = vi.fn<(text: string) => Promise<void>>().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    const { host, unmount } = render(
      createElement(
        IntlProvider,
        { locale: 'en', messages: enMessages },
        createElement(StudentCommentary, {
          paragraphs: fallbackParagraphs(bundle, tEn),
          studentName: 'Amelia Ngo',
          source: 'fallback',
        }),
      ),
    );
    expect(host.querySelectorAll('[data-slot="commentary-paragraph"]')).toHaveLength(3);
    expect(host.querySelector('[data-slot="student-commentary"]')?.getAttribute('data-source')).toBe('fallback');
    const button = host.querySelector('[data-slot="commentary-copy"]');
    expect(button?.classList.contains('print-hidden')).toBe(true);
    await act(async () => {
      button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    const copied = writeText.mock.calls[0]?.[0] ?? '';
    expect(copied).toContain('Overall reading stands at 74%');
    expect(copied.toLowerCase()).not.toContain('amelia');
    expect(host.querySelector('[data-slot="commentary-copy"]')?.textContent).toBe('Copied');
    unmount();
  });

  test('AskAiPanel: chips fill the input, submit hands the question to the parent, download renders from the bundle', async () => {
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    const onAsk = vi.fn();
    const { host, unmount } = render(
      createElement(
        IntlProvider,
        { locale: 'en', messages: enMessages },
        createElement(AskAiPanel, { bundle, answer: null, pending: false, onAsk }),
      ),
    );
    const chip = host.querySelector('[data-slot="ask-ai-chip"]');
    act(() => chip?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect((host.querySelector('[data-slot="ask-ai-input"]') as HTMLInputElement).value)
      .toBe('Which skills improved since the last test?');
    const input = host.querySelector('[data-slot="ask-ai-input"]') as HTMLInputElement;
    const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
    act(() => {
      setValue.call(input, '  Why is Grammar at 72%?  ');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    act(() => {
      (host.querySelector('form')!).dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    expect(onAsk).toHaveBeenCalledWith('Why is Grammar at 72%?');
    host.querySelector('[data-slot="llm-export-download"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    // jsdom's Blob lacks .text(); the markdown CONTENT is asserted in the renderStudentMarkdown
    // test above — here we assert the download is a markdown Blob created and revoked for the anchor.
    const blob = createObjectURL.mock.calls[0]?.[0] as Blob;
    expect(blob).toBeInstanceOf(Blob);
    expect(anchorClick).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock');
    unmount();
    createObjectURL.mockRestore();
    revokeObjectURL.mockRestore();
    anchorClick.mockRestore();
  });
});
