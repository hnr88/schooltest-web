'use client';

import { CheckIcon, XIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { TintTile } from '@/modules/design-system';

import type { SubskillTileProps } from '@/modules/classes/types/components.types';

// One spec §2 subskill tile: green for "Mastered", the neutral recess for "Not
// yet". Built on the canonical TintTile with the design system's own success
// tokens (the AA-safe `-soft` / `-ink` pair the status pills use) rather than a
// new tone or a raw colour.
//
// The verdict is carried in TEXT — the icon is decorative — so it survives with
// colour removed and never depends on hue alone (WCAG 1.4.1).
export function SubskillTile({ subskill, verdict }: SubskillTileProps) {
  const t = useTranslations('Classes.studentDetail');
  const mastered = verdict === 'mastered';
  const Icon = mastered ? CheckIcon : XIcon;

  return (
    <TintTile className={cn('text-center', mastered && 'bg-success-soft text-success-ink')}>
      <p className={cn('text-meta', mastered ? 'text-success-ink' : 'text-muted-foreground')}>
        {t(`subskill.${subskill}`)}
      </p>
      <p
        className={cn(
          'mt-0.5 flex items-center justify-center gap-1 text-sm font-medium',
          mastered ? 'text-success-ink' : 'text-body',
        )}
      >
        <Icon className="size-3.5" aria-hidden />
        {mastered ? t('mastered') : t('notYet')}
      </p>
    </TintTile>
  );
}
