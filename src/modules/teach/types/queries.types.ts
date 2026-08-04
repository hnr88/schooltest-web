import type { TeachHome } from '@/modules/teach/types/teach-home.types';

export interface UseTeachHomeQueryOptions {
  // Data-aware cadence (task 84): receives the cached payload so the landing
  // can poll only while a sitting is running; return false to stop polling.
  refetchInterval?: (data: TeachHome | undefined) => number | false;
}
