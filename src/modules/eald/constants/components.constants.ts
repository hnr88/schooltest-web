import type { SubskillPhase } from '@/modules/eald/types/eald.types';
import type {
  HomeEvidenceChartConfig,
  ProgrammeFact,
  TeachGroupingConfig,
  WhatYouGetCard,
} from '@/modules/eald/types/components.types';

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

// Home v2:143–196 — five numbered rows, not a card grid. Tile tints are the
// design's: 01–02 blue, 03–04 teal, 05 navy (its number tile inverts and the
// row carries the "In field testing" pill instead of a link — no href).
export const WHAT_YOU_GET_CARDS: readonly WhatYouGetCard[] = [
  {
    titleKey: 'home.whatYouGet.diagnoseTitle',
    descKey: 'home.whatYouGet.diagnoseDescription',
    href: '/diagnose',
    tone: 'blue',
  },
  {
    titleKey: 'home.whatYouGet.teachTitle',
    descKey: 'home.whatYouGet.teachDescription',
    href: '/teach',
    tone: 'blue',
  },
  {
    titleKey: 'home.whatYouGet.trackTitle',
    descKey: 'home.whatYouGet.trackDescription',
    href: '/track',
    tone: 'teal',
  },
  {
    titleKey: 'home.whatYouGet.predictTitle',
    descKey: 'home.whatYouGet.predictDescription',
    href: '/predict',
    tone: 'teal',
  },
  {
    titleKey: 'home.whatYouGet.reportTitle',
    descKey: 'home.whatYouGet.reportDescription',
    tone: 'navy',
  },
];

// Home v2:133–139 — the About band's five-cell fact table across the full
// width (Cohort · Skills assessed · Delivery · Reporting · Status). Status is
// the design's teal cell.
export const PROGRAMME_FACTS: readonly ProgrammeFact[] = [
  { labelKey: 'home.about.factCohortLabel', valueKey: 'home.about.factCohortValue' },
  { labelKey: 'home.about.factSkillsLabel', valueKey: 'home.about.factSkillsValue' },
  { labelKey: 'home.about.factDeliveryLabel', valueKey: 'home.about.factDeliveryValue' },
  { labelKey: 'home.about.factReportingLabel', valueKey: 'home.about.factReportingValue' },
  { labelKey: 'home.about.factStatusLabel', valueKey: 'home.about.factStatusValue', tone: 'teal' },
];

// Teach:186–193 — "Figure 1 — Primary gap across one class": students holding
// each subskill as their primary gap, Term 1 placement vs Term 2 after six
// weeks. Counts on a numeric axis (max 10); both series total 22.
export const TEACH_GROUPING: TeachGroupingConfig = {
  seriesLabelKeys: ['teach.grouping.seriesTerm1', 'teach.grouping.seriesTerm2'],
  categories: [
    {
      labelKey: 'teach.grouping.categoryVocabulary',
      bars: [
        { value: 8, display: '8' },
        { value: 5, display: '5' },
      ],
    },
    {
      labelKey: 'teach.grouping.categoryInference',
      bars: [
        { value: 6, display: '6' },
        { value: 6, display: '6' },
      ],
    },
    {
      labelKey: 'teach.grouping.categoryNoteTaking',
      bars: [
        { value: 4, display: '4' },
        { value: 6, display: '6' },
      ],
    },
    {
      labelKey: 'teach.grouping.categoryFluency',
      bars: [
        { value: 4, display: '4' },
        { value: 5, display: '5' },
      ],
    },
  ],
};

// Home v2:247–264 — "Figure 1 — ACARA phase by skill, one student". Values are
// the design's literals on the 0–100 band scale (BarChart max=100); band label
// keys are listed bottom-up (Beginning … Independent) to match the axis order
// BarChart's bands rendering expects.
export const HOME_EVIDENCE_CHART: HomeEvidenceChartConfig = {
  seriesLabelKeys: [
    'home.evidenceChart.seriesTerm1',
    'home.evidenceChart.seriesTerm2',
    'home.evidenceChart.seriesTerm4',
  ],
  bandLabelKeys: [
    'home.evidenceChart.bandBeginning',
    'home.evidenceChart.bandDeveloping',
    'home.evidenceChart.bandEmerging',
    'home.evidenceChart.bandConsolidating',
    'home.evidenceChart.bandIndependent',
  ],
  categories: [
    {
      labelKey: 'home.evidenceChart.categoryReading',
      bars: [
        { value: 42, display: '42' },
        { value: 68, display: '68' },
        { value: 84, display: '84' },
      ],
    },
    {
      labelKey: 'home.evidenceChart.categoryListening',
      bars: [
        { value: 34, display: '34' },
        { value: 58, display: '58' },
        { value: 74, display: '74' },
      ],
    },
    {
      labelKey: 'home.evidenceChart.categoryWriting',
      bars: [
        { value: 30, display: '30' },
        { value: 48, display: '48' },
        { value: 64, display: '64' },
      ],
    },
    {
      labelKey: 'home.evidenceChart.categorySpeaking',
      bars: [
        { value: 26, display: '26' },
        { value: 38, display: '38' },
        { value: 54, display: '54' },
      ],
    },
  ],
};

export const PREDICT_COHORT = [
  { labelKey: 'predict.cohort.figureBandUnder40', values: [9, 3] },
  { labelKey: 'predict.cohort.figureBand40to59', values: [6, 5] },
  { labelKey: 'predict.cohort.figureBand60to79', values: [5, 8] },
  { labelKey: 'predict.cohort.figureBand80plus', values: [2, 6] },
] as const;

