'use client';

import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import { studentDisplayName } from '@/modules/classes/lib/class-detail.helpers';
import {
  matchesStudentSearch,
  studentsNotInClass,
} from '@/modules/classes/lib/class-roster.helpers';
import {
  Alert,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  FieldShell,
  Skeleton,
} from '@/modules/design-system';
import { useSchoolStudentsQuery } from '@/modules/school-students';

import type { ClassStudentsPickerDialogProps } from '@/modules/classes/types/components.types';
import type { SchoolStudent } from '@/modules/school-students';

function currentClassHint(student: SchoolStudent, classDocumentId: string): string | null {
  if (student.class === null || student.class.documentId === classDocumentId) return null;
  return student.class.name;
}

export function ClassStudentsPickerDialog({
  classDocumentId,
  className,
  roster,
  pending,
  onSubmit,
  onClose,
}: ClassStudentsPickerDialogProps) {
  const t = useTranslations('Classes.detail.studentPicker');
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<ReadonlySet<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const studentsQuery = useSchoolStudentsQuery(
    { page: 1, pageSize: 100, status: 'active', classId: 'all', q: '' },
    true,
  );

  const candidates = useMemo(
    () => studentsNotInClass(studentsQuery.data?.rows ?? [], roster),
    [studentsQuery.data, roster],
  );
  const visible = useMemo(
    () => candidates.filter((student) => matchesStudentSearch(student, query)),
    [candidates, query],
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
    const ok = await onSubmit(candidates.filter((student) => picked.has(student.documentId)));
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
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description', { className })}</DialogDescription>
        </DialogHeader>
        <p className="text-sm font-medium text-warning-ink" data-slot="class-students-move-warning">
          {t('moveWarning')}
        </p>
        {studentsQuery.isPending ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
          </div>
        ) : studentsQuery.isError ? (
          <Alert variant="error" title={t('loadError')}>
            {t('loadErrorDescription')}
          </Alert>
        ) : (
          <>
            <FieldShell id="class-students-picker-search" label={t('searchLabel')}>
              <Input
                id="class-students-picker-search"
                autoComplete="off"
                placeholder={t('searchPlaceholder')}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </FieldShell>
            {candidates.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">{t('empty')}</p>
            ) : visible.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {t('noMatches', { query: query.trim() })}
              </p>
            ) : (
              <div className="flex max-h-72 flex-col gap-2 overflow-y-auto" data-slot="class-students-picker">
                {visible.map((student) => {
                  const hint = currentClassHint(student, classDocumentId);
                  return (
                    <label
                      key={student.documentId}
                      className="flex min-h-11 items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm"
                    >
                      <Checkbox
                        aria-label={studentDisplayName(student)}
                        checked={picked.has(student.documentId)}
                        disabled={busy}
                        onCheckedChange={(checked) => toggle(student.documentId, checked === true)}
                      />
                      <span className="font-medium text-foreground">
                        {studentDisplayName(student)}
                      </span>
                      <span className="ml-auto truncate text-right text-xs text-muted-foreground">
                        {hint === null ? t('noClassHint') : t('currentClassHint', { className: hint })}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </>
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
