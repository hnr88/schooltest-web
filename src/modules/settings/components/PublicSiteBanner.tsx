import { AlertTriangle, Info, OctagonAlert } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Container } from '@/modules/design-system';
import type { PublicSettings } from '@/modules/settings/types/settings.types';

interface PublicSiteBannerProps {
  readonly settings: PublicSettings;
}

const LEVEL_STYLES = {
  info: 'bg-blue-50 text-navy-800',
  warning: 'bg-amber-50 text-amber-900',
  critical: 'bg-red-50 text-red-900',
} as const;

const LEVEL_ICONS = { info: Info, warning: AlertTriangle, critical: OctagonAlert } as const;

// Renders the maintenance notice and/or the announcement from C-SET-01 above the
// public header. Server Component: the copy comes from the settings row, so an
// ops change appears on the site — there is no hardcoded fallback message and
// nothing renders at all when both are off.
function PublicSiteBanner({ settings }: PublicSiteBannerProps) {
  const maintenance = settings.maintenance_mode && settings.maintenance_message;
  const announcement = settings.announcement_enabled && settings.announcement_message;
  if (!maintenance && !announcement) return null;

  const level = maintenance ? 'critical' : settings.announcement_level;
  const Icon = LEVEL_ICONS[level];
  const message = maintenance ? settings.maintenance_message : settings.announcement_message;

  return (
    <div
      data-slot={maintenance ? 'maintenance-banner' : 'announcement-banner'}
      role="status"
      className={cn('border-b border-border', LEVEL_STYLES[level])}
    >
      <Container className="flex max-w-eald items-start gap-3 py-3">
        <Icon aria-hidden="true" className="mt-0.5 size-4.5 shrink-0" />
        <p className="text-body-sm font-medium">{message}</p>
      </Container>
    </div>
  );
}

export { PublicSiteBanner };
