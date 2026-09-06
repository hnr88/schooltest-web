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
  FieldShell,
  Input,
} from '@/modules/design-system';
import {
  OpsClassEditStaleError,
  useOpsUpdateClassMutation,
} from '@/modules/ops/queries/use-ops-update-class.mutation';

import type { OpsEditClassDialogProps } from '@/modules/ops/types/components.types';

// Task 19 — the ops class edit form, TIGHTENED: name and year_band ONLY.
// The old form wrote the teacher relation unconditionally (the inventory's
// recorded defect); relation replacement is the assign-teacher route's job
// (task 20) and lives in its own surface, so saving here can never clobber a
// teacher changed elsewhere. The class edit is the class-anchored ops PATCH
// with If-Match: a stale form answers 412, the DRAFT stays in the inputs, and
// the next save re-applies onto the current version the server reported.
export function OpsEditClassDialog({
  classDocumentId,
  schoolDocumentId,
  className,
  classUpdatedAt,
  currentYearBand,
  onClose,
}: OpsEditClassDialogProps) {
  const t = useTranslations('Ops.classDetail.edit');
  const labels = useTranslations('Ops.classDetail');
  const mutation = useOpsUpdateClassMutation();
  const [name, setName] = useState(className);
  const [yearBand, setYearBand] = useState(currentYearBand ?? '');
  // The If-Match token the next attempt sends: the one the form opened with,
  // or — after a 412 — the fresh one the server reported, so the next save is
  // the deliberate reapply.
  const [ifMatch, setIfMatch] = useState(classUpdatedAt);
  const stale = mutation.error instanceof OpsClassEditStaleError;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedYear = yearBand.trim();
    mutation.mutate(
      {
        classDocumentId,
        schoolDocumentId,
        classUpdatedAt: ifMatch,
        name: trimmedName,
        // Always sent: an empty band is an EXPLICIT null (clears), not an omission.
        yearBand: trimmedYear === '' ? null : trimmedYear,
      },
      {
        onSuccess: onClose,
        onError: (error) => {
          if (error instanceof OpsClassEditStaleError) setIfMatch(error.currentUpdatedAt);
        },
      },
    );
  };

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next && !mutation.isPending) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          {stale ? (
            <Alert variant="error" title={t('saveErrorTitle')}>
              {mutation.error instanceof OpsClassEditStaleError ? mutation.error.message : null}
            </Alert>
          ) : null}
          <FieldShell id="ops-edit-class-name" label={t('nameLabel')} required>
            <Input
              id="ops-edit-class-name"
              autoComplete="off"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </FieldShell>
          <FieldShell id="ops-edit-class-year-band" label={labels('yearBand')}>
            <Input
              id="ops-edit-class-year-band"
              autoComplete="off"
              value={yearBand}
              onChange={(event) => setYearBand(event.target.value)}
            />
          </FieldShell>
          <DialogFooter>
            <Button
              type="button"
              size="lg"
              variant="outline"
              onClick={onClose}
              disabled={mutation.isPending}
            >
              {t('cancel')}
            </Button>
            <Button type="submit" size="lg" loading={mutation.isPending} disabled={!name.trim()}>
              {mutation.isPending ? t('saving') : t('save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
