'use client';

import { useTranslations } from 'next-intl';

import { StatusPill } from '@/modules/design-system';
import {
  buildStudentDrillDownView,
  drillDownLabelKey,
} from '@/modules/teacher/lib/student-drill-down-view';
import type { DrillDownSkill } from '@/modules/teacher/lib/student-drill-down-view';
import type { StudentDrillDownBodyProps } from '@/modules/teacher/types/student-drill-down.types';

/** Presentation capitalisation of a server band token — same word, no rewrite. */
function bandWord(band: string): string {
  return band.charAt(0).toUpperCase() + band.slice(1);
}

function SkillRow({ skill, td, t }: {
  skill: DrillDownSkill;
  td: (key: string) => string;
  t: (key: string) => string;
}) {
  const label = td(drillDownLabelKey(skill.attribute));
  const gap = skill.score === null;
  const movement =
    skill.deltaDisplay === null
      ? t('valueUnavailable')
      : skill.deltaDisplay === 'band_movement' && skill.bandBefore !== null && skill.bandAfter !== null
        ? `${bandWord(skill.bandBefore)} \u2192 ${bandWord(skill.bandAfter)}`
        : bandWord(skill.deltaDisplay);

  return (
    <li
      data-slot="drill-down-skill"
      data-attribute={skill.attribute}
      data-status={skill.status ?? 'not_assessed'}
      className={skill.score === null ? 'flex items-center justify-between gap-3 opacity-60' : 'flex items-center justify-between gap-3'}
    >
      <span className="text-body-sm font-semibold text-foreground">{label}</span>
      <span className="flex items-center gap-2">
        {skill.status === null ? (
          <StatusPill tone="neutral">{t('bandNotAssessed')}</StatusPill>
        ) : (
          <StatusPill tone={skill.status === 'secure' ? 'success' : skill.status === 'not_yet' ? 'danger' : 'info'}>
            {bandWord(skill.status)}
          </StatusPill>
        )}
        <span className="text-body-sm font-semibold text-foreground">
          {gap ? t('bandNotAssessed') : `${skill.score} / 100`}
        </span>
        <span className="text-meta text-body">{movement}</span>
      </span>
    </li>
  );
}

// The v2-native drill-down body (web repoint, pre-24). ONE canonical read:
// the overall card (score, the server's own growth rendering, the current
// ACARA phase) and the six CDM-and-blend skill rows with the server's band
// and movement verbatim. Critical Reading is NOT a skill row — Rasch-scored
// outside the CDM, it renders as the GATE line: score + pass/fail state,
// never a band, never a delta. Older sittings render as collapsed overall
// rows from `history` (most recent first) — the history columns carry no
// bands, so collapsed rows honestly show scores only.
function StudentDrillDownBody({ view: rawView }: StudentDrillDownBodyProps) {
  const t = useTranslations('Teacher.results.drillDown');
  const td = useTranslations('Teach.diagnostic');
  const view = buildStudentDrillDownView(rawView);
  const [latest, ...earlier] = view.tests;

  return (
    <>
      <section
        data-slot="drill-down-overall"
        className="flex flex-wrap items-baseline gap-x-6 gap-y-2 rounded-card border border-border bg-card px-6 py-5"
      >
        <p className="text-4xl font-extrabold leading-none tracking-tight text-foreground">
          {view.overallScore === null ? t('valueUnavailable') : `${view.overallScore} / 100`}
        </p>
        {view.overallDeltaDisplay === null ? null : (
          <p className="text-body-sm font-semibold text-foreground">
            {view.overallDeltaDisplay === 'steady'
              ? bandWord('steady')
              : view.overallDeltaDisplay.startsWith('-')
                ? view.overallDeltaDisplay
                : `\u2191 ${view.overallDeltaDisplay}`}
          </p>
        )}
        <p className="text-body-sm text-body">
          {t('statAcaraPhase')}:{' '}
          {view.acaraPhase === null ? t('valueUnavailable') : bandWord(view.acaraPhase)}
        </p>
        <p className="text-body-sm text-body">
          {t('gateLabel')}: {view.gate.score === null ? t('valueUnavailable') : `${view.gate.score} / 100`}
          {view.gate.passed === null
            ? ` · ${t('gateNotSat')}`
            : ` · ${view.gate.passed ? t('gatePassed') : t('gateNotPassed')}`}
        </p>
      </section>

      <section data-slot="drill-down-skills" className="flex flex-col gap-3">
        <h2 className="text-panel-title font-semibold text-foreground">{t('subskillsHeading')}</h2>
        <ul className="flex flex-col divide-y divide-border rounded-card border border-border bg-card px-6">
          {view.skills.map((skill) => (
            <SkillRow key={skill.attribute} skill={skill} td={td} t={t} />
          ))}
        </ul>
      </section>

      {earlier.length > 0 ? (
        <section data-slot="drill-down-earlier" className="flex flex-col gap-2">
          <ul className="flex flex-col divide-y divide-border rounded-card border border-border bg-card px-6">
            {earlier.map((test) => (
              <li
                key={test.satAt}
                data-slot="drill-down-earlier-sitting"
                className="flex items-center justify-between gap-3 py-3 text-body-sm"
              >
                <span className="text-body">
                  {t('completedOn', { date: test.satAt })}
                </span>
                <span className="font-semibold text-foreground">
                  {test.overall === null ? t('valueUnavailable') : t('collapsedScore', { score: test.overall })}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}

export { StudentDrillDownBody };
