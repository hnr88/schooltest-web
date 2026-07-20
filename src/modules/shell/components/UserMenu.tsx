'use client';

import { ChevronDown, LogOut, Settings } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useRouter } from '@/i18n/navigation';
import { useAuth } from '@/modules/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  PresenceAvatar,
  Skeleton,
} from '@/modules/design-system';
import { getUserInitials } from '@/modules/shell/lib/user-initials';

// User chip + menu (C-UI-SHELL §12.3): 38px blue-soft initials avatar, 14/600 navy
// username, chevron; opens the 200px spec menu (§11) with Settings and a
// destructive Sign out that clears the session then leaves the guarded shell.
function UserMenu() {
  const t = useTranslations('Shell');
  const router = useRouter();
  const { user, logout } = useAuth();

  if (!user) {
    return <Skeleton className="size-9.5 rounded-full" />;
  }

  const handleSignOut = () => {
    logout();
    router.replace('/sign-in');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t('topbar.userMenuLabel')}
        className="group flex items-center gap-2.5 rounded-full py-1 pr-2 pl-1 transition-colors duration-200 ease-out hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-reduce:transition-none"
      >
        <PresenceAvatar initials={getUserInitials(user.username)} className="size-9.5" />
        <span className="text-sm font-semibold text-foreground max-md:hidden">
          {user.username}
        </span>
        <ChevronDown
          aria-hidden="true"
          className="size-4 text-muted-foreground transition-transform duration-200 ease-out group-data-popup-open:rotate-180 motion-reduce:transition-none"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-50">
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
