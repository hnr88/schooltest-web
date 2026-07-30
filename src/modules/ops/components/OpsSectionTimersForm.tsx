'use client';

import { format, parseISO } from 'date-fns';
import { useTranslations } from 'next-intl';

import { Button, FieldShell, Input } from '@/modules/design-system';
import { useSectionTimersForm } from '@/modules/ops/hooks/use-section-timers-form';
import type {
  SectionTimersFormValues,
  SectionTimersMeta,
  TimerSection,
} from '@/modules/ops/schemas/section-timers.schema';

const SECTION_FIELDS: ReadonlyArray<{ stage: number; name: keyof SectionTimersFormValues }> = [
  { stage: 1, name: 'section1' },
  { stage: 2, name: 'section2' },
  { stage: 3, name: 'section3' },
];

interface OpsSectionTimersFormProps {
  sections: TimerSection[];
  meta: SectionTimersMeta | null;
}

export function OpsSectionTimersForm({ sections, meta }: OpsSectionTimersFormProps) {
  const t = useTranslations('Ops.timers');
  const { form, submit, pending } = useSectionTimersForm(sections);
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <form
      onSubmit={submit}
      noValidate
      className="flex max-w-xl flex-col gap-4 rounded-xl border border-border bg-card p-4"
    >
      {SECTION_FIELDS.map((field) => (
        <FieldShell
          key={field.stage}
          id={`ops-timer-section-${field.stage}`}
          label={t('sectionLabel', { stage: field.stage })}
          helperText={t('minutesHint')}
          errorText={errors[field.name]?.message}
          required
        >
          <Input
            id={`ops-timer-section-${field.stage}`}
            type="number"
            min={1}
            max={60}
            step={1}
            {...register(field.name, { valueAsNumber: true })}
          />
        </FieldShell>
      ))}
      <p className="text-sm text-body">{t('nonRetroactiveNote')}</p>
      {meta ? (
        <p data-surface="ops-timers-meta" className="text-sm text-body">
          {t('lastSaved', {
            email: meta.section_timers.updated_by,
            date: format(parseISO(meta.section_timers.updated_at), 'd MMM yyyy, HH:mm'),
            version: meta.version,
          })}
        </p>
      ) : null}
      <div>
        <Button type="submit" loading={pending}>
          {pending ? t('savingButton') : t('saveButton')}
        </Button>
      </div>
    </form>
  );
}
