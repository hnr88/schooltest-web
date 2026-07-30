'use client';

import { useTranslations } from 'next-intl';

import { ClassForm } from '@/modules/classes/components/ClassForm';
import type { ClassFormTarget } from '@/modules/classes/hooks/use-class-form';
import { useClassChildrenQuery } from '@/modules/classes/queries/use-class-children.query';
import {
  Alert,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Skeleton,
} from '@/modules/design-system';
import { useTeachersQuery } from '@/modules/teachers';

interface ClassFormDialogProps {
  target: ClassFormTarget;
  onClose: () => void;
}

// Shell around ClassForm (C-CLS-02 create / C-CLS-03 edit): loads the teacher
// options (C-TCH-01) and, for edit, the children options (C-CHD-01) before the
// form mounts, so its default checked state matches the server. Rendered only
// while a target exists, so defaultValues are always fresh.
export function ClassFormDialog({ target, onClose }: ClassFormDialogProps) {
  const t = useTranslations('Classes.form');
  const editing = target.mode === 'edit' ? target.schoolClass : null;
  const teachersQuery = useTeachersQuery(true);
  const childrenQuery = useClassChildrenQuery(editing !== null);

  const loading = teachersQuery.isPending || (editing !== null && childrenQuery.isPending);
  const failed = teachersQuery.isError || (editing !== null && childrenQuery.isError);

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editing ? t('editTitle', { name: editing.name }) : t('createTitle')}
          </DialogTitle>
          <DialogDescription>
            {editing ? t('editDescription') : t('createDescription')}
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : failed ? (
          <Alert variant="error" title={t('loadError')}>
            {t('loadErrorDescription')}
          </Alert>
        ) : (
          <ClassForm
            target={target}
            teachers={teachersQuery.data ?? []}
            childOptions={childrenQuery.data ?? []}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
