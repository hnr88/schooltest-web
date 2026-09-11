'use client';

import { FileText, Sparkle } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Breadcrumbs } from '@/modules/teacher/components/v2/Breadcrumbs';
import { ClassBadge } from '@/modules/teacher/components/v2/ClassBadge';
import { PillSelect } from '@/modules/teacher/components/v2/PillSelect';
import { TeacherButton } from '@/modules/teacher/components/v2/TeacherButton';
import { TeacherStatusPill } from '@/modules/teacher/components/v2/TeacherStatusPill';
import { RESULTS_PATH } from '@/modules/teacher/constants/results.constants';
import { CLASS_STATUS_KEY } from '@/modules/teacher/constants/teacher-kit.constants';
import { classBadgeCode } from '@/modules/teacher/lib/teacher-kit';
import { useClassOverlaysStore } from '@/modules/teacher/stores/use-class-overlays-store';
import type { ClassResultsHeaderProps } from '@/modules/teacher/types/results-shell.types';

// The class-detail header (`Teacher Portal v2.dc.html:520–548`) over the ONE
// C-TD-1 card: breadcrumb, navy badge, name, meta, status pill, the two overlay
// buttons and the class switcher. The meta prints only what the card carries —
// `year_level` when set, `student_count` always; the design's "form A" has no
// source, so it is not drawn. The switcher is last in the DOM, where the
// design's `order:9` puts it on screen, so focus order follows the layout.
function ClassResultsHeader({ classCard, classes, onSwitchClass }: ClassResultsHeaderProps) {
  const t = useTranslations('TeacherPortal.classDetail');
  const openReports = useClassOverlaysStore((state) => state.openReports);
  const openAskAi = useClassOverlaysStore((state) => state.openAskAi);
  const year = classCard.year_level ?? null;
  const meta =
    year === null
      ? t('metaStudents', { count: classCard.student_count })
      : t('metaYearStudents', { year, count: classCard.student_count });

  return (
    <div data-slot="class-results-header" className="flex flex-col gap-4">
      <Breadcrumbs
        back={{ href: RESULTS_PATH, title: t('backTitle') }}
        items={[{ label: t('crumbClasses'), href: RESULTS_PATH }, { label: classCard.name }]}
      />
      <div className="flex flex-wrap items-center gap-[18px]">
        <ClassBadge code={classBadgeCode(classCard.name)} size="lg" tone="navy" />
        <div className="min-w-[220px] flex-1">
          <h1 className="text-[28px] font-medium tracking-[-0.02em] text-navy-900">{classCard.name}</h1>
          <p data-slot="class-meta" className="mt-1 text-[14px] text-[#6B7280]">
            {meta}
          </p>
        </div>
        <TeacherStatusPill status={CLASS_STATUS_KEY[classCard.status]} size="lg" className="flex-none" />
        <TeacherButton
          tone="outline"
          size="lg"
          data-slot="class-reports-button"
          className="flex-none"
          onClick={() => openReports()}
        >
          <FileText aria-hidden="true" className="size-4" strokeWidth={1.9} />
          {t('reports')}
        </TeacherButton>
        <TeacherButton
          tone="primary"
          size="lg"
          data-slot="class-ask-ai-button"
          title={t('askAiTitle')}
          className="flex-none"
          onClick={() => openAskAi()}
        >
          <Sparkle aria-hidden="true" className="size-4" strokeWidth={2} />
          {t('askAi')}
        </TeacherButton>
        <PillSelect
          size="lg"
          data-slot="class-switcher"
          label={t('switcherLabel')}
          value={classCard.class_document_id}
          options={classes.map((entry) => ({ value: entry.class_document_id, label: entry.name }))}
          onValueChange={onSwitchClass}
          className="flex-none"
        />
      </div>
    </div>
  );
}

export { ClassResultsHeader };
