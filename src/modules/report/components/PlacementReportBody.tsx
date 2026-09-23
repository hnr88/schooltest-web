'use client';

import { useTranslations } from 'next-intl';

import type { ResultView } from '@schooltest/scoring-contracts';

import { LegacyReportBody } from '@/modules/report/components/LegacyReportBody';
import { TeacherReportBody } from '@/modules/report/components/TeacherReportBody';
import { buildAttributePanel } from '@/modules/report/lib/attribute-view-model';
import type { LegacyResultView } from '@/modules/report/schemas/result-view.schema';

function CurrentModelChild({ result }: { result: ResultView }) {
  const attributes = buildAttributePanel(result);
  const evidence = attributes.state === 'rows' ? attributes.evidence : null;
  return <TeacherReportBody result={result} attributes={attributes} evidence={evidence} />;
}

export function PlacementReportBody({ view }: { view: LegacyResultView }) {
  const t = useTranslations('Report');

  return (
    <section data-surface="placement-report" className="flex w-full flex-col gap-8">
      {(view.combined_children ?? []).map((child) => (
        <article
          key={child.document_id}
          data-slot="placement-child"
          data-skill={child.skill ?? undefined}
          className="flex flex-col gap-4"
        >
          <p className="text-caption font-bold uppercase tracking-wide text-muted-foreground">
            {child.skill ? t(`skills.${child.skill}`) : t('skillCombined')}
          </p>
          {'overall' in child ? <CurrentModelChild result={child} /> : <LegacyReportBody view={child} />}
        </article>
      ))}
    </section>
  );
}
