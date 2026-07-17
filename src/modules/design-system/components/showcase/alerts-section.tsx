import { getTranslations } from 'next-intl/server';

import { Alert } from '@/modules/design-system/components/alert';
import { Button } from '@/modules/design-system/components/button';
import { Section } from '@/modules/design-system/components/layout';
import { AlertDismissDemo } from './alert-dismiss-demo';

async function AlertsSection() {
  const t = await getTranslations('DesignSystem');
  return (
    <Section id="alerts">
      <h2 className="text-2xl font-bold tracking-tight">{t('sectionAlerts')}</h2>
      <div className="mt-6 flex flex-col gap-4">
        <Alert variant="info" title={t('alertInfoTitle')}>
          {t('alertInfoBody')}
        </Alert>
        <Alert variant="success" title={t('alertSuccessTitle')}>
          {t('alertSuccessBody')}
        </Alert>
        <AlertDismissDemo
          title={t('alertWarningTitle')}
          body={t('alertWarningBody')}
          actionLabel={t('alertWarningAction')}
          dismissLabel={t('alertDismiss')}
        />
        <Alert
          variant="error"
          title={t('alertErrorTitle')}
          action={
            <Button variant="outline" size="sm">
              {t('alertErrorAction')}
            </Button>
          }
        >
          {t('alertErrorBody')}
        </Alert>
      </div>
    </Section>
  );
}

export { AlertsSection };
