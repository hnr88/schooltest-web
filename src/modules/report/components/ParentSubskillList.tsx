'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { Eyebrow } from '@/modules/design-system';
import { useBarReveal } from '@/modules/report/hooks/useBarReveal';
import { PARENT_TONE_FILL, PARENT_TONE_SURFACE } from '@/modules/report/lib/parent-tone';
import type {
  ParentSubskillGroup,
  ParentSubskillsView,
} from '@/modules/report/types/report-view.types';

const SECTION_CLASS =
  'flex animate-in flex-col gap-4 rounded-card bg-card px-6 py-6 shadow-sm delay-100 duration-300 ease-out-expo fade-in slide-in-from-bottom-2 motion-reduce:animate-none sm:px-7.5';

// One dot per subskill in the group — never a bar and never a share, so nothing
// on this surface is a percentage of anything (E11-14).
function GroupDots({ group, revealed }: { group: ParentSubskillGroup; revealed: boolean }) {
  return (
    <span aria-hidden="true" className="flex flex-wrap items-center gap-1.5">
      {Array.from({ length: group.count }, (_, dot) => (
        <span
          key={dot}
          className={cn(
            'size-2.5 rounded-full transition-transform duration-500 ease-out-expo motion-reduce:transition-none',
            PARENT_TONE_FILL[group.state],
          )}
          style={{ transform: `scale(${revealed ? 1 : 0})`, transitionDelay: `${dot * 60}ms` }}
        />
      ))}
    </span>
  );
}

function GroupRow({ group, revealed }: { group: ParentSubskillGroup; revealed: boolean }) {
  const t = useTranslations('Report');

  return (
    <li
      data-slot="report-parent-subskill-group"
      data-state={group.state}
      className="flex flex-col gap-2 rounded-xl px-3 py-3 transition-colors duration-200 ease-out hover:bg-surface-hover motion-reduce:transition-none"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span
          className={cn(
            'inline-flex w-fit items-center rounded-full px-3 py-0.5 text-meta font-bold tracking-wide uppercase',
            PARENT_TONE_SURFACE[group.state],
          )}
        >
          {t(`parentSubskillStates.${group.state}`)}
        </span>
        <span
          data-slot="report-parent-subskill-count"
          className="text-body-md font-semibold text-foreground"
        >
          {t('parentSubskillCount', { count: group.count })}
        </span>
        <span className="ml-auto">
          <GroupDots group={group} revealed={revealed} />
        </span>
      </div>
      <p className="text-caption text-muted-foreground">
        {t(`parentSubskillStateNote.${group.state}`)}
      </p>
    </li>
  );
}

// E11-13 — the parent tally of the seven modelled subskills, as a three-step
// positive ordinal. No code, no percentage, no cross glyph and no zero row.
export function ParentSubskillList({ view }: { view: ParentSubskillsView }) {
  const t = useTranslations('Report');
  const revealed = useBarReveal();

  if (view.state !== 'groups') {
    const key =
      view.state === 'not_derived' ? 'parentSubskillsNotDerived' : 'parentSubskillsNotApplicable';
    return (
      <section data-slot="report-parent-subskills" data-state={view.state} className={SECTION_CLASS}>
        <Eyebrow>{t('parentSubskillsEyebrow')}</Eyebrow>
        <p
          data-slot="report-parent-subskills-absent"
          className="text-body-lg font-semibold text-balance text-muted-foreground"
        >
          {t(key)}
        </p>
        <p className="text-caption text-muted-foreground">{t(`${key}Description`)}</p>
      </section>
    );
  }

  return (
    <section
      data-slot="report-parent-subskills"
      data-state="groups"
      aria-label={t('parentSubskillsEyebrow')}
      className={SECTION_CLASS}
    >
      <div className="flex flex-col gap-1.5">
        <Eyebrow>{t('parentSubskillsEyebrow')}</Eyebrow>
        <p className="text-body-md text-muted-foreground">{t('parentSubskillsDescription')}</p>
      </div>

      <ul className="flex flex-col gap-0.5">
        {view.groups.map((group) => (
          <GroupRow key={group.state} group={group} revealed={revealed} />
        ))}
      </ul>

      <p data-slot="report-parent-subskills-total" className="text-caption text-muted-foreground">
        {t('parentSubskillsSummary', { total: view.total })}
      </p>
      <p className="text-caption text-muted-foreground">{t('parentSubskillsSource')}</p>
    </section>
  );
}
