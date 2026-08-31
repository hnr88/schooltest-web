'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import {
  Alert,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Skeleton,
} from '@/modules/design-system';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useAssignTeachersMutation } from '@/modules/classes/queries/use-assign-teachers.mutation';
import { useTeachersQuery } from '@/modules/teachers';

// Task 025 multi-picker (School Admin Portal overlays artboard): "multi-picker
// for bulk teacher assignment or teacher classes". Two multi-choice lists —
// classes and teachers — over the school's REAL rosters (C-CLS-01 and
// C-TCH-01); submitting sets the selected teachers on every selected class
// through one C-CLS-03 PATCH per class (body key teacher_documentIds, the
// plural the api asserts against the school's own staff). No numbers exist in
// this dialog other than the two live list lengths.
export function AssignTeachersDialog({
  classes,
  onClose,
}: {
  classes: { documentId: string; name: string }[];
  onClose: () => void;
}) {
  const t = useTranslations('Classes.assignTeachers');
  const teachersQuery = useTeachersQuery(true);
  const assignMutation = useAssignTeachersMutation();
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);

  const toggle = (list: string[], setList: (next: string[]) => void, id: string) => {
    setList(list.includes(id) ? list.filter((entry) => entry !== id) : [...list, id]);
  };

  const teachers = (teachersQuery.data ?? []).filter((row) => !row.blocked);
  const canSubmit =
    selectedClasses.length > 0 && selectedTeachers.length > 0 && !assignMutation.isPending;

  return (
    <Dialog open onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent className="max-h-dvh overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        {teachersQuery.isPending ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : teachersQuery.isError ? (
          <Alert variant="error" title={t('errorTitle')}>
            {t('errorDescription')}
          </Alert>
        ) : (
          <div className="flex flex-col gap-4">
            <fieldset className="flex flex-col gap-2">
              <legend className="text-meta font-semibold text-foreground">
                {t('classesLegend', { count: selectedClasses.length })}
              </legend>
              <div className="max-h-44 overflow-y-auto rounded-lg border border-border p-2">
                {classes.map((klass) => (
                  <div key={klass.documentId} className="flex items-center gap-2 px-2 py-1">
                    <Checkbox
                      id={`assign-class-${klass.documentId}`}
                      checked={selectedClasses.includes(klass.documentId)}
                      onCheckedChange={() =>
                        toggle(selectedClasses, setSelectedClasses, klass.documentId)
                      }
                    />
                    <Label htmlFor={`assign-class-${klass.documentId}`} className="text-sm font-normal">
                      {klass.name}
                    </Label>
                  </div>
                ))}
              </div>
            </fieldset>
            <fieldset className="flex flex-col gap-2">
              <legend className="text-meta font-semibold text-foreground">
                {t('teachersLegend', { count: selectedTeachers.length })}
              </legend>
              <div className="max-h-44 overflow-y-auto rounded-lg border border-border p-2">
                {teachers.map((teacher) => (
                  <div key={teacher.documentId} className="flex items-center gap-2 px-2 py-1">
                    <Checkbox
                      id={`assign-teacher-${teacher.documentId}`}
                      checked={selectedTeachers.includes(teacher.documentId)}
                      onCheckedChange={() =>
                        toggle(selectedTeachers, setSelectedTeachers, teacher.documentId)
                      }
                    />
                    <Label
                      htmlFor={`assign-teacher-${teacher.documentId}`}
                      className="text-sm font-normal"
                    >
                      {[teacher.first_name, teacher.last_name].filter(Boolean).join(' ') ||
                        teacher.email}
                    </Label>
                  </div>
                ))}
                {teachers.length === 0 ? (
                  <p className="px-2 py-1 text-sm text-body">{t('noTeachers')}</p>
                ) : null}
              </div>
            </fieldset>
          </div>
        )}

        {assignMutation.isError ? (
          <Alert variant="error" title={t('submitErrorTitle')}>
            {t('submitErrorDescription')}
          </Alert>
        ) : null}
        {assignMutation.isSuccess ? (
          <Alert variant="success" title={t('successTitle')}>
            {t('successDescription', {
              classes: assignMutation.variables?.classDocumentIds.length ?? 0,
              teachers: assignMutation.variables?.teacherDocumentIds.length ?? 0,
            })}
          </Alert>
        ) : null}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button
            type="button"
            variant="accent"
            disabled={!canSubmit}
            loading={assignMutation.isPending}
            onClick={() =>
              assignMutation.mutate(
                { classDocumentIds: selectedClasses, teacherDocumentIds: selectedTeachers },
                { onSuccess: () => onClose() },
              )
            }
          >
            {t('submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
