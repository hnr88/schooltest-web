'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { CarerReportPreview } from '@/modules/teacher/components/CarerReportPreview';
import { FamilyReportDialogs } from '@/modules/teacher/components/FamilyReportDialogs';
import { FamilyReportRowItem } from '@/modules/teacher/components/FamilyReportRowItem';
import { FamilyReportsSummary } from '@/modules/teacher/components/FamilyReportsSummary';
import { FilterPills } from '@/modules/teacher/components/v2/FilterPills';
import { TeacherButton } from '@/modules/teacher/components/v2/TeacherButton';
import { FAMILY_FILTERS } from '@/modules/teacher/constants/family-reports.constants';
import { useFamilyReportActions } from '@/modules/teacher/hooks/useFamilyReportActions';
import { carerReport } from '@/modules/teacher/lib/v2/carer-report';
import { familyReportRow, familyReportRows } from '@/modules/teacher/lib/v2/family-reports';
import { useTeacherDashboardQuery } from '@/modules/teacher/queries/use-teacher-dashboard.query';
import type { FamilyFilter, FamilyReportsPanelProps } from '@/modules/teacher/types/v2-family.types';

function FamilyReportsPanel({ classDocumentId, rows }: FamilyReportsPanelProps) {
  const t = useTranslations('TeacherPortal.familyReports');
  const [filter, setFilter] = useState<FamilyFilter>('all');
  const [previewId, setPreviewId] = useState<string | null>(null);
  const dashboard = useTeacherDashboardQuery();
  const className = dashboard.data?.classes.find((entry) => entry.class_document_id === classDocumentId)?.name ?? '';
  const view = familyReportRows(rows, { filter });
  const actions = useFamilyReportActions(rows, view.releasableResultIds);
  const previewRow = rows.find((row) => row.result !== null && row.result.document_id === previewId);
  const previewResult = previewRow?.result ?? null;
  const preview = previewRow !== undefined && previewResult !== null ? carerReport(previewResult, previewRow.student) : null;

  const askFromPreview = (kind: 'release' | 'recall'): void => {
    if (previewRow === undefined) return;
    const row = familyReportRow(previewRow);
    setPreviewId(null);
    if (kind === 'release') actions.askRelease(row);
    else actions.askRecall(row);
  };

  return (
    <section
      data-slot="family-reports"
      data-status={rows.length === 0 ? 'empty' : 'ready'}
      aria-labelledby="family-reports-title"
      className="flex flex-col gap-[18px] leading-[normal]"
    >
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="min-w-0">
          <h2 id="family-reports-title" className="text-[20px] font-semibold text-navy-900">
            {t('title')}
          </h2>
          <p className="mt-1.5 text-[13.5px] text-[#6B7280]">{t('subtitle', { className })}</p>
        </div>
        <TeacherButton
          tone="primary"
          size="lg"
          data-action="release-held"
          className="rounded-[9px] px-[17px]"
          onClick={actions.askReleaseAll}
        >
          {t('releaseHeld', { count: view.releasableResultIds.length })}
        </TeacherButton>
      </div>
      <FamilyReportsSummary counts={view.counts} banner={view.banner} />
      <FilterPills
        label={t('filters.label')}
        value={filter}
        options={FAMILY_FILTERS.map((value) => ({ value, label: t(`filters.${value}`) }))}
        onValueChange={(value) => {
          const next = FAMILY_FILTERS.find((entry) => entry === value);
          if (next !== undefined) setFilter(next);
        }}
      />
      <div
        role={view.rows.length === 0 ? undefined : 'list'}
        aria-label={view.rows.length === 0 ? undefined : t('listLabel')}
        className="overflow-hidden rounded-[11px] border border-[#ECEEF2]"
      >
        {view.rows.length === 0 ? (
          <p className="px-5 py-[34px] text-[13.5px] text-[#6B7280]">{t('empty')}</p>
        ) : (
          view.rows.map((row) => (
            <FamilyReportRowItem
              key={row.studentDocumentId}
              row={row}
              onPreview={() => setPreviewId(row.resultDocumentId)}
              onRelease={() => actions.askRelease(row)}
              onRecall={() => actions.askRecall(row)}
            />
          ))
        )}
      </div>
      {preview === null ? null : (
        <CarerReportPreview
          report={preview}
          classDocumentId={classDocumentId}
          className={className}
          onClose={() => setPreviewId(null)}
          onRelease={() => askFromPreview('release')}
          onRecall={() => askFromPreview('recall')}
        />
      )}
      <FamilyReportDialogs
        actions={actions}
        counts={view.counts}
        heldCount={view.releasableResultIds.length}
        className={className}
      />
    </section>
  );
}

export { FamilyReportsPanel };
