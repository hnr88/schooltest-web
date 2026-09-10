import { act, type ReactElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, test, vi } from 'vitest';

import enMessages from '@/i18n/messages/en.json';
import { ReviewDrawer } from '@/modules/report/components/ReviewDrawer';

import type { ReviewItem } from '@/modules/teacher/schemas/teacher-review.schema';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

// scoring/11 — the review drawer's four MARKING-ASSIST VARIANTS, over
// constructed fixtures.
//
// This is the assertion the row exists to make, and it cannot be made live: the
// four outcomes depend on what a model happened to write about a particular
// student's extended response, so a live feed offers whichever variants its
// data contains and silently omits the rest. Constructed rows make all four
// observable, and make the SUPPRESSION rule falsifiable — that only `blank`
// and `language` withhold a suggestion, while `over_ceiling` and `offtopic`
// carry a note and still suggest. Getting that backwards either hides a
// suggestion the teacher should see or offers one where the design says no
// honest mark can be proposed, and nothing else in the tree would catch it.
//
// Only the data hook is mocked, at its own boundary; the drawer, its rows and
// the assist block are all real.

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children }: { href: string; children?: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/dashboard/teach',
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/modules/report/queries/use-result-review.query', () => ({
  useResultReviewQuery: vi.fn(),
}));

import { useResultReviewQuery } from '@/modules/report/queries/use-result-review.query';

const reviewMock = useResultReviewQuery as unknown as ReturnType<typeof vi.fn>;

const QUERY_OK = <T,>(data: T) => ({
  data,
  error: null,
  isError: false,
  isFetching: false,
  isPending: false,
  isLoading: false,
  refetch: vi.fn(),
});

const RUBRIC_BASE = {
  provider: 'writing_llm' as const,
  rubric_ref: 'RDG-EXT-1',
  rubric_version: 3,
  model: 'test-model',
  scored_at: '2026-09-10T00:00:00.000Z',
};

/** An extended-response row carrying whichever assist body the case needs. */
const extendedRow = (rubric: ReviewItem['rubric_score'], sequence = 1): ReviewItem => ({
  sequence_index: sequence,
  item_code: `EXT-${sequence}`,
  prompt: 'Explain what “holding its breath” means in this passage.',
  response_kind: 'text',
  task_type: 'extended',
  given: 'The town was afraid.',
  is_correct: null,
  latency_ms: 91_500,
  flags: null,
  area: 'Inference',
  correct_key: null,
      rubric_score: rubric,
});

const receptiveRow: ReviewItem = {
  sequence_index: 0,
  item_code: 'MC-1',
  prompt: 'Which word means the same as “quiet”?',
  response_kind: 'mc',
  task_type: 'mc_text',
  given: 'silent',
  is_correct: true,
  latency_ms: 4_200,
  flags: { timeout: false, tts_used: false, accommodation: null },
  area: 'Vocabulary',
  correct_key: { type: 'single' },
      rubric_score: null,
};

const review = (items: ReviewItem[]) => ({
  document_id: 'res-0000000000000000000001',
  status: 'complete',
  release_state: 'released',
  skill: 'receptive',
  cefr_band: 'A2',
  item_count: items.length,
  items,
});

let host: HTMLElement | null = null;
let root: Root | null = null;

afterEach(() => {
  if (root) act(() => root!.unmount());
  host?.remove();
  root = null;
  host = null;
  vi.clearAllMocks();
});

/** The sheet portals into document.body, so assertions read the body. */
function renderDrawer(element: ReactElement): HTMLElement {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => {
    root!.render(
      <NextIntlClientProvider locale="en" messages={enMessages} timeZone="Australia/Sydney">
        {element}
      </NextIntlClientProvider>,
    );
  });
  return document.body;
}

const open = () => <ReviewDrawer resultId="res-1" open onOpenChange={vi.fn()} />;

const COPY = enMessages.Report.review;

describe('the review drawer', () => {
  test('a receptive row renders given / correct / secs and NO assist block', () => {
    reviewMock.mockReturnValue(QUERY_OK(review([receptiveRow])));
    const body = renderDrawer(open());

    expect(body.querySelectorAll('[data-slot="review-question-row"]').length).toBe(1);
    // secs are DERIVED in the client from the served milliseconds.
    expect(body.textContent).toContain('4.2');
    expect(body.textContent).toContain('silent');
    // The served area label, rendered as given.
    expect(body.textContent).toContain('Vocabulary');
    // No rubric block on a receptive row — not an empty one, none at all.
    expect(body.querySelector('[data-slot="review-assist"]')).toBeNull();
    expect(body.querySelector('[data-slot="review-awaiting-mark"]')).toBeNull();
  });

  test('an unmarked extended row says it is awaiting a mark, and suggests nothing', () => {
    reviewMock.mockReturnValue(QUERY_OK(review([extendedRow(null)])));
    const body = renderDrawer(open());

    expect(body.querySelector('[data-slot="review-awaiting-mark"]')?.textContent).toBe(
      COPY.awaitingMark,
    );
    // The defect this guards: a fabricated suggestion on a row nobody marked.
    expect(body.querySelector('[data-slot="review-assist"]')).toBeNull();
    expect(body.querySelectorAll('[data-slot="review-question-row"]')[0]?.getAttribute(
      'data-correct',
    )).toBe('unmarked');
  });

  test.each([
    ['blank', true],
    ['language', true],
    ['over_ceiling', false],
    ['offtopic', false],
  ] as const)(
    'the %s variant declines=%s — only a decline withholds the suggestion',
    (kind, shouldDecline) => {
      const declining = kind === 'blank' || kind === 'language';
      reviewMock.mockReturnValue(
        QUERY_OK(
          review([
            extendedRow({
              ...RUBRIC_BASE,
              // A declining body carries NO bands and never zero-fills them;
              // a noting body is a scored body and does carry them.
              ...(declining
                ? {
                    decline_kind: kind,
                    decline_reason: `stored reason for ${kind}`,
                  }
                : { dimensions: { Inference: 2, Evidence: 1 } }),
            }),
          ]),
        ),
      );
      const body = renderDrawer(open());

      const assist = body.querySelector('[data-slot="review-assist"]');
      expect(assist, 'the assist block renders for every variant').not.toBeNull();
      expect(assist?.getAttribute('data-declined')).toBe(String(shouldDecline));

      const needsJudgement = body.querySelector('[data-slot="review-needs-judgement"]');
      const footer = body.querySelector('[data-slot="review-assist-footer"]');

      if (shouldDecline) {
        expect(needsJudgement?.textContent).toBe(COPY.needsJudgement);
        expect(footer?.textContent).toBe(COPY.noSuggestion);
        // The model's own sentence, verbatim — not an i18n key.
        expect(body.querySelector('[data-slot="review-decline-reason"]')?.textContent).toBe(
          `stored reason for ${kind}`,
        );
      } else {
        // A note still suggests: no judgement banner, and the invariant footer.
        expect(needsJudgement).toBeNull();
        expect(footer?.textContent).toBe(COPY.suggestionInvariant);
        expect(body.querySelector('[data-slot="review-criteria"]')).not.toBeNull();
      }
    },
  );

  test('the strip counts the SERVED judgements and shows the served band', () => {
    // Two correct out of three rows, band A2 — three numbers that cannot be
    // confused for one another if the wiring is right.
    const items = [
      receptiveRow,
      { ...receptiveRow, sequence_index: 2, item_code: 'MC-2' },
      { ...receptiveRow, sequence_index: 3, item_code: 'MC-3', is_correct: false },
    ];
    reviewMock.mockReturnValue(QUERY_OK(review(items)));
    const body = renderDrawer(open());

    expect(body.querySelector('[data-slot="review-strip"]')?.textContent).toContain('2/3');
    expect(body.querySelector('[data-slot="review-strip"]')?.textContent).toContain('A2');
    expect(body.querySelectorAll('[data-slot="review-question-row"]').length).toBe(3);
  });

  test('a sitting with no responses says so instead of rendering an empty list', () => {
    reviewMock.mockReturnValue(QUERY_OK(review([])));
    const body = renderDrawer(open());

    expect(body.querySelector('[data-slot="review-empty"]')?.textContent).toContain(
      COPY.emptyTitle,
    );
    expect(body.querySelector('[data-slot="review-questions"]')).toBeNull();
  });
});
