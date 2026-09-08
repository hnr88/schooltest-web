import { AlertTriangle, Info, OctagonAlert } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { Container } from '@/modules/design-system';
import type { PublicSettings } from '@/modules/settings/types/settings.types';

import type { PublicSiteBannerProps } from '@/modules/settings/types/components.types';
import { LEVEL_ICONS, LEVEL_STYLES } from '@/modules/settings/constants/components.constants';

// Renders the maintenance notice and/or the announcement from C-SET-01 above the
// public header. Server Component: the copy comes from the settings row, so an
// ops change appears on the site — there is no hardcoded fallback message and
// nothing renders at all when both are off. The design's uppercase chip and the
// fixed /eald#register link (PRD A9) are i18n-driven; the level icon stays for
// the maintenance state, where the alarm matters.
async function PublicSiteBanner({ settings }: PublicSiteBannerProps) {
  const maintenance = settings.maintenance_mode && settings.maintenance_message;
  const announcement = settings.announcement_enabled && settings.announcement_message;
  if (!maintenance && !announcement) return null;

  const t = await getTranslations();
  const level = maintenance ? 'critical' : settings.announcement_level;
  const Icon = LEVEL_ICONS[level];
  const message = maintenance ? settings.maintenance_message : settings.announcement_message;

  return (
    <div
      data-slot={maintenance ? 'maintenance-banner' : 'announcement-banner'}
      role="status"
      className={cn('border-b border-border', LEVEL_STYLES[level])}
    >
      <Container className="flex max-w-eald flex-wrap items-center gap-3 py-3">
        {maintenance ? <Icon aria-hidden="true" className="size-4.5 shrink-0" /> : null}
        <span className="inline-flex shrink-0 items-center rounded-md bg-navy-900 px-2.5 py-1 text-xs font-bold tracking-widest text-white uppercase">
          {t('Eald.notice.label')}
        </span>
        <p className="text-body-sm font-medium">
          {message}{' '}
          <Link
            href="/#register"
            className="font-semibold text-primary underline-offset-2 hover:underline"
          >
            {t('Eald.notice.cta')}
          </Link>
        </p>
      </Container>
    </div>
  );
}

export { PublicSiteBanner };
