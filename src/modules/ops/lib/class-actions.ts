import type { ClassListStatus } from '@/modules/ops/lib/ops-classes-contract';

/**
 * OPS-038 / task 17 — the Classes-tab lifecycle/action table (D-KIT's fourth
 * domain, beside `school-lifecycle-actions.ts` (08), `staff-actions.ts` (15)
 * and `student-actions.ts` (18)). Pure descriptors only — no hook, no dialog,
 * no request — so the class page (task 21) can render the SAME row menu
 * without re-deriving it, exactly like the school panel already shares one
 * `school-lifecycle-actions.ts` between the schools list and the school
 * detail header.
 *
 * The design's four row actions (`Ops Portal.dc.html:1337-1343`): Open class
 * (never a write), Reassign teacher, Edit class, and Archive/Restore —
 * relabelled by the row's OWN derived status, never a second status mapping.
 */

export type ClassRowActionKey = 'open' | 'reassignTeacher' | 'edit' | 'archive' | 'restore';

export interface ClassActionConfirmCopy {
  titleKey: string;
  bodyKey: string;
  ctaKey: string;
}

export interface ClassRowActionDef {
  key: ClassRowActionKey;
  labelKey: `actions.${string}`;
  /** Declared mutating action — the action-kit gate consumes this flag (D-20). */
  write: boolean;
  danger: boolean;
  confirm: ClassActionConfirmCopy | null;
}

const OPEN: ClassRowActionDef = {
  key: 'open',
  labelKey: 'actions.open',
  write: false,
  danger: false,
  confirm: null,
};

const REASSIGN_TEACHER: ClassRowActionDef = {
  key: 'reassignTeacher',
  labelKey: 'actions.reassignTeacher',
  write: true,
  danger: false,
  confirm: null,
};

const EDIT: ClassRowActionDef = {
  key: 'edit',
  labelKey: 'actions.edit',
  write: true,
  danger: false,
  confirm: null,
};

const ARCHIVE: ClassRowActionDef = {
  key: 'archive',
  labelKey: 'actions.archive',
  write: true,
  danger: true,
  confirm: {
    titleKey: 'actions.confirm.archive.title',
    bodyKey: 'actions.confirm.archive.body',
    ctaKey: 'actions.confirm.archive.cta',
  },
};

const RESTORE: ClassRowActionDef = {
  key: 'restore',
  labelKey: 'actions.restore',
  write: true,
  danger: false,
  confirm: {
    titleKey: 'actions.confirm.restore.title',
    bodyKey: 'actions.confirm.restore.body',
    ctaKey: 'actions.confirm.restore.cta',
  },
};

/** The row menu, relabelled by the row's OWN `classRowStatus` — one source, both ends. */
export function classRowActions(status: ClassListStatus): readonly ClassRowActionDef[] {
  return status === 'archived'
    ? [OPEN, REASSIGN_TEACHER, EDIT, RESTORE]
    : [OPEN, REASSIGN_TEACHER, EDIT, ARCHIVE];
}

/* ------------------------------------------------------------------ *
 * Bulk — the design's `:1435-1437` row: Set test window, Export, Archive.
 * `export` has no backing endpoint yet (no classes-list CSV export route
 * exists anywhere in the backlog — see the task-17 report) and is therefore
 * NOT declared here; declaring a bulk action with nothing real to run would
 * be exactly the stub OP-2 forbids.
 * ------------------------------------------------------------------ */

export type ClassBulkActionKey = 'setTestWindow' | 'archive';

export interface ClassBulkActionDef {
  key: ClassBulkActionKey;
  labelKey: `bulk.${string}`;
  write: boolean;
  danger: boolean;
  confirm: ClassActionConfirmCopy | null;
}

const BULK_SET_TEST_WINDOW: ClassBulkActionDef = {
  key: 'setTestWindow',
  labelKey: 'bulk.setTestWindow',
  write: true,
  danger: false,
  confirm: null,
};

const BULK_ARCHIVE: ClassBulkActionDef = {
  key: 'archive',
  labelKey: 'bulk.archive',
  write: true,
  danger: true,
  confirm: {
    titleKey: 'bulk.confirm.archive.title',
    bodyKey: 'bulk.confirm.archive.body',
    ctaKey: 'bulk.confirm.archive.cta',
  },
};

export function classBulkActions(): readonly ClassBulkActionDef[] {
  return [BULK_SET_TEST_WINDOW, BULK_ARCHIVE];
}
