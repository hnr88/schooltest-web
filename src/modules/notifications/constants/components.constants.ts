import { Bell, ClipboardCheck, ShieldCheck, Trophy, UserRoundPlus } from 'lucide-react';
import type { NotificationCategory } from '@/modules/notifications/types/notification.types';
import type { LucideIcon } from 'lucide-react';

export const CATEGORY_ICONS: Record<NotificationCategory, LucideIcon> = {
  account: Bell,
  security: ShieldCheck,
  children: UserRoundPlus,
  testActivity: ClipboardCheck,
  testResults: Trophy,
};

export const GROUP_HEADING_CLASS =
  'pt-5 pb-1 text-meta font-semibold tracking-overline text-muted-foreground uppercase';

export const GHOST_BUTTON_CLASS =
  'min-h-11 rounded-full border-portal-input bg-card px-4.5 text-caption font-semibold text-foreground transition duration-200 ease-out-expo hover:border-foreground hover:bg-card active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100';

export const ROWS = [0, 1, 2, 3];

export const NOTE_ID = 'notification-locked-note';

export const MARK_ALL_CLASS =
  'inline-flex min-h-11 items-center rounded-lg px-1 text-body-sm font-semibold text-primary transition duration-200 ease-out-expo hover:text-blue-700 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-95 disabled:pointer-events-none disabled:opacity-45 motion-reduce:transition-none motion-reduce:active:scale-100';

export const TRACK_CLASS =
  'h-6.75! w-11.5! px-0.5 transition-colors duration-200 ease-out-expo after:-inset-x-3 after:-inset-y-2.5 data-checked:bg-navy-900 data-unchecked:bg-portal-input motion-reduce:transition-none';

export const KNOB_CLASS =
  '[&_[data-slot=switch-thumb]]:size-5.25! [&_[data-slot=switch-thumb]]:bg-card [&_[data-slot=switch-thumb]]:shadow-knob [&_[data-slot=switch-thumb]]:duration-200 [&_[data-slot=switch-thumb]]:ease-out-expo [&_[data-slot=switch-thumb]]:motion-reduce:transition-none';

export const HELPER_CLASSES = {
  warning: 'text-warning-ink',
  muted: 'text-body',
} as const;
