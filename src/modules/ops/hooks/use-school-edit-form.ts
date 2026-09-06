'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import {
  useSchoolEditMutation,
  schoolFieldIssues,
  schoolStale,
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
 * email without blocking (task 10).
 */
export function useSchoolEditForm({
  school,
  onDone,
}: {
  school: SchoolEditDraft;
  onDone: () => void;
}) {
  const t = useTranslations('Ops.createSchool');
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

  const emailDomainWarning = computeEmailDomainWarning(
    form.watch('contact_email'),
    form.watch('name')
  );

  const submit = form.handleSubmit(async (values) => {
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
      toast.error(t('errorToast'));
    }
  });

  return { form, submit, isPending: edit.isPending, emailDomainWarning };
}

/**
 * A valid non-school-domain contact email WARNS without blocking (task 10):
 * the contact address is expected on the school's own domain; a match is any
 * school-name word (4+ letters) appearing in the domain. Both inputs are
 * runtime values — there is no domain allowlist to maintain.
 */
function computeEmailDomainWarning(email: string, schoolName: string): string | null {
  const at = email.lastIndexOf('@');
  if (at === -1 || schoolName.trim() === '') return null;
  const domain = email.slice(at + 1).toLowerCase();
  const words = schoolName
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((word) => word.length >= 4);
  if (words.length === 0) return null;
  if (words.some((word) => domain.includes(word))) return null;
  return 'domain-warning';
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
