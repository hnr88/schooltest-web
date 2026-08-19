'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import {
  Alert,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Skeleton,
} from '@/modules/design-system';
import { OpsTeachersTableRow } from '@/modules/ops/components/OpsTeachersTableRow';
import {
  useOpsTeachersQuery,
  useOpsTeacherRemoveMutation,
  useOpsTeacherUpdateMutation,
  type OpsTeacherPatch,
} from '@/modules/ops/queries/use-ops-teachers.query';

import type { EditState, OpsTeachersDialogProps } from '@/modules/ops/types/components.types';

// OPS-teacher-details — the staff directory modal the Teachers count card
// opens. Edit = the exact C-TCH-04 whitelist (first/last/email); the API 400s
// a duplicate email and that server message renders in the confirm strip.
// Delete = the C-TCH-03 revocation behind an inline confirm.
// ⚠️ Spec items deliberately NOT built, rulings open with the client:
// "Add Teacher" (staff accounts are minted via the C-INV-01/02 invitation
// flow — the Onboard School panel on this same page mints those links) and
// the editable Class column (no backing write exists in the API surface).
export function OpsTeachersDialog({
  schoolDocumentId,
  open,
  onOpenChange,
}: OpsTeachersDialogProps) {
  const t = useTranslations('Ops.teachers');
  const teachersQuery = useOpsTeachersQuery(schoolDocumentId, open);
  const updateMutation = useOpsTeacherUpdateMutation();
  const removeMutation = useOpsTeacherRemoveMutation();
  const [editing, setEditing] = useState<EditState | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  const save = async () => {
    if (!editing) return;
    const patch: OpsTeacherPatch = {
      first_name: editing.values.first_name.trim(),
      last_name: editing.values.last_name.trim(),
      email: editing.values.email.trim().toLowerCase(),
    };
    await updateMutation.mutateAsync({
      schoolDocumentId,
      teacherDocumentId: editing.documentId,
      ...patch,
    });
    setEditing(null);
  };

  const remove = async (teacherDocumentId: string) => {
    await removeMutation.mutateAsync({ schoolDocumentId, teacherDocumentId });
    setRemoving(null);
  };

  const rows = teachersQuery.data ?? [];
  const mutationError =
    (updateMutation.isError ? String((updateMutation.error as Error)?.message ?? '') : '') ||
    (removeMutation.isError ? String((removeMutation.error as Error)?.message ?? '') : '') ||
    null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-slot="ops-teachers-dialog" className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        {teachersQuery.isPending ? (
          <div className="flex flex-col gap-2" data-slot="ops-teachers-loading">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-2/3" />
          </div>
        ) : teachersQuery.isError ? (
          <Alert variant="error" title={t('errorTitle')}>
            {t('errorDescription')}
          </Alert>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-muted-foreground" data-slot="ops-teachers-flag">
              {t('flagNotice')}
            </p>
            <table className="w-full text-sm" data-slot="ops-teachers-table">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">{t('columnFirstName')}</th>
                  <th className="py-2 pr-3 font-medium">{t('columnLastName')}</th>
                  <th className="py-2 pr-3 font-medium">{t('columnEmail')}</th>
                  <th className="py-2 pr-3 font-medium">{t('columnClass')}</th>
                  <th className="py-2 font-medium sr-only">{t('columnActions')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <OpsTeachersTableRow
                    key={row.documentId}
                    row={row}
                    editing={editing?.documentId === row.documentId ? editing : null}
                    onEditingChange={setEditing}
                    removing={removing === row.documentId}
                    onRemovingChange={setRemoving}
                    onSave={save}
                    onRemove={() => remove(row.documentId)}
                    savePending={updateMutation.isPending}
                    removePending={removeMutation.isPending}
                    error={mutationError}
                  />
                ))}
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      {t('empty')}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
