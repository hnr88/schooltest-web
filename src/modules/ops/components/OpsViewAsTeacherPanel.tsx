'use client';

import { useTranslations } from 'next-intl';
import { ShieldAlert, X } from 'lucide-react';

import { Alert, Badge, Button, Skeleton } from '@/modules/design-system';
import { useViewAsTeacherQuery } from '@/modules/ops/queries/use-view-as-teacher.query';
import type { OpsViewAsTeacherPanelProps } from '@/modules/ops/types/inspection.types';

/**
 * Ledger row 11c / D-007 — the view-as-teacher read, rendered as an
 * EXPLICITLY LABELLED IMPERSONATION panel.
 *
 * The label is a product requirement, not copy polish: this surface shows one
 * operator what one named teacher sees, and every call leaves an
 * `api::audit-log` row (`view_as_teacher`, actor + target + timestamp) written
 * by the server. So the banner states three things the operator cannot miss —
 * that this is impersonation, WHOSE view it is, and that the access is
 * recorded. Nothing here mutates: it is a read of the teacher's own scope.
 *
 * The panel mounts on the row action's click, which is what triggers the
 * fetch; closing it unmounts and drops the payload (the query keeps no cache).
 * `monitors` is the C-SIT-02 payload verbatim and opaque by contract, so it is
 * reported as a count instead of being half-rendered from a guessed shape.
 */
export function OpsViewAsTeacherPanel({
  teacherDocumentId,
  teacherEmail,
  onClose,
}: OpsViewAsTeacherPanelProps) {
  const t = useTranslations('Ops.viewAsTeacher');
  const query = useViewAsTeacherQuery(teacherDocumentId);

  return (
    <section
      data-slot="ops-view-as-teacher-panel"
      data-surface="ops-view-as-teacher"
      data-teacher={teacherDocumentId}
      aria-label={t('panelLabel')}
      className="flex flex-col gap-3 rounded-lg border border-border bg-background p-3"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <ShieldAlert aria-hidden="true" className="mt-0.5 size-4 text-destructive" />
          <div className="flex flex-col gap-1">
            <p
              className="text-sm font-semibold text-foreground"
              data-slot="ops-view-as-teacher-impersonation-label"
            >
              {t('impersonationTitle')}
            </p>
            <p className="text-sm text-body" data-slot="ops-view-as-teacher-subject">
              {t('impersonationSubject', { teacher: teacherEmail ?? teacherDocumentId })}
            </p>
            <p className="text-xs text-muted-foreground" data-slot="ops-view-as-teacher-audited">
              {t('auditedNotice')}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          data-slot="ops-view-as-teacher-close"
          aria-label={t('close')}
          onClick={onClose}
        >
          <X aria-hidden="true" className="size-4" />
          {t('close')}
        </Button>
      </div>

      {query.isPending ? (
        <div className="flex flex-col gap-2" data-slot="ops-view-as-teacher-loading">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : query.isError || query.data === undefined ? (
        <Alert variant="error" title={t('errorTitle')}>
          {t('errorDescription')}
        </Alert>
      ) : (
        <div className="flex flex-col gap-3" data-slot="ops-view-as-teacher-payload">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge variant="default" data-slot="ops-view-as-teacher-class-count">
              {t('classCount', { count: query.data.classes.length })}
            </Badge>
            <Badge variant="default" data-slot="ops-view-as-teacher-sitting-count">
              {t('sittingCount', { count: query.data.sittings.length })}
            </Badge>
            <Badge variant="default" data-slot="ops-view-as-teacher-monitor-count">
              {t('monitorCount', { count: query.data.monitors.length })}
            </Badge>
          </div>

          {query.data.classes.length === 0 ? (
            <p className="text-sm text-body" data-slot="ops-view-as-teacher-no-classes">
              {t('noClasses')}
            </p>
          ) : (
            <ul className="flex flex-col gap-1" data-slot="ops-view-as-teacher-classes">
              {query.data.classes.map((row) => (
                <li
                  key={row.documentId}
                  data-slot="ops-view-as-teacher-class"
                  data-class={row.documentId}
                  className="flex flex-wrap items-center gap-2 text-sm text-body"
                >
                  <span className="font-medium text-foreground">{row.name ?? row.documentId}</span>
                  <span>{t('classMeta', { yearBand: row.year_band ?? '—' })}</span>
                  <span>{t('studentCount', { count: row.student_count })}</span>
                </li>
              ))}
            </ul>
          )}

          {query.data.sittings.length === 0 ? (
            <p className="text-sm text-body" data-slot="ops-view-as-teacher-no-sittings">
              {t('noSittings')}
            </p>
          ) : (
            <ul className="flex flex-col gap-1" data-slot="ops-view-as-teacher-sittings">
              {query.data.sittings.map((row) => (
                <li
                  key={row.documentId}
                  data-slot="ops-view-as-teacher-sitting"
                  className="flex flex-wrap items-center gap-2 text-sm text-body"
                >
                  <span className="font-medium text-foreground">{row.code ?? row.documentId}</span>
                  <span>{row.status}</span>
                  <span>{row.class?.name ?? '—'}</span>
                  <span>{row.form?.form_code ?? '—'}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
