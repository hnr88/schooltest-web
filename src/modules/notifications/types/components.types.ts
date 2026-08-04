import type { Notification } from '@/modules/notifications/types/notification.types';

import type { ReactNode } from 'react';

export interface PortalPanelProps {
  id: string;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export interface PortalSwitchProps {
  id: string;
  checked: boolean;
  disabled?: boolean;
  labelledById: string;
  describedById?: string;
  onCheckedChange: (checked: boolean) => void;
}

export interface PortalToggleRowProps {
  title: string;
  description: string;
  helper?: string;
  helperTone?: 'warning' | 'muted';
  describedById?: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export interface NotificationFeedHeaderProps {
  unreadCount: number;
  isMarkingAll: boolean;
  onMarkAllRead: () => void;
}

export interface NotificationFeedBodyProps {
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
  notifications: Notification[];
  onMarkRead: (documentId: string) => void;
  isMarking: boolean;
}
