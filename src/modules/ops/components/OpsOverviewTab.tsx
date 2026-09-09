'use client';

import { useTranslations } from 'next-intl';

import { KeyValueList, KeyValueRow } from '@/modules/design-system';
import { portalPlanLabelKey } from '@/modules/ops/lib/portal-lifecycle.lib';
import { OpsSchoolActivity } from '@/modules/ops/components/OpsSchoolActivity';

import type { SchoolDetail } from '@schooltest/ops-contracts';

/**
 * The Overview tab body (`Ops Portal.dc.html:322-350`): the design's six-row
 * "School details" card with its inline Edit, beside the activity feed.
 *
 * ops/12 (D-29): lifted out of OpsSchoolTables.tsx; pass two reshaped the
 * profile list from the old seven rows to the design's six — "Last activity"
 * became a stat card and "Plan" joined the list. Null values keep the
 * `t('unknown')` copy (D-33): unknown phone and last activity are NULL and
 * render as "unavailable", never a placeholder that reads like a value.
 *
 * The inline Edit opens the school form by activating the page-header Edit
 * control (`data-testid="ops-edit-school"`), which owns the write gate — the
 * same click-through pattern the invitation panel uses for its onboard
 * actions.
 */
export function OpsOverviewTab({ school }: { school: SchoolDetail }) {
  const t = useTranslations('Ops.schoolTables');
  const tDetail = useTranslations('Ops.detail');
  const tSchools = useTranslations('Ops.schools');

  const location = [school.suburb, school.state]
    .filter((part): part is string => Boolean(part))
    .join(' ');
  const plan = school.portal_plan
    ? `${tSchools(portalPlanLabelKey(school.portal_plan))} ${tSchools('planSuffix')}`
    : null;

  const rows = [
    {
      label: t('fieldSector'),
      value: school.sector ? tSchools(`sector.${school.sector}`) : t('unknown'),
    },
    { label: t('fieldLocation'), value: location !== '' ? location : t('unknown') },
    {
      label: t('fieldPlan'),
      value: plan ?? t('unknown'),
    },
    { label: t('fieldContact'), value: school.contact_name ?? t('unknown') },
    { label: t('fieldEmail'), value: school.contact_email ?? t('unknown') },
    { label: t('fieldPhone'), value: school.phone ?? t('unknown') },
  ];

  const openEdit = () => {
    document.querySelector<HTMLButtonElement>('[data-testid="ops-edit-school"]')?.click();
  };

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section data-slot="ops-overview-details" className="rounded-card bg-card p-7 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-foreground">{tDetail('detailsCardTitle')}</h2>
          <button
            type="button"
            data-testid="ops-overview-edit"
            onClick={openEdit}
            className="text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none"
          >
            {tDetail('detailsEditLabel')}
          </button>
        </div>
        <KeyValueList>
          {rows.map((row) => (
            <KeyValueRow key={row.label} label={row.label}>
              {row.value}
            </KeyValueRow>
          ))}
        </KeyValueList>
      </section>
      <OpsSchoolActivity documentId={school.documentId} />
    </div>
  );
}
