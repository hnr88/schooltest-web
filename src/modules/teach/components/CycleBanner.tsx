'use client';

import { useFormatter, useTranslations } from 'next-intl';

import { useClassCycleQuery } from '@/modules/teach/queries/use-class-cycle.query';

interface CycleBannerProps {
  documentId: string;
}

// Teacher cycle banner (task 108, mvp-updates 4.5): which test the class is
// working on (Test A or Test B) plus the live form window dates, at the top
// of the class page. The banner always renders once the read settles - the
// unscheduled state is a calm message, never an error (4.9 what-you-see-is-
// what-you-get). A failed read renders nothing so the rest of the class page
// keeps working. form_code is shown to staff as an ops-facing code (C-TEACH-02),
// never with psychometric terms.
export function CycleBanner({ documentId }: CycleBannerProps) {
  const t = useTranslations('Teach.CycleBanner');
  const format = useFormatter();
  const cycle = useClassCycleQuery(documentId);

  if (!cycle.isSuccess) return null;

  const { live_form, window, position } = cycle.data;
  const formatDate = (iso: string) =>
    format.dateTime(new Date(iso), { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <section
      data-slot="cycle-banner"
      data-position={position}
      aria-label={t('label')}
      className="flex flex-col gap-1 rounded-lg border border-border bg-background px-3 py-2"
    >
      {position === 'unscheduled' ? (
        <p className="text-sm text-body">{t('unscheduled')}</p>
      ) : (
        <>
          <h2 className="text-sm font-semibold text-foreground">
            {t(position === 'test_b' ? 'testB' : 'testA')}
          </h2>
          {window ? (
            <p className="text-sm text-body">
              {t('window', { opens: formatDate(window.opens_at), closes: formatDate(window.closes_at) })}
            </p>
          ) : null}
          {live_form ? (
            <p className="text-xs text-muted-foreground">
              {t('formCode', { code: live_form.form_code })}
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}
