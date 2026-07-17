import { BellIcon } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { Button } from '@/modules/design-system/components/button';
import { Section } from '@/modules/design-system/components/layout';

async function ButtonsSection() {
  const t = await getTranslations('DesignSystem');
  return (
    <Section id="buttons">
      <h2 className="text-2xl font-bold tracking-tight">{t('sectionButtons')}</h2>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button className="ds-probe">{t('buttonCreate')}</Button>
        <Button variant="navy">{t('buttonGetStarted')}</Button>
        <Button variant="accent">{t('buttonCreate')}</Button>
        <Button variant="secondary">{t('buttonSave')}</Button>
        <Button variant="outline">{t('buttonCancel')}</Button>
        <Button variant="ghost">{t('buttonCancel')}</Button>
        <Button variant="destructive">{t('buttonDelete')}</Button>
        <Button variant="link">{t('buttonLearnMore')}</Button>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-navy-900 p-6">
        <Button variant="white">{t('buttonGetStarted')}</Button>
        <Button variant="outline-white">{t('buttonLearnMore')}</Button>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button size="sm">{t('buttonCreate')}</Button>
        <Button size="default">{t('buttonCreate')}</Button>
        <Button size="lg">{t('buttonCreate')}</Button>
        <Button size="xl">{t('buttonGetStarted')}</Button>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button loading>{t('buttonSaving')}</Button>
        <Button disabled>{t('buttonSave')}</Button>
        <Button size="icon" aria-label={t('buttonNotifications')}>
          <BellIcon />
        </Button>
      </div>
    </Section>
  );
}

export { ButtonsSection };
