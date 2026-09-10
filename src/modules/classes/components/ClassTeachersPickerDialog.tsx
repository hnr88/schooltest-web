'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { teacherLabel } from '@/modules/classes/lib/class-form.helpers';
import { Checkbox } from '@/components/ui/checkbox';
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
import { useTeachersQuery } from '@/modules/teachers';

import type { ClassTeachersPickerDialogProps } from '@/modules/classes/types/components.types';

export function ClassTeachersPickerDialog({
  className,
  currentTeacher,
  pending,
  onSubmit,
  onClose,
}: ClassTeachersPickerDialogProps) {
  const t = useTranslations('Classes.detail.teachers');
  const teachersQuery = useTeachersQuery(true);
  const [picked, setPicked] = useState<ReadonlySet<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  const candidates = (teachersQuery.data ?? []).filter(
    (candidate) => candidate.documentId !== currentTeacher?.documentId,
  );

  function toggle(documentId: string, checked: boolean) {
    setPicked((current) => {
      const next = new Set(current);
      if (checked) next.add(documentId);
      else next.delete(documentId);
      return next;
    });
  }

  async function submit() {
    setSubmitting(true);
    const ok = await onSubmit([...picked]);
    setSubmitting(false);
    if (ok) onClose();
  }

  const busy = pending || submitting;

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{t('pickerTitle')}</DialogTitle>
          <DialogDescription>{t('pickerDescription', { className })}</DialogDescription>
        </DialogHeader>
        {teachersQuery.isPending ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
          </div>
        ) : teachersQuery.isError ? (
          <Alert variant="error" title={t('pickerLoadError')}>
            {t('pickerLoadErrorDescription')}
          </Alert>
        ) : candidates.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{t('pickerEmpty')}</p>
        ) : (
          <div className="flex max-h-72 flex-col gap-2 overflow-y-auto" data-slot="class-teachers-picker">
            {candidates.map((candidate) => (
              <label
                key={candidate.documentId}
                className="flex min-h-11 items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm"
              >
                <Checkbox
                  aria-label={teacherLabel(candidate)}
                  checked={picked.has(candidate.documentId)}
                  disabled={busy}
                  onCheckedChange={(checked) => toggle(candidate.documentId, checked === true)}
                />
                <span className="font-medium text-foreground">{teacherLabel(candidate)}</span>
                <span className="ml-auto truncate text-xs text-muted-foreground">
                  {candidate.email}
                </span>
              </label>
            ))}
          </div>
        )}
        <DialogFooter>
          <Button type="button" size="lg" variant="outline" onClick={onClose} disabled={busy}>
            {t('cancel')}
          </Button>
          <Button
            type="button"
            size="lg"
            loading={busy}
            disabled={picked.size === 0}
            onClick={() => void submit()}
          >
            {busy ? t('saving') : t('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
