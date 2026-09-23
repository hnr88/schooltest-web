import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, expect, test } from 'vitest';

import enMessages from '@/i18n/messages/en.json';
import { StudentTestCard } from '@/modules/classes/components/StudentTestCard';
import { studentTestResultSchema } from '@/modules/classes/schemas/class-detail.schema';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
});

// BUG-008 follow-up: a sitting that reached only the Everyday strand. The C-CLS-06
// contract now carries two vocabulary tiles and a null for a tile with no evidence.
const onlyEveryday = studentTestResultSchema.parse({
  test_id: 'A',
  status: 'completed',
  overall_score: 55,
  acara_phase: 'Emerging',
  subskills: {
    decoding: 'mastered',
    vocab_a2: 'mastered',
    grammar: 'not_yet',
    vocab_b1: null,
    gist: null,
    detail: null,
    inference: null,
    critical: null,
  },
  started_at: null,
  completed_at: null,
});

test('Everyday and Classroom Vocabulary are two tiles; a tile with no evidence shows the em dash, not "Not yet"', () => {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => {
    root?.render(
      <NextIntlClientProvider locale="en" messages={enMessages} timeZone="UTC">
        <StudentTestCard test={onlyEveryday} />
      </NextIntlClientProvider>,
    );
  });
  const tiles = [...host.querySelectorAll('[data-slot="tint-tile"]')].map((tile) => tile.textContent);
  expect(tiles).toEqual([
    'DecodingMastered',
    'Everyday VocabularyMastered',
    'GrammarNot yet',
    'Classroom Vocabulary—',
    'Gist—',
    'Detail—',
    'Inference—',
    'Critical—',
  ]);
  expect(host.textContent).not.toMatch(/(^|[^ ])Vocabulary(Mastered|Not yet)/);
});

test('the contract refuses the retired single `vocabulary` tile', () => {
  const { subskills } = onlyEveryday;
  expect(studentTestResultSchema.safeParse({ ...onlyEveryday, subskills: { ...subskills, vocabulary: 'mastered' } }).success).toBe(false);
});
