'use client';

import { IdCard } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import {
  BorderedCallout,
  KeyValueList,
  KeyValueRow,
  PanelHeaderRow,
  PersonCell,
} from '@/modules/design-system';
import { CONTACT_CHANNEL_VALUES, GENDER_VALUES } from '@/modules/student-wizard';
import { getEnrolmentFacts, getGuardianFacts } from '@/modules/children/lib/child-profile-facts';
import { getTargetEntry } from '@/modules/children/lib/student-display';
import type { ChildProfileFact, StudentDetail } from '@/modules/children/types/children.types';

function isGender(value: string | null): value is (typeof GENDER_VALUES)[number] {
  return value !== null && (GENDER_VALUES as readonly string[]).includes(value);
}

function isChannel(value: string | null): value is (typeof CONTACT_CHANNEL_VALUES)[number] {
  return value !== null && (CONTACT_CHANNEL_VALUES as readonly string[]).includes(value);
}

function FactList({ facts }: { facts: ChildProfileFact[] }) {
  return (
    <KeyValueList>
      {facts.map((fact) => (
        <KeyValueRow key={fact.label} label={fact.label}>
          {fact.value}
        </KeyValueRow>
      ))}
    </KeyValueList>
  );
}

// The two record panels this screen used to stack are ONE surface now, split into
// two columns — canonical 2h has no record panel at all (enrolment and linked
// parents live on 5e, a different role's screen), so the parent's copy is deferred
// behind the Record tab and drawn once rather than twice.
//
// Rows are the canonical §02.15 KeyValueRow, which owns the 12px rhythm and the
// #EEF2F7 hairline the old hand-rolled <dl> had to re-declare. Every row is a
// field GET /api/my/students/:documentId really returned for THIS child; the
// caller filters nulls out, so a row can never render as an em dash, and a section
// with nothing recorded gets the canonical BorderedCallout saying exactly that.
export function ChildRecordPanel({ detail }: { detail: StudentDetail }) {
  const t = useTranslations('Children');
  const tWizard = useTranslations('StudentWizard');
  const format = useFormatter();

  const enrolment = getEnrolmentFacts(detail, {
    formatYear: (year) => tWizard('education.yearOption', { n: year }),
    yearLevel: t('yearLevel'),
    dateOfBirth: tWizard('personal.dateOfBirth'),
    gender: tWizard('personal.gender.label'),
    genderValue: isGender(detail.gender) ? tWizard(`personal.gender.${detail.gender}`) : null,
    nationality: t('nationality'),
    currentSchool: tWizard('education.currentSchool'),
    targetEntry: t('targetEntry'),
    signInEmail: t('signInEmail'),
    addedOn: t('addedOn'),
    born: detail.date_of_birth
      ? format.dateTime(new Date(`${detail.date_of_birth}T00:00:00`), { dateStyle: 'long' })
      : null,
    added: format.dateTime(new Date(detail.createdAt), { dateStyle: 'medium' }),
    targetEntryValue: getTargetEntry(detail),
  }).filter((fact) => fact.value !== null);

  const guardian = getGuardianFacts(detail, {
    email: tWizard('guardian.email'),
    phone: tWizard('guardian.phone'),
    wechat: tWizard('guardian.wechat'),
    preferredContact: tWizard('guardian.preferredContact'),
    channelValue: isChannel(detail.preferred_contact_channel)
      ? tWizard(`guardian.channel.${detail.preferred_contact_channel}`)
      : null,
  }).filter((fact) => fact.value !== null);

  const guardianName = detail.parent_guardian_name?.trim();

  return (
    <section
      data-slot="child-record-panel"
      className="grid gap-6 rounded-card bg-card px-6 py-6 shadow-sm sm:px-7.5 lg:grid-cols-2 lg:gap-x-10"
    >
      <div className="flex flex-col gap-3">
        <PanelHeaderRow title={t('enrolmentHeading')} className="pb-0" />
        {enrolment.length === 0 ? (
          <BorderedCallout icon={IdCard}>{t('enrolmentEmpty')}</BorderedCallout>
        ) : (
          <FactList facts={enrolment} />
        )}
      </div>

      <div className="flex flex-col gap-3">
        <PanelHeaderRow title={t('guardianHeading')} className="pb-0" />
        {!guardianName && guardian.length === 0 ? (
          <BorderedCallout icon={IdCard}>{t('guardianEmpty')}</BorderedCallout>
        ) : (
          <>
            {guardianName ? <PersonCell name={guardianName} secondary={t('guardianRole')} /> : null}
            {guardian.length > 0 ? <FactList facts={guardian} /> : null}
          </>
        )}
      </div>
    </section>
  );
}
