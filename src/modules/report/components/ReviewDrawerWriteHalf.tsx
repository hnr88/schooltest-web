'use client';

import { useTranslations } from 'next-intl';
import { useState, type ReactNode } from 'react';

import { OpsConfirmDialog } from '@/modules/ops';
import { showOpsToast, useOpsConfirmAction } from '@/modules/ops/actions';
import { hasText, isDeclined, suggestedMark } from '@/modules/report/lib/review-display';
import {
  reviewMarkDecision,
  reviewMarkPayload,
  reviewResetPayload,
  reviewSavePayload,
  reviewSourceForValue,
  useResultReviewMutation,
} from '@/modules/report/queries/use-result-review.mutation';
import type {
  MarkedItem,
  ReviewHeaderContext,
  ReviewMarkSource,
  ReviewPendingMark,
} from '@/modules/report/types/review.types';
import type { ResultReview, ReviewItem } from '@/modules/teacher/schemas/teacher-review.schema';

// scoring/12 — the write half of the review drawer (C-REV-2; Teacher Portal v2
// S31). The suggestion is NEVER overwritten: marks are stored in their own
// columns beside it. A mark commits the moment it is set (the design's
// setMark), through the four guards and the portal's one confirm dialog; the
// question notes and the overall comment are drafts until "Save comments"
// sends them in ONE PUT. Reset clears the mark key, never a zero.

/** The marking state machine behind the drawer. */
export function useReviewMarking(
  resultId: string,
  review: ResultReview | null,
  context: ReviewHeaderContext,
  onSaved: () => void,
) {
  const t = useTranslations('TeacherPortal.review');
  const mutation = useResultReviewMutation();
  const confirmAction = useOpsConfirmAction({ onConfirm: () => runConfirmed() });
  const served = review?.teacher_comment ?? null;
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [comment, setComment] = useState(served ?? '');
  const [pending, setPending] = useState<ReviewPendingMark | null>(null);

  // The server's copy is the truth: drafts reset when it changes (a save, a
  // first load, another result) — lazily, with no effect and no cascade.
  const identity = `${resultId}|${review === null ? '' : 'loaded'}|${served ?? ''}`;
  const [lastIdentity, setLastIdentity] = useState(identity);
  if (lastIdentity !== identity) {
    setLastIdentity(identity);
    setNotes({});
    setComment(served ?? '');
  }

  const items = review?.items ?? [];
  const noteFor = (item: ReviewItem): string => {
    const id = item.response_document_id;
    if (id !== undefined && id in notes) return notes[id];
    return item.teacher_note ?? '';
  };
  const setNote = (item: ReviewItem, note: string): void => {
    const id = item.response_document_id;
    if (id !== undefined) setNotes((current) => ({ ...current, [id]: note }));
  };
  const noteCount = (hasText(comment) ? 1 : 0) + items.filter((item) => hasText(noteFor(item))).length;

  const commit = (item: MarkedItem, value: number, source: ReviewMarkSource) =>
    mutation.mutateAsync({
      documentId: resultId,
      body: { responses: [reviewMarkPayload(item, value, source)] },
    });

  const runConfirmed = async (): Promise<void> => {
    if (pending === null) return;
    await commit(pending.item, pending.value, pending.source);
    setPending(null);
  };

  const choose = (item: MarkedItem, value: number): void => {
    if (mutation.isPending) return;
    const declined = item.rubric_score !== null && isDeclined(item.rubric_score);
    const source: ReviewMarkSource = declined ? 'overridden' : reviewSourceForValue(item, value);
    const suggested = suggestedMark(item) ?? 0;
    const decision = reviewMarkDecision({ value, suggested, max: item.mark_max ?? value, declined });
    if (decision.kind === 'confirm') {
      confirmAction.setTypedName('');
      setPending({ item, value, source, tone: decision.tone });
      confirmAction.openDialog();
      return;
    }
    mutation.mutate({ documentId: resultId, body: { responses: [reviewMarkPayload(item, value, source)] } });
  };

  const reset = (item: MarkedItem): void => {
    if (mutation.isPending) return;
    mutation.mutate({ documentId: resultId, body: { responses: [reviewResetPayload(item)] } });
  };

  const subject = context.studentName
    ? context.testLabel
      ? t('subjectNamed', { name: context.studentName, test: context.testLabel })
      : t('subjectNameOnly', { name: context.studentName })
    : t('subjectAnon');

  const save = (): void => {
    if (mutation.isPending || review === null) return;
    const done = (): void => {
      showOpsToast({
        tone: 'ok',
        message:
          noteCount > 0 ? t('savedToast', { count: noteCount, subject }) : t('reviewedToast', { subject }),
      });
      onSaved();
    };
    const body = reviewSavePayload({ items, notes, comment, servedComment: served });
    if (body === null) {
      done();
      return;
    }
    mutation.mutate({ documentId: resultId, body }, { onSuccess: done });
  };

  const confirmCopy = (mark: ReviewPendingMark) => {
    const max = mark.item.mark_max ?? 0;
    const suggested = suggestedMark(mark.item) ?? 0;
    if (mark.tone === 'destructive') {
      const name = context.studentName ?? t('studentFallback');
      return { title: t('confirmZeroTitle'), body: t('confirmZeroBody', { name }), cta: t('confirmZeroCta') };
    }
    const cta = t('confirmRecordCta', { value: mark.value, max });
    if (mark.value === max && suggested === max) {
      const over = mark.item.rubric_score?.decline_kind === 'over_ceiling' ? 'yes' : 'no';
      return { title: t('confirmCeilingTitle'), body: t('confirmCeilingBody', { max, over }), cta };
    }
    return {
      title: t('confirmBelowTitle', { gap: suggested - mark.value }),
      body: t('confirmBelowBody', { value: mark.value, max, suggested }),
      cta,
    };
  };

  const copy = pending === null ? null : confirmCopy(pending);
  const confirmDialog: ReactNode =
    pending !== null && copy !== null && confirmAction.open ? (
      <OpsConfirmDialog
        open
        onOpenChange={(next) => (next ? confirmAction.openDialog() : confirmAction.closeDialog())}
        tone={pending.tone}
        title={copy.title}
        description={copy.body}
        confirmLabel={copy.cta}
        cancelLabel={t('cancel')}
        pending={confirmAction.pending}
        error={confirmAction.errorMessage}
        className="sm:max-w-[440px]"
        onConfirm={() => void confirmAction.confirm()}
      />
    ) : null;

  return {
    noteFor,
    setNote,
    comment,
    setComment,
    noteCount,
    choose,
    reset,
    save,
    isPending: mutation.isPending,
    isError: mutation.isError,
    confirmDialog,
  };
}
