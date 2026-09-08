import Image from 'next/image';
import { Check } from 'lucide-react';

import { Eyebrow } from '@/modules/design-system';
import { BENEFITS } from '@/modules/eald/constants/components.constants';

import type { RegisterCardProps } from '@/modules/eald/types/components.types';

function RegisterFoundingCard({ t }: RegisterCardProps) {
  return (
    <div className="flex min-w-0 flex-col">
      <Eyebrow tone="teal">{t('home.register.foundingEyebrow')}</Eyebrow>
      <h2 className="mt-3.5 text-h2 font-bold tracking-tight text-balance text-foreground">
        {t('home.register.foundingTitle')}
      </h2>
      <p className="mt-5 text-body-lg leading-relaxed text-pretty text-body">
        {t('home.register.foundingBody')}
      </p>
      <ul className="mt-6 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
        {BENEFITS.map((key) => (
          <li
            key={key}
            className="flex items-center gap-3 px-5 py-4 text-body-md font-medium text-foreground"
          >
            <Check aria-hidden="true" className="size-4 shrink-0 text-teal-700" strokeWidth={2.8} />
            {t(key)}
          </li>
        ))}
      </ul>
      <div className="relative mt-6.5 min-h-55 flex-1 overflow-hidden rounded-2xl">
        <Image
          src="/images/university-of-mobile-ZPkG0EdWQa8-unsplash.jpg"
          alt={t('home.register.foundingImageAlt')}
          fill
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover"
        />
      </div>
    </div>
  );
}

export { RegisterFoundingCard };
