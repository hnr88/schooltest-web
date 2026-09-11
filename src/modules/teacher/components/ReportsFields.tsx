'use client';

import { useId } from 'react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { ChoiceCard } from '@/modules/teacher/components/start-session/ChoiceCard';
import {
  REPORT_KINDS,
  REPORTS_KIND_GROUP_CLASS,
  REPORTS_LABEL_CLASS,
} from '@/modules/teacher/constants/class-reports.constants';
import type { ReportsFormatFieldProps, ReportsKindFieldProps } from '@/modules/teacher/types/class-reports.types';

// The Reports modal's two choices (`Teacher Portal v2.dc.html:1633–1668`): "What to
// produce" as the design's radio cards and "Format" as round pills — both native
// radio groups, so arrow keys move the choice and each group is one tab stop.

function ReportsKindField({ value, forClass, onChange }: ReportsKindFieldProps) {
  const t = useTranslations('TeacherPortal.reports');
  const labelId = useId();
  return (
    <div data-slot="reports-kinds" className="mt-5">
      <p id={labelId} className={REPORTS_LABEL_CLASS}>
        {t('produceLabel')}
      </p>
      <div role="radiogroup" aria-labelledby={labelId} className={REPORTS_KIND_GROUP_CLASS}>
        {REPORT_KINDS.map((kind) => (
          <ChoiceCard
            key={kind}
            name="reports-kind"
            value={kind}
            checked={value === kind}
            onSelect={() => onChange(kind)}
            label={t(`kinds.${kind}.label`)}
            description={t(`kinds.${kind}.desc`, { name: forClass })}
            size="scope"
          />
        ))}
      </div>
    </div>
  );
}

function ReportsFormatField({ formats, value, onChange }: ReportsFormatFieldProps) {
  const t = useTranslations('TeacherPortal.reports');
  const labelId = useId();
  return (
    <div data-slot="reports-formats" className="mt-[22px]">
      <p id={labelId} className={REPORTS_LABEL_CLASS}>
        {t('formatLabel')}
      </p>
      <div role="radiogroup" aria-labelledby={labelId} className="flex flex-wrap gap-2">
        {formats.map((format) => {
          const checked = format === value;
          return (
            <label
              key={format}
              data-slot="reports-format"
              data-value={format}
              data-checked={checked ? '' : undefined}
              className={cn(
                'cursor-pointer rounded-full border px-[18px] py-[9px] text-[13px] font-semibold transition-colors motion-reduce:transition-none has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-navy-900',
                checked ? 'border-navy-900 bg-navy-900 text-white' : 'border-[#E4E9F2] bg-white text-[#3D4A5C] hover:border-navy-900',
              )}
            >
              <input
                type="radio"
                name="reports-format"
                value={format}
                checked={checked}
                onChange={() => onChange(format)}
                className="sr-only"
              />
              {t(`formats.${format}`)}
            </label>
          );
        })}
      </div>
    </div>
  );
}

export { ReportsFormatField, ReportsKindField };
