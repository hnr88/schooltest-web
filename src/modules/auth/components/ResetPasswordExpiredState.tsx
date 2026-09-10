import { Clock3 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/modules/design-system';

export function ResetPasswordExpiredState() {
  const t = useTranslations('Auth');

  return (
    <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-2 duration-300 motion-reduce:animate-none">
      <span aria-hidden="true" className="grid size-12 place-items-center rounded-full bg-[#FEF2F2]">
        <Clock3 aria-hidden="true" className="size-[22px] text-[#B91C1C]" strokeWidth={2.2} />
      </span>
      <div className="flex flex-col gap-2">
        <h1 className="text-auth-title font-bold text-foreground">{t('expiredLinkTitle')}</h1>
        <p className="text-body-md text-muted-foreground">{t('portal.expiredBody')}</p>
      </div>
      <div className="flex flex-col gap-3">
        <Button
          href="/forgot-password"
          size="xl"
          className="w-full rounded-lg shadow-sm transition-[transform,background-color,box-shadow] duration-150 ease-out-expo hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
        >
          {t('portal.sendNewLink')}
        </Button>
        <Button href="/sign-in" variant="outline" size="xl" className="w-full rounded-lg">
          {t('portal.backToLogin')}
        </Button>
      </div>
    </div>
  );
}
