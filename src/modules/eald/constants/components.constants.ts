import { BarChart3, Sparkles, Target, TrendingUp } from 'lucide-react';
import type { SubskillPhase } from '@/modules/eald/types/eald.types';

export const GROUP_KEYS = ['groupA', 'groupB', 'groupC', 'groupD'] as const;

export const TERMS = [
  { labelKey: 'term1Label', phaseKey: 'term1Phase', style: 'default' },
  { labelKey: 'term2Label', phaseKey: 'term2Phase', style: 'default' },
  { labelKey: 'term3Label', phaseKey: 'term3Phase', style: 'blue' },
  { labelKey: 'term4Label', phaseKey: 'term4Phase', style: 'navy' },
] as const;

export const STATS = [
  { valueKey: 'home.proof.skillsValue', labelKey: 'home.proof.skillsLabel' },
  { valueKey: 'home.proof.yearsValue', labelKey: 'home.proof.yearsLabel' },
  { valueKey: 'home.proof.scalesValue', labelKey: 'home.proof.scalesLabel' },
  { valueKey: 'home.proof.durationValue', labelKey: 'home.proof.durationLabel' },
] as const;

export const BENEFITS = [
  'home.register.benefitEarlyAccess',
  'home.register.benefitDirectInput',
  'home.register.benefitFoundingTerms',
] as const;

export const ROLE_KEYS = [
  'home.register.roleCoordinator',
  'home.register.roleHod',
  'home.register.roleTeacher',
  'home.register.rolePrincipal',
  'home.register.roleOther',
] as const;

export const STUDENT_KEYS = [
  'home.register.students1to20',
  'home.register.students21to50',
  'home.register.students51to100',
  'home.register.students100plus',
] as const;

export const PHASE_BAR_COLORS: Record<SubskillPhase, string> = {
  consolidating: 'bg-teal-600',
  developing: 'bg-blue-700',
  emerging: 'bg-blue-500',
  beginning: 'bg-chart-4',
};

export const THREE_MORE_CARDS = [
  { titleKey: 'groupByGapTitle', descKey: 'groupByGapDescription', tone: 'light' },
  { titleKey: 'pairBySkillTitle', descKey: 'pairBySkillDescription', tone: 'navy' },
  { titleKey: 'parentUpdatesTitle', descKey: 'parentUpdatesDescription', tone: 'light' },
] as const;

export const WHAT_YOU_GET_CARDS = [
  {
    titleKey: 'home.whatYouGet.diagnoseTitle',
    descKey: 'home.whatYouGet.diagnoseDescription',
    href: '/eald/diagnose',
    icon: BarChart3,
    dark: false,
    iconWrap: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  {
    titleKey: 'home.whatYouGet.teachTitle',
    descKey: 'home.whatYouGet.teachDescription',
    href: '/eald/teach',
    icon: Sparkles,
    dark: true,
    iconWrap: 'bg-navy-800',
    iconColor: 'text-teal-400',
  },
  {
    titleKey: 'home.whatYouGet.trackTitle',
    descKey: 'home.whatYouGet.trackDescription',
    href: '/eald/track',
    icon: TrendingUp,
    dark: false,
    iconWrap: 'bg-teal-50',
    iconColor: 'text-teal-700',
  },
  {
    titleKey: 'home.whatYouGet.predictTitle',
    descKey: 'home.whatYouGet.predictDescription',
    href: '/eald/predict',
    icon: Target,
    dark: false,
    iconWrap: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
] as const;
