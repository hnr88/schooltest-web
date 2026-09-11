'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import {
  OpsDialog,
  OpsDialogBody,
  OpsDialogCancel,
  OpsDialogContent,
  OpsDialogCta,
  OpsDialogFooter,
  OpsDialogHeader,
} from '@/modules/design-system';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useUpdateClassTeachersMutation } from '@/modules/classes';
import {
  classMembershipPatches,
  currentTeacherClassIds,
} from '@/modules/teachers/lib/teacher-class-membership';

import type { SchoolClass } from '@/modules/classes';

export function AssignClassesDialog({
  teacherDocumentId,
  teacherName,
  classes,
  onClose,
  onAssigned,
}: {
  teacherDocumentId: string;
  teacherName: string;
  classes: SchoolClass[];
  onClose: () => void;
  onAssigned: () => void;
}) {
  const t = useTranslations('Teachers.detail.assignDialog');
  const mutation = useUpdateClassTeachersMutation();
  const [selected, setSelected] = useState<ReadonlySet<string>>(() =>
    currentTeacherClassIds(classes, teacherDocumentId),
  );

  const patches = useMemo(
    () => classMembershipPatches(classes, teacherDocumentId, selected),
    [classes, teacherDocumentId, selected],
  );

  const toggle = (documentId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(documentId)) {
        next.delete(documentId);
      } else {
        next.add(documentId);
      }
      return next;
    });
  };

  const submit = async () => {
    try {
      for (const patch of patches) {
        await mutation.mutateAsync(patch);
      }
      onAssigned();
      onClose();
    } catch {
      return;
    }
  };

  return (
    <OpsDialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <OpsDialogContent className="sm:max-w-[520px]">
        <OpsDialogHeader title={t('title')} sub={t('description', { name: teacherName })} />

        {classes.length === 0 ? (
          <OpsDialogBody className="py-5">
            <p className="text-sm text-body">{t('empty')}</p>
          </OpsDialogBody>
        ) : (
          <OpsDialogBody className="py-5">
            <fieldset className="flex flex-col gap-2">
              <legend className="text-meta font-semibold text-foreground">
                {t('classesLegend', { count: selected.size })}
              </legend>
              <div className="max-h-64 overflow-y-auto rounded-[14px] border border-[#EEF1F6] p-2">
                {classes.map((klass) => (
                  <div key={klass.documentId} className="flex items-center gap-2 px-2 py-1">
                    <Checkbox
                      id={`assign-classes-${klass.documentId}`}
                      checked={selected.has(klass.documentId)}
                      onCheckedChange={() => toggle(klass.documentId)}
                    />
                    <Label
                      htmlFor={`assign-classes-${klass.documentId}`}
                      className="flex min-w-0 flex-1 items-center justify-between gap-2 text-sm font-normal"
                    >
                      <span className="truncate">{klass.name}</span>
                      {klass.year_band ? (
                        <span className="shrink-0 text-meta text-body">{klass.year_band}</span>
                      ) : null}
                    </Label>
                  </div>
                ))}
              </div>
            </fieldset>
          </OpsDialogBody>
        )}

        <OpsDialogFooter
          error={
            mutation.isError ? `${t('errorTitle')}. ${t('errorDescription')}` : null
          }
        >
          <OpsDialogCancel type="button" onClick={onClose} disabled={mutation.isPending}>
            {t('cancel')}
          </OpsDialogCancel>
          <OpsDialogCta
            type="button"
            disabled={patches.length === 0}
            loading={mutation.isPending}
            onClick={() => void submit()}
          >
            {mutation.isPending ? t('submitting') : t('submit')}
          </OpsDialogCta>
        </OpsDialogFooter>
      </OpsDialogContent>
    </OpsDialog>
  );
}
