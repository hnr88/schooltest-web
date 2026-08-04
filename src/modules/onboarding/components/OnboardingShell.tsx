import { Card, CardContent } from '@/components/ui/card';

import type { OnboardingShellProps } from '@/modules/onboarding/types/components.types';

// The identical frame all four onboarding states render inside.
export function OnboardingShell({ children, contentClassName }: OnboardingShellProps) {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-12 sm:px-10 lg:px-14">
      <Card className="w-full max-w-auth">
        <CardContent className={contentClassName}>{children}</CardContent>
      </Card>
    </div>
  );
}
