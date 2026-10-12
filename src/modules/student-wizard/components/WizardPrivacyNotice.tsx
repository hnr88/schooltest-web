'use client';

import { useTranslations } from 'next-intl';

import { PolicyLinks } from '@/modules/auth';
import { parentViewsEnabled } from '@/modules/flags';
import { useWizardPrivacyOptions } from '@/modules/student-wizard/hooks/use-student-wizard';

// W4-19 (G-24, G-26): the just-in-time collection notice at the top of step 1.
// Plain language, written from the same facts as the privacy policy purposes
// table: what we ask for, why, and the three policy links. Text only: nothing
// to click or accept (D5). Guardian and media rows appear only when those steps
// are rendered (parent views flag); the extras row switches wording with the
// minimised profile. While the consent config is pending a skeleton holds the
// place; on error the default (today's) wording shows.
export function WizardPrivacyNotice() {
  const t = useTranslations('StudentWizard.notice');
  const { options, isPending } = useWizardPrivacyOptions();
  const { minimised } = options;
  const rows = [
    'identity',
    'education',
    ...(parentViewsEnabled() ? ['guardian', 'media'] : []),
    minimised ? 'extrasOptional' : 'extras',
  ];

  return (
    <section
      data-slot="wizard-privacy-notice"
      aria-labelledby="wizard-notice-title"
      aria-busy={isPending}
      className="flex flex-col gap-3 rounded-card border border-border bg-muted/40 p-4"
    >
      <h3 id="wizard-notice-title" className="text-[15px] font-semibold text-foreground">
        {t('title')}
      </h3>
      {isPending ? (
        <div role="status" className="flex flex-col gap-2">
          <span className="sr-only">{t('loading')}</span>
          <span aria-hidden="true" className="shimmer-sweep h-3 w-11/12 rounded-sm" />
          <span aria-hidden="true" className="shimmer-sweep h-3 w-3/5 rounded-sm" />
        </div>
      ) : (
        <>
          <p className="text-body-sm text-body">{t('intro')}</p>
          <ul className="flex flex-col gap-2 text-body-sm text-body">
            {rows.map((row) => (
              <li key={row} data-notice-row={row}>
                <span className="font-semibold text-foreground">{t(`rows.${row}.label`)}</span>{' '}
                {t(`rows.${row}.why`)}
              </li>
            ))}
          </ul>
          {minimised ? <p className="text-body-sm text-body">{t('optionalNote')}</p> : null}
        </>
      )}
      <PolicyLinks />
    </section>
  );
}
