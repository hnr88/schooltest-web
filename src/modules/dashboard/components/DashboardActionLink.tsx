import type { LucideIcon } from 'lucide-react';
import { ArrowUpRight } from 'lucide-react';

import { Link } from '@/i18n/navigation';

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
    <Link
      href={href}
      className="group flex min-h-11 items-center gap-3 rounded-tile p-2.5 transition-colors duration-200 ease-out-expo hover:bg-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-reduce:transition-none"
    >
      <span
        aria-hidden="true"
        className="grid size-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-primary transition-colors duration-200 ease-out-expo group-hover:bg-blue-100 motion-reduce:transition-none"
      >
        <Icon className="size-4" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-body-sm font-semibold text-foreground">{title}</span>
        <span className="truncate text-meta text-muted-foreground">{description}</span>
      </span>
      <ArrowUpRight
        aria-hidden="true"
        className="size-4 shrink-0 text-slate-400 transition-transform duration-200 ease-out-expo group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none"
      />
    </Link>
  );
}

export { DashboardActionLink };
