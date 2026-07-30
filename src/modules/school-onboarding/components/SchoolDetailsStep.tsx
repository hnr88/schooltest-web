'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/modules/design-system';
import { OnboardingSelectField } from '@/modules/school-onboarding/components/OnboardingSelectField';
import { OnboardingTextField } from '@/modules/school-onboarding/components/OnboardingTextField';
import {
  AU_STATE_VALUES,
  SCHOOL_SECTOR_VALUES,
} from '@/modules/school-onboarding/constants/school-onboarding.constants';
import {
  createSchoolDetailsSchema,
  type SchoolDetailsValues,
} from '@/modules/school-onboarding/schemas/school-onboarding.schema';
import type { SchoolDetails } from '@/modules/school-onboarding/types/school-onboarding.types';

interface SchoolDetailsStepProps {
  defaultValues: SchoolDetails;
  onSubmit: (values: SchoolDetailsValues) => void;
}

// Step 1: school details, prefilled from the ops-entered school record.
export function SchoolDetailsStep({ defaultValues, onSubmit }: SchoolDetailsStepProps) {
  const t = useTranslations('SchoolOnboarding.school');
  const tv = useTranslations('SchoolOnboarding.validation');
  const schema = useMemo(() => createSchoolDetailsSchema(tv), [tv]);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SchoolDetails, unknown, SchoolDetailsValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const stateOptions = AU_STATE_VALUES.map((value) => ({ value, label: value }));
  const sectorOptions = SCHOOL_SECTOR_VALUES.map((value) => ({
    value,
    label: t(`sectors.${value}`),
  }));

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-semibold text-foreground">{t('title')}</h2>
        <p className="mt-1 text-body-sm text-muted-foreground">{t('description')}</p>
      </div>
      <OnboardingTextField
        id="onb-school-name"
        label={t('name')}
        autoComplete="organization"
        error={errors.name?.message}
        registration={register('name')}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <OnboardingTextField
          id="onb-school-suburb"
          label={t('suburb')}
          autoComplete="address-level2"
          error={errors.suburb?.message}
          registration={register('suburb')}
        />
        <OnboardingTextField
          id="onb-school-postcode"
          label={t('postcode')}
          autoComplete="postal-code"
          error={errors.postcode?.message}
          registration={register('postcode')}
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <OnboardingSelectField
          control={control}
          name="state"
          id="onb-school-state"
          label={t('state')}
          options={stateOptions}
          placeholder={t('statePlaceholder')}
          error={errors.state?.message}
        />
        <OnboardingSelectField
          control={control}
          name="sector"
          id="onb-school-sector"
          label={t('sector')}
          options={sectorOptions}
          placeholder={t('sectorPlaceholder')}
          error={errors.sector?.message}
        />
      </div>
      <div className="mt-2 flex justify-end">
        <Button type="submit" size="lg">
          {t('continue')}
        </Button>
      </div>
    </form>
  );
}
