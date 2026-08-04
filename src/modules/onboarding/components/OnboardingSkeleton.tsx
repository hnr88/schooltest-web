import { Skeleton } from '@/components/ui/skeleton';
import { OnboardingShell } from '@/modules/onboarding/components/OnboardingShell';

// Held until GET /users/me resolves too: the profile step's form defaults are
// captured at mount, so the prefill (C-PAR-ME fields) must be settled first.
export function OnboardingSkeleton() {
  return (
    <OnboardingShell contentClassName="flex flex-col gap-6">
      <Skeleton className="h-2 w-full" />
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <Skeleton className="size-14 rounded-2xl" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full max-w-64" />
      </div>
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-10 w-full" />
    </OnboardingShell>
  );
}
