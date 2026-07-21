import { Bell, ClipboardCheck, ShieldCheck, Trophy, UserRoundPlus } from 'lucide-react';

import type { NotificationCategory } from '@/modules/notifications/types/notification.types';

function NotificationCategoryIcon({ category }: { category: NotificationCategory }) {
  switch (category) {
    case 'account':
      return <Bell aria-hidden="true" className="size-5" />;
    case 'security':
      return <ShieldCheck aria-hidden="true" className="size-5" />;
    case 'children':
      return <UserRoundPlus aria-hidden="true" className="size-5" />;
    case 'testActivity':
      return <ClipboardCheck aria-hidden="true" className="size-5" />;
    case 'testResults':
      return <Trophy aria-hidden="true" className="size-5" />;
  }
}

export { NotificationCategoryIcon };
