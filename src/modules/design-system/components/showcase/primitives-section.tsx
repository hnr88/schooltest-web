import { Pencil, Trash2 } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { IconButton } from '@/modules/design-system/components/icon-button';
import { PersonCell } from '@/modules/design-system/components/person-cell';
import { ScoreText } from '@/modules/design-system/components/score-text';
import { SubjectProgressCard } from '@/modules/design-system/components/subject-progress-card';
import { TimelineRow } from '@/modules/design-system/components/timeline-row';
import { PrimitivesDemo } from './primitives-demo';

async function PrimitivesSection() {
  const t = await getTranslations('DesignSystem');
  const percent = (value: number) => t('primitivePercent', { percent: value });

  return (
    <div data-slot="primitives-showcase" className="flex flex-col gap-8">
      <h3 className="text-xl font-bold tracking-tight">{t('sectionPrimitives')}</h3>
      <div className="flex flex-wrap items-center gap-4">
        <IconButton icon={Pencil} label={t('dropdownEdit')} size="sm" />
        <IconButton icon={Pencil} label={t('dropdownEdit')} />
        <IconButton icon={Pencil} label={t('dropdownEdit')} size="lg" />
        <IconButton icon={Pencil} label={t('dropdownEdit')} tone="soft" />
        <IconButton icon={Pencil} label={t('dropdownEdit')} tone="ghost" />
        <IconButton icon={Trash2} label={t('dropdownDelete')} tone="danger" />
        <PersonCell name={t('primitivePersonName')} secondary={t('primitivePersonRole')} />
        <ScoreText value={92} display={percent(92)} />
        <ScoreText value={71} display={percent(71)} />
        <ScoreText value={38} display={percent(38)} />
        <ScoreText value={null} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <SubjectProgressCard
          subject={t('primitiveSubjectMath')}
          value={91}
          valueLabel={percent(91)}
          progressLabel={t('progressLabel')}
          meta={t('primitiveSubjectMeta')}
        />
        <SubjectProgressCard
          subject={t('primitiveSubjectEnglish')}
          value={74}
          valueLabel={percent(74)}
          progressLabel={t('progressLabel')}
          meta={t('primitiveSubjectMeta')}
          tone="warning"
        />
      </div>
      <div className="flex flex-col rounded-panel border border-border bg-card px-6 py-2">
        <TimelineRow
          date={t('primitiveTimelineDate')}
          tag={t('primitiveSubjectMath')}
          title={t('tableRowMath')}
          trailing={<ScoreText value={92} display={percent(92)} />}
        />
        <TimelineRow
          date={t('primitiveTimelineDate')}
          tag={t('primitiveSubjectEnglish')}
          tagTone="amber"
          title={t('tableRowReading')}
          trailing={<ScoreText value={74} display={percent(74)} />}
        />
      </div>
      {/* The ToggleRows carry their own labels, not switchResults/switchShuffle: reusing
          those put two identically-named switches on one page — an a11y smell and a
          Playwright strict-mode trap. */}
      <PrimitivesDemo
        tabs={[
          { value: 'overview', label: t('tabsOverview') },
          { value: 'questions', label: t('tabsQuestions') },
          { value: 'results', label: t('tabsResults') },
        ]}
        tabsAriaLabel={t('sectionPrimitives')}
        resultsLabel={t('primitiveToggleResultsLabel')}
        resultsHint={t('primitiveToggleResultsHint')}
        shuffleLabel={t('primitiveToggleShuffleLabel')}
        shuffleHint={t('primitiveToggleShuffleHint')}
      />
    </div>
  );
}

export { PrimitivesSection };
