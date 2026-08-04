// Canonical switch geometry: 42x24 track, 18px knob, 3px inset; the 3px side
// padding + 1px transparent border make the primitive's own
// `translate-x(100% - 2px)` land exactly on the canonical travel. The geometry
// overrides are marked important because the primitive states them behind
// data-[size=default]/group variants that out-specify a plain utility.
export const SWITCH_CLASSES =
  'h-6! w-10.5! px-0.75 after:-inset-y-3 [&_[data-slot=switch-thumb]]:size-4.5! [&_[data-slot=switch-thumb]]:bg-card [&_[data-slot=switch-thumb]]:shadow-sm';
