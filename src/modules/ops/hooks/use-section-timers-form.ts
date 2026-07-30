'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { useSectionTimersMutation } from '@/modules/ops/queries/use-section-timers.mutation';
import {
  createSectionTimersFormSchema,
  type SectionTimersFormValues,
  type TimerSection,
} from '@/modules/ops/schemas/section-timers.schema';

// Seconds on the wire -> whole minutes in the inputs (0 when a stage is
// absent - the range validation flags it rather than inventing a default).
function toMinutes(sections: TimerSection[]): SectionTimersFormValues {
  const byStage = new Map(sections.map((section) => [section.stage, section.duration_seconds]));
  return {
    section1: (byStage.get(1) ?? 0) / 60,
    section2: (byStage.get(2) ?? 0) / 60,
    section3: (byStage.get(3) ?? 0) / 60,
  };
}

// Form wiring for OpsSectionTimers (C-TMR-01, task 68): minutes in, seconds
// out, stage-ordered. A 403 (wrong role) gets its own toast; anything else is
// the generic failure.
export function useSectionTimersForm(sections: TimerSection[]) {
  const t = useTranslations('Ops.timers');
  const tv = useTranslations('Ops.timers.validation');
  const schema = useMemo(() => createSectionTimersFormSchema(tv), [tv]);
  const mutation = useSectionTimersMutation();
  const form = useForm<SectionTimersFormValues>({
    resolver: zodResolver(schema),
    defaultValues: toMinutes(sections),
  });

  const submit = form.handleSubmit(async (values) => {
    try {
      await mutation.mutateAsync([
        { stage: 1, duration_seconds: values.section1 * 60 },
        { stage: 2, duration_seconds: values.section2 * 60 },
        { stage: 3, duration_seconds: values.section3 * 60 },
      ]);
      toast.success(t('savedToast'));
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 403) {
        toast.error(t('forbiddenToast'));
        return;
      }
      toast.error(t('errorToast'));
    }
  });

  return { form, submit, pending: mutation.isPending };
}
