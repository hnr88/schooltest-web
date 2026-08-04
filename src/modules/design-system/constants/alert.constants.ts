import { CircleAlert, CircleCheck, Info, TriangleAlert, type LucideIcon } from 'lucide-react';

import type { AlertVariant } from '@/modules/design-system/types/design-system.types';

export const VARIANT_CONFIG: Record<AlertVariant, { icon: LucideIcon; tile: string }> = {
  info: { icon: Info, tile: 'bg-blue-50 text-blue-600' },
  success: { icon: CircleCheck, tile: 'bg-green-100 text-green-600' },
  warning: { icon: TriangleAlert, tile: 'bg-amber-100 text-amber-600' },
  error: { icon: CircleAlert, tile: 'bg-red-100 text-red-600' },
};
