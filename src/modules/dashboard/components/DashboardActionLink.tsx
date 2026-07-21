import type { LucideIcon } from 'lucide-react';
import { ArrowUpRight } from 'lucide-react';

import { Button } from '@/modules/design-system';

function DashboardActionLink({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <Button
      href={href}
      variant="outline"
      className="h-auto w-full justify-between px-4 py-4 text-left shadow-sm"
    >
      <span className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex size-9 items-center justify-center rounded-lg bg-blue-50 text-primary"
        >
          <Icon className="size-4" />
        </span>
        <span className="flex flex-col gap-1">
          <span className="font-semibold">{title}</span>
          <span className="text-caption font-normal text-muted-foreground">{description}</span>
        </span>
      </span>
      <ArrowUpRight aria-hidden="true" className="size-4 shrink-0" />
    </Button>
  );
}

export { DashboardActionLink };
