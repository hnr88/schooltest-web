'use client';

import { useId } from 'react';
import { useTranslations } from 'next-intl';

import { ChoiceCard } from '@/modules/teacher/components/start-session/ChoiceCard';
import { START_SESSION_SKILLS } from '@/modules/teacher/constants/start-session.constants';
import {
  CLASS_SELECT_CLASS,
  DEMO_NOTE_CLASS,
  FIELD_LABEL_CLASS,
} from '@/modules/teacher/constants/start-session-styles.constants';
import type { DashboardClass, TeacherTest } from '@/modules/teacher/types/teacher.types';

/**
 * Skill (Reading live, the rest disabled), the teacher's REAL classes and the
 * tests GET /api/teacher/tests returns (`:1404–1447`). The API carries no
 * description, duration or question count for a form, so a card is its label.
 */
function TestTab({
  isDemo,
  classes,
  tests,
  classId,
  formId,
  onClass,
  onTest,
}: {
  isDemo: boolean;
  classes: readonly DashboardClass[];
  tests: readonly TeacherTest[];
  classId: string;
  formId: string;
  onClass: (classId: string) => void;
  onTest: (formId: string) => void;
}) {
  const t = useTranslations('TeacherPortal.startSession.test');
  const id = useId();

  return (
    <div data-slot="start-session-test" className="mt-1">
      <span id={`${id}-skill`} className={FIELD_LABEL_CLASS}>
        {t('skill')}
      </span>
      <div role="radiogroup" aria-labelledby={`${id}-skill`} className="flex flex-nowrap gap-2">
        {START_SESSION_SKILLS.map(({ key, live }) => (
          <ChoiceCard
            key={key}
            name="start-session-skill"
            value={key}
            size="skill"
            checked={key === 'reading'}
            disabled={!live}
            onSelect={() => undefined}
            label={t(`skills.${key}`)}
          />
        ))}
      </div>

      {isDemo ? (
        <p className={DEMO_NOTE_CLASS}>{t('demoNote')}</p>
      ) : (
        <div className="mt-5">
          <label htmlFor={`${id}-class`} className={FIELD_LABEL_CLASS}>
            {t('class')}
          </label>
          <select
            id={`${id}-class`}
            data-slot="start-session-class"
            value={classId}
            onChange={(event) => onClass(event.target.value)}
            className={CLASS_SELECT_CLASS}
          >
            {classes.map((klass) => (
              <option key={klass.class_document_id} value={klass.class_document_id}>
                {klass.year_level === null || klass.year_level === undefined
                  ? t('classOptionNoYear', { name: klass.name, count: klass.student_count })
                  : t('classOption', { name: klass.name, year: klass.year_level, count: klass.student_count })}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="mt-[22px]">
        <span id={`${id}-test`} className={FIELD_LABEL_CLASS}>
          {t('test')}
        </span>
        <div role="radiogroup" aria-labelledby={`${id}-test`} className="flex flex-col gap-2.5">
          {tests.map((test) => (
            <ChoiceCard
              key={test.form_document_id}
              name="start-session-test"
              value={test.form_document_id}
              size="test"
              checked={test.form_document_id === formId}
              onSelect={onTest}
              label={test.label}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export { TestTab };
