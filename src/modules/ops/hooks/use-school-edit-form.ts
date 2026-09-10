'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { showOpsToast } from '@/modules/ops/actions/lib/ops-toast';
import {
  findDuplicateSchoolName,
  schoolFieldIssues,
  schoolNameConflict,
  schoolStale,
  useSchoolEditMutation,
} from '@/modules/ops/queries/use-school-create.mutation';
import {
  createSchoolEditFormSchema,
  type SchoolEditFormValues,
} from '@/modules/ops/schemas/school-create.schema';
import type { SchoolEditDraft } from '@/modules/ops/types/school-create.types';

/**
 * Task 10 — the EDIT half of the school form: the versioned PATCH with
 * If-Match on the SAME modal surface.
 *
 * STALE IS SURFACED, NEVER RETRIED: a 412 lands on the form root as a real
 * user-visible state ("someone else changed this school") and the draft STAYS
 * in the form — the operator decides what to keep. Server field errors map to
 * their controls and the first bad one focuses, with every other entered value
 * preserved. `emailDomainWarning` warns on a valid non-school-domain contact
 * email without blocking (task 10, algorithm corrected task 24 to match
 * `vSchool`).
 *
 * Task 24 — a duplicate-name PATCH is confirmed live to answer 500 with no
 * field detail and to PERSIST THE RENAME regardless (see `schoolNameConflict`'s
 * doc comment). The async pre-check below is therefore the only real
 * defence here, not a nicety: it must run before the network call, not after.
 */
export function useSchoolEditForm({
  school,
  onDone,
}: {
  school: SchoolEditDraft;
  onDone: () => void;
}) {
  const t = useTranslations('Ops.createSchool');
  const tToast = useTranslations('Ops.toast');
  const tv = useTranslations('Ops.createSchool.validation');
  const schema = useMemo(() => createSchoolEditFormSchema(tv), [tv]);
  const edit = useSchoolEditMutation(school.documentId);

  const defaultValues = useMemo(
    () =>
      ({
        name: school.name,
        suburb: school.suburb ?? '',
        state: school.state ?? '',
        sector: school.sector ?? '',
        postcode: school.postcode ?? '',
        schoolType: (school.schoolType as SchoolEditFormValues['schoolType']) ?? '',
        plan: (school.portal_plan as SchoolEditFormValues['plan']) ?? 'pilot',
        contact_name: school.contact_name ?? '',
        contact_email: school.contact_email ?? '',
        phone: school.phone ?? '',
      }) as SchoolEditFormValues,
    [school]
  );

  const form = useForm<SchoolEditFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const emailDomainWarning = schoolEmailDomainWarning(form.watch('contact_email'));
  const { errors } = form.formState;
  const fieldErrorCount = Object.keys(errors).filter((key) => key !== 'root').length;

  const submit = form.handleSubmit(async (values) => {
    if (values.name.trim().toLowerCase() !== school.name.trim().toLowerCase()) {
      const duplicate = await findDuplicateSchoolName(values.name, school.documentId);
      if (duplicate) {
        form.setError('name', { message: t('conflict') });
        form.setFocus('name');
        return;
      }
    }
    try {
      await edit.mutateAsync({
        documentId: school.documentId,
        patch: buildEditPatch(values, school),
        ifMatch: `"${school.updatedAt}"`,
      });
      // A pure edit answers onboarding_delivery 'not_requested' — no invite
      // story to tell, and no school id to carry: the row is updated.
      toast.success(t('editSuccessToast'));
      onDone();
    } catch (error) {
      if (schoolStale(error)) {
        form.setError('root', { message: t('staleEdit') });
        return;
      }
      if (schoolNameConflict(error)) {
        form.setError('name', { message: t('conflict') });
        form.setFocus('name');
        return;
      }
      const issues = schoolFieldIssues(error);
      if (issues.length > 0) {
        for (const issue of issues) {
          form.setError(issue.path as keyof SchoolEditFormValues, { message: issue.message });
        }
        const first = issues[0]?.path;
        if (first) form.setFocus(first as never);
        form.setError('root', { message: t('fieldServerError') });
        return;
      }
      showOpsToast({
        tone: 'error',
        message: t('errorToast'),
        action: { label: tToast('retry'), run: () => submit() },
      });
    }
  });

  return { form, submit, isPending: edit.isPending, emailDomainWarning, fieldErrorCount };
}

/**
 * `vSchool` (`Ops Portal.dc.html:1170`) — a syntactically valid email whose
 * host doesn't look like a school's WARNS without blocking. This is the
 * design's own fixed suffix check, independent of any per-school column —
 * the per-school "domain" (`mailFor`, D-05) belongs to `vInvite`, a
 * different modal, not this one.
 */
const EMAIL_FORMAT = /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i;
const SCHOOL_DOMAIN_PATTERN = /\.edu(\.au)?$|\.qld|\.nsw|\.vic|\.wa|\.sa\b/i;

export function schoolEmailDomainWarning(email: string): boolean {
  const trimmed = email.trim();
  return trimmed !== '' && EMAIL_FORMAT.test(trimmed) && !SCHOOL_DOMAIN_PATTERN.test(trimmed);
}

/** The EDIT patch carries only what the operator can see and change. */
function buildEditPatch(
  values: SchoolEditFormValues,
  school: SchoolEditDraft
): Record<string, unknown> {
  const patch: Record<string, unknown> = {
    name: values.name,
    suburb: values.suburb,
    contact_email: values.contact_email,
    contact_name: values.contact_name,
    contact_first_name: null,
    contact_last_name: null,
    phone: values.phone === '' ? null : values.phone,
  };
  if (values.state) patch.state = values.state;
  if (values.sector) patch.sector = values.sector;
  if (values.postcode) patch.postcode = values.postcode;
  if (values.schoolType) patch.schoolType = values.schoolType;
  // The portal tier is the school's commercial plan; portal STATUS is a
  // lifecycle decision and stays with task 12's services.
  if (school.portal_plan) patch.portal_plan = values.plan;
  return patch;
}
