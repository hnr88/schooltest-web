'use client';

import { useTranslations } from 'next-intl';

import type { SchoolsListStatusCounts } from '@schooltest/ops-contracts';

import { DIRECTORY_ALL } from '@/modules/ops/directory';

interface OpsSchoolsPillsProps {
  /** Whole-dataset tallies from `meta.status_counts`; undefined until loaded. */
  counts: SchoolsListStatusCounts | undefined;
  selected: string;
  onSelect: (value: string) => void;
}

/** Pill order and label key, exactly as the design writes them. */
const PILLS = [
  { value: DIRECTORY_ALL, countKey: 'all', labelKey: 'pillAllSchools' },
  { value: 'active', countKey: 'active', labelKey: 'portalStatus.active' },
  { value: 'trial', countKey: 'trial', labelKey: 'portalStatus.trial' },
  { value: 'pending_setup', countKey: 'pending_setup', labelKey: 'portalStatus.pending_setup' },
  { value: 'suspended', countKey: 'suspended', labelKey: 'portalStatus.suspended' },
  { value: 'archived', countKey: 'archived', labelKey: 'portalStatus.archived' },
] as const satisfies readonly {
  value: string;
  countKey: keyof SchoolsListStatusCounts;
  labelKey: string;
}[];

/**
 * The Schools status pill bar — the one control the directory kit has no
 * concept of, so it stays here rather than being pushed into the kit.
 *
 * The counts are the server's `meta.status_counts`, which apply every other
 * filter but NOT status: that is what lets a pill show how many schools the
 * operator would see if they clicked it, instead of collapsing to the current
 * selection. Nothing is counted client-side, so no number is ever the size of
 * the loaded page. Until the first response lands the counts are absent, and
 * the pills show no number rather than a zero they have not verified.
 */
export function OpsSchoolsPills({ counts, selected, onSelect }: OpsSchoolsPillsProps) {
  const t = useTranslations('Ops.schools');

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      data-slot="ops-schools-pills"
      role="group"
      aria-label={t('filterStatus')}
    >
      {PILLS.map((pill) => {
        const active = selected === pill.value;
        return (
          <button
            key={pill.value}
            type="button"
            aria-pressed={active}
            data-slot={`ops-schools-pill-${pill.value}`}
            onClick={() => onSelect(pill.value)}
            className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
              active
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-foreground hover:border-primary'
            }`}
          >
            {t(pill.labelKey)}
            {counts === undefined ? null : (
              <span className={active ? 'ml-2 opacity-80' : 'ml-2 text-muted-foreground'}>
                {counts[pill.countKey]}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
