'use client';

import { useTranslations } from 'next-intl';

import { PersonCell } from '@/modules/design-system';
import { CONTACT_CHANNEL_VALUES } from '@/modules/student-wizard';
import { ChildFactList } from '@/modules/children/components/ChildFactList';
import { getGuardianFacts } from '@/modules/children/lib/child-profile-facts';
import type { StudentDetail } from '@/modules/children/types/children.types';

type ContactChannel = (typeof CONTACT_CHANNEL_VALUES)[number];

function isChannel(value: string | null): value is ContactChannel {
  return value !== null && (CONTACT_CHANNEL_VALUES as readonly string[]).includes(value);
}

// The canonical "Linked parents" rail panel (Student detail 5d): a person cell
// over the contact facts. Fed entirely by the guardian block of the parent detail
// read — when the API returned none of it, the panel says so in one sentence.
export function ChildGuardianPanel({ detail }: { detail: StudentDetail }) {
  const t = useTranslations('Children');
  const tWizard = useTranslations('StudentWizard');

  const facts = getGuardianFacts(detail, {
    email: tWizard('guardian.email'),
    phone: tWizard('guardian.phone'),
    wechat: tWizard('guardian.wechat'),
    preferredContact: tWizard('guardian.preferredContact'),
    channelValue: isChannel(detail.preferred_contact_channel)
      ? tWizard(`guardian.channel.${detail.preferred_contact_channel}`)
      : null,
  }).filter((fact) => fact.value !== null);

  const name = detail.parent_guardian_name?.trim();
  const isEmpty = !name && facts.length === 0;

  return (
    <section
      data-slot="child-guardian-panel"
      aria-labelledby="child-guardian-title"
      className="flex flex-col gap-3 rounded-panel border border-border bg-card p-5 shadow-sm sm:p-6"
    >
      <h2 id="child-guardian-title" className="text-panel-title font-semibold text-foreground">
        {t('guardianHeading')}
      </h2>
      {isEmpty ? (
        <p className="text-body-sm text-muted-foreground">{t('guardianEmpty')}</p>
      ) : (
        <>
          {name ? <PersonCell name={name} secondary={t('guardianRole')} /> : null}
          {facts.length > 0 ? <ChildFactList facts={facts} /> : null}
        </>
      )}
    </section>
  );
}
