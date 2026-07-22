import type { ReactNode } from 'react';

// Canonical "Parent settings → Security" row: 14/600 navy label on the left, the
// value or control pinned right, 14px gap, and the same 12px/hairline rhythm the
// §36 toggle rows use. The last row in a stack drops its rule.
export function SettingsFactRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3.5 border-b border-divider py-3 last:border-b-0">
      <span className="min-w-0 flex-1 text-sm font-semibold text-foreground">{label}</span>
      <span className="min-w-0 shrink-0 truncate text-body-sm text-muted-foreground">
        {children}
      </span>
    </div>
  );
}
