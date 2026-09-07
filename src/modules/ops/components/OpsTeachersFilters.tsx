'use client';

import { useTranslations } from 'next-intl';

import { FieldShell, FilterChipGroup, Input } from '@/modules/design-system';
import {
  OPS_TEACHERS_FILTER_ALL,
  type OpsTeachersFiltersProps,
  type OpsTeachersRoleFilter,
  type OpsTeachersStatusFilter,
} from '@/modules/ops/types/teachers-list.types';

// C-OPS-PORTAL-021 directory controls: the reference's search box plus the two
// chip rows (role, status). Every control maps to a query parameter the API
// validates — nothing filters client-side, so a search reaches every eligible
// candidate rather than the rows that happen to be on screen.
export function OpsTeachersFilters({
  q,
  role,
  status,
  onQChange,
  onRoleChange,
  onStatusChange,
}: OpsTeachersFiltersProps) {
  const t = useTranslations('Ops.teachers');

  return (
    <div className="flex flex-col gap-3" data-slot="ops-teachers-filters">
      <FieldShell id="ops-teachers-search" label={t('searchLabel')}>
        <Input
          id="ops-teachers-search"
          type="search"
          value={q}
          data-slot="ops-teachers-search"
          onChange={(event) => onQChange(event.target.value)}
        />
      </FieldShell>
      <div className="flex flex-wrap gap-4">
        <FilterChipGroup
          ariaLabel={t('roleFilterLabel')}
          value={role}
          onValueChange={(next) => onRoleChange(next as OpsTeachersRoleFilter)}
          options={[
            { value: OPS_TEACHERS_FILTER_ALL, label: t('roleAll') },
            { value: 'teacher', label: t('roleTeacher') },
            { value: 'school_admin', label: t('roleSchoolAdmin') },
          ]}
        />
        <FilterChipGroup
          ariaLabel={t('statusFilterLabel')}
          value={status}
          onValueChange={(next) => onStatusChange(next as OpsTeachersStatusFilter)}
          options={[
            { value: OPS_TEACHERS_FILTER_ALL, label: t('statusAll') },
            { value: 'active', label: t('statusActive') },
            { value: 'suspended', label: t('statusSuspended') },
          ]}
        />
      </div>
    </div>
  );
}
