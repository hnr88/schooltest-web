'use client';

import { useTranslations } from 'next-intl';
import { Controller } from 'react-hook-form';

import { Button } from '@/modules/design-system';
import { TestSessionSelect } from '@/modules/teacher/components/TestSessionSelect';

import type { StartTestSessionFormProps } from '@/modules/teacher/types/session-setup.types';

// Field ids are stable so <label for> / aria-describedby wire up and the
// controls stay reachable by label alone (WCAG 2.2 AA, .qa/DESIGN.md).
const CLASS_FIELD_ID = 'test-session-class';
const TEST_FIELD_ID = 'test-session-test';

function StartTestSessionForm({
  form,
  onSubmit,
  classOptions,
  testOptions,
  isGenerating,
}: StartTestSessionFormProps) {
  const t = useTranslations('Teacher.testSessions.setup');
  const { control, formState } = form;
  const classError = formState.errors.class_document_id?.message;
  const testError = formState.errors.form_document_id?.message;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          control={control}
          name="class_document_id"
          render={({ field }) => (
            <TestSessionSelect
              id={CLASS_FIELD_ID}
              label={t('classLabel')}
              placeholder={t('classPlaceholder')}
              options={classOptions}
              value={field.value}
              onValueChange={field.onChange}
              errorText={classError ? t(classError) : undefined}
            />
          )}
        />
        <Controller
          control={control}
          name="form_document_id"
          render={({ field }) => (
            <TestSessionSelect
              id={TEST_FIELD_ID}
              label={t('testLabel')}
              placeholder={t('testPlaceholder')}
              options={testOptions}
              value={field.value}
              onValueChange={field.onChange}
              errorText={testError ? t(testError) : undefined}
            />
          )}
        />
      </div>
      <Button type="submit" size="lg" loading={isGenerating} className="self-start rounded-lg">
        {isGenerating ? t('submitting') : t('submit')}
      </Button>
    </form>
  );
}

export { StartTestSessionForm };
