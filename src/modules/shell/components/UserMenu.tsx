'use client';

import { LogOut, Settings } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useRouter } from '@/i18n/navigation';
import { OPS_ROLE_TYPE, SCHOOL_ADMIN_ROLE_TYPE, TEACHER_ROLE_TYPE, useAuth } from '@/modules/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Skeleton,
} from '@/modules/design-system';
import { getUserInitials } from '@/modules/shell/lib/user-initials';
import { LABELLED_ROLE_TYPES } from '@/modules/shell/constants/nav.constants';
import { USER_CARD_CLASSES } from '@/modules/shell/constants/shell-classes.constants';

// The rail's USER AREA (.qa/design/spec/01 §1.2, portal--detached-sidebar.html:24-30):
// `margin-top:14px; background:#F4F6FA; border-radius:16px; padding:12px 14px; gap:11px`
// with a 36px round navy avatar (white 600/13px), the name at 13.5/600/#0E2350 and the
// role at 12px. The slice notes "no chevron, no menu, no logout affordance" — the app
// must still be able to sign out, so the card IS the menu trigger. That is the only
// addition; the geometry is the slice's.
// Role ink is --color-body (#475569, 6.9:1 on the card) instead of the slice's #7C8698,
// which measures 3.4:1 on #F4F6FA and fails AA at 12px.
// Role slugs with a user-menu label (i18n userMenu.roles.*). Anything else —
// including a missing role while the me query settles — renders no label,
// never a wrong one (the hardcoded "Parent account" mislabelled every staff
// role).
function UserMenu() {
  const t = useTranslations('Shell');
  const router = useRouter();
  const { user, logout } = useAuth();

  if (!user) {
    return <Skeleton className="h-15 w-full rounded-panel" />;
  }

  const roleType = user.role?.type ?? null;
  const roleLabel =
    roleType !== null && LABELLED_ROLE_TYPES.includes(roleType) ? t(`userMenu.roles.${roleType}`) : null;

  const handleSignOut = () => {
    logout();
    router.replace('/sign-in');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label={t('topbar.userMenuLabel')} className={USER_CARD_CLASSES}>
        <span
          aria-hidden="true"
          className="grid size-9 shrink-0 place-items-center rounded-full bg-navy-900 text-caption font-semibold text-white"
        >
          {getUserInitials(user.username)}
        </span>
        <span className="flex min-w-0 flex-col gap-px group-data-[collapsible=icon]:hidden">
          <span className="truncate text-body-sm font-semibold text-foreground">
            {user.username}
          </span>
          {roleLabel !== null ? <span className="truncate text-xs text-body">{roleLabel}</span> : null}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" sideOffset={8} className="w-56">
        <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
          <Settings aria-hidden="true" />
          {t('userMenu.settings')}
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
          <LogOut aria-hidden="true" />
          {t('userMenu.signOut')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { UserMenu };
