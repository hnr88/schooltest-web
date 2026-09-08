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
import { OpsTeachersFilters } from '@/modules/ops/components/OpsTeachersFilters';
import { OpsTeachersTable } from '@/modules/ops/components/OpsTeachersTable';
import { OpsTeachersTableRow } from '@/modules/ops/components/OpsTeachersTableRow';
import { OpsViewAsTeacherPanel } from '@/modules/ops/components/OpsViewAsTeacherPanel';
import { useOpsTeachersDirectory } from '@/modules/ops/hooks/use-teachers-directory';
import { useOpsTeacherRowActions } from '@/modules/ops/hooks/use-teachers-row-actions';

import type { OpsTeachersDialogProps } from '@/modules/ops/types/components.types';

// C-OPS-PORTAL-021 (OPS-031) — the staff directory the Teachers count card
// opens. It consumes the VERSIONED read (paginated data/meta, server-applied
// q/role/blocked filters, and class membership reconciled across the primary
// and co-teacher relations); the unversioned complete-array contract is
// untouched for the callers that still send no portal-version header.
// Edit = the exact C-TCH-04 whitelist (first/last/email); the API 400s a
// duplicate email and that server message renders in the row's confirm strip.
// Delete = the C-TCH-03 revocation behind an inline confirm.
// ⚠️ Spec items deliberately NOT built, rulings open with the client:
// "Add Teacher" (staff accounts are minted via the C-INV-01/02 invitation flow)
// and the editable Class column (no backing write exists in the API surface).
export function OpsTeachersDialog({
  schoolDocumentId,
  open,
  onOpenChange,
}: OpsTeachersDialogProps) {
  const t = useTranslations('Ops.teachers');
  const directory = useOpsTeachersDirectory(schoolDocumentId, open);
  const actions = useOpsTeacherRowActions(schoolDocumentId);
  const result = directory.listQuery.data;
  // Ledger 11c — ONE open impersonation panel at a time, owned here rather
  // than per row: mounting the panel is what performs the audited read, so a
  // second row's click must replace the first view, not add another.
  const [viewingTeacher, setViewingTeacher] = useState<string | null>(null);
  const viewingRow = result?.data.find((row) => row.documentId === viewingTeacher) ?? null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-slot="ops-teachers-dialog" className="sm:max-w-5xl">
        {/* sm:-prefixed override on PURPOSE: the base class already sets
            sm:max-w-sm, and an unprefixed max-w-5xl loses to that breakpoint
            variant in the compiled stylesheet — the dialog rendered 384px at
            any desktop width (measured). twMerge drops sm:max-w-sm for
            sm:max-w-5xl and keeps the base calc() guard, so <640px is
            unchanged. */}
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        {/* min-w-0 lets this grid item shrink below its content width —
            without it the 7-column table stretches the item to its own
            min-content width, the overflow-x-auto wrapper inside never
            becomes a scroller, and the row actions simply paint past the
            dialog frame, unreachable at 1280. */}
        <div className="flex min-w-0 flex-col gap-3">
          <p className="text-xs text-muted-foreground" data-slot="ops-teachers-flag">
            {t('flagNotice')}
          </p>
          <OpsTeachersFilters
            q={directory.state.q}
            role={directory.state.role}
            status={directory.state.status}
            onQChange={directory.setQ}
            onRoleChange={directory.setRole}
            onStatusChange={directory.setStatus}
          />
          {directory.listQuery.isPending ? (
            <div className="flex flex-col gap-2" data-slot="ops-teachers-loading">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-2/3" />
            </div>
          ) : directory.listQuery.isError || result === undefined ? (
            <Alert variant="error" title={t('errorTitle')}>
              {t('errorDescription')}
            </Alert>
          ) : (
            <OpsTeachersTable
              rows={result.data}
              pagination={result.meta.pagination}
              filtered={directory.filtered}
              onPageChange={directory.setPage}
              renderRow={(row) => (
                <OpsTeachersTableRow
                  key={row.documentId}
                  row={row}
                  editing={
                    actions.editing?.documentId === row.documentId ? actions.editing : null
                  }
                  onEditingChange={actions.setEditing}
                  removing={actions.removing === row.documentId}
                  onRemovingChange={actions.setRemoving}
                  onSave={actions.save}
                  onRemove={() => actions.remove(row.documentId)}
                  savePending={actions.savePending}
                  removePending={actions.removePending}
                  error={actions.error}
                  onViewAs={setViewingTeacher}
                />
              )}
            />
          )}
          {viewingTeacher !== null ? (
            <OpsViewAsTeacherPanel
              key={viewingTeacher}
              teacherDocumentId={viewingTeacher}
              teacherEmail={viewingRow?.email ?? null}
              onClose={() => setViewingTeacher(null)}
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
