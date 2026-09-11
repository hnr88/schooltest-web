'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

import {
  Alert,
  Input,
  OPS_CONTROL_CLASS,
  OpsDialog,
  OpsDialogBody,
  OpsDialogCancel,
  OpsDialogContent,
  OpsDialogCta,
  OpsDialogFooter,
  OpsDialogHeader,
  OpsFieldShell,
  SelectField,
  Skeleton,
} from '@/modules/design-system';
import { showOpsToast, useOpsWriteGate } from '@/modules/ops/actions';
import { OpsTeacherPicker } from '@/modules/ops/components/OpsTeacherPicker';
import { YEAR_BANDS } from '@/modules/classes/constants/year-bands.constants';
import { classesListQueryKey, useClassesListQuery } from '@/modules/ops/queries/use-classes-list.query';
import { opsClassDetailQueryKey, useOpsClassDetailQuery } from '@/modules/ops/queries/use-ops-class-detail.query';
import {
  assignClassWindow,
  assignTeacher,
  OpsAssignTeacherIneligibleError,
  OpsClassEditStaleError,
  useOpsCreateClassMutation,
  useOpsUpdateClassMutation,
} from '@/modules/ops/queries/use-ops-update-class.mutation';
import { teachersListSchoolKey, useTeachersListQuery } from '@/modules/ops/queries/use-teachers-list.query';
import { useResultWindowsQuery } from '@/modules/ops/queries/use-result-windows.query';
import { createClassFormSchema } from '@/modules/ops/schemas/class-form.schema';

export interface OpsEditClassDialogProps {
  /** Defaults to `'edit'` so the two existing call sites (task 17, task 21) compile unchanged. */
  mode?: 'create' | 'edit';
  schoolDocumentId: string;
  onClose: () => void;
  /** EDIT-only — the class being edited. Absent (create) means a brand-new class. */
  classDocumentId?: string;
  className?: string;
  /** The class `updatedAt` the form was opened with — seeds the edit's If-Match; superseded by a fresher read once the detail query resolves. */
  classUpdatedAt?: string | null;
  currentYearBand?: string | null;
}

/**
 * The server's OWN duplicate-name refusal on create/edit — verified live:
 * **400** `ValidationError` with `details.fields: ['name']` (proof/23.md;
 * `contracts/classes.md`'s claimed 409 does not happen on either route). The
 * client pre-check (rule 2) cannot see a class beyond the first 200 the
 * duplicate list loads, so this is rendered, never treated as redundant.
 */
function isServerNameConflict(error: unknown): boolean {
  if (!isAxiosError(error) || error.response?.status !== 400) return false;
  const fields = (error.response.data as { error?: { details?: { fields?: unknown } } })?.error?.details
    ?.fields;
  return Array.isArray(fields) && fields.includes('name');
}

interface ClassFieldErrors {
  name?: string;
  teacherDocumentId?: string;
}

/**
 * Task 23 — one modal, two modes, the design's `:661-708` CLASS FORM MODAL.
 *
 * D-57: this dialog draws row-shaped content (a teacher picker, a class
 * list for the duplicate check) but mounts NONE of `src/modules/directory`.
 * `OpsTeacherPicker` (task 22) is presentational — no `useDirectoryState`;
 * the duplicate-name check is a plain `useClassesListQuery` call, a TanStack
 * Query hook with no `next/navigation` search-params coupling at all. A
 * second `useDirectoryState` instance inside a modal fights the host list
 * page's own URL-scoped state (row 26's import table hit exactly this) —
 * nothing here can, because nothing here is the kit.
 *
 * Task 19 tightened PATCH (and task 23 verified CREATE is the same) to
 * name + year_band ONLY — a relation key is a named 400. A picked teacher or
 * test window is therefore never sent on the create/edit body: this dialog
 * chains the existing `assignTeacher` / `assignClassWindow` writes (task 20)
 * onto a successful create or an edit that actually changed either value.
 */
export function OpsEditClassDialog({
  mode = 'edit',
  schoolDocumentId,
  onClose,
  classDocumentId,
  className,
  classUpdatedAt,
  currentYearBand,
}: OpsEditClassDialogProps) {
  const isEdit = mode === 'edit' && Boolean(classDocumentId);

  const t = useTranslations('Ops.classDetail.edit');
  const createT = useTranslations('Ops.classDetail.create');
  const formT = useTranslations('Ops.classDetail.form');
  const labels = useTranslations('Ops.classDetail');
  const classesTabT = useTranslations('Ops.classesTab');
  const queryClient = useQueryClient();
  const writeGate = useOpsWriteGate();

  const detailQuery = useOpsClassDetailQuery(schoolDocumentId, classDocumentId ?? '', isEdit);
  const detail = detailQuery.data ?? null;

  // Every OTHER class of this school, for rule 2's client-side duplicate
  // check — the max page size the contract allows (200). It cannot see a
  // class on a page beyond that, which is why the server's own 400 on a
  // genuine duplicate (verified against 127.0.0.1:5500, proof/23.md — the
  // record's claimed 409 does not happen) is rendered too, never replaced.
  const classesQuery = useClassesListQuery(schoolDocumentId, { page: 1, pageSize: 200 }, true);
  const existingClasses = (classesQuery.data?.data ?? [])
    .filter((row) => row.documentId !== classDocumentId)
    .map((row) => ({ documentId: row.documentId, name: row.name }));

  const teachersQuery = useTeachersListQuery(schoolDocumentId, { page: 1, pageSize: 200 }, true);
  const teachers = teachersQuery.data?.data ?? [];

  const windowsQuery = useResultWindowsQuery(schoolDocumentId, { page: 1, pageSize: 200 });
  const windows = windowsQuery.data?.data ?? [];

  const [name, setName] = useState(className ?? '');
  const [yearBand, setYearBand] = useState(currentYearBand ?? '');
  const [fieldErrors, setFieldErrors] = useState<ClassFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // The If-Match token: seeded from the caller's prop, refreshed by the
  // fresh detail read, and OVERRIDDEN by a 412's reported current value —
  // the override always wins once set (task 19's stale-conflict contract).
  const [ifMatchOverride, setIfMatchOverride] = useState<string | null>(null);
  const ifMatch = ifMatchOverride ?? detail?.updated_at ?? classUpdatedAt ?? null;

  // What the class ACTUALLY has, per the fresh detail read — `null` (not
  // "loading") for CREATE, where there is nothing to fetch. Rule 3 is judged
  // against this, not a default "nothing picked" that would falsely warn on
  // every class that already has a teacher.
  const initialTeacherDocumentId = detail?.primary_teacher?.documentId ?? null;
  const initialTestWindowDocumentId = detail?.test_window?.documentId ?? null;
  // EDIT waits for the detail read before it can submit or show the picker
  // truthfully; CREATE has nothing to wait for. No effect needed to "seed"
  // the picker: `teacherOverride`/`windowOverride` start `undefined`
  // (untouched) and the SELECTED value below falls through to whatever the
  // detail query resolves to, on every render, for free.
  const waitingOnDetail = isEdit && detailQuery.isPending;
  const [teacherOverride, setTeacherOverride] = useState<string | null | undefined>(undefined);
  const [windowOverride, setWindowOverride] = useState<string | null | undefined>(undefined);
  const teacherDocumentId = teacherOverride === undefined ? initialTeacherDocumentId : teacherOverride;
  const testWindowDocumentId = windowOverride === undefined ? initialTestWindowDocumentId : windowOverride;

  const createMutation = useOpsCreateClassMutation();
  const updateMutation = useOpsUpdateClassMutation();

  const schema = createClassFormSchema((key) => formT(key), {
    existingClasses,
    editingDocumentId: classDocumentId ?? null,
  });
  const liveWarning = schema.safeParse({
    name,
    yearBand: yearBand === '' ? null : yearBand,
    teacherDocumentId,
    testWindowDocumentId,
  }).data?.warnings.teacher;

  // `:1148` — typing in a field clears THAT field's error and the
  // form-level error. A change with no field of its own (year band, the
  // window select) still clears the form-level summary, but must not wipe
  // an UNRELATED field's still-unfixed error (e.g. a pending name error).
  const clearErrors = (key?: keyof ClassFieldErrors) => {
    setFormError(null);
    if (key === undefined) return;
    setFieldErrors((previous) => {
      if (!(key in previous)) return previous;
      const next = { ...previous };
      delete next[key];
      return next;
    });
  };

  const runSubmit = async () => {
    const blocked = writeGate.blockedReason();
    if (blocked !== null) {
      showOpsToast({ tone: 'error', message: blocked });
      return;
    }

    const parsed = schema.safeParse({
      name,
      yearBand: yearBand === '' ? null : yearBand,
      teacherDocumentId,
      testWindowDocumentId,
    });
    if (!parsed.success) {
      const nextFieldErrors: ClassFieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key === 'name' && nextFieldErrors.name === undefined) nextFieldErrors.name = issue.message;
        if (key === 'teacherDocumentId' && nextFieldErrors.teacherDocumentId === undefined) {
          nextFieldErrors.teacherDocumentId = issue.message;
        }
      }
      setFieldErrors(nextFieldErrors);
      setFormError(formT('formSummary', { count: Object.keys(nextFieldErrors).length }));
      return;
    }

    setFieldErrors({});
    setFormError(null);
    setIsSubmitting(true);
    const trimmedName = parsed.data.name.trim();

    try {
      let activeClassId = classDocumentId ?? null;

      if (isEdit && activeClassId !== null) {
        await updateMutation.mutateAsync({
          classDocumentId: activeClassId,
          schoolDocumentId,
          classUpdatedAt: ifMatch,
          name: trimmedName,
          yearBand: parsed.data.yearBand,
        });
        if (parsed.data.teacherDocumentId !== initialTeacherDocumentId) {
          await assignTeacher(
            activeClassId,
            parsed.data.teacherDocumentId === null ? [] : [parsed.data.teacherDocumentId],
          );
        }
        if (parsed.data.testWindowDocumentId !== initialTestWindowDocumentId) {
          await assignClassWindow(schoolDocumentId, activeClassId, parsed.data.testWindowDocumentId);
        }
      } else {
        const created = await createMutation.mutateAsync({
          schoolDocumentId,
          name: trimmedName,
          yearBand: parsed.data.yearBand,
        });
        activeClassId = created.documentId;
        if (parsed.data.teacherDocumentId !== null) {
          await assignTeacher(activeClassId, [parsed.data.teacherDocumentId]);
        }
        if (parsed.data.testWindowDocumentId !== null) {
          await assignClassWindow(schoolDocumentId, activeClassId, parsed.data.testWindowDocumentId);
        }
      }

      await queryClient.invalidateQueries({ queryKey: ['ops', 'schools', schoolDocumentId] });
      if (activeClassId !== null) {
        await queryClient.invalidateQueries({ queryKey: opsClassDetailQueryKey(activeClassId) });
      }
      await queryClient.invalidateQueries({ queryKey: classesListQueryKey(schoolDocumentId, { page: 1, pageSize: 200 }) });

      showOpsToast({
        tone: 'ok',
        message: isEdit ? formT('savedToast', { name: trimmedName }) : formT('createdToast', { name: trimmedName }),
      });
      onClose();
      return;
    } catch (error) {
      let message = formT('saveErrorGeneric');
      if (error instanceof OpsClassEditStaleError) {
        setIfMatchOverride(error.currentUpdatedAt);
        message = error.message;
      } else if (error instanceof OpsAssignTeacherIneligibleError) {
        void queryClient.invalidateQueries({ queryKey: teachersListSchoolKey(schoolDocumentId) });
        message = error.message;
      } else if (isServerNameConflict(error)) {
        message = formT('nameDuplicate');
        setFieldErrors({ name: message });
      }
      setFormError(message);
      setIsSubmitting(false);
      showOpsToast({
        tone: 'error',
        message,
        action: { label: labels('retry'), run: () => void runSubmit() },
      });
    }
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    void runSubmit();
  };

  const closing = isSubmitting;
  const teacherError = fieldErrors.teacherDocumentId;
  const teacherWarning = teacherError === undefined ? liveWarning : undefined;
  const blockedReason = writeGate.blockedReason();

  return (
    <OpsDialog
      open
      onOpenChange={(next) => {
        if (!next && !closing) onClose();
      }}
    >
      <OpsDialogContent className="sm:max-w-[560px]">
        <OpsDialogHeader
          title={isEdit ? t('title') : createT('title')}
          sub={isEdit ? t('description') : createT('description')}
        />

        <form onSubmit={submit} noValidate>
          <OpsDialogBody>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <OpsFieldShell
                id="ops-class-form-name"
                label={t('nameLabel')}
                required
                errorText={fieldErrors.name}
              >
                <Input
                  id="ops-class-form-name"
                  autoComplete="off"
                  aria-invalid={fieldErrors.name ? true : undefined}
                  value={name}
                  className={`h-12 rounded-xl ${OPS_CONTROL_CLASS}`}
                  onChange={(event) => {
                    setName(event.target.value);
                    clearErrors('name');
                  }}
                />
              </OpsFieldShell>
              <OpsFieldShell id="ops-class-form-year" label={labels('yearBand')}>
                <SelectField
                  id="ops-class-form-year"
                  label={labels('yearBand')}
                  placeholder={labels('notAvailable')}
                  hideLabel
                  value={yearBand}
                  options={[
                    { value: '', label: labels('notAvailable') },
                    ...YEAR_BANDS.map((band) => ({ value: band, label: classesTabT(`year.${band}`) })),
                  ]}
                  onValueChange={(value) => {
                    setYearBand(value);
                    clearErrors();
                  }}
                  triggerClassName={OPS_CONTROL_CLASS}
                />
              </OpsFieldShell>
            </div>

            <div className="flex flex-col">
              <span className="mb-[9px] text-[12.5px] leading-none font-semibold text-[#0E2350]">
                {labels('classTeacher')}
              </span>
              {waitingOnDetail || teachersQuery.isPending ? (
                <Skeleton className="h-40 w-full rounded-card" />
              ) : teachersQuery.isError ? (
                <Alert variant="error" title={t('loadError')}>
                  {t('loadErrorDescription')}
                </Alert>
              ) : (
                <OpsTeacherPicker
                  teachers={teachers}
                  selectedDocumentId={teacherDocumentId}
                  onSelect={(documentId) => {
                    // A plain radiogroup, matching `OpsAssignTeacherDialog`'s
                    // own `onSelect` (task 22): picking a teacher never
                    // toggles off — the design draws no "none" row, and this
                    // form invents no unassign gesture the design does not.
                    setTeacherOverride(documentId);
                    clearErrors('teacherDocumentId');
                  }}
                  ariaLabel={labels('classTeacher')}
                />
              )}
              {teacherError ? (
                <p className="mt-1.5 text-xs font-medium text-[#B42318]">{teacherError}</p>
              ) : teacherWarning ? (
                <p className="mt-1.5 text-xs font-medium text-warning">{teacherWarning}</p>
              ) : null}
            </div>

            <OpsFieldShell id="ops-class-form-window" label={formT('testWindowLabel')}>
              <SelectField
                id="ops-class-form-window"
                label={formT('testWindowLabel')}
                placeholder={formT('noWindowOption')}
                hideLabel
                value={testWindowDocumentId ?? ''}
                disabled={waitingOnDetail || windowsQuery.isPending}
                options={[
                  { value: '', label: formT('noWindowOption') },
                  ...windows.map((window) => ({
                    value: window.documentId,
                    label: window.title,
                    disabled: window.status === 'cancelled' || window.status === 'complete',
                  })),
                ]}
                onValueChange={(value) => {
                  setWindowOverride(value === '' ? null : value);
                  // A control with no field of its own clears the form-level
                  // summary only — never an UNRELATED field's pending error
                  // (same rule the year-band select follows above).
                  clearErrors();
                }}
                triggerClassName={OPS_CONTROL_CLASS}
              />
            </OpsFieldShell>
          </OpsDialogBody>

          <OpsDialogFooter error={formError}>
            <OpsDialogCancel type="button" onClick={onClose} disabled={isSubmitting}>
              {t('cancel')}
            </OpsDialogCancel>
            <OpsDialogCta
              type="submit"
              loading={isSubmitting}
              aria-disabled={blockedReason !== null || waitingOnDetail || undefined}
              className={blockedReason !== null ? 'opacity-60' : undefined}
              disabled={!name.trim() || waitingOnDetail}
              onClick={(event) => {
                if (blockedReason !== null) {
                  event.preventDefault();
                  showOpsToast({ tone: 'error', message: blockedReason });
                }
              }}
            >
              {isSubmitting ? (isEdit ? t('saving') : createT('creating')) : isEdit ? t('save') : createT('submit')}
            </OpsDialogCta>
          </OpsDialogFooter>
        </form>
      </OpsDialogContent>
    </OpsDialog>
  );
}
