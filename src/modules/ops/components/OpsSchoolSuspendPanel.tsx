'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

import { OpsTypedNameConfirm } from '@/modules/ops/actions';
import { Button } from '@/modules/design-system';
import { OpsConfirmDialog } from '@/modules/ops/components/OpsConfirmDialog';
import { useSchoolArchiveMutation } from '@/modules/ops/queries/use-school-suspend.mutation';
import { useSchoolRestoreMutation } from '@/modules/ops/queries/use-school-suspend.mutation';
import { useSchoolSuspendMutation } from '@/modules/ops/queries/use-school-suspend.mutation';
import { useSchoolUndoMutation } from '@/modules/ops/queries/use-school-suspend.mutation';
import { useSchoolVersionQuery } from '@/modules/ops/queries/use-school-version.query';
import { useSchoolSuspendAction } from '@/modules/ops/hooks/use-school-suspend-action';

import type { OpsSchoolSuspendPanelProps } from '@/modules/ops/types/school-suspend.types';

/**
 * C-OPS-PORTAL-005/016/017/18 — the school detail's lifecycle actions.
 *
 * The controls only render for a state the operation accepts: an active school
 * suspends or archives (archive demands the typed school name AND quotes the
 * row version as expected_updated_at), a suspended school activates again and
 * offers Undo strictly while the SERVER window (undo_expires_at) is open, and
 * an archived school restores. The server refuses everything else — this only
 * avoids dead buttons.
 */
export function OpsSchoolSuspendPanel({ school, enabled }: OpsSchoolSuspendPanelProps) {
  const t = useTranslations('Ops.detail.suspend');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [typedName, setTypedName] = useState('');
  const accountStatus = school.account_status;

  const version = useSchoolVersionQuery(school.documentId, enabled);
  const action = useSchoolSuspendAction({
    documentId: school.documentId,
    schoolName: school.name,
    enabled: enabled && accountStatus !== 'suspended' && accountStatus !== 'closed',
  });
  const archive = useSchoolArchiveMutation();
  const restore = useSchoolRestoreMutation();
  const undo = useSchoolUndoMutation();

  const versionHeader = version.data ? undefined : undefined;
  void versionHeader;
  const isArchived = accountStatus === 'closed';
  const isSuspended = accountStatus === 'suspended';
  // The Undo window is the SERVER deadline carried by the suspend result —
  // never a client-side 60-second timer started at click time.
  const undoResult = action.result;
  // Re-evaluate the SERVER deadline once a second while it matters; the clock
  // only decides whether the button renders — the window itself is the
  // server's (undo_expires_at from the action's commit).
  const [nowMs, setNowMs] = useState(0);
  useEffect(() => {
    if (!undoResult) return;
    const tick = () => setNowMs(Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [undoResult]);
  const undoOpen =
    undoResult !== undefined && new Date(undoResult.undo_expires_at).getTime() > nowMs;

  if (isArchived) {
    return (
      <div data-slot="ops-school-suspend" data-account-status={accountStatus} className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          data-action="restore-school"
          disabled={!version.isSuccess || restore.isPending}
          onClick={() => {
            if (version.data) {
              restore.mutate({
                schoolDocumentId: school.documentId,
                version: `"${version.data.updatedAt}"`,
              });
            }
          }}
        >
          {t('restore')}
        </Button>
      </div>
    );
  }

  if (isSuspended) {
    return (
      <div data-slot="ops-school-suspend" data-account-status={accountStatus} className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          data-action="activate-school"
          disabled={!version.isSuccess || restore.isPending}
          onClick={() => {
            if (version.data) {
              restore.mutate({
                schoolDocumentId: school.documentId,
                version: `"${version.data.updatedAt}"`,
              });
            }
          }}
        >
          {t('activate')}
        </Button>
        {undoOpen ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            data-action="undo-lifecycle"
            disabled={!version.isSuccess || undo.isPending}
            onClick={() => {
              if (version.data && undoResult) {
                undo.mutate({
                  schoolDocumentId: school.documentId,
                  actionDocumentId: undoResult.action_documentId,
                  version: `"${version.data.updatedAt}"`,
                });
              }
            }}
          >
            {t('undo')}
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div
      data-slot="ops-school-suspend"
      data-account-status={accountStatus}
      className="flex flex-wrap items-center gap-3"
    >
      <Button
        type="button"
        variant="destructive"
        size="sm"
        data-action="suspend-school"
        disabled={!action.ready}
        loading={action.pending}
        onClick={() => setConfirmOpen(true)}
      >
        {t('action')}
      </Button>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        data-action="archive-school"
        disabled={!version.isSuccess || archive.isPending}
        onClick={() => setArchiveOpen(true)}
      >
        {t('archive')}
      </Button>
      <OpsConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t('confirmTitle', { name: school.name })}
        description={t('confirmBody')}
        confirmLabel={t('confirmCta')}
        cancelLabel={t('cancel')}
        tone="destructive"
        pending={action.pending}
        onConfirm={() => {
          void action.confirm().then((done) => {
            if (done) setConfirmOpen(false);
          });
        }}
      />
      <OpsTypedNameConfirm
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title={t('archiveTitle')}
        description={t('archiveBody', { name: school.name })}
        requiredName={school.name}
        typedName={typedName}
        onTypedNameChange={setTypedName}
        canConfirm={typedName.trim() === school.name}
        errorMessage={t('archiveNameMismatch')}
        confirmLabel={t('archiveCta')}
        cancelLabel={t('cancel')}
        pending={archive.isPending}
        onConfirm={() => {
          if (version.data) {
            archive.mutate(
              {
                schoolDocumentId: school.documentId,
                version: `"${version.data.updatedAt}"`,
              },
              { onSuccess: () => { setArchiveOpen(false); setTypedName(''); } },
            );
          }
        }}
      />
    </div>
  );
}
