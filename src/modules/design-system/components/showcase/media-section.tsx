import { MapPin, School } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { EmptyState } from '@/modules/design-system/components/empty-state';
import { Section } from '@/modules/design-system/components/layout';
import { MapPanelFrame } from '@/modules/design-system/components/map-panel-frame';
import { MediaCard } from '@/modules/design-system/components/media-card';
import { MediaCover } from '@/modules/design-system/components/media-cover';
import { Badge } from '@/modules/design-system/components/badge';
import { StatusPill } from '@/modules/design-system/components/status-pill';
import { FilterRailDemo } from './filter-rail-demo';

const COVER_SIZES = '(min-width: 1024px) 22rem, 100vw';

async function MediaSection() {
  const t = await getTranslations('DesignSystem');
  return (
    <Section id="media" className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight">{t('sectionMedia')}</h2>
        <p className="max-w-2xl text-body-sm text-muted-foreground">{t('mediaIntro')}</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <MediaCard
          title={t('mediaCardTitle')}
          badges={<Badge variant="secondary">{t('mediaCardBadge')}</Badge>}
          description={t('mediaCardDescription')}
          meta={<span>{t('mediaCardMeta')}</span>}
          cover={
            <MediaCover
              src="/brand/hero-field.webp"
              alt={t('mediaCoverAlt')}
              sizes={COVER_SIZES}
              overlayEnd={<StatusPill tone="success">{t('mediaCardOpen')}</StatusPill>}
            />
          }
        />
        <MediaCard
          title={t('mediaCardNoImageTitle')}
          badges={<Badge variant="secondary">{t('mediaCardBadge')}</Badge>}
          description={t('mediaCardNoImageDescription')}
          meta={<span>{t('mediaCardNoImageMeta')}</span>}
          cover={<MediaCover icon={School} alt={t('mediaCoverEmptyAlt')} sizes={COVER_SIZES} />}
        />
        <MediaCard
          selected
          title={t('mediaCardFlatTitle')}
          description={t('mediaCardFlatDescription')}
          meta={<span>{t('mediaCardMeta')}</span>}
          trailing={t('choicePackSinglePrice')}
        />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <FilterRailDemo
          title={t('filterRailTitle')}
          clearLabel={t('filterRailClear')}
          sectorLabel={t('filterRailSector')}
          sectorOptions={[
            { value: 'public', label: t('filterSectorPublic') },
            { value: 'private', label: t('filterSectorPrivate') },
          ]}
          stageLabel={t('filterRailStage')}
          stageOptions={[
            { value: 'primary', label: t('filterStagePrimary') },
            { value: 'secondary', label: t('filterStageSecondary') },
          ]}
          applyLabel={t('filterRailApply')}
        />
        <MapPanelFrame label={t('mapPanelLabel')} sticky={false} className="min-h-80 lg:col-span-2">
          <EmptyState
            icon={MapPin}
            tone="brand"
            title={t('mapPanelEmptyTitle')}
            description={t('mapPanelEmptyBody')}
            className="h-full border-0"
          />
        </MapPanelFrame>
      </div>
    </Section>
  );
}

export { MediaSection };
