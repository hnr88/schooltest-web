import type { PlatformSettingsForm } from '@/modules/ops/types/platform-settings.types';

export interface SettingsGroup {
  readonly id: string;
  readonly fields: readonly (keyof PlatformSettingsForm)[];
}
