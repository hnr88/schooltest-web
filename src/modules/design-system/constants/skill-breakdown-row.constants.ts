import type { SkillVerdictTone } from '@/modules/design-system/types/record.types';

// Verdict inks are the AA-safe strong/ink tokens, not the 3.2:1 canonical
// #16A34A / #D97706.
export const VERDICTS: Record<SkillVerdictTone, { fill: string; ink: string }> = {
  mastered: { fill: 'bg-success', ink: 'text-success-strong' },
  emerging: { fill: 'bg-warning', ink: 'text-warning-strong' },
  notYet: { fill: 'bg-destructive', ink: 'text-danger-strong' },
  notAssessed: { fill: 'bg-transparent', ink: 'text-muted-foreground' },
};
