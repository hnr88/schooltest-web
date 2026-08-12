import { Sparkles } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { Badge } from '@/modules/design-system';
import {
  PILOT_AUDIENCE_VIEWS,
  PILOT_LLM_TARGETS,
} from '@/modules/landing/constants/pilot.constants';
import type { PilotUspDetailProps } from '@/modules/landing/types/landing.types';

/**
 * The illustrative blocks the client's draft shows inside two of the five USPs:
 * USP 02's "Export to your favourite LLM" row, and USP 05's three audience views.
 *
 * PRESENTATION ONLY. These are marketing mocks — no API call, no student record, no
 * fabricated numbers standing in for real data. They exist to show the SHAPE of the
 * feature, which is what the draft asks for, and they are inside the same Card as the
 * USP text so nothing reads as live output.
 */
async function PilotUspDetail({ detail }: PilotUspDetailProps) {
  const t = await getTranslations('Home');

  if (detail === 'llm') {
    return (
      <div className="flex flex-col gap-3 rounded-tile bg-surface-inset p-4">
        <span className="flex items-center gap-2 text-meta font-semibold tracking-wide text-body uppercase">
          <Sparkles aria-hidden="true" className="size-4" />
          {t('pilot.llmExportLabel')}
        </span>
        <ul className="flex flex-wrap gap-2">
          {PILOT_LLM_TARGETS.map((key) => (
            <li key={key}>
              <Badge variant="secondary" className="h-auto px-3 py-1 text-caption">
                {t(key)}
              </Badge>
            </li>
          ))}
        </ul>
        <p className="text-meta text-balance text-body">{t('pilot.llmDeidentifiedNote')}</p>
      </div>
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-3">
      {PILOT_AUDIENCE_VIEWS.map((view) => (
        <li
          key={view.id}
          data-slot="pilot-audience-view"
          data-view={view.id}
          className="flex min-w-0 flex-col gap-1.5 rounded-tile bg-surface-inset p-4"
        >
          <span className="text-meta font-semibold tracking-wide text-body uppercase">
            {t(view.labelKey)}
          </span>
          <span className="text-body-sm font-semibold text-balance text-foreground">
            {t(view.headlineKey)}
          </span>
          <span className="text-meta text-balance text-body">{t(view.bodyKey)}</span>
        </li>
      ))}
    </ul>
  );
}

export { PilotUspDetail };
