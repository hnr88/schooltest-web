'use client';

import { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFormatter, useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';

import {
  Badge,
  Button,
  Input,
  KeyValueList,
  KeyValueRow,
  NativeSelect,
  NativeSelectOption,
  OPS_CONTROL_CLASS,
  OpsDialog,
  OpsDialogBody,
  OpsDialogCancel,
  OpsDialogContent,
  OpsDialogCta,
  OpsDialogDangerCancel,
  OpsDialogFooter,
  OpsDialogHeader,
  OpsFieldShell,
  Skeleton,
} from '@/modules/design-system';
import { StudentEaldFields } from '@/modules/school-students/components/StudentEaldFields';
import { BLANK_VALUES } from '@/modules/school-students/constants/hooks.constants';
import { YEAR_LEVEL_OPTIONS } from '@/modules/school-students/constants/schemas.constants';
import { classifyStudentError } from '@/modules/school-students/lib/classify-student-error';
import {
  toAcaraPhase,
  toFirstLanguage,
  toYearLevelOption,
} from '@/modules/school-students/lib/student-level';
import {
  buildStudentCreateBody,
  buildStudentUpdateBody,
} from '@/modules/school-students/lib/student-request';
import {
  createSchoolStudentFormSchema,
  type SchoolStudentFormValues,
} from '@/modules/school-students/schemas/school-student.schema';
import { showOpsToast, useOpsWriteGate } from '@/modules/ops/actions';
import { OpsConfirmDialog } from '@/modules/ops/components/OpsConfirmDialog';
import { noValueIfMissing } from '@/modules/ops/lib/ops-class-detail.helpers';
import {
  opsStudentFullName,
  opsStudentStatusLabelKey,
  opsStudentStatusTone,
} from '@/modules/ops/lib/ops-students-list.helpers';
import {
  useOpsStudentProfileQuery,
  type OpsStudentProfile,
} from '@/modules/ops/queries/use-ops-student-profile.query';
import { useOpsStudentCreateMutation } from '@/modules/ops/queries/use-ops-student-create.mutation';
import { useOpsStudentUpdateMutation, type OpsStudentWriteBody } from '@/modules/ops/queries/use-ops-student-update.mutation';
import {
  useDeactivateStudentMutation,
  useReactivateStudentMutation,
} from '@/modules/ops/queries/use-student-actions.mutation';

import type { OpsStudentsClassOption } from '@/modules/ops/types/students-list.types';

// The design's 48px modal select (same descendant trick SchoolStudentForm
// uses: NativeSelect renders its classes on the wrapper, the control is
// reached with [&_select]).
const NATIVE_SELECT_CLASS =
  'w-full [&_select]:h-12 [&_select]:rounded-xl [&_select]:border-[1.5px] [&_select]:border-[#D8DFEA] [&_select]:bg-white [&_select]:px-3 [&_select]:text-sm [&_select]:text-[#0E2350] [&_select]:outline-none [&_select]:focus-visible:border-[#2563EB] [&_select]:focus-visible:ring-0';

export interface OpsStudentEditModalProps {
  /** `'edit'` opens the student's record; `'create'` opens a blank Add-student form. */
  mode: 'create' | 'edit';
  schoolDocumentId: string;
  /** Edit mode only: the student to open. */
  studentDocumentId?: string;
  /** The school's classes for the class picker (same options the move dialog offers). */
  classOptions: readonly OpsStudentsClassOption[];
  onClose: () => void;
}

/**
 * Prefill/diff baseline for one student: every field AS STORED, blank when
 * null. `buildStudentUpdateBody` diffs against exactly this object, so an
 * untouched field sends nothing ("keep it") and a cleared field sends null
 * ("clear it") — the profile read carries every value, unlike the school
 * roster's list rows, so the diff is always honest here.
 */
function initialValuesFromProfile(student: OpsStudentProfile): SchoolStudentFormValues {
  return {
    ...BLANK_VALUES,
    given_name: student.given_name,
    family_name: student.family_name ?? '',
    email: student.email ?? '',
    date_of_birth: student.date_of_birth ?? '',
    year_level: toYearLevelOption(student.year_level),
    first_language: toFirstLanguage(student.first_language) ?? '',
    acara_phase: toAcaraPhase(student.acara_phase) ?? '',
    other_languages: (student.other_languages ?? []).join(', '),
    l1_literate: student.l1_literate === null ? '' : student.l1_literate ? 'yes' : 'no',
    prior_schooling_interrupted:
      student.prior_schooling_interrupted === null
        ? ''
        : student.prior_schooling_interrupted
          ? 'yes'
          : 'no',
    time_learning_english_yrs:
      student.time_learning_english_yrs === null ? '' : String(student.time_learning_english_yrs),
    time_in_australia_months:
      student.time_in_australia_months === null ? '' : String(student.time_in_australia_months),
    class_documentId: student.class?.documentId ?? '',
  };
}

function displayName(values: SchoolStudentFormValues): string {
  return `${values.given_name} ${values.family_name}`.trim();
}

/**
 * The ops student record modal (row click / View profile / Add student): the
 * old read-only profile panel's context (current class, latest result,
 * attempts) kept visible ABOVE the full editable form, so one surface now
 * reads AND writes the student. Vocabulary (labels, picklists, validation
 * copy) is the school-students form's own, so the two surfaces can never
 * disagree about a field.
 *
 * Save keeps the modal OPEN on refreshed data (the operator stays in context);
 * Remove = the existing deactivate (archive) endpoint behind a confirm, so an
 * archived student's modal flips to Reactivate — there is no hard delete by
 * design. The create half (Add student) closes on success instead: there is
 * nothing to keep open for a student the list does not show yet.
 */
export function OpsStudentEditModal({
  mode,
  schoolDocumentId,
  studentDocumentId,
  classOptions,
  onClose,
}: OpsStudentEditModalProps) {
  const t = useTranslations('Ops.schoolTables');
  // A malformed caller (mode 'edit' without an id) degrades to the create
  // surface instead of firing a profile read for `undefined`.
  const queryStudentDocumentId =
    mode === 'edit' && typeof studentDocumentId === 'string' ? studentDocumentId : null;
  const editing = queryStudentDocumentId !== null;
  const profile = useOpsStudentProfileQuery(schoolDocumentId, queryStudentDocumentId);
  const writeGate = useOpsWriteGate();
  const update = useOpsStudentUpdateMutation();
  const create = useOpsStudentCreateMutation();
  const deactivate = useDeactivateStudentMutation();
  const reactivate = useReactivateStudentMutation();
  const [lifecycleConfirm, setLifecycleConfirm] = useState<'deactivate' | 'reactivate' | null>(null);

  // ESC/backdrop/X all funnel through onOpenChange; the guard is the same
  // shape the move/lifecycle dialogs use — a request in the air is never
  // abandoned by dismissing its dialog.
  const busy =
    update.isPending || create.isPending || deactivate.isPending || reactivate.isPending;

  const student = editing && profile.data !== undefined && !profile.isError ? profile.data : null;

  const handleSave = async (body: OpsStudentWriteBody): Promise<boolean> => {
    if (student === null) return false;
    try {
      await update.mutateAsync({
        schoolDocumentId,
        studentDocumentId: student.documentId,
        body,
      });
      return true;
    } catch {
      showOpsToast({ tone: 'error', message: t('studentsEditSaveError') });
      return false;
    }
  };

  const handleCreate = async (body: OpsStudentWriteBody): Promise<void> => {
    // The form schema already enforced a non-empty given name; the guard makes
    // that fact type-visible for the create input's required key.
    if (typeof body.given_name !== 'string' || body.given_name === '') return;
    try {
      await create.mutateAsync({
        schoolDocumentId,
        body: { ...body, given_name: body.given_name },
      });
      const created = [
        body.given_name,
        typeof body.family_name === 'string' ? body.family_name : '',
      ]
        .join(' ')
        .trim();
      showOpsToast({ tone: 'ok', message: t('studentsAddSavedToast', { name: created }) });
      onClose();
    } catch (error) {
      const kind = classifyStudentError(error);
      showOpsToast({
        tone: 'error',
        message:
          kind === 'seatCap'
            ? t('studentsAddSeatCapToast')
            : kind === 'schoolInactive'
              ? t('studentsAddSchoolInactiveToast')
              : t('studentsEditSaveError'),
      });
    }
  };

  const runLifecycle = async () => {
    if (lifecycleConfirm === null || student === null) return;
    const action = lifecycleConfirm;
    const name = opsStudentFullName(student);
    setLifecycleConfirm(null);
    try {
      if (action === 'deactivate') {
        await deactivate.mutateAsync({ schoolDocumentId, studentDocumentId: student.documentId });
        showOpsToast({ tone: 'ok', message: t('studentsEditRemovedToast', { name }) });
      } else {
        await reactivate.mutateAsync({ schoolDocumentId, studentDocumentId: student.documentId });
        showOpsToast({ tone: 'ok', message: t('studentsEditReactivatedToast', { name }) });
      }
    } catch {
      showOpsToast({ tone: 'error', message: t('studentsEditStatusErrorToast') });
    }
  };

  const lifecycleRunning = deactivate.isPending || reactivate.isPending;
  const archived = student?.student_status === 'archived';
  const studentName = student === null ? '' : opsStudentFullName(student);

  return (
    <>
      <OpsDialog
        open
        onOpenChange={(open) => {
          if (!open && busy) return;
          if (!open) onClose();
        }}
      >
        <OpsDialogContent data-testid="ops-student-edit-modal" className="sm:max-w-3xl">
          <OpsDialogHeader
            title={
              mode === 'create' ? (
                t('studentsAddTitle')
              ) : student ? (
                <span className="flex flex-wrap items-center gap-2.5">
                  {opsStudentFullName(student)}
                  <Badge variant={opsStudentStatusTone(student.student_status)}>
                    {t(opsStudentStatusLabelKey(student.student_status))}
                  </Badge>
                </span>
              ) : (
                t('studentsEditModalTitle')
              )
            }
            sub={mode === 'create' ? t('studentsAddDescription') : t('studentsEditModalDescription')}
          />
          {mode === 'create' ? (
            <OpsStudentEditForm
              student={null}
              classOptions={classOptions}
              readOnly={writeGate.readOnly}
              saving={create.isPending}
              lifecycleRunning={false}
              onCancel={onClose}
              onSave={handleSave}
              onCreate={handleCreate}
              onRemove={() => setLifecycleConfirm('deactivate')}
              onReactivate={() => setLifecycleConfirm('reactivate')}
            />
          ) : profile.isPending ? (
            <div
              role="status"
              aria-label={t('studentsLoading')}
              data-testid="ops-student-edit-loading"
              className="flex flex-col gap-2 px-7 py-6"
            >
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : profile.isError || profile.data === undefined ? (
            <div data-testid="ops-student-edit-error" className="flex flex-col gap-2 px-7 py-6">
              <p className="text-sm font-semibold text-[#B42318]">{t('errorTitle')}</p>
              <p className="text-sm text-body">{t('errorDescription')}</p>
            </div>
          ) : (
            <OpsStudentEditForm
              student={profile.data}
              classOptions={classOptions}
              readOnly={writeGate.readOnly}
              saving={update.isPending}
              lifecycleRunning={lifecycleRunning}
              archived={archived}
              onCancel={onClose}
              onSave={handleSave}
              onCreate={handleCreate}
              onRemove={() => setLifecycleConfirm('deactivate')}
              onReactivate={() => setLifecycleConfirm('reactivate')}
            />
          )}
        </OpsDialogContent>
      </OpsDialog>

      {lifecycleConfirm === null || student === null ? null : (
        <OpsConfirmDialog
          open
          onOpenChange={(open) => {
            if (!open && !lifecycleRunning) setLifecycleConfirm(null);
          }}
          title={
            lifecycleConfirm === 'deactivate'
              ? t('studentsDeactivateConfirmTitle', { name: studentName })
              : t('studentsReactivateConfirmTitle', { name: studentName })
          }
          description={
            lifecycleConfirm === 'deactivate'
              ? t('studentsDeactivateConfirmBody')
              : t('studentsReactivateConfirmBody')
          }
          confirmLabel={
            lifecycleConfirm === 'deactivate'
              ? t('studentsDeactivateConfirmCta')
              : t('studentsReactivateConfirmCta')
          }
          cancelLabel={t('makeOwnerCancel')}
          tone={lifecycleConfirm === 'deactivate' ? 'destructive' : 'neutral'}
          pending={lifecycleRunning}
          onConfirm={() => void runLifecycle()}
        />
      )}
    </>
  );
}

interface OpsStudentEditFormProps {
  /** null → create mode: blank form, no context block, no status actions. */
  student: OpsStudentProfile | null;
  classOptions: readonly OpsStudentsClassOption[];
  readOnly: boolean;
  saving: boolean;
  lifecycleRunning: boolean;
  archived?: boolean;
  onCancel: () => void;
  onSave: (body: OpsStudentWriteBody) => Promise<boolean>;
  onCreate: (body: OpsStudentWriteBody) => Promise<void>;
  onRemove: () => void;
  onReactivate: () => void;
}

/**
 * The form half, mounted only once its inputs exist (edit prefills from the
 * loaded profile; create is blank), so useForm's defaults are correct at
 * mount. Field markup, picklists and the EAL/D block are the school-students
 * form's own; the schema is literally the same zod one, so the validation
 * contract (given name required, email format, YYYY-MM-DD DOB, year 7-12)
 * cannot drift between the two surfaces.
 */
function OpsStudentEditForm({
  student,
  classOptions,
  readOnly,
  saving,
  lifecycleRunning,
  archived = false,
  onCancel,
  onSave,
  onCreate,
  onRemove,
  onReactivate,
}: OpsStudentEditFormProps) {
  const t = useTranslations('Ops.schoolTables');
  const tForm = useTranslations('SchoolStudents.form');
  const tv = useTranslations('SchoolStudents.validation');
  const schema = useMemo(() => createSchoolStudentFormSchema(tv), [tv]);
  // The diff baseline lives ONCE per mount and moves only on a successful
  // save — a background profile refetch must never silently rebase it under
  // unsaved edits.
  const [initial, setInitial] = useState<SchoolStudentFormValues>(() =>
    student === null ? BLANK_VALUES : initialValuesFromProfile(student),
  );
  const form = useForm<SchoolStudentFormValues>({
    resolver: zodResolver(schema),
    defaultValues: initial,
  });
  const {
    formState: { errors },
  } = form;

  const submit = form.handleSubmit(async (values) => {
    if (student === null) {
      // Create: the whole form goes up (given_name required, optionals only
      // when set); the caller toasts and CLOSES on success.
      await onCreate(buildStudentCreateBody(values));
      return;
    }
    const body = buildStudentUpdateBody(values, initial);
    if (Object.keys(body).length === 0) {
      // The server rejects an empty PATCH body — say so instead of sending {}.
      showOpsToast({ tone: 'warn', message: t('studentsEditNoChanges') });
      return;
    }
    const saved = await onSave(body);
    if (saved) {
      setInitial(values);
      showOpsToast({ tone: 'ok', message: t('studentsEditSavedToast', { name: displayName(values) }) });
    }
  });

  return (
    <form onSubmit={submit} noValidate>
      <OpsDialogBody>
        {student === null ? null : <OpsStudentContext student={student} />}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <OpsFieldShell
            id="ops-student-given-name"
            label={tForm('givenName')}
            errorText={errors.given_name?.message}
            required
          >
            <Input
              id="ops-student-given-name"
              autoComplete="off"
              className={OPS_CONTROL_CLASS}
              {...form.register('given_name')}
            />
          </OpsFieldShell>
          <OpsFieldShell
            id="ops-student-family-name"
            label={tForm('familyName')}
            errorText={errors.family_name?.message}
          >
            <Input
              id="ops-student-family-name"
              autoComplete="off"
              className={OPS_CONTROL_CLASS}
              {...form.register('family_name')}
            />
          </OpsFieldShell>
        </div>
        <OpsFieldShell
          id="ops-student-email"
          label={tForm('email')}
          helperText={tForm('emailHint')}
          errorText={errors.email?.message}
        >
          <Input
            id="ops-student-email"
            type="email"
            autoComplete="off"
            className={OPS_CONTROL_CLASS}
            {...form.register('email')}
          />
        </OpsFieldShell>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <OpsFieldShell
            id="ops-student-dob"
            label={tForm('dateOfBirth')}
            errorText={errors.date_of_birth?.message}
          >
            <Input
              id="ops-student-dob"
              type="date"
              className={OPS_CONTROL_CLASS}
              {...form.register('date_of_birth')}
            />
          </OpsFieldShell>
          <OpsFieldShell id="ops-student-year-level" label={tForm('yearLevel')}>
            <NativeSelect
              id="ops-student-year-level"
              className={NATIVE_SELECT_CLASS}
              {...form.register('year_level')}
            >
              {YEAR_LEVEL_OPTIONS.map((option) => (
                <NativeSelectOption key={option} value={option}>
                  {option === '' ? tForm('notSet') : tForm('yearOption', { level: Number(option) })}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </OpsFieldShell>
        </div>
        <OpsFieldShell
          id="ops-student-class"
          label={tForm('classLabel')}
          helperText={classOptions.length === 0 ? tForm('classNoClassesHint') : undefined}
        >
          <NativeSelect
            id="ops-student-class"
            className={NATIVE_SELECT_CLASS}
            {...form.register('class_documentId')}
          >
            <NativeSelectOption value="">{tForm('classNone')}</NativeSelectOption>
            {classOptions.map((option) => (
              <NativeSelectOption key={option.value} value={option.value}>
                {option.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </OpsFieldShell>
        {/* The whole EAL/D block (first language, ACARA phase, other languages,
            the two tri-states and the two time fields). The ACARA phase select
            renders for ops staff the way it does for school admins: D-10 holds
            it back from TEACHER-facing surfaces only. */}
        <StudentEaldFields form={form} showAcaraPhase />
      </OpsDialogBody>
      <OpsDialogFooter>
        {student === null ? null : archived ? (
          <Button
            type="button"
            variant="outline"
            data-testid="ops-student-edit-reactivate"
            disabled={readOnly || lifecycleRunning}
            onClick={onReactivate}
          >
            {t('studentsReactivateConfirmCta')}
          </Button>
        ) : (
          <OpsDialogDangerCancel
            type="button"
            data-testid="ops-student-edit-remove"
            disabled={readOnly || lifecycleRunning}
            onClick={onRemove}
          >
            {t('studentsEditRemoveCta')}
          </OpsDialogDangerCancel>
        )}
        <OpsDialogCancel
          type="button"
          data-testid={student === null ? 'ops-student-create-cancel' : 'ops-student-edit-cancel'}
          disabled={saving || lifecycleRunning}
          onClick={onCancel}
        >
          {tForm('cancel')}
        </OpsDialogCancel>
        <OpsDialogCta
          type="submit"
          data-testid={student === null ? 'ops-student-create-save' : 'ops-student-edit-save'}
          loading={saving}
          disabled={readOnly}
        >
          {student === null ? tForm('submitCreate') : tForm('submitEdit')}
        </OpsDialogCta>
      </OpsDialogFooter>
    </form>
  );
}

/**
 * The read-only context the old profile panel carried, kept visible above the
 * form: current class, latest official result and the recent attempts. The
 * fields that MOVED into the form (status, DOB, language, level) are not
 * repeated here.
 */
function OpsStudentContext({ student }: { student: OpsStudentProfile }) {
  const t = useTranslations('Ops.schoolTables');
  const tStudents = useTranslations('SchoolStudents');
  const format = useFormatter();
  const formatDate = (isoDate: string): string =>
    format.dateTime(new Date(isoDate), { day: 'numeric', month: 'short' });

  return (
    <div
      data-testid="ops-student-edit-context"
      className="flex flex-col gap-3 rounded-[14px] border border-[#EEF1F6] p-4"
    >
      <KeyValueList>
        <KeyValueRow label={tStudents('table.columnClass')}>
          <span className="block truncate" title={student.class?.name ?? tStudents('table.classNone')}>
            {student.class?.name ?? tStudents('table.classNone')}
          </span>
        </KeyValueRow>
        <KeyValueRow label={t('columnLatestResult')}>
          {student.latest_result === null
            ? t('studentsNoResult')
            : `${student.latest_result.percentage === null ? '' : `${student.latest_result.percentage}% · `}${formatDate(student.latest_result.completed_at)}`}
        </KeyValueRow>
      </KeyValueList>
      <div className="flex flex-col gap-2">
        <p className="text-meta font-medium text-body">{t('opsProfileAttemptsTitle')}</p>
        {student.attempts.length === 0 ? (
          <p className="text-sm text-body">{t('studentsNoResult')}</p>
        ) : (
          student.attempts.map((attempt) => (
            <div
              key={attempt.documentId}
              data-testid="ops-student-attempt"
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
            >
              <span className="text-sm text-body">
                {noValueIfMissing(attempt.skill)}
                {attempt.ended_at === null ? '' : ` · ${formatDate(attempt.ended_at)}`}
              </span>
              {attempt.invalidated_at !== null ? (
                <Badge variant="warning">{t('opsProfileAttemptInvalidated')}</Badge>
              ) : attempt.official ? (
                <Badge variant="success">{t('opsProfileAttemptOfficial')}</Badge>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
