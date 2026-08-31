import { Clock3 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/modules/design-system';

export function ResetPasswordExpiredState() {
  const t = useTranslations('Auth');

  return (
    <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-2 duration-300 motion-reduce:animate-none">
      <span
        aria-hidden="true"
        className="flex size-12 items-center justify-center rounded-full bg-danger-soft-2 text-danger-strong"
      >
        <Clock3 className="size-5.5" />
      </span>
      <div className="flex flex-col gap-2">
        <h1 className="text-auth-title font-bold text-foreground">{t('expiredLinkTitle')}</h1>
        <p className="text-body-md text-body">{t('expiredLinkBody')}</p>
      </div>
      <div className="flex flex-col gap-3">
        <Button href="/forgot-password" size="xl" className="w-full rounded-lg">
          {t('requestNewLink')}
        </Button>
        <Button href="/sign-in" variant="outline" size="xl" className="w-full rounded-lg">
          {t('backToSignIn')}
        </Button>
      </div>
    </div>
  );
}
