import { NotificationPreferencesPanel } from '@/modules/notifications';
import { AuthSettingsPanel } from '@/modules/settings/components/AuthSettingsPanel';
import { SearchPreferencesForm } from '@/modules/settings/components/SearchPreferencesForm';
import { AlertTriangle, Info, OctagonAlert } from 'lucide-react';
import type { SettingsTab } from '@/modules/settings/types/settings.types';
import type { JSX } from 'react';

export const SAVE_AFFORDANCE = '[&_form>div:last-child]:justify-start';

export const LEVEL_STYLES = {
  info: 'bg-blue-50 text-navy-800',
  warning: 'bg-amber-50 text-amber-900',
  critical: 'bg-red-50 text-red-900',
} as const;

export const LEVEL_ICONS = { info: Info, warning: AlertTriangle, critical: OctagonAlert } as const;

export const SETTINGS_PANELS: Record<SettingsTab, () => JSX.Element> = {
  auth: AuthSettingsPanel,
  search: SearchPreferencesForm,
  notifications: NotificationPreferencesPanel,
};

export const IDLE_INK_ON_WELL =
  '[&_[data-slot=tabs-trigger]:not([data-active])]:text-body [&_[data-slot=tabs-trigger]:not([data-active]):hover]:text-foreground';
