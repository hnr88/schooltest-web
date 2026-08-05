'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { FieldShell, SelectField, Textarea } from '@/modules/design-system';
import { CsvDropZone } from '@/modules/student-import/components/CsvDropZone';
import { CsvTemplateLink } from '@/modules/student-import/components/CsvTemplateLink';
import { useStudentImportFields } from '@/modules/student-import/hooks/use-student-import-fields';
import type { StudentImportFieldsProps } from '@/modules/student-import/types/components.types';

const PASTE_FIELD_ID = 'student-import-csv';
const CLASS_FIELD_ID = 'student-import-class';

// The ONE import flow spec §2 (Add class modal) and §4 (Import students) share:
// template link, drop zone, paste box, and the class selector only when the
// host passes `classes` — Classes creates the class in the same submit, so it
// omits them. Presentational plus parsing: every row reaches the host through
// `onChange` and the host owns the write.
export function StudentImportFields({
  onChange,
  classes,
  classId,
  onClassChange,
  className,
}: StudentImportFieldsProps) {
  const t = useTranslations('StudentImport');
  const fields = useStudentImportFields(onChange);

  return (
    <div data-slot="student-import-fields" className={cn('flex flex-col gap-4', className)}>
      <CsvTemplateLink />
      <CsvDropZone
        inputRef={fields.inputRef}
        isDragging={fields.isDragging}
        onBrowse={fields.onBrowse}
        onFileInput={fields.onFileInput}
        onDragOver={fields.onDragOver}
        onDragLeave={fields.onDragLeave}
        onDrop={fields.onDrop}
      />
      <FieldShell id={PASTE_FIELD_ID} label={t('pasteLabel')}>
        <Textarea
          id={PASTE_FIELD_ID}
          rows={4}
          spellCheck={false}
          placeholder={t('pastePlaceholder')}
          value={fields.csv}
          onChange={(event) => fields.setCsv(event.target.value)}
          className="font-mono"
        />
      </FieldShell>
      {classes ? (
        <SelectField
          id={CLASS_FIELD_ID}
          label={t('classLabel')}
          placeholder={t('classPlaceholder')}
          value={classId}
          onValueChange={onClassChange}
          options={classes.map((option) => ({
            value: option.documentId,
            label: option.name,
          }))}
        />
      ) : null}
    </div>
  );
}
