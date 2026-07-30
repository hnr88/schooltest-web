'use client';

import { useTranslations } from 'next-intl';
import { Controller } from 'react-hook-form';

import {
  ClassMemberChecklist,
  type ClassMemberOption,
} from '@/modules/classes/components/ClassMemberChecklist';
import { useClassForm, type ClassFormTarget } from '@/modules/classes/hooks/use-class-form';
import type { ClassChildOption } from '@/modules/classes/types/classes.types';
import { YEAR_BANDS } from '@/modules/classes/constants/year-bands.constants';
import {
  Button,
  DialogFooter,
  FieldShell,
  Input,
  NativeSelect,
  NativeSelectOption,
} from '@/modules/design-system';
import type { SchoolTeacher } from '@/modules/teachers';

interface ClassFormProps {
  target: ClassFormTarget;
  teachers: SchoolTeacher[];
  childOptions: ClassChildOption[];
  onClose: () => void;
}

function teacherOption(teacher: SchoolTeacher): ClassMemberOption {
  const name = `${teacher.first_name ?? ''} ${teacher.last_name ?? ''}`.trim();
  return { value: teacher.documentId, label: name || teacher.email };
}

function childOption(child: ClassChildOption): ClassMemberOption {
  return {
    value: child.documentId,
    label: `${child.given_name} ${child.family_name}`.trim(),
    hint: child.class?.name,
  };
}

// The C-CLS-02/03 form body. Student assignment is edit-only (C-CLS-02 takes
// no student list); the PATCH replace semantics make unchecked members
// unlink, which the students hint states plainly.
export function ClassForm({ target, teachers, childOptions, onClose }: ClassFormProps) {
  const t = useTranslations('Classes.form');
  const tb = useTranslations('Classes.yearBands');
  const editing = target.mode === 'edit';
  const { form, submit, pending } = useClassForm(target, childOptions, onClose);
  const {
    register,
    control,
    formState: { errors },
  } = form;

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <FieldShell id="class-name" label={t('name')} errorText={errors.name?.message} required>
        <Input id="class-name" autoComplete="off" {...register('name')} />
      </FieldShell>
      <FieldShell id="class-year-band" label={t('yearBand')} required>
        <NativeSelect id="class-year-band" className="w-full" {...register('year_band')}>
          {YEAR_BANDS.map((band) => (
            <NativeSelectOption key={band} value={band}>
              {tb(band)}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </FieldShell>
      <Controller
        control={control}
        name="teacher_documentIds"
        render={({ field }) => (
          <FieldShell id="class-teachers" label={t('teachers')} labelId="class-teachers-label">
            <ClassMemberChecklist
              idPrefix="class-teacher"
              options={teachers.map(teacherOption)}
              value={field.value}
              onChange={field.onChange}
              emptyText={t('teachersEmpty')}
            />
          </FieldShell>
        )}
      />
      {editing ? (
        <Controller
          control={control}
          name="student_documentIds"
          render={({ field }) => (
            <FieldShell
              id="class-students"
              label={t('students')}
              labelId="class-students-label"
              helperText={t('studentsHint')}
            >
              <ClassMemberChecklist
                idPrefix="class-student"
                options={childOptions.map(childOption)}
                value={field.value}
                onChange={field.onChange}
                emptyText={t('studentsEmpty')}
              />
            </FieldShell>
          )}
        />
      ) : null}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
          {t('cancel')}
        </Button>
        <Button type="submit" loading={pending}>
          {pending ? t('submitting') : editing ? t('submitEdit') : t('submitCreate')}
        </Button>
      </DialogFooter>
    </form>
  );
}
