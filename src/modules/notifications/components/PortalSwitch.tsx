'use client';

import { cn } from '@/lib/utils';
import { Switch } from '@/modules/design-system';

import type { PortalSwitchProps } from '@/modules/notifications/types/components.types';
import { KNOB_CLASS, TRACK_CLASS } from '@/modules/notifications/constants/components.constants';

export function PortalSwitch({
  id,
  checked,
  disabled = false,
  labelledById,
  describedById,
  onCheckedChange,
}: PortalSwitchProps) {
  return (
    <Switch
      id={id}
      checked={checked}
      disabled={disabled}
      aria-labelledby={labelledById}
      aria-describedby={describedById}
      onCheckedChange={(next) => onCheckedChange(next)}
      className={cn(TRACK_CLASS, KNOB_CLASS)}
    />
  );
}
