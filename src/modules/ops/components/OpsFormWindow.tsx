'use client';

import { format, parseISO } from 'date-fns';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Alert, Badge, Button, Skeleton } from '@/modules/design-system';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { OpsFormWindowEditor } from '@/modules/ops/components/OpsFormWindowEditor';
import { useFormWindowData } from '@/modules/ops/hooks/use-form-window';
import { useAssessmentWindowCreateMutation } from '@/modules/ops/queries/use-assessment-window-create.mutation';
import { useResultWindowsQuery } from '@/modules/ops/queries/use-result-windows.query';
import { useClassesListQuery } from '@/modules/ops/queries/use-classes-list.query';
import { useFormsQuery } from '@/modules/ops/queries/use-forms.query';

import type { OpsFormWindowProps } from '@/modules/ops/types/components.types';
import { DATE_TIME } from '@/modules/ops/constants/components.constants';
import { windowKey } from '@/modules/ops/lib/ops-form-window.helpers';

// Ops form-window panel (task 68, C-WIN-01/02, mvp-updates 4.2; C-OPS-PORTAL-052
// read, OPS-062): which prebuilt form is live for this school's sittings, and
// when. The current window and its lock badge come from core finds; the save is
// the replace PUT. A locked form is not pre-hidden - the 400 FORM_LOCKED refusal
// surfaces as panel copy. Two stored-data states are reported rather than
// papered over: more than one window row for the school (no single window is
// live), and a row whose form relation is gone.
//
// Task 28 (D-WIN) adds the ASSESSMENT windows section beside this panel: the
// historical/scheduled result windows (C-OPS-PORTAL-054) and the scheduled
// window creation for selected classes (C-OPS-PORTAL-073). The legacy school
// form-window editor below is untouched — two window systems, two panels.
export function OpsFormWindow({ documentId }: OpsFormWindowProps) {
  const t = useTranslations('Ops.window');
  const win = useFormWindowData(documentId);

  if (win.isPending) {
    return (
      <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-24 w-full" />
      </section>
    );
  }

  if (win.isError) {
    return (
      <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
        <Alert
          variant="error"
          title={t('loadErrorTitle')}
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              loading={win.retrying}
              onClick={win.retry}
            >
              {t('retry')}
            </Button>
          }
        >
          {t('loadErrorDescription')}
        </Alert>
      </section>
    );
  }

  const current = win.currentWindow;
  const state = win.windowState;

  return (
    <section
      data-surface="ops-form-window"
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4"
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-foreground">{t('title')}</h2>
        <p className="text-sm text-body">{t('description')}</p>
      </div>
      {state.kind === 'conflict' ? (
        <div data-surface="ops-form-window-integrity">
          <Alert variant="error" title={t('integrityTitle')}>
            {t('integrityDescription', { count: state.documentIds.length })}
          </Alert>
        </div>
      ) : null}
      {state.kind === 'incomplete' ? (
        <div data-surface="ops-form-window-incomplete">
          <Alert variant="warning" title={t('incompleteTitle')}>
            {t('incompleteDescription')}
          </Alert>
        </div>
      ) : null}
      {current?.form ? (
        <div
          data-surface="ops-form-window-current"
          className="flex flex-col items-start gap-1 rounded-lg bg-muted p-3"
        >
          <p className="text-sm font-medium text-foreground">
            {t('currentForm', { formCode: current.form.form_code })}
          </p>
          <p className="text-sm text-body">
            {t('currentPeriod', {
              opens: format(parseISO(current.opens_at), DATE_TIME),
              closes: format(parseISO(current.closes_at), DATE_TIME),
            })}
          </p>
          {win.locked ? <Badge variant="error">{t('lockedBadge')}</Badge> : null}
        </div>
      ) : state.kind === 'none' ? (
        <p className="text-sm text-body">{t('currentNone')}</p>
      ) : null}
      <OpsFormWindowEditor
        key={windowKey(current)}
        schoolDocumentId={documentId}
        currentWindow={current}
        forms={win.forms}
      />
      <OpsResultWindowsSection schoolDocumentId={documentId} />
    </section>
  );
}

type WindowStatus = 'complete' | 'in_progress' | 'scheduled' | 'cancelled';

const STATUS_VARIANTS: Record<WindowStatus, 'success' | 'warning' | 'error' | 'default'> = {
  complete: 'success',
  in_progress: 'default',
  scheduled: 'warning',
  cancelled: 'error',
};

const WINDOW_SKILLS = ['reading', 'listening', 'speaking', 'writing'] as const;

/**
 * The assessment-window list and the scheduled-window creation form
 * (C-OPS-PORTAL-054/073). A pending score is its own figure
 * (`eligible - sat`) — never a zero — and `average_cefr` renders as its
 * unknown-state fallback (em dash) because the server can only send null.
 */
function OpsResultWindowsSection({ schoolDocumentId }: { schoolDocumentId: string }) {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<WindowStatus | undefined>(undefined);
  const [creating, setCreating] = useState(false);
  const windows = useResultWindowsQuery(schoolDocumentId, { page, pageSize: 25, status });

  if (windows.isPending) {
    return <Skeleton className="h-24 w-full rounded-lg" data-testid="ops-result-windows-loading" />;
  }
  if (windows.isError) {
    return (
      <div data-testid="ops-result-windows-error">
        <Alert variant="error" title="Result windows could not be loaded">
          The server refused or failed the read. Retry after the next reload — nothing was changed.
        </Alert>
      </div>
    );
  }
  const rows = windows.data?.data ?? [];
  const meta = windows.data?.meta.pagination;
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-background p-3" data-testid="ops-result-windows">
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-foreground">Result windows</h3>
        <p className="text-sm text-body">
          Historical and scheduled assessment windows for this school&apos;s classes. Sat counts official,
          non-invalidated attempts; pending scores are shown separately, never as zero.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setPage((current) => Math.max(1, current - 1))}
          disabled={!meta || page <= 1}
        >
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setPage((current) => (meta && page < meta.pageCount ? current + 1 : current))}
          disabled={!meta || page >= (meta.pageCount ?? 1)}
        >
          Next
        </Button>
        <span className="text-sm text-body">
          {meta ? `Page ${meta.page} of ${meta.pageCount} — ${meta.total} windows` : ''}
        </span>
        <Button type="button" size="sm" onClick={() => setCreating((open) => !open)}>
          {creating ? 'Close scheduler' : 'Schedule window'}
        </Button>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-body" data-testid="ops-result-windows-empty">
          No result windows yet. Schedule one to run official progress tests for selected classes.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((row) => (
            <li
              key={row.documentId}
              className="flex flex-col gap-1 rounded-lg bg-muted p-3"
              data-testid={`ops-result-window-${row.documentId}`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">{row.title}</span>
                <Badge variant={STATUS_VARIANTS[row.status] ?? 'default'}>{row.status}</Badge>
              </div>
              <p className="text-sm text-body">
                {format(parseISO(row.opens_at), DATE_TIME)} – {format(parseISO(row.closes_at), DATE_TIME)}
              </p>
              <p className="text-sm text-body">
                Sat {row.sat} of {row.eligible} · pending {Math.max(row.eligible - row.sat, 0)}
                {row.average_percentage === null
                  ? ''
                  : ` · average ${row.average_percentage}%`}
                {row.average_cefr === null ? ' · CEFR band pending' : ` · ${row.average_cefr}`}
              </p>
            </li>
          ))}
        </ul>
      )}
      {creating ? (
        <OpsAssessmentWindowCreateForm schoolDocumentId={schoolDocumentId} onDone={() => setCreating(false)} />
      ) : null}
    </div>
  );
}

type WindowFormBinding = { skill: 'reading' | 'listening' | 'speaking' | 'writing'; form_documentId: string };

const EMPTY_CREATE = {
  title: '',
  timezone: '',
  opens_at: '',
  closes_at: '',
};

/**
 * The scheduled-window creation form. Classes come from the EXISTING classes
 * list query (one consumer more, no duplicate), forms from the core forms
 * read, and the created row invalidates the list server-derived state. Every
 * field is real: no preselected classes, no invented timezone, no defaults the
 * operator did not type.
 */
function OpsAssessmentWindowCreateForm({
  schoolDocumentId,
  onDone,
}: {
  schoolDocumentId: string;
  onDone: () => void;
}) {
  const classes = useClassesListQuery(schoolDocumentId, { page: 1, pageSize: 200 }, true);
  const forms = useFormsQuery(true);
  const [title, setTitle] = useState('');
  const [timezone, setTimezone] = useState('');
  const [opensAt, setOpensAt] = useState('');
  const [closesAt, setClosesAt] = useState('');
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [bindings, setBindings] = useState<Record<string, string>>({});
  const create = useAssessmentWindowCreateMutation(schoolDocumentId);

  const chosenBindings = WINDOW_SKILLS.map((skill) => ({
    skill,
    form_documentId: bindings[skill] ?? '',
  })).filter((binding) => binding.form_documentId !== '');

  const submit = () => {
    create.mutate(
      {
        schoolDocumentId,
        body: {
          title: title.trim(),
          class_documentIds: selectedClasses,
          forms: chosenBindings.map((binding) => ({
            skill: binding.skill,
            form_documentId: binding.form_documentId,
          })),
          opens_at: new Date(opensAt).toISOString(),
          closes_at: new Date(closesAt).toISOString(),
          timezone: timezone.trim(),
        },
      },
      { onSuccess: () => onDone() }
    );
  };

  const invalid =
    title.trim() === '' ||
    timezone.trim() === '' ||
    opensAt === '' ||
    closesAt === '' ||
    selectedClasses.length === 0 ||
    chosenBindings.length === 0 ||
    create.isPending;

  return (
    <form
      className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3"
      data-testid="ops-assessment-window-create"
      onSubmit={(event) => {
        event.preventDefault();
        if (!invalid) submit();
      }}
    >
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-foreground">Title</span>
        <Input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={255} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-foreground">Timezone (IANA, e.g. Australia/Melbourne)</span>
        <Input value={timezone} onChange={(event) => setTimezone(event.target.value)} maxLength={100} />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground">Opens</span>
          <Input type="datetime-local" value={opensAt} onChange={(event) => setOpensAt(event.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground">Closes</span>
          <Input type="datetime-local" value={closesAt} onChange={(event) => setClosesAt(event.target.value)} />
        </label>
      </div>
      <fieldset className="flex flex-col gap-1">
        <legend className="text-sm font-medium text-foreground">Classes ({selectedClasses.length} selected)</legend>
        <div className="flex max-h-48 flex-col gap-1 overflow-y-auto rounded-lg border border-border p-2">
          {(classes.data?.data ?? []).map((row) => (
            <label key={row.documentId} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={selectedClasses.includes(row.documentId)}
                onCheckedChange={(checked) =>
                  setSelectedClasses((current) =>
                    checked
                      ? [...current, row.documentId]
                      : current.filter((id) => id !== row.documentId)
                  )
                }
              />
              {row.name ?? row.documentId}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="flex flex-col gap-1">
        <legend className="text-sm font-medium text-foreground">Forms per skill (1–4 skills)</legend>
        {WINDOW_SKILLS.map((skill) => (
          <label key={skill} className="flex items-center gap-2 text-sm">
            <span className="w-20 text-body">{skill}</span>
            <select
              className="rounded-md border border-border bg-background p-1 text-sm"
              value={bindings[skill] ?? ''}
              onChange={(event) => setBindings((current) => ({ ...current, [skill]: event.target.value }))}
            >
              <option value="">— no form —</option>
              {(forms.data ?? [])
                .filter((form) => form.skill === skill)
                .map((form) => (
                  <option key={form.documentId} value={form.documentId}>
                    {form.form_code}
                  </option>
                ))}
            </select>
          </label>
        ))}
      </fieldset>
      {create.isError ? (
        <Alert variant="error" title="The window was not scheduled">
          {conflictMessage(create.error)} — nothing was assigned.
        </Alert>
      ) : null}
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" loading={create.isPending} disabled={invalid}>
          Schedule
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

/** The 409/400 body is the shared error envelope — surface its message. */
function conflictMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message !== '') return message;
  }
  return 'The server refused the window.';
}
