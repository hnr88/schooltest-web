import type { LucideIcon } from 'lucide-react';

export interface SkillProgressProps {
  icon: LucideIcon;
  iconClassName: string;
  label: string;
  progressClassName: string;
  value: number;
}
