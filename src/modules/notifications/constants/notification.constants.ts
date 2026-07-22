import type { NotificationCategoryFilterValue } from '@/modules/notifications/types/notification.types';

export const NOTIFICATION_PREVIEW_PAGE_SIZE = 5;
export const NOTIFICATION_FEED_PAGE_SIZE = 20;

// PortalCard (.qa/design/spec/03 §1.4): #FFFFFF, radius 24 and a single
// 0 1px 2px rgba(14,35,80,.04) shadow with no border. `overflow-visible` keeps the
// ::after pointer expansions of the switches and dot buttons inside it clickable.
export const PORTAL_CARD_CLASS = 'overflow-visible rounded-card border-0 shadow-sm';

// Portal screen container (§4.1, §5.1): one 820px column on a 22px rhythm.
export const PORTAL_SCREEN_CLASS =
  'mx-auto flex w-full max-w-portal flex-1 flex-col gap-5.5 px-4 py-6 sm:px-6 lg:px-8';

// PortalChip, Pill variant (§1.4): 42px tall, 18px side padding, 13.5/500, r999.
export const PORTAL_PILL_CLASS =
  'inline-flex h-10.5 items-center rounded-full border px-4.5 text-body-sm font-medium transition duration-200 ease-out-expo focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100';

export const PORTAL_PILL_SELECTED_CLASS = 'border-foreground bg-foreground text-primary-foreground';

export const PORTAL_PILL_IDLE_CLASS =
  'border-portal-input bg-card text-body hover:border-foreground hover:text-foreground';

export const NOTIFICATION_CATEGORY_FILTERS = [
  'all',
  'testResults',
  'testActivity',
  'children',
  'account',
  'security',
] as const satisfies readonly NotificationCategoryFilterValue[];
