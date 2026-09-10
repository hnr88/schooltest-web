import type { PortalStatus } from '@schooltest/ops-contracts';

export type SchoolLifecycleActionKey =
  'editDetails' | 'inviteAdmin' | 'activate' | 'reactivate' | 'restore' | 'suspend' | 'archive';

export interface SchoolLifecycleAction {
  key: SchoolLifecycleActionKey;
  labelKey: `actions.${string}`;
  write: boolean;
  danger: boolean;
  typed: boolean;
  confirm: null | {
    titleKey: `actions.confirm.${string}.title`;
    bodyKey: `actions.confirm.${string}.body`;
    ctaKey: `actions.confirm.${string}.cta`;
  };
  targetStatus?: PortalStatus;
}

const EDIT_DETAILS: SchoolLifecycleAction = {
  key: 'editDetails',
  labelKey: 'actions.editDetails',
  write: true,
  danger: false,
  typed: false,
  confirm: null,
};

const INVITE_ADMIN: SchoolLifecycleAction = {
  key: 'inviteAdmin',
  labelKey: 'actions.inviteAdmin',
  write: true,
  danger: false,
  typed: false,
  confirm: null,
};

const STATUS_ACTIONS: Record<
  Exclude<SchoolLifecycleActionKey, 'editDetails' | 'inviteAdmin' | 'archive'>,
  SchoolLifecycleAction
> = {
  activate: {
    key: 'activate',
    labelKey: 'actions.activate',
    write: true,
    danger: false,
    typed: false,
    targetStatus: 'active',
    confirm: {
      titleKey: 'actions.confirm.activate.title',
      bodyKey: 'actions.confirm.activate.body',
      ctaKey: 'actions.confirm.activate.cta',
    },
  },
  reactivate: {
    key: 'reactivate',
    labelKey: 'actions.reactivate',
    write: true,
    danger: false,
    typed: false,
    targetStatus: 'active',
    confirm: {
      titleKey: 'actions.confirm.reactivate.title',
      bodyKey: 'actions.confirm.reactivate.body',
      ctaKey: 'actions.confirm.reactivate.cta',
    },
  },
  restore: {
    key: 'restore',
    labelKey: 'actions.restore',
    write: true,
    danger: false,
    typed: false,
    targetStatus: 'pending_setup',
    confirm: {
      titleKey: 'actions.confirm.restore.title',
      bodyKey: 'actions.confirm.restore.body',
      ctaKey: 'actions.confirm.restore.cta',
    },
  },
  suspend: {
    key: 'suspend',
    labelKey: 'actions.suspend',
    write: true,
    danger: true,
    typed: false,
    targetStatus: 'suspended',
    confirm: {
      titleKey: 'actions.confirm.suspend.title',
      bodyKey: 'actions.confirm.suspend.body',
      ctaKey: 'actions.confirm.suspend.cta',
    },
  },
};

const ARCHIVE: SchoolLifecycleAction = {
  key: 'archive',
  labelKey: 'actions.archive',
  write: true,
  danger: true,
  typed: true,
  targetStatus: 'archived',
  confirm: {
    titleKey: 'actions.confirm.archive.title',
    bodyKey: 'actions.confirm.archive.body',
    ctaKey: 'actions.confirm.archive.cta',
  },
};

const ACTIONS_BY_STATUS: Record<PortalStatus, readonly SchoolLifecycleAction[]> = {
  active: [EDIT_DETAILS, INVITE_ADMIN, STATUS_ACTIONS.suspend, ARCHIVE],
  trial: [EDIT_DETAILS, INVITE_ADMIN, STATUS_ACTIONS.activate, ARCHIVE],
  pending_setup: [EDIT_DETAILS, INVITE_ADMIN, STATUS_ACTIONS.activate, ARCHIVE],
  suspended: [EDIT_DETAILS, INVITE_ADMIN, STATUS_ACTIONS.reactivate, ARCHIVE],
  archived: [EDIT_DETAILS, INVITE_ADMIN, STATUS_ACTIONS.restore],
};

/** The detail menu is the design's school row action set, minus Open school. */
export function schoolLifecycleActions(status: PortalStatus): readonly SchoolLifecycleAction[] {
  return ACTIONS_BY_STATUS[status];
}

/** The header's single status action is derived, never supplied by the API. */
export function primarySchoolLifecycleAction(status: PortalStatus): SchoolLifecycleAction {
  if (status === 'active') return STATUS_ACTIONS.suspend;
  if (status === 'suspended') return STATUS_ACTIONS.reactivate;
  if (status === 'archived') return STATUS_ACTIONS.restore;
  return STATUS_ACTIONS.activate;
}

export function lifecycleActionFor(
  status: PortalStatus,
  key: SchoolLifecycleActionKey,
): SchoolLifecycleAction | null {
  return schoolLifecycleActions(status).find((action) => action.key === key) ?? null;
}
