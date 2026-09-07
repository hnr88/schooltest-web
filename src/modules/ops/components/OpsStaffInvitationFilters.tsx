'use client';

import { useTranslations } from 'next-intl';

import { FilterChipGroup } from '@/modules/design-system';
import { STAFF_INVITATION_FILTER_ALL } from '@/modules/ops/hooks/use-staff-invitations-filter';
import {
  STAFF_INVITATION_ROLES,
  STAFF_INVITATION_STATUSES,
} from '@/modules/ops/lib/ops-staff-invitations.helpers';

import type { OpsStaffInvitationFiltersProps } from '@/modules/ops/types/staff-invitations.types';

// The pictured chip row: "All" plus one chip per value, exactly the chip shape
// the reference tabs use. Both groups are SERVER filters — see
// use-staff-invitations-filter.ts for why that matters to the counts.
export function OpsStaffInvitationFilters({
  role,
  status,
  onRoleChange,
  onStatusChange,
}: OpsStaffInvitationFiltersProps) {
  const t = useTranslations('Ops.staffInvitations');

  const chips = (values: readonly string[], prefix: string) => [
    { value: STAFF_INVITATION_FILTER_ALL, label: t('filterAll') },
    ...values.map((value) => ({ value, label: t(`${prefix}.${value}`) })),
  ];

  return (
    <div className="flex flex-wrap gap-3" data-slot="ops-staff-invitations-filters">
      <FilterChipGroup
        options={chips(STAFF_INVITATION_ROLES, 'role')}
        value={role}
        onValueChange={onRoleChange}
        ariaLabel={t('filterRole')}
      />
      <FilterChipGroup
        options={chips(STAFF_INVITATION_STATUSES, 'status')}
        value={status}
        onValueChange={onStatusChange}
        ariaLabel={t('filterStatus')}
      />
    </div>
  );
}
