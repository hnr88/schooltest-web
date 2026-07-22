'use client';

import { useTranslations } from 'next-intl';

import { env } from '@/lib/env';
import { cn } from '@/lib/utils';
import { GoogleMark } from '@/modules/auth/components/GoogleMark';
import { Button } from '@/modules/design-system';

interface GoogleButtonProps {
  className?: string;
}

// Continue-with-Google entry point (C-AUTH-GOOGLE), shared by SignInCard and
// SignUpCard: a plain anchor to the api's connect route, visible always (D18
// — task-12 decision). While the provider stays disabled pre-credentials
// (D5), the api answers its real typed 400 there — never a dead/fake link.
export function GoogleButton({ className }: GoogleButtonProps) {
  const t = useTranslations('Auth');

  return (
    <Button
      variant="outline"
      size="lg"
      href={`${env.NEXT_PUBLIC_API_BASE_URL}/api/connect/google`}
      title={t('googleTitle')}
      className={cn(
        'gap-2.5 rounded-lg text-body-md font-semibold text-navy-800 shadow-none transition-[transform,background-color,border-color] duration-150 ease-out-expo hover:-translate-y-0.5 hover:border-slate-400 active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0',
        className,
      )}
    >
      <GoogleMark />
      {t('googleButton')}
    </Button>
  );
}
