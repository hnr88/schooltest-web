import type { ReactNode } from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';

import enMessages from '@/i18n/messages/en.json';
import { strapi } from '@/lib/axios/strapi';
import { ReviewDrawer } from '@/modules/report/components/ReviewDrawer';
import { ReviewSubmissionLauncher } from '@/modules/report/components/ReviewSubmissionLauncher';

import reading from './fixtures/result-review-reading.live.json';
import unreached from './fixtures/result-review-unreached.live.json';
import writing from './fixtures/result-review-writing.live.json';
import student from './fixtures/review-student.live.json';
import { fill, press, renderDrawer, settle, unmountDrawer } from './review-drawer.harness';

// Teacher Portal v2 S31 — the review drawer's row kinds and its report-page
// launcher, over payloads recorded from the live API (each fixture names its
// `source`): a writing review whose provider-scored answers are extended
// responses, a reading review with not-reached rows, and a student record.
// Only the HTTP client is replaced at its boundary.

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

const getMock = vi.mocked(strapi.get);
const COPY = enMessages.TeacherPortal.review;
const READING = enMessages.Report.skills.reading;

afterEach(() => {
  unmountDrawer();
  vi.clearAllMocks();
});

describe('the review drawer over live row kinds', () => {
  test('provider-scored answers are Extended response cards awaiting a mark; key-scored text answers are rows', async () => {
    getMock.mockResolvedValue({ data: writing.review });
    const body = renderDrawer(
      <ReviewDrawer resultDocumentId={writing.review.document_id} open onOpenChange={vi.fn()} />,
    );
    await settle();

    const items = writing.review.items;
    const extended = items.filter((item) => item.correct_key.type === 'provider_scored');
    const keyed = items.filter((item) => item.correct_key.type !== 'provider_scored');
    const cards = body.querySelectorAll('[data-slot="review-assist"]');
    expect(extended.length).toBeGreaterThan(0);
    expect(cards).toHaveLength(extended.length);
    cards.forEach((card) => {
      // No assist was served: the card awaits a mark with no rubric, scale or suggestion.
      expect(card.querySelector('[data-slot="review-mark-state"]')?.textContent).toBe(COPY.stateAwaiting);
      expect(card.querySelector('[data-slot="review-criteria"]')).toBeNull();
      expect(card.querySelector('[data-slot="review-mark"]')).toBeNull();
      expect(card.querySelector('[data-slot="review-assist-footer"]')).toBeNull();
    });
    const first = extended[0];
    const text = (first.given as { text: string }).text;
    const words = text.trim().split(/\s+/).length;
    const secs = Math.round(first.latency_ms / 1000);
    const duration = secs >= 60 ? `${Math.floor(secs / 60)} min ${secs % 60} s` : `${secs} s`;
    expect(cards[0].textContent).toContain(first.prompt ?? first.item_code);
    expect(cards[0].querySelector('[data-slot="review-answer"]')?.textContent).toBe(text);
    expect(cards[0].querySelector('[data-slot="review-word-count"]')?.textContent).toBe(
      `${words} ${words === 1 ? 'word' : 'words'} · written in ${duration}`,
    );

    const rows = body.querySelectorAll('[data-slot="review-question-row"]');
    expect(rows).toHaveLength(keyed.length);
    expect(rows[0].querySelector('[data-slot="review-given"]')?.textContent).toBe(
      (keyed[0].given as { text: string }).text,
    );
    expect(rows[0].querySelector('[data-slot="review-key"]')?.textContent).toBe(
      (keyed[0].correct_key as { accepted: string[] }).accepted.join(' / '),
    );
    // Opened with no header context: the design's action names the drawer and nothing is filled in.
    expect(body.querySelector('[data-slot="sheet-title"]')?.textContent).toBe(COPY.title);
    expect(body.querySelector('[data-slot="review-strip"]')?.textContent).not.toContain(COPY.phaseNotSet);
  });

  test('not-reached rows say so — no Correct or Incorrect, no answer, the key beside them', async () => {
    getMock.mockResolvedValue({ data: unreached.review });
    const body = renderDrawer(
      <ReviewDrawer resultDocumentId={unreached.review.document_id} open onOpenChange={vi.fn()} />,
    );
    await settle();

    const items = unreached.review.items;
    const expected = items.filter((item) => item.given === null && item.is_correct === null);
    const rows = body.querySelectorAll('[data-slot="review-question-row"][data-unreached="true"]');
    expect(expected.length).toBeGreaterThan(0);
    expect(rows).toHaveLength(expected.length);
    rows.forEach((row) => {
      expect(row.querySelector('[data-slot="review-question-mark"]')?.textContent).toBe(COPY.unreached);
      expect(row.querySelector('[data-slot="review-given"]')?.textContent).toBe(COPY.unreached);
    });
    expect(rows[0].querySelector('[data-slot="review-key"]')?.textContent).toBe(
      fill(COPY.option, { id: expected[0].correct_key.answer.toUpperCase() }),
    );
    // Every served row is in the tally; a not-reached row is simply not correct.
    const correct = items.filter((item) => item.is_correct === true).length;
    expect(body.querySelector('[data-slot="review-strip"]')?.textContent).toContain(
      fill(COPY.scoreChip, { correct, total: items.length }),
    );
  });

  test('the report-page launcher names the student and class from their live record once opened', async () => {
    getMock.mockImplementation((url: string) =>
      Promise.resolve({ data: url.startsWith('/api/students/') ? student.response : reading.review }),
    );
    const ctx = reading.context;
    const body = renderDrawer(
      <ReviewSubmissionLauncher
        resultDocumentId={reading.review.document_id}
        view={{ student_document_id: ctx.studentDocumentId, skill: ctx.skill, acara_phase: ctx.phase }}
      />,
    );
    // A closed drawer reads nothing.
    expect(getMock).not.toHaveBeenCalled();

    press(body.querySelector('[data-slot="review-open"]'));
    await settle();

    expect(getMock).toHaveBeenCalledWith(
      `/api/students/${ctx.studentDocumentId}?fields[0]=given_name&fields[1]=family_name&populate[class][fields][0]=name`,
    );
    const record = student.response.data;
    const header = body.querySelector('[data-slot="review-header"]');
    expect(header?.querySelector('[data-slot="sheet-title"]')?.textContent).toBe(
      `${record.given_name} ${record.family_name}`,
    );
    expect(header?.textContent).toContain(`${READING} · ${record.class.name}`);
    expect(body.querySelector('[data-slot="review-strip"]')?.textContent).toContain(
      COPY.phase[ctx.phase as keyof typeof COPY.phase],
    );
  });
});
