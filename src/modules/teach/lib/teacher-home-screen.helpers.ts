import { MONITOR_POLL_MS } from '@/modules/teach/constants/components.constants';
import type { TeachHome } from '@/modules/teach/types/teach-home.types';

export function monitorAwareRefetchInterval(data: TeachHome | undefined): number | false {
  return data?.classes.some((cls) => cls.monitor !== null) ? MONITOR_POLL_MS : false;
}
