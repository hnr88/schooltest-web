'use client';

import { useTranslations } from 'next-intl';

import type { DiagnosticGroup } from '@/modules/teach/types/diagnostic.types';

import type { GroupPanelProps } from '@/modules/teach/types/components.types';

// "Group the class" panel (tasks 95-96, mvp-updates §4.9/§4.10): children
// clustered by the reading area currently holding them back, so the teacher
// can see who to pair with whom and how to differentiate, and click one click
// down to the individual profile. Raw codes and probabilities never reach this
// surface. The API emits the groups in reading-ladder order with
// not-yet-assessed last, so the panel renders the wire order verbatim. Returns
// null when no groups exist so the dashboard never shows a blank gap
// (C-RPT-01 v2 behavioural contract).
export function GroupPanel({ groups, onSelectStudent }: GroupPanelProps) {
  const t = useTranslations('Teach.diagnostic');

  if (groups.length === 0) {
    return null;
  }

  return (
    <section data-slot="group-panel" className="flex flex-col gap-3" aria-label={t('groupsTitle')}>
      <h3 className="text-base font-semibold text-foreground">{t('groupsTitle')}</h3>
      <p className="max-w-xl text-sm text-body">{t('groupsDescription')}</p>
      <ul className="flex flex-col gap-3">
        {groups.map((group) => (
          <li
            key={group.limiting_attribute}
            className="flex flex-col gap-2 rounded-xl border border-border bg-card px-4 py-3"
          >
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-sm font-semibold text-foreground">
                {t(`areas.${group.limiting_attribute}`)}
              </span>
              <span className="text-xs text-body">{t('groupCount', { count: group.count })}</span>
            </div>
            <ul className="flex flex-wrap gap-x-3 gap-y-1">
              {group.student_refs.map((ref, index) => (
                <li key={`${ref}-${index}`}>
                  <button
                    type="button"
                    onClick={() => onSelectStudent(ref)}
                    className="rounded-lg px-1 py-0.5 text-sm font-medium text-primary transition-colors duration-150 hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    {ref}
                  </button>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}
