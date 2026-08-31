import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/modules/design-system';

export function ResetPasswordSuccessState() {
  const t = useTranslations('Auth');

  return (
    <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-2 duration-300 motion-reduce:animate-none">
      <span
        aria-hidden="true"
        className="flex size-12 items-center justify-center rounded-full bg-teal-50 text-teal-600"
      >
        <Check className="size-5.5" strokeWidth={3} />
      </span>
      <div className="flex flex-col gap-2">
        <h1 className="text-auth-title font-bold text-foreground">{t('passwordUpdatedTitle')}</h1>
        <p className="text-body-md text-body">{t('passwordUpdatedBody')}</p>
      </div>
      <Button href="/dashboard" size="xl" className="w-full rounded-lg">
        {t('continueToDashboard')}
      </Button>
    </div>
  );
}
