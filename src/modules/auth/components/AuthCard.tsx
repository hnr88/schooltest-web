import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface AuthCardProps {
  children: ReactNode;
  className?: string;
}

// The 420px auth card (design spec 06 §1.3): white surface, 1px --border rule,
// 16px radius, 36px padding, --shadow-md, 20px inner rhythm.
export function AuthCard({ children, className }: AuthCardProps) {
  return (
    <div
      className={cn(
        'flex animate-in flex-col gap-5 rounded-panel border border-border bg-card p-7 shadow-md duration-500 ease-out-expo fade-in slide-in-from-bottom-3 motion-reduce:animate-none sm:p-9',
        className,
      )}
    >
      {children}
    </div>
  );
}
