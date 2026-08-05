import type { AccountTab } from '@/modules/school-admin/types/account.types';
import type { SchoolPlan } from '@/modules/school-admin/types/school-admin.types';

// Spec section 5 "Sub-tabs": My account / Settings / Sign out, in that order.
export const ACCOUNT_TABS = ['account', 'settings', 'signout'] as const;

// DS §5.6 underline tabs are label-only — the canonical row carries no glyphs.
export const ACCOUNT_TAB_CONFIG: readonly { value: AccountTab; labelKey: string }[] = [
  { value: 'account', labelKey: 'account.tabs.account' },
  { value: 'settings', labelKey: 'account.tabs.settings' },
  { value: 'signout', labelKey: 'account.tabs.signout' },
];

// CONTRAST: the dashboard scroll column sits on the #EEF2F7 well, where the tab
// row's idle --muted-foreground measures 4.23:1 and fails AA. Same
// consumer-side re-ink the portal Settings tab row already carries.
export const ACCOUNT_TABS_IDLE_INK =
  '[&_[data-slot=tabs-trigger]:not([data-active])]:text-body [&_[data-slot=tabs-trigger]:not([data-active]):hover]:text-foreground';

// Spec section 5: the "Current plan" card carries the subtitle "Reading tests
// only" on trial. Full license has no equivalent line in the spec, so it gets
// none rather than invented copy.
export const PLAN_SUBTITLE_KEYS: Record<SchoolPlan, string | null> = {
  trial: 'account.planSubtitleTrial',
  full_license: null,
};
