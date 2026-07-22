'use client';

import { cn } from '@/lib/utils';
import { Switch } from '@/modules/design-system';

// PortalToggle (.qa/design/spec/03 §1.4): a 46×27 r999 track whose background
// transitions over .2s between #D8DFEA and #0E2350, carrying a 21px white knob at a
// 3px inset with box-shadow 0 1px 3px rgba(14,35,80,.25) and 19px of travel.
// The design animates the knob's `left`; this animates TRANSFORM for the identical
// result — the primitive's own `translate-x-[calc(100%-2px)]` is 21 − 2 = 19px, the
// design's travel exactly. The 1px transparent border of the primitive is absorbed by
// a 2px side padding so the drawn inset is still 3px on both ends.
// Geometry overrides carry `!` because the primitive states them behind
// data-[size=default] / group variants that out-specify a plain utility.
const TRACK_CLASS =
  'h-6.75! w-11.5! px-0.5 transition-colors duration-200 ease-out-expo after:-inset-x-3 after:-inset-y-2.5 data-checked:bg-navy-900 data-unchecked:bg-portal-input motion-reduce:transition-none';

const KNOB_CLASS =
  '[&_[data-slot=switch-thumb]]:size-5.25! [&_[data-slot=switch-thumb]]:bg-card [&_[data-slot=switch-thumb]]:shadow-knob [&_[data-slot=switch-thumb]]:duration-200 [&_[data-slot=switch-thumb]]:ease-out-expo [&_[data-slot=switch-thumb]]:motion-reduce:transition-none';

interface PortalSwitchProps {
  id: string;
  checked: boolean;
  disabled?: boolean;
  labelledById: string;
  describedById?: string;
  onCheckedChange: (checked: boolean) => void;
}

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
