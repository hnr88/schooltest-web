import { getTranslations } from 'next-intl/server';

import { cn } from '@/lib/utils';
import { Card, Eyebrow } from '@/modules/design-system';
import { PilotUspDetail } from '@/modules/landing/components/PilotUspDetail';
import { PILOT_USPS } from '@/modules/landing/constants/landing.constants';

async function PilotUspList() {
  const t = await getTranslations('Home');

  return (
    <ol data-slot="pilot-usps" className="grid gap-6 md:grid-cols-2">
      {PILOT_USPS.map((usp, index) => (
        <li key={usp.number} className={cn(index === PILOT_USPS.length - 1 && 'md:col-span-2')}>
          <Card className="h-full rounded-3xl p-8">
            <div className="flex items-center gap-4">
              <span
                aria-hidden="true"
                className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-600 text-button font-bold text-white"
              >
                {usp.number}
              </span>
              <Eyebrow>{t(usp.nameKey)}</Eyebrow>
            </div>
            <div>
              <h3 className="text-panel-title font-bold text-balance">{t(usp.titleKey)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-body">{t(usp.bodyKey)}</p>
              <p className="mt-3 text-sm font-semibold text-balance text-foreground">
                {t(usp.kickerKey)}
              </p>
            </div>
            {usp.detail ? <PilotUspDetail detail={usp.detail} /> : null}
          </Card>
        </li>
      ))}
    </ol>
  );
}

export { PilotUspList };
