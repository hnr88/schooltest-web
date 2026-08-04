'use client';

import { CircleCheck, Clock, Link2Off, TriangleAlert, type LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/modules/design-system';
import type { InviteLinkState } from '@/modules/invitation/types/invitation.types';

import type { InviteStatusScreenProps } from '@/modules/invitation/types/components.types';
import { STATE_ICONS } from '@/modules/invitation/constants/components.constants';

// Terminal link states (C-INV-05 404/410/409 + network failure): each renders
// its own screen instead of the accept form. The used state routes to sign-in.
export function InviteStatusScreen({ state }: InviteStatusScreenProps) {
  const t = useTranslations('Invite.errors');
  const Icon = STATE_ICONS[state];

  return (
    <div
      data-slot="invite-status"
      data-state={state}
      className="flex flex-col items-center gap-4 py-16 text-center"
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-muted">
        <Icon className="size-6 text-muted-foreground" aria-hidden />
      </span>
      <h1 className="text-2xl font-semibold text-foreground">{t(`${state}Title`)}</h1>
      <p className="max-w-md text-body-sm text-muted-foreground">{t(`${state}Message`)}</p>
      {state === 'used' ? (
        <Button href="/sign-in" size="lg" className="mt-2">
          {t('usedAction')}
        </Button>
      ) : null}
    </div>
  );
}
