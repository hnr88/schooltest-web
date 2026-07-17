import { getTranslations } from 'next-intl/server';

import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from '@/components/ui/avatar';

import { Badge } from '@/modules/design-system/components/badge';
import { CountBadge } from '@/modules/design-system/components/count-badge';
import { Section } from '@/modules/design-system/components/layout';
import { PresenceAvatar } from '@/modules/design-system/components/presence-avatar';
import { StatusBadge } from '@/modules/design-system/components/status-badge';
import { Tag } from '@/modules/design-system/components/tag';
import { TagDemo } from './tag-demo';

async function BadgesSection() {
  const t = await getTranslations('DesignSystem');
  return (
    <Section id="badges">
      <h2 className="text-2xl font-bold tracking-tight">{t('sectionBadges')}</h2>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Badge>{t('badgeLive')}</Badge>
        <Badge variant="secondary">{t('badgeScheduled')}</Badge>
        <Badge variant="navy">{t('badgeDraft')}</Badge>
        <Badge variant="accent">{t('tagGrade')}</Badge>
        <Badge variant="success">{t('badgeLive')}</Badge>
        <Badge variant="warning">{t('badgeScheduled')}</Badge>
        <Badge variant="error">{t('badgeDraft')}</Badge>
        <Badge variant="outline">{t('tagGrade')}</Badge>
        <Badge variant="ghost">{t('badgeLive')}</Badge>
        <Badge variant="link">{t('badgeScheduled')}</Badge>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <StatusBadge status="live" label={t('badgeLive')} />
        <StatusBadge status="scheduled" label={t('badgeScheduled')} />
        <StatusBadge status="draft" label={t('badgeDraft')} />
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Tag label={t('tagGrade')} />
        <TagDemo label={t('tagGrade')} removeLabel={t('tagRemove', { label: t('tagGrade') })} />
        <CountBadge count={3} ariaLabel={t('buttonNotifications')} />
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <Avatar>
          <AvatarImage src="/brand/logo-mark.png" alt={t('avatarAlt')} />
          <AvatarFallback>ST</AvatarFallback>
        </Avatar>
        <Avatar size="lg">
          <AvatarFallback>LP</AvatarFallback>
          <AvatarBadge aria-hidden="true" />
        </Avatar>
        <AvatarGroup>
          <Avatar>
            <AvatarFallback>LP</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>MK</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <AvatarGroupCount>+9</AvatarGroupCount>
        </AvatarGroup>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <PresenceAvatar initials="LP" size="sm" presence="online" />
        <PresenceAvatar initials="MK" size="default" presence="offline" />
        <PresenceAvatar initials="JD" size="lg" presence="online" />
        <PresenceAvatar initials="AW" size="xl" />
      </div>
    </Section>
  );
}

export { BadgesSection };
