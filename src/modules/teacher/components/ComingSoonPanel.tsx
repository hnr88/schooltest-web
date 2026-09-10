'use client';

import { Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { SKILL_SCOPE_ORDER, isSkillLive } from '@/modules/teacher/lib/skill-scope';
import type { ComingSoonPanelProps } from '@/modules/teacher/types/results-shell.types';

/**
 * The ONE coming-soon body, two scopes: the class shell (S06a, `Teacher Portal
 * v2` `:641–661`) and the student page (S04d, task 15) — never a second body.
 * Title and description come from the caller, because the design words the two
 * scopes differently; the icon tile, the layout and (class scope only) the four
 * skill status chips are shared.
 *
 * It ships WITHOUT the notify-me confirmation ([D-12]): `api::push-subscription`
 * is web-push transport, not a launch-interest list, and a confirmation that
 * records nothing is a lie (OP-2). The panel carries no control at all.
 */
function ComingSoonPanel({ title, description, showSkillChips = false }: ComingSoonPanelProps) {
  const t = useTranslations('Teacher.results.skills');

  return (
    <section
      data-slot="coming-soon-panel"
      aria-labelledby="coming-soon-heading"
      className="flex flex-col items-center gap-4 px-4 pb-5 pt-11 text-center sm:px-6"
    >
      <div className="grid size-15 place-items-center rounded-2xl bg-surface-hover">
        <Clock aria-hidden="true" className="size-6.5 text-body" strokeWidth={1.8} />
      </div>
      <div className="max-w-prose">
        <h2 id="coming-soon-heading" className="text-panel-title font-semibold text-foreground">
          {title}
        </h2>
        <p className="mt-2.5 text-body-sm text-balance text-body">{description}</p>
      </div>
      {showSkillChips ? (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {SKILL_SCOPE_ORDER.map((skill) =>
            isSkillLive(skill) ? (
              <span
                key={skill}
                data-slot="skill-status-chip"
                data-skill={skill}
                data-state="live"
                className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1 text-meta font-semibold text-success-strong"
              >
                <span aria-hidden="true" className="size-1.5 rounded-full bg-success-strong" />
                {t('liveChip', { skill: t(skill) })}
              </span>
            ) : (
              <span
                key={skill}
                data-slot="skill-status-chip"
                data-skill={skill}
                data-state="soon"
                className="inline-flex items-center rounded-full bg-surface-hover px-3 py-1 text-meta font-semibold text-body"
              >
                {t('soonChip', { skill: t(skill) })}
              </span>
            ),
          )}
        </div>
      ) : null}
    </section>
  );
}

export { ComingSoonPanel };
