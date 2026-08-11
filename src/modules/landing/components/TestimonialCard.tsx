import { Star } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { Card } from '@/modules/design-system';
import {
  TESTIMONIAL_INITIALS,
  TESTIMONIAL_STAR_COUNT,
} from '@/modules/landing/constants/landing.constants';
import type { TestimonialCardProps } from '@/modules/landing/types/landing.types';

async function TestimonialCard({
  quoteKey = 'testimonial.quote',
  nameKey = 'testimonial.name',
  roleKey = 'testimonial.role',
  initials = TESTIMONIAL_INITIALS,
  showRating = true,
}: TestimonialCardProps) {
  const t = await getTranslations('Home');

  return (
    <Card className="rounded-3xl p-8 shadow-md sm:p-9">
      {showRating ? (
        <div role="img" aria-label={t('testimonial.ratingLabel')} className="flex gap-0.5">
          {Array.from({ length: TESTIMONIAL_STAR_COUNT }, (_, index) => (
            <Star key={index} aria-hidden="true" className="size-4 fill-amber-500 text-amber-500" />
          ))}
        </div>
      ) : null}
      <blockquote className="mt-4 text-quote">{t(quoteKey)}</blockquote>
      <div className="mt-auto flex items-center gap-3 pt-6">
        {initials === null ? null : (
          <span
            aria-hidden="true"
            className="grid size-11 shrink-0 place-items-center rounded-full bg-teal-500 text-sm font-bold text-navy-900"
          >
            {initials}
          </span>
        )}
        <div>
          {nameKey === null ? null : <p className="text-sm font-semibold">{t(nameKey)}</p>}
          <p className="text-caption text-muted-foreground">{t(roleKey)}</p>
        </div>
      </div>
    </Card>
  );
}

export { TestimonialCard };
