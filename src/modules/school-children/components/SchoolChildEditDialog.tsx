'use client';

import { useTranslations } from 'next-intl';

import { SCHOOL_ADMIN_ROLE_TYPE } from '@/modules/auth';
import { useMeQuery } from '@/modules/auth';
import { useAuthStore } from '@/modules/auth';
import type { SchoolClass } from '@/modules/classes';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/modules/design-system';
import { SchoolChildForm } from '@/modules/school-children/components/SchoolChildForm';
import { childDisplayName } from '@/modules/school-children/hooks/use-child-row-actions';
import type { SchoolChild } from '@/modules/school-children/types/school-children.types';

import type { SchoolChildEditDialogProps } from '@/modules/school-children/types/components.types';

// Edit shell (C-CHD-03): mounts the form fresh per child so its defaults
// always match the row being edited. The ACARA phase control stays behind the
// school_admin role check (D-10), same as the add form.
export function SchoolChildEditDialog({ child, classes, onClose }: SchoolChildEditDialogProps) {
  const t = useTranslations('SchoolChildren.form');
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const meQuery = useMeQuery(hydrated && Boolean(token));
  const showAcaraPhase = meQuery.data?.role?.type === SCHOOL_ADMIN_ROLE_TYPE;

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="max-h-dvh overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('editTitle', { name: childDisplayName(child) })}</DialogTitle>
          <DialogDescription>{t('editDescription')}</DialogDescription>
        </DialogHeader>
        <SchoolChildForm
          target={{ mode: 'edit', child }}
          classes={classes}
          showAcaraPhase={showAcaraPhase}
          onCancel={onClose}
          onDone={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
