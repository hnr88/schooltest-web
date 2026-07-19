'use client';

import { useTranslations } from 'next-intl';

import {
  Alert,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/modules/design-system';
import { useAddStudentForm } from '@/modules/dashboard/hooks/use-add-student-form';
import { YEAR_LEVEL_OPTIONS } from '@/modules/dashboard/schemas/add-student.schema';

interface AddStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Add-student flow (C-STUDENT-CREATE), reachable from both the dashboard
// header button and the students empty-state action — the parent owns
// `open`/`onOpenChange` so a single dialog instance serves either trigger.
export function AddStudentDialog({ open, onOpenChange }: AddStudentDialogProps) {
  const t = useTranslations('Dashboard');
  const { form, onSubmit, handleOpenChange, errorTitle, isPending } = useAddStudentForm({
    onOpenChange,
  });
  const { errors } = form.formState;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('dialogTitle')}</DialogTitle>
          <DialogDescription>{t('dialogSubtitle')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <FieldGroup>
            {errorTitle ? (
              <Alert variant="error" title={errorTitle}>
                {null}
              </Alert>
            ) : null}
            <Field>
              <FieldLabel htmlFor="add-student-given-name">{t('fieldFirstName')}</FieldLabel>
              <Input
                id="add-student-given-name"
                placeholder={t('fieldFirstNamePlaceholder')}
                aria-invalid={errors.given_name ? true : undefined}
                {...form.register('given_name')}
              />
              {errors.given_name?.message ? (
                <FieldError>{t(errors.given_name.message)}</FieldError>
              ) : null}
            </Field>
            <Field>
              <FieldLabel htmlFor="add-student-family-name">{t('fieldLastName')}</FieldLabel>
              <Input
                id="add-student-family-name"
                placeholder={t('fieldLastNamePlaceholder')}
                aria-invalid={errors.family_name ? true : undefined}
                {...form.register('family_name')}
              />
              {errors.family_name?.message ? (
                <FieldError>{t(errors.family_name.message)}</FieldError>
              ) : null}
            </Field>
            <Field>
              <FieldLabel htmlFor="add-student-year-level">{t('fieldYearLevel')}</FieldLabel>
              <Select
                value={form.watch('year_level')}
                onValueChange={(value) =>
                  form.setValue('year_level', value, { shouldValidate: true })
                }
              >
                <SelectTrigger
                  id="add-student-year-level"
                  className="w-full"
                  aria-invalid={errors.year_level ? true : undefined}
                >
                  <SelectValue placeholder={t('fieldYearLevelPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {YEAR_LEVEL_OPTIONS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {t('yearLevelOption', { level })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.year_level?.message ? (
                <FieldError>{t(errors.year_level.message)}</FieldError>
              ) : null}
            </Field>
            <Field>
              <FieldLabel htmlFor="add-student-email">{t('fieldEmail')}</FieldLabel>
              <Input
                id="add-student-email"
                type="email"
                placeholder={t('fieldEmailPlaceholder')}
                aria-invalid={errors.email ? true : undefined}
                {...form.register('email')}
              />
              {errors.email?.message ? <FieldError>{t(errors.email.message)}</FieldError> : null}
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              {t('cancel')}
            </Button>
            <Button type="submit" loading={isPending}>
              {isPending ? t('saving') : t('addStudent')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
