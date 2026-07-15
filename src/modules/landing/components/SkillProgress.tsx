import { getTranslations } from 'next-intl/server';

import type { SkillProgressProps } from '@/modules/landing/types/landing.types';

export async function SkillProgress({
  icon: Icon,
  iconClassName,
  label,
  progressClassName,
  value,
}: SkillProgressProps) {
  const t = await getTranslations('Home');

  return (
    <article className="flex flex-col gap-3 rounded-2xl bg-background p-3">
      <div className="flex items-center gap-2">
        <span className={`grid size-8 place-items-center rounded-xl ${iconClassName}`}>
          <Icon aria-hidden className="size-4" />
        </span>
        <span className="text-sm font-semibold text-ink">{label}</span>
      </div>
      <div
        role="progressbar"
        aria-label={t('preview.skillProgress', { skill: label, value })}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        className="h-2 overflow-hidden rounded-full bg-progress-track"
      >
        <span aria-hidden className={`block h-full rounded-full ${progressClassName}`} />
      </div>
    </article>
  );
}
