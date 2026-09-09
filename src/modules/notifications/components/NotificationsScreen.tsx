'use client';

import { cn } from '@/lib/utils';
import { PORTAL_SCREEN_CLASS } from '@/modules/notifications/constants/notification.constants';
import { NotificationFeedList } from '@/modules/notifications/components/NotificationFeedList';

// ops/36 — the screen owns the portal chrome only; the feed (header, category
// pills, kit table with search/filter/sort/pagination/states) is
// NotificationFeedList on the generic directory kit.
function NotificationsScreen() {
  return (
    <main
      data-surface="notification-feed"
      className={cn(
        PORTAL_SCREEN_CLASS,
        // No `fade-in-0`: an opacity ramp composites the 12.5px timestamp ink below
        // AA for the length of the transition, which axe fails as SERIOUS. The
        // entrance is the slide alone.
        'animate-in duration-300 ease-out-expo slide-in-from-bottom-2 motion-reduce:animate-none',
      )}
    >
      <NotificationFeedList />
    </main>
  );
}

export { NotificationsScreen };
