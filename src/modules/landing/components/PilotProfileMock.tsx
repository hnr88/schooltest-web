import { getTranslations } from 'next-intl/server';

import { Badge, StatusPill } from '@/modules/design-system';
import { MOCK_PROFILE_SUBSKILLS } from '@/modules/landing/constants/pilot-mock.constants';

/**
 * USP 01's illustrative profile card — the client's draft, in this design system's
 * primitives. SAMPLE DATA, labelled as such: it shows the SHAPE of a diagnostic profile
 * (one score, plus the subskills underneath it that explain the score) and is wired to
 * nothing. Real profiles live on /dashboard/results behind the C-TR-* contracts.
 *
 * The band word sits beside every tint, never colour alone (WCAG 1.4.1).
 */
async function PilotProfileMock() {
  const t = await getTranslations('Home');

  return (
    <figure
      data-slot="pilot-profile-mock"
      className="flex min-w-0 flex-col gap-3 rounded-tile bg-surface-inset p-4"
    >
      <figcaption className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex min-w-0 flex-col">
          <span className="text-body-sm font-semibold text-foreground">{t('pilot.mockStudent')}</span>
          <span className="text-meta text-body">{t('pilot.mockYear')}</span>
        </span>
        <Badge variant="secondary" className="h-auto px-2 py-0.5 text-caption">
          {t('pilot.mockSampleLabel')}
        </Badge>
      </figcaption>

      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-meta font-semibold tracking-wide text-body uppercase">
          {t('pilot.mockReading')}
        </span>
        <span className="text-stat-sm font-bold tabular-nums text-foreground">
          {t('pilot.mockScore')}
        </span>
        <span className="text-meta text-body">{t('pilot.mockCefr')}</span>
        <span className="text-meta text-body">{t('pilot.mockStanine')}</span>
      </div>

      <ul className="flex flex-wrap gap-1.5">
        {MOCK_PROFILE_SUBSKILLS.map((skill) => (
          <li key={skill.labelKey}>
            <StatusPill tone={skill.tone}>
              {t(skill.labelKey)} · {t(skill.bandKey)}
            </StatusPill>
          </li>
        ))}
      </ul>

      <p className="text-meta text-balance text-body">{t('pilot.mockMore')}</p>
    </figure>
  );
}

export { PilotProfileMock };
