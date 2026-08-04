'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { classifyChildError } from '@/modules/school-children/lib/classify-child-error';
import {
  buildChildCreateBody,
  buildChildUpdateBody,
} from '@/modules/school-children/lib/child-request';
import { useCreateChildMutation } from '@/modules/school-children/queries/use-create-child.mutation';
import { useUpdateChildMutation } from '@/modules/school-children/queries/use-update-child.mutation';
import {
  createSchoolChildFormSchema,
  type SchoolChildFormValues,
} from '@/modules/school-children/schemas/school-child.schema';
import type { SchoolChild } from '@/modules/school-children/types/school-children.types';

import type { ChildFormTarget } from '@/modules/school-children/types/hooks.types';
import { BLANK_VALUES } from '@/modules/school-children/constants/hooks.constants';

function initialValues(target: ChildFormTarget): SchoolChildFormValues {
  if (target.mode === 'create') {
    return BLANK_VALUES;
  }
  const { child } = target;
  // The C-CHD-01 row carries name/class/status only; every other field stays
  // blank so an untouched edit sends nothing for it (see lib/child-request).
  return {
    ...BLANK_VALUES,
    given_name: child.given_name ?? '',
    family_name: child.family_name ?? '',
    class_documentId: child.class?.documentId ?? '',
  };
}

function displayName(values: SchoolChildFormValues): string {
  return `${values.given_name} ${values.family_name}`.trim();
}

// Form wiring for SchoolChildForm (C-CHD-02 create / C-CHD-03 edit): schema,
// defaults, body building, mutation dispatch and toast/error classification.
// onDone fires after a successful save (page navigates back, dialog closes).
export function useChildForm(target: ChildFormTarget, onDone: () => void) {
  const t = useTranslations('SchoolChildren.form');
  const tv = useTranslations('SchoolChildren.validation');
  const schema = useMemo(() => createSchoolChildFormSchema(tv), [tv]);
  const create = useCreateChildMutation();
  const update = useUpdateChildMutation();
  const form = useForm<SchoolChildFormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialValues(target),
  });

  const pending = create.isPending || update.isPending;

  const submit = form.handleSubmit(async (values) => {
    try {
      if (target.mode === 'create') {
        await create.mutateAsync(buildChildCreateBody(values));
        toast.success(t('createdToast', { name: displayName(values) }));
      } else {
        const body = buildChildUpdateBody(values, initialValues(target));
        if (Object.keys(body).length > 0) {
          await update.mutateAsync({ documentId: target.child.documentId, body });
          toast.success(t('updatedToast', { name: displayName(values) }));
        }
      }
      onDone();
    } catch (error) {
      toast.error(t(`${classifyChildError(error)}Toast`));
    }
  });

  return { form, submit, pending };
}
