import type { ReactNode } from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';

import enMessages from '@/i18n/messages/en.json';
import { strapi } from '@/lib/axios/strapi';
import { showOpsToast } from '@/modules/ops/actions';
import { ReviewDrawer } from '@/modules/report/components/ReviewDrawer';

import reading from './fixtures/result-review-reading.live.json';
import { fill, press, renderDrawer, settle, typeInto, unmountDrawer } from './review-drawer.harness';

// Teacher Portal v2 S31 — the review drawer over t2's REAL reading review,
// recorded from the live API with the live roster row's name, class and phase
// as header context (see the fixture's `source`). The drawer, its rows, its
// query, its mutation and the strict schema are all real; only the HTTP client
// is replaced at its boundary, so the PUT body the drawer sends can be read.

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children }: { href: string; children?: ReactNode }) => <a href={href}>{children}</a>,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/dashboard/reports',
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/lib/axios/strapi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/axios/strapi')>()),
  strapi: { get: vi.fn(), put: vi.fn() },
}));

vi.mock('@/modules/ops/actions', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/modules/ops/actions')>()),
  showOpsToast: vi.fn(),
}));

const getMock = vi.mocked(strapi.get);
const putMock = vi.mocked(strapi.put);
const toastMock = vi.mocked(showOpsToast);
const COPY = enMessages.TeacherPortal.review;
const READING = enMessages.Report.skills.reading;
const ctx = reading.context;

afterEach(() => {
  unmountDrawer();
  vi.clearAllMocks();
});

const openReading = (onOpenChange = vi.fn()) => (
  <ReviewDrawer
    resultDocumentId={reading.review.document_id}
    open
    onOpenChange={onOpenChange}
    studentName={ctx.studentName}
    testLabel={READING}
    className={ctx.className}
    phase={ctx.phase}
  />
);

describe('the review drawer over the live reading review', () => {
  test('the header names the student, the test and the class, and tallies the served judgements', async () => {
    getMock.mockResolvedValue({ data: reading.review });
    const body = renderDrawer(openReading());
    await settle();

    expect(getMock).toHaveBeenCalledWith(`/api/results/${reading.review.document_id}/review`);
    const items = reading.review.items;
    const correct = items.filter((item) => item.is_correct === true).length;
    const header = body.querySelector('[data-slot="review-header"]');
    expect(header?.querySelector('[data-slot="sheet-title"]')?.textContent).toBe(ctx.studentName);
    expect(header?.textContent).toContain(`${READING} · ${ctx.className}`);
    const strip = body.querySelector('[data-slot="review-strip"]')?.textContent ?? '';
    expect(strip).toContain(fill(COPY.scoreChip, { correct, total: items.length }));
    expect(strip).toContain(`${Math.round((correct / items.length) * 100)}%`);
    expect(strip).toContain(COPY.phase[ctx.phase as keyof typeof COPY.phase]);
    expect(body.querySelector('[data-slot="review-note-summary"]')?.textContent).toBe('No comments yet');
  });

  test('every served row renders what they answered, and the key only when the judgement is wrong', async () => {
    getMock.mockResolvedValue({ data: reading.review });
    const body = renderDrawer(openReading());
    await settle();

    const items = reading.review.items;
    const rows = body.querySelectorAll('[data-slot="review-question-row"]');
    expect(rows).toHaveLength(items.length);
    const wrong = items.findIndex((item) => item.is_correct === false);
    const row = rows[wrong];
    expect(row.textContent).toContain(fill(COPY.questionNumber, { n: wrong + 1 }));
    expect(row.textContent).toContain(items[wrong].prompt);
    expect(row.querySelector('[data-slot="review-question-mark"]')?.textContent).toBe(COPY.incorrect);
    expect(row.querySelector('[data-slot="review-given"]')?.textContent).toBe(
      fill(COPY.option, { id: items[wrong].given.option_id.toUpperCase() }),
    );
    expect(row.querySelector('[data-slot="review-key"]')?.textContent).toBe(
      fill(COPY.option, { id: items[wrong].correct_key.answer.toUpperCase() }),
    );
    expect(row.textContent).toContain(
      fill(COPY.timeOnQuestion, { secs: Math.round(items[wrong].latency_ms / 1000) }),
    );
    const right = items.findIndex((item) => item.is_correct === true);
    expect(rows[right].querySelector('[data-slot="review-question-mark"]')?.textContent).toBe(COPY.correct);
    expect(rows[right].querySelector('[data-slot="review-key"]')).toBeNull();
    // A reading sitting carries no rubric-marked response, so no extended card.
    expect(body.querySelector('[data-slot="review-assist"]')).toBeNull();
  });

  test('"Save comments" sends ONE PUT — the comment and the changed note, the row re-sending its mark — then closes', async () => {
    getMock.mockResolvedValue({ data: reading.review });
    putMock.mockResolvedValue({ data: reading.review });
    const onOpenChange = vi.fn();
    const body = renderDrawer(openReading(onOpenChange));
    await settle();

    const overall = 'Keeps going when a passage gets long.';
    const note = 'Re-read the spelling rule before choosing.';
    typeInto(body.querySelector<HTMLTextAreaElement>('[data-slot="review-comment"]'), overall);
    typeInto(body.querySelector<HTMLTextAreaElement>('[data-slot="review-question-row"] textarea'), note);
    expect(body.querySelector('[data-slot="review-note-summary"]')?.textContent).toBe('2 comments written');

    press(body.querySelector('[data-slot="review-save"]'));
    await settle();

    const first = reading.review.items[0];
    expect(putMock).toHaveBeenCalledTimes(1);
    expect(putMock).toHaveBeenCalledWith(`/api/results/${reading.review.document_id}/review`, {
      responses: [
        {
          response_document_id: first.response_document_id,
          teacher_mark: first.teacher_mark,
          teacher_mark_source: first.teacher_mark_source,
          teacher_note: note,
        },
      ],
      comment: overall,
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(toastMock).toHaveBeenCalledWith({
      tone: 'ok',
      message: `Saved 2 comments on ${ctx.studentName}’s ${READING} submission`,
    });
  });

  test('saving with nothing written sends nothing and reports the review', async () => {
    getMock.mockResolvedValue({ data: reading.review });
    const onOpenChange = vi.fn();
    const body = renderDrawer(openReading(onOpenChange));
    await settle();

    press(body.querySelector('[data-slot="review-save"]'));
    await settle();

    expect(putMock).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(toastMock).toHaveBeenCalledWith({
      tone: 'ok',
      message: `Reviewed ${ctx.studentName}’s ${READING} submission`,
    });
  });

  test('a refused save keeps the drawer open and says it was not saved', async () => {
    getMock.mockResolvedValue({ data: reading.review });
    putMock.mockRejectedValue(new Error('Network Error'));
    const onOpenChange = vi.fn();
    const body = renderDrawer(openReading(onOpenChange));
    await settle();

    typeInto(body.querySelector<HTMLTextAreaElement>('[data-slot="review-comment"]'), 'A comment.');
    press(body.querySelector('[data-slot="review-save"]'));
    await settle();

    expect(body.querySelector('[data-slot="review-status"]')?.textContent).toBe(COPY.saveFailed);
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(toastMock).not.toHaveBeenCalled();
  });
});
