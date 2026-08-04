import {
  Bell,
  ClipboardCheck,
  ShieldCheck,
  Trophy,
  UserRoundPlus,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import type { NotificationCategory } from '@/modules/notifications/types/notification.types';
import { CATEGORY_ICONS } from '@/modules/notifications/constants/components.constants';

function NotificationCategoryIcon({
  category,
  className,
}: {
  category: NotificationCategory;
  className?: string;
}) {
  const Icon = CATEGORY_ICONS[category];

  return <Icon aria-hidden="true" className={cn('size-5', className)} />;
}

export { NotificationCategoryIcon };
