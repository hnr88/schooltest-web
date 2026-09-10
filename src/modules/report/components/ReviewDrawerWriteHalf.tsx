'use client';

import { useTranslations } from 'next-intl';
import { useState, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { OpsConfirmDialog } from '@/modules/ops';
import { useOpsConfirmAction } from '@/modules/ops/actions';
import { isDeclined } from '@/modules/report/lib/review-display';
import {
  reviewMarkDecision,
  reviewMarkPayload,
  reviewResetPayload,
  reviewSourceForValue,
  useResultReviewMutation,
} from '@/modules/report/queries/use-result-review.mutation';
import type { ReviewItem } from '@/modules/teacher/schemas/teacher-review.schema';

// scoring/12 — the write half of the review drawer (C-REV-2; T-12
// `:2903–2966`). The suggestion is NEVER overwritten: the provider's bands and
// evidence render read-only in the assist block, and the human mark is stored
// in its own columns beside it — the design's whole moderation promise.
//
// THE FOUR GUARDS ship verbatim from logic.md#v-mark-override through the pure
// reviewMarkDecision, and every guarded commit goes through the existing
// useOpsConfirmAction + OpsConfirmDialog — no hand-rolled seventh dialog.
// Reset clears the mark key (never a zero); the note and the result-grain
// comment are their own honest saves.

type MarkDraft = { value: number | null; source: 'accepted' | 'overridden' | 'declined' | null; note: string };
/** A row that came off the wire always carries its documentId — the optional
 * form exists only for legacy read-only fixtures. */
type MarkedItem = ReviewItem & { response_document_id: string };

function suggestedOf(item: ReviewItem): number | null {
  const dimensions = item.rubric_score?.dimensions;
  if (dimensions === null || dimensions === undefined) return null;
  return Object.values(dimensions).reduce((total, band) => total + band, 0);
}

function MarkControls({
  item,
  draft,
  disabled,
  onSet,
  onDecline,
  onReset,
  onNote,
}: {
  item: MarkedItem;
  draft: MarkDraft | undefined;
  disabled: boolean;
  onSet: (item: MarkedItem, value: number) => void;
  onDecline: (item: MarkedItem) => void;
  onReset: (item: MarkedItem) => void;
  onNote: (item: MarkedItem, note: string) => void;
}) {
  const t = useTranslations('Report.review');
  const assist = item.rubric_score;
  const declinedAssist = assist !== null && isDeclined(assist);
  const suggested = suggestedOf(item);
  const max = item.mark_max ?? null;
  const mine = draft?.value ?? item.teacher_mark ?? null;
  const note = draft?.note ?? item.teacher_note ?? '';
  if (assist === null) return null;

  return (
    <div data-slot="review-mark" data-marked={String(mine !== null)} className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {mine !== null && max !== null ? (
          <span data-slot="review-mark-state" className="text-caption font-semibold text-success">
            {t('markedState', { value: mine, max })}
          </span>
        ) : null}
        {mine !== null ? (
          <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => onReset(item)}>
            {t('reset')}
          </Button>
        ) : null}
        {!declinedAssist && suggested !== null && mine === null && max !== null ? (
          <Button type="button" size="sm" disabled={disabled} onClick={() => onSet(item, suggested)}>
            {t('accept', { suggested, max })}
          </Button>
        ) : null}
        {declinedAssist && assist.decline_kind != null && mine === null ? (
          <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => onDecline(item)}>
            {t('declineToMark')}
          </Button>
        ) : null}
      </div>
      {max === null ? null : (
        <div data-slot="review-mark-scale" className="flex flex-wrap items-center gap-1">
          <span className="text-caption text-muted-foreground">
            {declinedAssist ? t('scaleDeclined') : t('scale')}
          </span>
          {Array.from({ length: max + 1 }, (_, value) => (
            <Button
              key={value}
              type="button"
              variant={mine === value ? 'default' : 'outline'}
              size="sm"
              disabled={disabled}
              onClick={() => onSet(item, value)}
            >
              {value}
            </Button>
          ))}
        </div>
      )}
      <label className="flex flex-col gap-1">
        <span className="text-caption text-muted-foreground">{t('noteLabel')}</span>
        <Textarea
          value={note}
          rows={2}
          disabled={disabled}
          onChange={(event) => onNote(item, event.target.value)}
        />
      </label>
    </div>
  );
}

/**
 * The marking state machine behind the drawer's write half. The drawer spreads
 * `markSlotFor(item)` under each text row, renders `commentSection` beside the
 * footer promise, and mounts `confirmDialog` while a guarded commit waits.
 */
export function useReviewMarking(resultId: string, items: ReviewItem[], comment: string | null) {
  const t = useTranslations('Report.review');
  const mutation = useResultReviewMutation();
  const confirmAction = useOpsConfirmAction({ onConfirm: () => runConfirmed() });
  const [drafts, setDrafts] = useState<Record<string, MarkDraft>>({});
  const [commentDraft, setCommentDraft] = useState(comment ?? '');
  const [pending, setPending] = useState<{
    item: MarkedItem;
    value: number;
    source: 'accepted' | 'overridden';
    tone: 'destructive' | 'neutral';
  } | null>(null);

  // The re-read the PUT returns is the truth; drafts carry only in-flight
  // edits. Keys reset lazily on identity change — no setState inside an
  // effect, so no cascading render.
  const identity = `${resultId}|${comment ?? ''}`;
  const [lastIdentity, setLastIdentity] = useState(identity);
  if (lastIdentity !== identity) {
    setLastIdentity(identity);
    setDrafts({});
    setCommentDraft(comment ?? '');
  }

  const draftNoteOf = (item: MarkedItem): string | null =>
    drafts[item.response_document_id]?.note ?? item.teacher_note ?? null;

  const commitValue = async (
    item: MarkedItem,
    value: number,
    source: 'accepted' | 'overridden',
  ): Promise<void> => {
    await mutation.mutateAsync({
      documentId: resultId,
      body: {
        responses: [
          {
            ...reviewMarkPayload(item, value, source),
            teacher_note: draftNoteOf(item),
          },
        ],
      },
    });
  };

  const runConfirmed = async (): Promise<void> => {
    if (pending === null) return;
    const { item, value, source } = pending;
    setPending(null);
    await commitValue(item, value, source);
  };

  const choose = (item: MarkedItem, value: number): void => {
    if (mutation.isPending) return;
    const declinedAssist = item.rubric_score !== null && isDeclined(item.rubric_score);
    const suggested = suggestedOf(item) ?? 0;
    const max = item.mark_max ?? value;
    const source = declinedAssist ? ('overridden' as const) : reviewSourceForValue(item, value);
    const decision = reviewMarkDecision({ value, suggested, max, declined: declinedAssist });
    if (decision.kind === 'confirm') {
      confirmAction.setTypedName('');
      setPending({ item, value, source, tone: decision.tone });
      confirmAction.openDialog();
      return;
    }
    void commitValue(item, value, source);
  };

  const declineToMark = async (item: MarkedItem): Promise<void> => {
    if (mutation.isPending) return;
    await mutation.mutateAsync({
      documentId: resultId,
      body: { responses: [{ ...reviewMarkPayload(item, null, 'declined'), teacher_note: draftNoteOf(item) }] },
    });
  };

  const reset = async (item: MarkedItem): Promise<void> => {
    if (mutation.isPending) return;
    await mutation.mutateAsync({
      documentId: resultId,
      body: { responses: [reviewResetPayload(item)] },
    });
  };

  const saveComment = async (): Promise<void> => {
    if (mutation.isPending || commentDraft === (comment ?? '')) return;
    await mutation.mutateAsync({ documentId: resultId, body: { responses: [], comment: commentDraft } });
  };

  const markSlotFor = (item: ReviewItem): ReactNode => {
    const id = item.response_document_id;
    if (id === undefined || item.response_kind !== 'text' || item.rubric_score === null) return null;
    const marked: MarkedItem = { ...item, response_document_id: id };
    return (
      <MarkControls
        item={marked}
        draft={drafts[id]}
        disabled={mutation.isPending}
        onSet={(target, value) => choose({ ...target, response_document_id: id }, value)}
        onDecline={(target) => void declineToMark({ ...target, response_document_id: id })}
        onReset={(target) => void reset({ ...target, response_document_id: id })}
        onNote={(target, note) =>
          setDrafts((current) => ({
            ...current,
            [id]: {
              value: current[id]?.value ?? target.teacher_mark ?? null,
              source: current[id]?.source ?? target.teacher_mark_source ?? null,
              note,
            },
          }))
        }
      />
    );
  };

  const commentSection: ReactNode = (
    <section className="flex flex-col gap-2">
      <label className="flex flex-col gap-1">
        <span className="text-caption text-muted-foreground">{t('commentLabel')}</span>
        <Textarea
          data-slot="review-comment"
          value={commentDraft}
          rows={3}
          disabled={mutation.isPending}
          onChange={(event) => setCommentDraft(event.target.value)}
        />
      </label>
      <div>
        <Button
          type="button"
          size="sm"
          disabled={mutation.isPending || commentDraft === (comment ?? '')}
          onClick={() => void saveComment()}
        >
          {t('saveComment')}
        </Button>
      </div>
    </section>
  );

  const ceilingMet = pending !== null && pending.value === pending.item.mark_max && suggestedOf(pending.item) === pending.item.mark_max;
  const confirmDialog: ReactNode =
    pending !== null && confirmAction.open ? (
      <OpsConfirmDialog
        open
        onOpenChange={(nextOpen) =>
          nextOpen ? confirmAction.openDialog() : confirmAction.closeDialog()
        }
        tone={pending.tone}
        title={
          pending.tone === 'destructive'
            ? t('confirmZeroTitle')
            : ceilingMet
              ? t('confirmCeilingTitle')
              : t('confirmBelowTitle', { gap: Math.abs(pending.value - (suggestedOf(pending.item) ?? 0)) })
        }
        description={
          pending.tone === 'destructive'
            ? t('confirmZeroBody')
            : ceilingMet
              ? t('confirmCeilingBody', { max: pending.item.mark_max ?? 0 })
              : t('confirmBelowBody', {
                  value: pending.value,
                  max: pending.item.mark_max ?? 0,
                  suggested: suggestedOf(pending.item) ?? 0,
                })
        }
        confirmLabel={
          pending.tone === 'destructive'
            ? t('confirmZeroCta')
            : t('confirmRecordCta', { value: pending.value, max: pending.item.mark_max ?? 0 })
        }
        cancelLabel={t('cancel')}
        pending={confirmAction.pending}
        error={confirmAction.errorMessage}
        onConfirm={() => void confirmAction.confirm()}
      />
    ) : null;

  return { markSlotFor, commentSection, confirmDialog };
}

export { MarkControls };
