import { LinkedInIcon, XIcon, YouTubeIcon } from '@/modules/landing/components/SocialIcons';

export const SCORE_TILES = [
  {
    labelKey: 'featureDetail.card.grammar',
    scoreKey: 'featureDetail.card.scoreGrammar',
    value: 85,
    indicatorClassName: '[&_[data-slot=progress-indicator]]:bg-blue-600',
  },
  {
    labelKey: 'featureDetail.card.vocabulary',
    scoreKey: 'featureDetail.card.scoreVocabulary',
    value: 70,
    indicatorClassName: '[&_[data-slot=progress-indicator]]:bg-teal-500',
  },
  {
    labelKey: 'featureDetail.card.coherence',
    scoreKey: 'featureDetail.card.scoreCoherence',
    value: 65,
    indicatorClassName: '[&_[data-slot=progress-indicator]]:bg-navy-900',
  },
] as const;

export const SOCIAL_ICONS = {
  x: XIcon,
  youtube: YouTubeIcon,
  linkedin: LinkedInIcon,
} as const;

export const STATS = [
  {
    valueKey: 'stats.deliveredValue',
    labelKey: 'stats.deliveredLabel',
    valueClassName: 'text-white',
  },
  {
    valueKey: 'stats.accuracyValue',
    labelKey: 'stats.accuracyLabel',
    valueClassName: 'text-chart-5',
  },
  {
    valueKey: 'stats.savedValue',
    labelKey: 'stats.savedLabel',
    valueClassName: 'text-chart-4',
  },
] as const;
