'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import {
  Alert,
  OpsDialog,
  OpsDialogBody,
  OpsDialogCancel,
  OpsDialogContent,
  OpsDialogCta,
  OpsDialogFooter,
  OpsDialogHeader,
  Skeleton,
} from '@/modules/design-system';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { PicksClearedNotice } from '@/modules/classes/components/PicksClearedNotice';
import { useAssignableTeachers } from '@/modules/classes/hooks/use-assignable-teachers';
import { useTeacherPicks } from '@/modules/classes/hooks/use-teacher-picks';
import { assignmentFromPicks, teacherPickOptions } from '@/modules/classes/lib/class-teacher-picker';
import { useAssignTeachersMutation } from '@/modules/classes/queries/use-assign-teachers.mutation';

// Task 025 multi-picker (School Admin Portal overlays artboard): "multi-picker
// for bulk teacher assignment or teacher classes". Two multi-choice lists —
// classes and teachers — over the school's REAL rosters (C-CLS-01 and
// C-TCH-01); submitting sets the selected teachers on every selected class
// through one C-CLS-03 PATCH per class (body key teacher_documentIds, the
// plural the api asserts against the school's own staff). No numbers exist in
// this dialog other than the two live list lengths.
// BUG-006: invited teachers still pending activation are listed too (labelled
// "Invited — pending"); at most one can be picked, sent as the pending teacher.
export function AssignTeachersDialog({
  classes,
  onClose,
}: {
  classes: { documentId: string; name: string; hasPendingTeacher: boolean }[];
  onClose: () => void;
}) {
  const t = useTranslations('Classes.assignTeachers');
  const tp = useTranslations('Classes.teacherPicker');
  const teachersQuery = useAssignableTeachers(true);
  const assignMutation = useAssignTeachersMutation();
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const { picks: selectedTeachers, dropped, toggle: toggleTeacher } = useTeacherPicks();

  const toggle = (list: string[], setList: (next: string[]) => void, id: string) => {
    setList(list.includes(id) ? list.filter((entry) => entry !== id) : [...list, id]);
  };

  const teachers = teacherPickOptions(
    teachersQuery.allTeachers.filter((row) => !row.blocked),
    teachersQuery.invitations,
    (name) => tp('pendingOption', { name }),
  );
  const canSubmit =
    selectedClasses.length > 0 && selectedTeachers.length > 0 && !assignMutation.isPending;

  return (
    <OpsDialog open onOpenChange={(next) => { if (!next) onClose(); }}>
      <OpsDialogContent>
        <OpsDialogHeader title={t('title')} sub={t('description')} />

        {teachersQuery.isPending ? (
          <OpsDialogBody className="py-5">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          </OpsDialogBody>
        ) : teachersQuery.isError && teachers.length === 0 ? (
          <OpsDialogBody className="py-5">
            <Alert variant="error" title={t('errorTitle')}>
              {t('errorDescription')}
            </Alert>
          </OpsDialogBody>
        ) : (
          <OpsDialogBody className="gap-4 py-5">
            <fieldset className="flex flex-col gap-2">
              <legend className="text-meta font-semibold text-foreground">
                {t('classesLegend', { count: selectedClasses.length })}
              </legend>
              <div className="max-h-44 overflow-y-auto rounded-[14px] border border-[#EEF1F6] p-2">
                {/* Defensive: the screen-level trigger is disabled while the
                    school has no classes, but the dialog still refuses to draw
                    an empty list if it is ever reached. */}
                {classes.length === 0 ? (
                  <p className="px-2 py-1 text-sm text-body">{t('noClasses')}</p>
                ) : (
                  classes.map((klass) => (
                    <div key={klass.documentId} className="flex items-center gap-2 px-2 py-1">
                      <Checkbox
                        id={`assign-class-${klass.documentId}`}
                        checked={selectedClasses.includes(klass.documentId)}
                        onCheckedChange={() =>
                          toggle(selectedClasses, setSelectedClasses, klass.documentId)
                        }
                      />
                      <Label htmlFor={`assign-class-${klass.documentId}`} className="min-w-0 text-sm font-normal">
                        <span className="block truncate" title={klass.name}>
                          {klass.name}
                        </span>
                      </Label>
                    </div>
                  ))
                )}
              </div>
            </fieldset>
            <fieldset className="flex flex-col gap-2">
              <legend className="text-meta font-semibold text-foreground">
                {t('teachersLegend', { count: selectedTeachers.length })}
              </legend>
              <div className="max-h-44 overflow-y-auto rounded-[14px] border border-[#EEF1F6] p-2">
                {teachers.map((teacher) => (
                  <div key={teacher.value} className="flex items-center gap-2 px-2 py-1">
                    <Checkbox
                      id={`assign-teacher-${teacher.value}`}
                      checked={selectedTeachers.includes(teacher.value)}
                      onCheckedChange={(checked) => toggleTeacher(teacher.value, checked === true)}
                    />
                    <Label
                      htmlFor={`assign-teacher-${teacher.value}`}
                      className="min-w-0 text-sm font-normal"
                    >
                      <span className="block truncate" title={teacher.label}>
                        {teacher.label}
                      </span>
                    </Label>
                  </div>
                ))}
                {teachers.length === 0 ? (
                  <p className="px-2 py-1 text-sm text-body">{t('noTeachers')}</p>
                ) : null}
              </div>
              <PicksClearedNotice
                dropped={dropped}
                labelOf={(value) => teachers.find((option) => option.value === value)?.label ?? value}
              />
            </fieldset>
          </OpsDialogBody>
        )}

        {assignMutation.isSuccess ? (
          <div className="px-7 pb-4">
            <Alert variant="success" title={t('successTitle')}>
              {t('successDescription', {
                classes: assignMutation.variables?.classDocumentIds.length ?? 0,
                teachers:
                  (assignMutation.variables?.teacherDocumentIds.length ?? 0) +
                  (assignMutation.variables?.pendingTeacherDocumentId ? 1 : 0),
              })}
            </Alert>
          </div>
        ) : null}

        <OpsDialogFooter
          error={
            assignMutation.isError
              ? `${t('submitErrorTitle')}. ${t('submitErrorDescription')}`
              : null
          }
        >
          <OpsDialogCancel type="button" onClick={onClose}>
            {t('cancel')}
          </OpsDialogCancel>
          <OpsDialogCta
            type="button"
            disabled={!canSubmit}
            loading={assignMutation.isPending}
            onClick={() =>
              assignMutation.mutate(
                {
                  classDocumentIds: selectedClasses,
                  teacherDocumentIds: assignmentFromPicks(selectedTeachers).teacher_documentIds,
                  pendingTeacherDocumentId:
                    assignmentFromPicks(selectedTeachers).pending_teacher_documentId,
                  classesWithPendingTeacher: classes
                    .filter((klass) => klass.hasPendingTeacher)
                    .map((klass) => klass.documentId),
                },
                { onSuccess: () => onClose() },
              )
            }
          >
            {t('submit')}
          </OpsDialogCta>
        </OpsDialogFooter>
      </OpsDialogContent>
    </OpsDialog>
  );
}
