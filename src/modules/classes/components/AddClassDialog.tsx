'use client';

import { useTranslations } from 'next-intl';

import { AddClassForm } from '@/modules/classes/components/AddClassForm';
import { useAssignableTeachers } from '@/modules/classes/hooks/use-assignable-teachers';
import {
  Alert,
  Button,
  MissingDependencyNotice,
  OpsDialog,
  OpsDialogBody,
  OpsDialogCancel,
  OpsDialogContent,
  OpsDialogFooter,
  OpsDialogHeader,
  Skeleton,
} from '@/modules/design-system';

import type { AddClassDialogProps } from '@/modules/classes/types/components.types';

// Spec §2 "Add class modal". The teacher list (C-TCH-01) is a PREREQUISITE of
// creation, not decoration: a class needs at least one assignable teacher (an
// active staff row that is not the admin, or — BUG-006 — an invited teacher
// still pending activation), so eligibility is checked BEFORE
// the form renders — a school with none gets the refusal + "Invite a teacher"
// CTA instead of a form they can fill and only then discover they cannot
// submit. A failed load blocks too: eligibility cannot be verified, so the
// form never pretends it can be.
// Modal chrome on the OpsDialog kit (School Admin design: class modal, 520px).
export function AddClassDialog({ onClose }: AddClassDialogProps) {
  const t = useTranslations('Classes.addForm');
  const assignable = useAssignableTeachers(true);

  let body: React.ReactNode;
  if (assignable.isPending) {
    body = (
      <div className="flex flex-col gap-3" data-slot="add-class-pending">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  } else if (assignable.isError && !assignable.hasAssignable) {
    body = (
      <Alert
        variant="error"
        title={t('teacherLoadError')}
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            loading={assignable.isFetching}
            onClick={assignable.refetch}
          >
            {t('retry')}
          </Button>
        }
      >
        {t('teacherLoadErrorDescription')}
      </Alert>
    );
  } else if (!assignable.hasAssignable) {
    body = (
      <div data-slot="add-class-ineligible">
        <MissingDependencyNotice kind="assignableTeachers" ctaHref="/dashboard/school/teachers" />
      </div>
    );
  } else {
    body = (
      <AddClassForm
        teachers={assignable.teachers}
        invitations={assignable.invitations}
        onClose={onClose}
      />
    );
  }

  const canAct = !assignable.isPending && assignable.hasAssignable;

  return (
    <OpsDialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <OpsDialogContent>
        <OpsDialogHeader
          title={t('title')}
          sub={canAct ? t('description') : undefined}
        />
        {body}
        {!canAct ? (
          <OpsDialogFooter>
            <OpsDialogCancel type="button" onClick={onClose}>
              {t('cancel')}
            </OpsDialogCancel>
          </OpsDialogFooter>
        ) : null}
      </OpsDialogContent>
    </OpsDialog>
  );
}
