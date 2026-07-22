'use client';

import { MoreHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

import { useRouter } from '@/i18n/navigation';
import { getStudentDisplayName } from '@/lib/student-name';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconButton,
} from '@/modules/design-system';
import { ArchiveConfirmDialog } from '@/modules/children/components/ArchiveConfirmDialog';
import {
  useArchiveStudentMutation,
  useUnarchiveStudentMutation,
} from '@/modules/children/queries/use-archive-student.mutation';
import type { StudentListRow } from '@/modules/dashboard';

interface ChildrenRowActionsProps {
  student: StudentListRow;
}

// C-UI-MYCHILDREN row actions: `⋯` ghost dropdown → Edit (navigate to the edit
// wizard) + Archive/Unarchive (C-STUDENT-UPDATE). Archive is confirmed via the
// AlertDialog (§11); unarchive is immediate. Toast on success/failure.
export function ChildrenRowActions({ student }: ChildrenRowActionsProps) {
  const t = useTranslations('Children');
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const archive = useArchiveStudentMutation();
  const unarchive = useUnarchiveStudentMutation();

  const isArchived = student.status === 'archived';
  const name = getStudentDisplayName(student, t('unknownStudent'));

  const handleArchive = async () => {
    try {
      await archive.mutateAsync(student.documentId);
      toast.success(t('archivedToast', { name }));
      setConfirmOpen(false);
    } catch {
      toast.error(t('actionError'));
    }
  };

  const handleUnarchive = async () => {
    try {
      await unarchive.mutateAsync(student.documentId);
      toast.success(t('unarchivedToast', { name }));
    } catch {
      toast.error(t('actionError'));
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<IconButton icon={MoreHorizontal} label={t('actionsLabel', { name })} />}
        />
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            className="min-h-11"
            onClick={() => router.push(`/dashboard/children/${student.documentId}/edit`)}
          >
            {t('edit')}
          </DropdownMenuItem>
          {isArchived ? (
            <DropdownMenuItem className="min-h-11" onClick={handleUnarchive}>
              {t('unarchive')}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              variant="destructive"
              className="min-h-11"
              onClick={() => setConfirmOpen(true)}
            >
              {t('archive')}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <ArchiveConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        name={name}
        pending={archive.isPending}
        onConfirm={handleArchive}
      />
    </>
  );
}
