'use client';

import { ChevronUp, LogOut, Settings } from 'lucide-react';
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
import { getUserDisplayName, getUserInitials } from '@/modules/shell/lib/user-initials';
import { LABELLED_ROLE_TYPES } from '@/modules/shell/constants/role-label.constants';
import { STAFF_SETTINGS_HREF } from '@/modules/shell/constants/nav.constants';
import { USER_MENU_SKIN_CLASSES } from '@/modules/shell/constants/shell-classes.constants';
import type { ShellSkin } from '@/modules/shell/types/shell.types';

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
// `skin="teacher"` (Teacher Portal v2.dc.html:39–52): the design's card — the
// person's real name with its first initial, the role and an up chevron — over a
// menu that holds Sign out only; the design draws no Settings row for a teacher.
function UserMenu({ skin = 'default' }: { skin?: ShellSkin }) {
  const t = useTranslations('Shell');
  const router = useRouter();
  const { user, logout } = useAuth();

  if (!user) {
    return <Skeleton className="h-15 w-full rounded-panel" />;
  }

  const classes = USER_MENU_SKIN_CLASSES[skin];
  const isTeacherSkin = skin === 'teacher';
  const displayName = isTeacherSkin ? getUserDisplayName(user) : user.username;
  const roleType = user.role?.type ?? null;
  const roleLabel =
    roleType !== null && LABELLED_ROLE_TYPES.includes(roleType) ? t(`userMenu.roles.${roleType}`) : null;

  // WHERE "Settings" GOES, by role (notifications/06, D-08). This item used to
  // push EVERY role at /dashboard/settings — a parent-portal route behind
  // ParentGuard and the parent-views mask — so a teacher or school admin who
  // pressed it was bounced, and the preference card that gates their own
  // notifications was unreachable. School staff now land on the school-staff
  // route, which SchoolStaffGuard admits both of them to.
  //
  // OPS IS UNCHANGED ON PURPOSE (mvp/ops R-26): the notifications module is
  // gated out of /dashboard/ops/**, ops receives only non-suppressible
  // account/security events, and /dashboard/ops/settings is PLATFORM settings,
  // not this card. Ops keeps the default target, exactly as before this row.
  const isSchoolStaff = roleType === TEACHER_ROLE_TYPE || roleType === SCHOOL_ADMIN_ROLE_TYPE;
  const settingsHref = isSchoolStaff ? STAFF_SETTINGS_HREF : '/dashboard/settings';

  const handleSignOut = () => {
    logout();
    router.replace('/sign-in');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label={t('topbar.userMenuLabel')} className={classes.card}>
        <span aria-hidden="true" className={classes.avatar}>
          {getUserInitials(displayName, isTeacherSkin ? 1 : 2)}
        </span>
        <span className={classes.text}>
          <span className={classes.name}>{displayName}</span>
          {roleLabel !== null ? <span className={classes.role}>{roleLabel}</span> : null}
        </span>
        {isTeacherSkin ? (
          <ChevronUp
            aria-hidden="true"
            strokeWidth={2}
            className="size-[15px] shrink-0 text-[#6B7280] group-data-[collapsible=icon]:hidden"
          />
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        side="top"
        sideOffset={isTeacherSkin ? 10 : 8}
        className={classes.content}
      >
        {isTeacherSkin ? null : (
          <DropdownMenuItem onClick={() => router.push(settingsHref)}>
            <Settings aria-hidden="true" />
            {t('userMenu.settings')}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem variant="destructive" className={classes.signOut} onClick={handleSignOut}>
          <LogOut aria-hidden="true" strokeWidth={isTeacherSkin ? 1.8 : undefined} />
          {t('userMenu.signOut')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { UserMenu };
