// Derived display values for the entitlement panel (C-ENT-01).

// Percentage used for a progress indicator; guards the divide when a plan
// carries a zero total (empty entitlement rows exist for prospect schools).
export function usagePercent(used: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((used / total) * 100));
}

// Spec: the "Contact SchoolTest to add seats" state shows only at the cap.
export function isSeatCapReached(seatsRemaining: number): boolean {
  return seatsRemaining === 0;
}
