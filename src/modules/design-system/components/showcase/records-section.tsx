import { Info } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { BorderedCallout } from '@/modules/design-system/components/bordered-callout';
import { Button } from '@/modules/design-system/components/button';
import { GlassStatTile } from '@/modules/design-system/components/glass-stat-tile';
import { KeyValueList, KeyValueRow } from '@/modules/design-system/components/key-value-row';
import { Section } from '@/modules/design-system/components/layout';
import { NavyPanel } from '@/modules/design-system/components/navy-panel';
import { NavyPromoCard } from '@/modules/design-system/components/navy-promo-card';
import { NotesCard } from '@/modules/design-system/components/notes-card';
import { PanelHeaderRow } from '@/modules/design-system/components/panel-header-row';
import { SkeletonCard } from '@/modules/design-system/components/skeleton-card';
import { TintTile } from '@/modules/design-system/components/tint-tile';
import { RecordRows } from './record-rows';

async function RecordsSection() {
  const t = await getTranslations('DesignSystem');
  return (
    <Section id="records" className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight">{t('sectionRecords')}</h2>
        <p className="max-w-2xl text-body-sm text-muted-foreground">{t('recordsIntro')}</p>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <section className="flex flex-col gap-3 rounded-panel border border-border bg-card p-5.5 shadow-sm">
          <PanelHeaderRow
            title={t('recordEnrolmentTitle')}
            description={t('recordEnrolmentDescription')}
            action={
              <Button variant="link" size="sm" className="min-h-11 px-0">
                {t('recordEnrolmentAction')}
              </Button>
            }
          />
          <KeyValueList>
            <KeyValueRow label={t('recordYearLevel')}>{t('recordYearLevelValue')}</KeyValueRow>
            <KeyValueRow label={t('recordNationality')}>{t('recordNationalityValue')}</KeyValueRow>
            <KeyValueRow label={t('recordTargetEntry')}>{t('recordTargetEntryValue')}</KeyValueRow>
          </KeyValueList>
        </section>
        <NavyPanel
          eyebrow={t('recordCreditsEyebrow')}
          value={t('recordCreditsValue')}
          caption={t('recordCreditsCaption')}
          action={
            <Button variant="accent" size="sm" className="min-h-11 px-4">
              {t('recordCreditsAction')}
            </Button>
          }
        >
          <div className="mt-1 grid grid-cols-2 gap-2.5">
            <GlassStatTile value={t('recordGlassCorrectValue')} label={t('recordGlassCorrect')} />
            <GlassStatTile
              tone="accent"
              value={t('recordGlassBandValue')}
              label={t('recordGlassBand')}
            />
          </div>
        </NavyPanel>
        <NavyPromoCard
          title={t('recordPromoTitle')}
          body={t('recordPromoBody')}
          watermarkSrc="/brand/logo-mark.png"
          action={
            <Button variant="accent" size="sm" className="min-h-11 px-4">
              {t('recordPromoAction')}
            </Button>
          }
        />
      </div>
      <BorderedCallout icon={Info}>{t('recordCalloutBody')}</BorderedCallout>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <TintTile>{t('recordTintInset')}</TintTile>
        <TintTile tone="well">{t('recordTintWell')}</TintTile>
        <TintTile tone="brand">{t('recordTintBrand')}</TintTile>
        <TintTile tone="accent">{t('recordTintAccent')}</TintTile>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <NotesCard
          title={t('recordNoteTitle')}
          author={t('recordNoteAuthor')}
          timestamp={t('recordNoteTime')}
        >
          {t('recordNoteBody')}
        </NotesCard>
        <SkeletonCard />
      </div>
      <RecordRows />
    </Section>
  );
}

export { RecordsSection };
