import { useTranslations } from 'next-intl';

import { KpiCard } from '@/modules/teacher/components/v2/KpiCard';
import { FAMILY_TILES } from '@/modules/teacher/constants/family-reports.constants';
import type { FamilyReportsSummaryProps } from '@/modules/teacher/types/v2-family.types';

function FamilyReportsSummary({ counts, banner }: FamilyReportsSummaryProps) {
  const t = useTranslations('TeacherPortal.familyReports');
  const bannerText =
    banner === null
      ? null
      : banner.kind === 'complete'
        ? t('banner.complete')
        : [
            banner.open > 0 ? t('banner.open', { count: banner.open }) : null,
            banner.blocked > 0 ? t('banner.blocked', { count: banner.blocked }) : null,
            t('banner.gaps'),
          ]
            .filter((part) => part !== null)
            .join(' ');

  return (
    <>
      <div data-slot="family-report-tiles" className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3">
        {FAMILY_TILES.map((tile) => (
          <KpiCard
            key={tile.key}
            variant="count"
            tone={tile.tone}
            label={t(`tiles.${tile.key}`)}
            value={String(counts[tile.key])}
          />
        ))}
      </div>
      {banner === null ? null : (
        <p
          data-slot="family-report-banner"
          data-kind={banner.kind}
          className="box-content max-w-[96ch] rounded-[10px] border px-[18px] py-[15px] text-[13px] leading-[1.55]"
          style={{ color: banner.tone.fg, backgroundColor: banner.tone.bg, borderColor: banner.tone.border }}
        >
          {bannerText}
        </p>
      )}
    </>
  );
}

export { FamilyReportsSummary };
