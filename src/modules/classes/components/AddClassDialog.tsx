'use client';

import { useTranslations } from 'next-intl';

import { AddClassForm } from '@/modules/classes/components/AddClassForm';
import { isEligibleClassTeacher } from '@/modules/classes/lib/class-form.helpers';
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
import { useTeachersQuery } from '@/modules/teachers';

import type { AddClassDialogProps } from '@/modules/classes/types/components.types';

// Spec §2 "Add class modal". The teacher list (C-TCH-01) is a PREREQUISITE of
// creation, not decoration: a class needs at least one eligible teacher (an
// active staff row that is not the admin), so eligibility is checked BEFORE
// the form renders — a school with none gets the refusal + "Invite a teacher"
// CTA instead of a form they can fill and only then discover they cannot
// submit. A failed load blocks too: eligibility cannot be verified, so the
// form never pretends it can be.
// Modal chrome on the OpsDialog kit (School Admin design: class modal, 520px).
export function AddClassDialog({ onClose }: AddClassDialogProps) {
  const t = useTranslations('Classes.addForm');
  const teachersQuery = useTeachersQuery(true);

  const eligibleTeachers = (teachersQuery.data ?? []).filter(isEligibleClassTeacher);

  let body: React.ReactNode;
  if (teachersQuery.isPending) {
    body = (
      <div className="flex flex-col gap-3" data-slot="add-class-pending">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  } else if (teachersQuery.isError) {
    body = (
      <Alert
        variant="error"
        title={t('teacherLoadError')}
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            loading={teachersQuery.isFetching}
            onClick={() => void teachersQuery.refetch()}
          >
            {t('retry')}
          </Button>
        }
      >
        {t('teacherLoadErrorDescription')}
      </Alert>
    );
  } else if (eligibleTeachers.length === 0) {
    body = (
      <div data-slot="add-class-ineligible">
        <MissingDependencyNotice kind="eligibleTeachers" ctaHref="/dashboard/school/teachers" />
      </div>
    );
  } else {
    body = <AddClassForm teachers={eligibleTeachers} onClose={onClose} />;
  }

  const canAct =
    !teachersQuery.isPending && !teachersQuery.isError && eligibleTeachers.length > 0;

  return (
    <OpsDialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <OpsDialogContent className="sm:max-w-[520px]">
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
