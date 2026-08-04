import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Eyebrow } from '@/modules/design-system';
import { BENEFITS } from '@/modules/eald/constants/components.constants';

import type { RegisterCardProps } from '@/modules/eald/types/components.types';

function RegisterFoundingCard({ t }: RegisterCardProps) {
  return (
    <div className="relative flex flex-col justify-center overflow-hidden rounded-3xl bg-navy-900 p-10 sm:p-12">
      <div className="absolute inset-0 bg-gradient-to-br from-navy-900/95 to-navy-900/90" />
      <div className="relative">
        <Eyebrow tone="teal">{t('home.register.foundingEyebrow')}</Eyebrow>
        <h2 className="mt-3 text-h2 font-bold text-balance text-white">
          {t('home.register.foundingTitle')}
        </h2>
        <p className="mt-3 text-body-md leading-relaxed text-navy-muted">
          {t('home.register.foundingBody')}
        </p>
        <div className="mt-6 flex flex-col gap-3">
          {BENEFITS.map((key) => (
            <span key={key} className="flex items-center gap-2.5 text-body-md text-blue-200">
              <Check className="size-4 shrink-0 text-teal-400" strokeWidth={2.6} />
              {t(key)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export { RegisterFoundingCard };
