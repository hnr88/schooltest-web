import {
  CircleAlert,
  CircleCheck,
  Info,
  TriangleAlert,
  XIcon,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';

import { Button } from './button';
import type { AlertProps, AlertVariant } from '../types/design-system.types';

const VARIANT_CONFIG: Record<AlertVariant, { icon: LucideIcon; tile: string }> = {
  info: { icon: Info, tile: 'bg-blue-50 text-blue-600' },
  success: { icon: CircleCheck, tile: 'bg-green-100 text-green-600' },
  warning: { icon: TriangleAlert, tile: 'bg-amber-100 text-amber-600' },
  error: { icon: CircleAlert, tile: 'bg-red-100 text-red-600' },
};

function Alert({
  variant = 'info',
  title,
  children,
  action,
  onDismiss,
  dismissLabel,
  className,
}: AlertProps) {
  const { icon: Icon, tile } = VARIANT_CONFIG[variant];
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn('flex gap-3 rounded-xl border bg-card p-4 text-card-foreground', className)}
    >
      <span
        aria-hidden="true"
        className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg', tile)}
      >
        <Icon className="size-4" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <div className="text-sm text-muted-foreground">{children}</div>
        {action ? <div className="mt-2 flex items-center gap-2">{action}</div> : null}
      </div>
      {onDismiss ? (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={dismissLabel}
          onClick={onDismiss}
          className="-m-1 shrink-0 text-muted-foreground"
        >
          <XIcon aria-hidden="true" />
        </Button>
      ) : null}
    </div>
  );
}

export { Alert };
