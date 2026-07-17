import { Star } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { Card, PresenceAvatar } from '@/modules/design-system';
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
          <Star key={index} aria-hidden="true" className="size-4 fill-amber-400 text-amber-400" />
        ))}
      </div>
      <blockquote className="text-lg leading-relaxed">{t('testimonial.quote')}</blockquote>
      <div className="mt-auto flex items-center gap-3">
        <PresenceAvatar initials={TESTIMONIAL_INITIALS} size="lg" />
        <div>
          <p className="text-sm font-semibold">{t('testimonial.name')}</p>
          <p className="text-sm text-muted-foreground">{t('testimonial.role')}</p>
        </div>
      </div>
    </Card>
  );
}

export { TestimonialCard };
