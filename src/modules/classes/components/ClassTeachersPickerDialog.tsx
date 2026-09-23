'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { useAssignableTeachers } from '@/modules/classes/hooks/use-assignable-teachers';
import { pickDocumentId, teacherPickOptions, togglePick } from '@/modules/classes/lib/class-teacher-picker';
import { Checkbox } from '@/components/ui/checkbox';
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

import type { ClassTeachersPickerDialogProps } from '@/modules/classes/types/components.types';

export function ClassTeachersPickerDialog({
  className,
  currentTeacher,
  allowInvited,
  pending,
  onSubmit,
  onClose,
}: ClassTeachersPickerDialogProps) {
  const t = useTranslations('Classes.detail.teachers');
  const tp = useTranslations('Classes.teacherPicker');
  const teachersQuery = useAssignableTeachers(true);
  const [picked, setPicked] = useState<readonly string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // BUG-006: invited teachers still pending activation are offered only while
  // the class has no teacher (a class never holds a teacher AND a pending one),
  // and picking one excludes every other pick.
  const candidates = teacherPickOptions(
    teachersQuery.allTeachers.filter((candidate) => candidate.documentId !== currentTeacher?.documentId),
    allowInvited ? teachersQuery.invitations : [],
    (name) => tp('pendingOption', { name }),
  );
  const emailByValue = new Map(
    [...teachersQuery.allTeachers, ...teachersQuery.invitations].map((row) => [row.documentId, row.email]),
  );

  function toggle(value: string, checked: boolean) {
    setPicked((current) => togglePick(current, value, checked));
  }

  async function submit() {
    setSubmitting(true);
    const ok = await onSubmit([...picked]);
    setSubmitting(false);
    if (ok) onClose();
  }

  const busy = pending || submitting;

  return (
    <OpsDialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <OpsDialogContent>
        <OpsDialogHeader
          title={t('pickerTitle')}
          sub={t('pickerDescription', { className })}
        />
        {teachersQuery.isPending ? (
          <OpsDialogBody className="py-5">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-full" />
            </div>
          </OpsDialogBody>
        ) : teachersQuery.isError && candidates.length === 0 ? (
          <OpsDialogBody className="py-5">
            <Alert variant="error" title={t('pickerLoadError')}>
              {t('pickerLoadErrorDescription')}
            </Alert>
          </OpsDialogBody>
        ) : candidates.length === 0 ? (
          <OpsDialogBody className="py-5">
            <p className="py-6 text-center text-sm text-muted-foreground">{t('pickerEmpty')}</p>
          </OpsDialogBody>
        ) : (
          <OpsDialogBody className="py-5">
            <div className="flex max-h-72 flex-col gap-2 overflow-y-auto" data-slot="class-teachers-picker">
              {candidates.map((candidate) => {
                const email = emailByValue.get(pickDocumentId(candidate.value)) ?? '';
                return (
                  <label
                    key={candidate.value}
                    className="flex min-h-11 items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm"
                  >
                    <Checkbox
                      aria-label={candidate.label}
                      checked={picked.includes(candidate.value)}
                      disabled={busy}
                      onCheckedChange={(checked) => toggle(candidate.value, checked === true)}
                    />
                    <span className="min-w-0 truncate font-medium text-foreground" title={candidate.label}>
                      {candidate.label}
                    </span>
                    <span className="ml-auto min-w-0 truncate text-xs text-muted-foreground" title={email}>
                      {email}
                    </span>
                  </label>
                );
              })}
            </div>
          </OpsDialogBody>
        )}
        <OpsDialogFooter>
          <OpsDialogCancel type="button" onClick={onClose} disabled={busy}>
            {t('cancel')}
          </OpsDialogCancel>
          <OpsDialogCta
            type="button"
            loading={busy}
            disabled={picked.length === 0}
            onClick={() => void submit()}
          >
            {busy ? t('saving') : t('save')}
          </OpsDialogCta>
        </OpsDialogFooter>
      </OpsDialogContent>
    </OpsDialog>
  );
}
