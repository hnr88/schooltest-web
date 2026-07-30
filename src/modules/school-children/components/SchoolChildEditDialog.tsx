'use client';

import { useTranslations } from 'next-intl';

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

interface SchoolChildEditDialogProps {
  child: SchoolChild;
  classes: SchoolClass[];
  onClose: () => void;
}

// Edit shell (C-CHD-03): mounts the form fresh per child so its defaults
// always match the row being edited.
export function SchoolChildEditDialog({ child, classes, onClose }: SchoolChildEditDialogProps) {
  const t = useTranslations('SchoolChildren.form');

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
          onCancel={onClose}
          onDone={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
