'use client';

import { skillSchema, type ResultView } from '@schooltest/scoring-contracts';

import { cn } from '@/lib/utils';

/**
 * Screen C header (dashboard §4.1). The overall score is `overall.domain_score`
 * — never the mean of the subskills (honesty guardrail, data contract §8) — and
 * the growth pill renders `overall.delta_display` verbatim, hidden when null.
 *
 * CONTRACT GAP (task 30 report): ResultView v2 carries NO student identification
 * (name/class/initials live on the "student relation" the dashboard spec §4.1
 * names, but the read model has no such block). The screen therefore takes them
 * as props from the page, which joins them from the teacher's roster reads.
 * Task 23 must either add the block to the teacher-authorised view or bless the
 * prop-join; nothing here invents a field.
 */
export interface StudentIdentity {
  name: string;
  className: string;
  initials: string;
}

function initialsOf(student: StudentIdentity): string {
  return student.initials || student.name.slice(0, 2).toUpperCase();
}

export function StudentResultHeader({ view, student }: { view: ResultView; student: StudentIdentity }) {
  const growth = view.overall.delta_display;
  const arrow = growth !== null && (growth.startsWith('+') ? '↑' : growth.startsWith('-') ? '↓' : null);
  const nonReading = skillSchema.options.filter((skill) => skill !== view.skill);

  return (
    <header data-slot="result-header" className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <span aria-hidden className="flex size-10 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary-ink">
          {initialsOf(student)}
        </span>
        <div>
          <h1 className="text-h3 font-bold">{student.name}</h1>
          <p className="text-caption text-muted-foreground">{student.className}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span data-slot="overall-score" className="text-h2 font-bold tabular-nums">
          {view.overall.domain_score === null ? '—' : `${view.overall.domain_score}%`}
        </span>
        {growth !== null ? (
          <span
            data-slot="growth-pill"
            data-delta={growth}
            className="rounded-full bg-primary-soft px-2 py-0.5 text-caption font-semibold text-primary-ink"
          >
            {arrow ? `${arrow} ${growth} pts` : growth}
          </span>
        ) : null}
        {view.acara_phase !== null ? (
          <span data-slot="acara-badge" className="rounded-full bg-muted px-2 py-0.5 text-caption font-semibold">
            ACARA: {view.acara_phase}
          </span>
        ) : null}
        {view.gate.passed !== null ? (
          <span
            data-slot="gate-badge"
            data-gate={view.gate.passed ? 'passed' : 'not_yet'}
            className={cn(
              'rounded-full px-2 py-0.5 text-caption font-semibold',
              view.gate.passed ? 'bg-success-soft text-success-ink' : 'bg-warning-soft text-warning-ink',
            )}
          >
            Exit gate: {view.gate.passed ? 'passed' : 'not yet'}
          </span>
        ) : null}
      </div>

      {/* Skill switcher (§4.1): reading is the only assessed skill; the rest are
          honest coming-soon entries, never a silent empty tab. */}
      <nav data-slot="skill-switcher" aria-label="Skill" className="flex gap-1">
        {[view.skill, ...nonReading].map((skill) => (
          <span
            key={skill}
            data-slot="skill-tab"
            data-active={skill === view.skill}
            aria-current={skill === view.skill ? 'page' : undefined}
            className={cn(
              'rounded-full px-3 py-1 text-caption font-semibold capitalize',
              skill === view.skill ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
            )}
          >
            {skill === view.skill ? skill : `${skill} — coming soon`}
          </span>
        ))}
      </nav>
    </header>
  );
}
