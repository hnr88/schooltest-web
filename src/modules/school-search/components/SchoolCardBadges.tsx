'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { SECTOR_LABEL_KEYS } from '@/modules/school-search/constants/school-search.constants';
import { SECTOR_TONE, pillVariants } from '@/modules/school-search/lib/school-badge-variants';
import type {
  SchoolHit,
  SectorValue,
  StateCode,
} from '@/modules/school-search/types/school-search.types';

function SchoolSectorPill({ sector }: { sector: SectorValue | null }) {
  const t = useTranslations('SchoolSearch');
  if (!sector) return null;
  return (
    <span
      className={cn(
        pillVariants({ tone: SECTOR_TONE[sector] }),
        'font-bold tracking-wide uppercase',
      )}
    >
      {t(`sectors.${SECTOR_LABEL_KEYS[sector]}`)}
    </span>
  );
}

function SchoolStateBadge({ state }: { state: StateCode | null }) {
  if (!state) return null;
  return <span className={pillVariants({ tone: 'outline' })}>{state}</span>;
}

function SchoolCardBadges({ hit }: { hit: SchoolHit }) {
  const t = useTranslations('SchoolSearch');
  return (
    <div className="flex flex-wrap gap-1.5">
      {hit.schoolType ? (
        <span className={pillVariants({ tone: 'neutral' })}>
          {t(`schoolTypes.${hit.schoolType}`)}
        </span>
      ) : null}
      {hit.cricosCode != null ? (
        <span className={pillVariants({ tone: 'info' })}>{t('badges.cricos')}</span>
      ) : null}
      {hit.scholarshipAvailable ? (
        <span className={pillVariants({ tone: 'teal' })}>{t('badges.scholarships')}</span>
      ) : null}
      {hit.elicosEslSupport ? (
        <span className={pillVariants({ tone: 'info' })}>{t('badges.elicos')}</span>
      ) : null}
    </div>
  );
}

export { SchoolCardBadges, SchoolSectorPill, SchoolStateBadge };
