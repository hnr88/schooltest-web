/**
 * task 15 — the shared row/bulk action TABLES for the Admins and Teachers
 * tabs, so the two surfaces cannot drift on label, confirm copy or the
 * declared `write`/danger flags (D-50: task 16 CONSUMES this file, unedited).
 *
 * This module is descriptive only — i18n keys, `write` and `danger` flags,
 * confirm copy keys — mirroring `school-lifecycle-actions.ts`'s split between
 * "what the menu says" and "what the click does". The actual
 * `OpsActionDefinition`s (perform/readBack/isEligible) live beside the
 * endpoints they call: `queries/use-staff-user-actions.mutation.ts` for the
 * ACCOUNT actions (block/unblock/role/remove) and `use-teachers-*` (task 16)
 * for the teacher-specific reassignment. `staff-actions.ts` never imports
 * `strapi` or a query hook.
 *
 * Row action ORDER and set (`logic.md#c-row-actions`, `Ops Portal.dc.html`):
 *  - Admins   (:1304–1310): Edit access · Resend invite · Make owner ·
 *    Suspend/Reactivate admin · Remove from school
 *  - Teachers (:1321–1327): View classes · Edit access · Resend invite ·
 *    Suspend/Reactivate teacher · Remove from school
 *
 * `staffAccountRowActions`/`staffAccountBulkActions` below cover the FOUR
 * account-lifecycle actions common to an ACCEPTED user of either surface
 * (Edit access, Suspend/Reactivate, Remove — Teachers additionally gets View
 * classes, which is `write: false` and has no confirm). "Resend invite" is
 * NOT one of them: an accepted account has no open invitation to resend, so
 * that action exists only for a PENDING invitation row — Admins wires it in
 * `OpsStaffUsersTable.tsx` off the existing `Ops.staffInvitations` actions
 * (task 19's surface), and it is not part of this shared table.
 */

export type StaffActionSurface = 'admin' | 'teacher';
export type StaffAccountStatus = 'active' | 'suspended';

export type StaffRowActionKey = 'editAccess' | 'viewClasses' | 'suspend' | 'reactivate' | 'remove';

export interface StaffConfirmCopy {
  titleKey: string;
  bodyKey: string;
  ctaKey: string;
}

export interface StaffRowAction {
  key: StaffRowActionKey;
  labelKey: string;
  write: boolean;
  danger: boolean;
  /** null: the action has no confirm step (Edit access, View classes). */
  confirm: StaffConfirmCopy | null;
}

// Relative to the `Ops.schoolTables` namespace — every consumer resolves
// these through `useTranslations('Ops.schoolTables')`, the same convention
// `school-lifecycle-actions.ts` uses under `Ops.detail`.

const EDIT_ACCESS: StaffRowAction = {
  key: 'editAccess',
  labelKey: 'actions.editAccess',
  write: true,
  danger: false,
  confirm: null,
};

const VIEW_CLASSES: StaffRowAction = {
  key: 'viewClasses',
  labelKey: 'actions.viewClasses',
  write: false,
  danger: false,
  confirm: null,
};

function suspendOrReactivate(surface: StaffActionSurface, status: StaffAccountStatus): StaffRowAction {
  const surfaceKey = surface === 'admin' ? 'Admin' : 'Teacher';
  if (status === 'suspended') {
    return {
      key: 'reactivate',
      labelKey: `actions.reactivate${surfaceKey}`,
      write: true,
      danger: false,
      confirm: {
        titleKey: `actions.confirm.reactivate${surfaceKey}.title`,
        bodyKey: `actions.confirm.reactivate${surfaceKey}.body`,
        ctaKey: `actions.confirm.reactivate${surfaceKey}.cta`,
      },
    };
  }
  return {
    key: 'suspend',
    labelKey: `actions.suspend${surfaceKey}`,
    write: true,
    danger: true,
    confirm: {
      titleKey: `actions.confirm.suspend${surfaceKey}.title`,
      bodyKey: `actions.confirm.suspend${surfaceKey}.body`,
      ctaKey: `actions.confirm.suspend${surfaceKey}.cta`,
    },
  };
}

function removeFromSchool(surface: StaffActionSurface): StaffRowAction {
  const surfaceKey = surface === 'admin' ? 'Admin' : 'Teacher';
  return {
    key: 'remove',
    labelKey: 'actions.removeFromSchool',
    write: true,
    danger: true,
    confirm: {
      titleKey: `actions.confirm.remove${surfaceKey}.title`,
      bodyKey: `actions.confirm.remove${surfaceKey}.body`,
      ctaKey: `actions.confirm.remove${surfaceKey}.cta`,
    },
  };
}

/** The row menu for an ACCEPTED account (kind `user`) of either surface. */
export function staffAccountRowActions(
  surface: StaffActionSurface,
  status: StaffAccountStatus,
): readonly StaffRowAction[] {
  const tail = [suspendOrReactivate(surface, status), removeFromSchool(surface)];
  return surface === 'teacher' ? [VIEW_CLASSES, EDIT_ACCESS, ...tail] : [EDIT_ACCESS, ...tail];
}

export type StaffBulkActionKey = 'suspend' | 'remove';

export interface StaffBulkAction {
  key: StaffBulkActionKey;
  labelKey: string;
  write: boolean;
  danger: boolean;
  confirm: StaffConfirmCopy;
}

/**
 * The account half of the bulk bar (`logic.md#c-bulk`): Suspend and Remove,
 * over accepted (kind `user`) targets only. "Resend invites" and "Export" are
 * NOT here — Resend acts on invitation targets exclusively (wired beside the
 * invitation actions, `OpsStaffUsersTable.tsx`) and Export is scope-based
 * (D-16), never per-target, so neither carries a per-surface confirm table.
 */
export function staffAccountBulkActions(surface: StaffActionSurface): readonly StaffBulkAction[] {
  const surfaceKey = surface === 'admin' ? 'Admin' : 'Teacher';
  return [
    {
      key: 'suspend',
      labelKey: 'bulkSuspend',
      write: true,
      danger: true,
      confirm: {
        titleKey: `bulkConfirm.suspend${surfaceKey}.title`,
        bodyKey: `bulkConfirm.suspend${surfaceKey}.body`,
        ctaKey: `bulkConfirm.suspend${surfaceKey}.cta`,
      },
    },
    {
      key: 'remove',
      labelKey: 'bulkRemove',
      write: true,
      danger: true,
      confirm: {
        titleKey: `bulkConfirm.remove${surfaceKey}.title`,
        bodyKey: `bulkConfirm.remove${surfaceKey}.body`,
        ctaKey: `bulkConfirm.remove${surfaceKey}.cta`,
      },
    },
  ];
}
