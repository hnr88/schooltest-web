import { describe, expect, test } from 'vitest';

import { diagnosticExportSchema } from '@schooltest/scoring-contracts';

import { fallbackParagraphs } from '@/modules/results/lib/commentary-fallback';
import { renderStudentMarkdown } from '@/modules/results/lib/llm-export';

import enMessages from '@/i18n/messages/en.json';

// BUG-008 follow-up — the two vocabulary strands leave the web by their register
// names (Everyday / Classroom Vocabulary), never as the internal Vocab_A2 / Vocab_B1
// keys or an "A2 strand / B1 strand" CEFR code, and no copy names a weaker strand
// when neither was assessed. The bundle is parsed by the shared export contract.
const bundle = (a2: number | null, b1: number | null) =>
  diagnosticExportSchema.parse({
    model_version: 'reading-3model/1',
    student: { year_group: 8, first_language: 'Mandarin', l1_literate: true },
    sitting: { date: '2026-09-11', number: 1, weeks_since_previous: null },
    overall: { domain_score: 42, delta_display: null },
    acara_phase: null,
    readiness: null,
    skills: {
      Decoding: { domain_score: 60, status: 'developing', delta_display: null },
      Vocab_A2: a2 === null ? { status: 'not_assessed', items_seen: 0 } : { domain_score: a2, status: 'secure', delta_display: null },
      Grammar: { domain_score: 40, status: 'emerging', delta_display: null },
      Vocab_B1: b1 === null ? { status: 'not_assessed', items_seen: 0 } : { domain_score: b1, status: 'not_yet', delta_display: null },
      Gist: { status: 'not_assessed', items_seen: 0 },
      Detail: { status: 'not_assessed', items_seen: 0 },
      Inference: { status: 'not_assessed', items_seen: 0 },
      Critical: { status: 'not_assessed', items_seen: 0 },
    },
    vocab: { a2: { domain_score: a2 }, b1: { domain_score: b1 } },
    gate: { passed: null, domain_score: null },
    error_patterns: [],
    history: [],
    caveats: ['A single sitting.'],
  });

const t = (key: string, values?: Record<string, string | number>): string => {
  const template = (enMessages.Results as Record<string, unknown>)[key];
  if (typeof template !== 'string') throw new Error(`missing Results.${key}`);
  return template.replace(/\{(\w+)\}/g, (_, name: string) => String(values?.[name] ?? `{${name}}`));
};

describe('renderStudentMarkdown — vocabulary strands by name', () => {
  test('skills and the vocabulary block say Everyday / Classroom Vocabulary, never the internal keys or CEFR strands', () => {
    const markdown = renderStudentMarkdown(bundle(80, null));
    expect(markdown).toContain('- Everyday Vocabulary: 80% (secure)');
    expect(markdown).toContain('- Classroom Vocabulary: not assessed this sitting');
    expect(markdown).toContain('- Everyday Vocabulary: 80%\n- Classroom Vocabulary: not assessed');
    expect(markdown).not.toMatch(/Vocab_A2|Vocab_B1|A2 strand|B1 strand/);
    expect(markdown).toContain('- Grammar: 40% (emerging)');
  });
});

describe('fallbackParagraphs — the vocabulary paragraph is truthful', () => {
  test('neither strand assessed: no vocabulary paragraph, so no "weaker of the two"', () => {
    const paragraphs = fallbackParagraphs(bundle(null, null), t);
    expect(paragraphs).toHaveLength(2);
    expect(paragraphs.join(' ')).not.toMatch(/Vocabulary|weaker/);
  });

  test('one strand: that strand only; both strands: both scores', () => {
    expect(fallbackParagraphs(bundle(80, null), t).at(-1)).toBe(t('fallbackVocabA2Only', { a2: '80%' }));
    expect(fallbackParagraphs(bundle(null, 30), t).at(-1)).toBe(t('fallbackVocabB1Only', { b1: '30%' }));
    expect(fallbackParagraphs(bundle(80, 30), t).at(-1)).toBe(t('fallbackVocabBlend', { a2: '80%', b1: '30%' }));
  });
});
