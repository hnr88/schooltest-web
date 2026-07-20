import type { ReactNode } from 'react';

function AgentFilterSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title} className="flex flex-col gap-2 border-b border-border pb-4 last:border-b-0 last:pb-0">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

export { AgentFilterSection };
