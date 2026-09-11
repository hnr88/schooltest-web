import type { z } from 'zod';

import type { reviewStudentSchema } from '@/modules/report/schemas/review-student.schema';
import type { ReviewItem } from '@/modules/teacher/schemas/teacher-review.schema';

/** The student record fields the review header reads (GET /api/students/:id). */
export type ReviewStudent = z.infer<typeof reviewStudentSchema>['data'];

/** The result fields the launcher reads to open the drawer from a result page. */
export interface ReviewLaunchView {
  student_document_id?: string | null;
  skill: string | null;
  acara_phase: string | null;
}

/** A served review row carrying the C-REV-2 identity a write targets. */
export type MarkedItem = ReviewItem & { response_document_id: string };

export type ReviewMarkSource = 'accepted' | 'overridden';

/** A guarded mark waiting on the confirm dialog. */
export interface ReviewPendingMark {
  item: MarkedItem;
  value: number;
  source: ReviewMarkSource;
  tone: 'destructive' | 'neutral';
}

/** The design's four extended-response state labels. */
export type ReviewMarkState = 'awaiting' | 'judgement' | 'accepted' | 'marked';

/**
 * A criterion chip's tone. `unknown` is honest: the contract serves only the
 * rubric's total ceiling, so a non-zero band is known to be full only when
 * every band sits at the ceiling together.
 */
export type ReviewCriterionTone = 'full' | 'zero' | 'unknown';

export interface ReviewCriterion {
  name: string;
  level: number;
  max: number | null;
  tone: ReviewCriterionTone;
  reason: string | null;
  evidence: string | null;
}

/** A served answer or key, reduced to what the drawer can print. */
export type ReviewAnswer =
  | { kind: 'options'; ids: string[] }
  | { kind: 'text'; text: string }
  | { kind: 'none' };

export type ReviewSubmittedAgo =
  | { unit: 'now' }
  | { unit: 'minutes' | 'hours' | 'days'; count: number };

export type ReviewPhase = 'beginning' | 'emerging' | 'developing' | 'consolidating';

export interface ReviewTally {
  correct: number;
  total: number;
}

/**
 * Header context the caller already holds from a live row (roster, monitor or
 * result read). `undefined` means "not known here" and leaves that part out;
 * a `null` phase means the result has none ("Phase not set").
 */
export interface ReviewHeaderContext {
  studentName?: string | null;
  testLabel?: string | null;
  /** The school class's display name — not a CSS class. */
  className?: string | null;
  /** ISO timestamp the attempt was submitted. */
  submittedAt?: string | null;
  /** The result's served ACARA phase key. */
  phase?: string | null;
}

export interface ReviewDrawerProps extends ReviewHeaderContext {
  resultDocumentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
