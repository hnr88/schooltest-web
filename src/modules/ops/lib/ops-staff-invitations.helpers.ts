import {
  staffInvitationInvitedDaysAgo,
  type StaffInvitationRole,
  type StaffInvitationRow,
  type StaffInvitationStatus,
} from '@schooltest/ops-contracts';

import type { StatusPillTone } from '@/modules/design-system';

export const STAFF_INVITATION_STATUSES: readonly StaffInvitationStatus[] = [
  'invited',
  'accepted',
  'expired',
  'revoked',
];

export const STAFF_INVITATION_ROLES: readonly StaffInvitationRole[] = ['school_admin', 'teacher'];

/**
 * The reference palette (Ops Portal.dc.html statusStyle): Invited is the amber
 * "Pending setup" pair, an accepted invitation is the green Active pair, a
 * revoked one the red Suspended pair, and a lapsed one the grey Archived
 * fallback. Kept as the design-system tone names so the tokens stay single-source.
 */
const STATUS_TONES: Record<StaffInvitationStatus, StatusPillTone> = {
  invited: 'warning',
  accepted: 'success',
  expired: 'neutral',
  revoked: 'danger',
};

export function staffInvitationTone(status: StaffInvitationStatus | null): StatusPillTone {
  return status === null ? 'neutral' : STATUS_TONES[status];
}

/**
 * The pictured row subtitle age, in whole days. Null means the invitation has
 * no recorded creation instant — the UI says so rather than printing "0 days",
 * and `expires_at` is never substituted for it.
 */
export function staffInvitationAgeDays(row: StaffInvitationRow, nowMs: number): number | null {
  return staffInvitationInvitedDaysAgo(row.invited_at, nowMs);
}

/** The single pictured avatar initial. Falls back to the email, then to nothing. */
export function staffInvitationInitial(row: StaffInvitationRow): string {
  const source = row.display_name ?? row.email ?? '';
  const first = source.trim().charAt(0);
  return first === '' ? '·' : first.toUpperCase();
}
