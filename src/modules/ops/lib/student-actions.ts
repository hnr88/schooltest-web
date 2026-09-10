import type { OpsStudentStatus } from '@schooltest/ops-contracts';

/**
 * The design's student row menu (`Ops Portal.dc.html:1354-1360`) and the
 * shared bulk set (`:1465-1492`), for the ops Students tab (task 18) AND the
 * class roster (task 21) — both surfaces move a student between classes in
 * the same school through the SAME endpoint (C-OPS-STU-MOVE), so the label
 * and confirm copy for that one action live here once.
 *
 * Pure data, no React, no i18n: every `*Key` field is a message key resolved
 * by the consumer's own `useTranslations` call, exactly like the sibling
 * `school-lifecycle-actions.ts`.
 */
export type StudentActionKey = 'viewProfile' | 'moveClass' | 'deactivate' | 'reactivate';

export interface StudentActionConfirmCopy {
  titleKey: string;
  bodyKey: string;
  ctaKey: string;
}

export interface StudentAction {
  key: StudentActionKey;
  labelKey: string;
  /** Declared mutating action — task 03's action-kit gate consumes this flag; never inferred from the label (D-20). */
  write: boolean;
  danger: boolean;
  /** null for a plain read (View profile); every write carries its own confirm copy. */
  confirm: StudentActionConfirmCopy | null;
}

/** `false, true, true` per the design's row (`:1354-1360`) — write flags never guessed from the label. */
export const VIEW_PROFILE_ACTION: StudentAction = {
  key: 'viewProfile',
  labelKey: 'opsProfileOpen',
  write: false,
  danger: false,
  confirm: null,
};

/**
 * Shared with the class roster (task 21): the SAME destination-class picker
 * and the SAME endpoint move a student between classes in one school,
 * whether the operator started from the school-wide Students tab or from a
 * class roster. The design's own row for this action is an unfinished toast
 * stub (`run: () => this.toast('Class transfer opens here')`) — there is no
 * drawn confirm copy to quote verbatim, so the consumer supplies its own
 * destination-picker dialog around this label.
 */
export const MOVE_CLASS_ACTION: StudentAction = {
  key: 'moveClass',
  labelKey: 'studentsActionMoveClass',
  write: true,
  danger: false,
  confirm: {
    titleKey: 'studentsMoveClassTitle',
    bodyKey: 'studentsMoveClassBody',
    ctaKey: 'studentsMoveClassCta',
  },
};

/** Row label "Deactivate student"; confirm body verbatim from the design (`:1358`). */
export const DEACTIVATE_ACTION: StudentAction = {
  key: 'deactivate',
  labelKey: 'studentsActionDeactivate',
  write: true,
  danger: true,
  confirm: {
    titleKey: 'studentsDeactivateConfirmTitle',
    bodyKey: 'studentsDeactivateConfirmBody',
    ctaKey: 'studentsDeactivateConfirmCta',
  },
};

/** Row label "Reactivate student"; confirm body verbatim from the design (`:1358`). */
export const REACTIVATE_ACTION: StudentAction = {
  key: 'reactivate',
  labelKey: 'studentsActionReactivate',
  write: true,
  danger: false,
  confirm: {
    titleKey: 'studentsReactivateConfirmTitle',
    bodyKey: 'studentsReactivateConfirmBody',
    ctaKey: 'studentsReactivateConfirmCta',
  },
};

/**
 * The design's per-row menu (`:1354-1360`): View profile, Move class, then
 * Deactivate or Reactivate — relabelled by the row's OWN status, never a
 * second stored value.
 */
export function studentRowActions(status: OpsStudentStatus): readonly StudentAction[] {
  return [
    VIEW_PROFILE_ACTION,
    MOVE_CLASS_ACTION,
    status === 'archived' ? REACTIVATE_ACTION : DEACTIVATE_ACTION,
  ];
}

export function studentActionFor(status: OpsStudentStatus, key: StudentActionKey): StudentAction | null {
  return studentRowActions(status).find((action) => action.key === key) ?? null;
}

/**
 * The design's bulk set (`:1465-1492`, `bulkFor('Students', …)`): Move class,
 * Export, Deactivate. Export is a scoped CSV read the header already owns
 * (D-16 — the whole current filter scope, never the selection size), not a
 * per-row write, so it is not one of these action definitions.
 */
export function studentBulkActions(): readonly StudentAction[] {
  return [MOVE_CLASS_ACTION, DEACTIVATE_ACTION];
}
