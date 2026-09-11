'use client';

import { PlusIcon, XIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { showOpsToast } from '@/modules/ops/actions';
import { ClassTeachersPickerDialog } from '@/modules/classes/components/ClassTeachersPickerDialog';
import { teacherDisplayName } from '@/modules/classes/lib/class-detail.helpers';
import {
  removalAllowed,
  unionTeacherIds,
  withoutTeacherId,
} from '@/modules/classes/lib/class-roster.helpers';
import { useUpdateClassTeachersMutation } from '@/modules/classes/queries/use-update-class-teachers.mutation';
import { Alert, Button, IconButton } from '@/modules/design-system';
import { cn } from '@/lib/utils';

import type { ClassTeacherPanelProps } from '@/modules/classes/types/components.types';

export function ClassTeacherPanel({ schoolClass }: ClassTeacherPanelProps) {
  const t = useTranslations('Classes.detail.teachers');
  const td = useTranslations('Classes.detail');
  const update = useUpdateClassTeachersMutation();
  const [adding, setAdding] = useState(false);
  const [failed, setFailed] = useState(false);
  // Wrapped in an object: a bare `(() => void) | null` state would make React
  // treat every setter call as a functional updater — it CALLS the function,
  // which re-fired apply() (and the PATCH) once per queued update, storming
  // the class-detail PATCH endpoint until React killed the render loop.
  const [retryFn, setRetryFn] = useState<{ run: () => void } | null>(null);

  const teacher = schoolClass.teacher;
  const teacherName = teacherDisplayName(teacher);

  async function apply(teacherDocumentIds: string[], onRetry: () => void): Promise<boolean> {
    setRetryFn({ run: onRetry });
    setFailed(false);
    try {
      await update.mutateAsync({ documentId: schoolClass.documentId, teacherDocumentIds });
      showOpsToast({ tone: 'ok', message: t('savedToast') });
      return true;
    } catch {
      setFailed(true);
      return false;
    }
  }

  function addTeachers(picked: readonly string[]): Promise<boolean> {
    return apply(unionTeacherIds(teacher, picked), () => addTeachers(picked));
  }

  function removeTeacher(teacherDocumentId: string) {
    const next = withoutTeacherId(teacher, teacherDocumentId);
    if (!removalAllowed(next)) return;
    void apply(next, () => removeTeacher(teacherDocumentId));
  }

  return (
    <div className="flex flex-col gap-2">
      <ul
        aria-label={t('label')}
        className={cn(
          'flex flex-wrap items-center gap-2',
          update.isPending && 'pointer-events-none opacity-50',
        )}
      >
        <li className="text-sm font-medium text-body" aria-hidden="true">
          {t('label')}
        </li>
        {teacher === null || teacherName === null ? (
          <li className="text-sm text-muted-foreground">{td('teacherUnassigned')}</li>
        ) : (
          <li
            data-slot="class-teacher-chip"
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-card pr-1.5 pl-3.5 text-sm font-medium text-body"
          >
            <span>{teacherName}</span>
            <IconButton
              icon={XIcon}
              size="sm"
              tone="ghost"
              label={t('removeAria', { name: teacherName })}
              disabled={update.isPending}
              onClick={() => removeTeacher(teacher.documentId)}
            />
          </li>
        )}
        <li>
          <Button type="button" size="sm" variant="secondary" disabled={update.isPending} onClick={() => setAdding(true)}>
            <PlusIcon className="size-4" aria-hidden />
            {t('add')}
          </Button>
        </li>
      </ul>
      {failed ? (
        <Alert
          variant="error"
          title={t('errorTitle')}
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setFailed(false);
                retryFn?.run();
              }}
            >
              {t('retry')}
            </Button>
          }
        >
          {t('errorDescription')}
        </Alert>
      ) : null}
      {adding ? (
        <ClassTeachersPickerDialog
          className={schoolClass.name ?? ''}
          currentTeacher={teacher}
          pending={update.isPending}
          onSubmit={addTeachers}
          onClose={() => setAdding(false)}
        />
      ) : null}
    </div>
  );
}
