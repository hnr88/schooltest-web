import { Star } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { Card } from '@/modules/design-system';
import {
  TESTIMONIAL_INITIALS,
  TESTIMONIAL_STAR_COUNT,
} from '@/modules/landing/constants/landing.constants';

async function TestimonialCard() {
  const t = await getTranslations('Home');

  return (
    <Card className="p-8">
      <div role="img" aria-label={t('testimonial.ratingLabel')} className="flex gap-0.5">
        {Array.from({ length: TESTIMONIAL_STAR_COUNT }, (_, index) => (
          <Star key={index} aria-hidden="true" className="size-4 fill-amber-500 text-amber-500" />
        ))}
      </div>
      <blockquote className="mt-4 text-quote">{t('testimonial.quote')}</blockquote>
      <div className="mt-auto flex items-center gap-3 pt-6">
        <span
          aria-hidden="true"
          className="grid size-11 shrink-0 place-items-center rounded-full bg-teal-500 text-sm font-bold text-navy-900"
        >
          {TESTIMONIAL_INITIALS}
        </span>
        <div>
          <p className="text-sm font-semibold">{t('testimonial.name')}</p>
          <p className="text-sm text-muted-foreground">{t('testimonial.role')}</p>
        </div>
      </div>
    </Card>
  );
}

export { TestimonialCard };
