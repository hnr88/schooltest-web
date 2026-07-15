import { BookOpen, Headphones, Mic, PenLine, Sparkles } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { SkillProgress } from '@/modules/landing/components/SkillProgress';

export async function AssessmentPreview() {
  const t = await getTranslations('Home');
  const weeklyProgress = 75;
  const skills = [
    {
      icon: BookOpen,
      label: t('preview.reading'),
      value: 75,
      iconClassName: 'bg-rausch-100 text-rausch-600',
      progressClassName: 'w-3/4 bg-rausch-500',
    },
    {
      icon: Headphones,
      label: t('preview.listening'),
      value: 66,
      iconClassName: 'bg-babu-50 text-babu-700',
      progressClassName: 'w-2/3 bg-babu-500',
    },
    {
      icon: PenLine,
      label: t('preview.writing'),
      value: 50,
      iconClassName: 'bg-arches-50 text-arches-700',
      progressClassName: 'w-1/2 bg-arches-500',
    },
    {
      icon: Mic,
      label: t('preview.speaking'),
      value: 80,
      iconClassName: 'bg-rausch-50 text-rausch-600',
      progressClassName: 'w-4/5 bg-rausch-500',
    },
  ];

  return (
    <div className="relative mx-auto w-full max-w-xl">
      <span aria-hidden className="absolute -top-6 right-4 size-20 rounded-full bg-arches-50" />
      <div className="relative rounded-3xl border border-divider bg-background p-3 shadow-landing-card">
        <div className="flex flex-col gap-5 rounded-2xl bg-rausch-50 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold tracking-widest text-rausch-600 uppercase">
                {t('preview.eyebrow')}
              </span>
              <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-semibold tracking-tight text-ink">
                  {t('preview.title')}
                </h2>
                <p className="max-w-sm text-sm leading-6 text-ink-muted">
                  {t('preview.description')}
                </p>
              </div>
            </div>
            <span className="shrink-0 rounded-full bg-background px-3 py-2 text-xs font-semibold text-rausch-600 shadow-sm">
              {t('preview.week')}
            </span>
          </div>

          <div className="rounded-2xl bg-background p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-ink-muted">
                  {t('preview.levelLabel')}
                </span>
                <span className="text-lg font-semibold text-ink">{t('preview.levelName')}</span>
              </div>
              <span className="grid size-12 place-items-center rounded-2xl bg-rausch-500 text-sm font-bold text-on-rausch">
                {t('preview.level')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {skills.map((skill) => (
              <SkillProgress key={skill.label} {...skill} />
            ))}
          </div>

          <div className="flex flex-col gap-2 rounded-2xl bg-background p-4">
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="font-semibold text-ink">{t('preview.progressLabel')}</span>
              <span className="font-medium text-rausch-600">{t('preview.progress')}</span>
            </div>
            <div
              role="progressbar"
              aria-label={t('preview.weeklyProgress', { value: weeklyProgress })}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={weeklyProgress}
              className="h-2 overflow-hidden rounded-full bg-progress-track"
            >
              <span aria-hidden className="block h-full w-3/4 rounded-full bg-rausch-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-5 -left-3 hidden items-center gap-3 rounded-2xl border border-divider bg-background p-3 shadow-landing-card sm:flex">
        <span className="grid size-9 place-items-center rounded-xl bg-babu-50 text-babu-700">
          <Sparkles aria-hidden className="size-4" />
        </span>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-ink-muted">{t('preview.streakLabel')}</span>
          <span className="text-sm font-semibold text-ink">{t('preview.streak')}</span>
        </div>
      </div>
    </div>
  );
}
