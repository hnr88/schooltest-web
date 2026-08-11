const NAV_LINKS = [
  { href: '#product', key: 'nav.product' },
  { href: '#for-schools', key: 'nav.schools' },
  { href: '#pricing', key: 'nav.pricing' },
  { href: '#resources', key: 'nav.resources' },
] as const;

const FLOW_STEPS = ['flow.stepOne', 'flow.stepTwo', 'flow.stepThree'] as const;

const TRUSTED_WORDMARKS = [
  'trustedBy.one',
  'trustedBy.two',
  'trustedBy.three',
  'trustedBy.four',
  'trustedBy.five',
] as const;

const FEATURE_CHECKLIST = [
  'featureDetail.checkOne',
  'featureDetail.checkTwo',
  'featureDetail.checkThree',
] as const;

const HOW_IT_WORKS_STEPS = [
  { titleKey: 'howItWorks.stepOneTitle', descriptionKey: 'howItWorks.stepOneDescription' },
  { titleKey: 'howItWorks.stepTwoTitle', descriptionKey: 'howItWorks.stepTwoDescription' },
  { titleKey: 'howItWorks.stepThreeTitle', descriptionKey: 'howItWorks.stepThreeDescription' },
] as const;

// Locale-invariant data — initials derive from the person, not the copy.
const TESTIMONIAL_INITIALS = 'LP';
const TESTIMONIAL_STAR_COUNT = 5;

const PILOT_CAPABILITIES = [
  'pilot.capabilityEald',
  'pilot.capabilitySubskills',
  'pilot.capabilityAcara',
  'pilot.capabilityPsychometric',
  'pilot.capabilityClassroom',
] as const;

// Diagnose → Teach → Track → Predict → Report. The flow labels are the USP names, so they
// read from the USP keys instead of a duplicate set of five identical strings.
const PILOT_FLOW_STEPS = [
  'pilot.uspOneName',
  'pilot.uspTwoName',
  'pilot.uspThreeName',
  'pilot.uspFourName',
  'pilot.uspFiveName',
] as const;

// Locale-invariant data — the client numbers the five USPs 01-05.
const PILOT_USPS = [
  {
    number: '01',
    nameKey: 'pilot.uspOneName',
    titleKey: 'pilot.uspOneTitle',
    kickerKey: 'pilot.uspOneKicker',
  },
  {
    number: '02',
    nameKey: 'pilot.uspTwoName',
    titleKey: 'pilot.uspTwoTitle',
    kickerKey: 'pilot.uspTwoKicker',
  },
  {
    number: '03',
    nameKey: 'pilot.uspThreeName',
    titleKey: 'pilot.uspThreeTitle',
    kickerKey: 'pilot.uspThreeKicker',
  },
  {
    number: '04',
    nameKey: 'pilot.uspFourName',
    titleKey: 'pilot.uspFourTitle',
    kickerKey: 'pilot.uspFourKicker',
  },
  {
    number: '05',
    nameKey: 'pilot.uspFiveName',
    titleKey: 'pilot.uspFiveTitle',
    kickerKey: 'pilot.uspFiveKicker',
  },
] as const;

// Presentation-only audience labels under USP 05 — no data source, no API.
const PILOT_AUDIENCES = [
  'pilot.audienceTeacher',
  'pilot.audienceLeader',
  'pilot.audienceFamily',
] as const;

const PRICING_TIERS = [
  {
    key: 'free',
    nameKey: 'pricing.freeName',
    priceKey: 'pricing.freePrice',
    suffixKey: 'pricing.perMonth',
    badgeKey: null,
    ctaKey: 'pricing.freeCta',
    includedFeatureKeys: ['pricing.freeFeatureStudents', 'pricing.freeFeatureTests'],
    excludedFeatureKeys: ['pricing.freeFeatureAi'],
    featured: false,
  },
  {
    key: 'pro',
    nameKey: 'pricing.proName',
    priceKey: 'pricing.proPrice',
    suffixKey: 'pricing.perTeacherMonth',
    badgeKey: 'pricing.proBadge',
    ctaKey: 'pricing.proCta',
    includedFeatureKeys: [
      'pricing.proFeatureOne',
      'pricing.proFeatureTwo',
      'pricing.proFeatureThree',
    ],
    excludedFeatureKeys: [],
    featured: true,
  },
  {
    key: 'school',
    nameKey: 'pricing.schoolName',
    priceKey: 'pricing.schoolPrice',
    suffixKey: null,
    badgeKey: null,
    ctaKey: 'pricing.schoolCta',
    includedFeatureKeys: [
      'pricing.schoolFeatureOne',
      'pricing.schoolFeatureTwo',
      'pricing.schoolFeatureThree',
    ],
    excludedFeatureKeys: [],
    featured: false,
  },
] as const;

const FAQ_ITEMS = [
  { value: 'accounts', questionKey: 'faq.accountsQuestion', answerKey: 'faq.accountsAnswer' },
  { value: 'aiGrading', questionKey: 'faq.aiGradingQuestion', answerKey: 'faq.aiGradingAnswer' },
  { value: 'import', questionKey: 'faq.importQuestion', answerKey: 'faq.importAnswer' },
  { value: 'pte', questionKey: 'faq.pteQuestion', answerKey: 'faq.pteAnswer' },
] as const;

// D7: social icons point at real external profiles; link columns map to on-page anchors.
const FOOTER_SOCIALS = [
  { key: 'x', href: 'https://x.com/schooltest', labelKey: 'footer.socialX' },
  { key: 'youtube', href: 'https://www.youtube.com/@schooltest', labelKey: 'footer.socialYouTube' },
  {
    key: 'linkedin',
    href: 'https://www.linkedin.com/company/schooltest',
    labelKey: 'footer.socialLinkedIn',
  },
] as const;

const FOOTER_COLUMNS = [
  {
    titleKey: 'footer.productTitle',
    links: [
      { href: '#product', labelKey: 'footer.productBuilder' },
      { href: '#ai-feedback', labelKey: 'footer.productFeedback' },
      { href: '#product', labelKey: 'footer.productAnalytics' },
      { href: '#pricing', labelKey: 'footer.productPricing' },
      { href: '#for-schools', labelKey: 'footer.productHowItWorks' },
      { href: '#resources', labelKey: 'footer.productFaqs' },
      { href: '#cta', labelKey: 'pilot.cta' },
    ],
  },
  {
    titleKey: 'footer.schoolsTitle',
    links: [
      { href: '#for-schools', labelKey: 'footer.schoolsDistricts' },
      { href: '#for-schools', labelKey: 'footer.schoolsLanguageCenters' },
      { href: '#for-schools', labelKey: 'footer.schoolsUniversities' },
      { href: '#for-schools', labelKey: 'footer.schoolsCaseStudies' },
    ],
  },
  {
    titleKey: 'footer.companyTitle',
    links: [
      { href: '/about', labelKey: 'footer.companyAbout' },
      { href: '/blog', labelKey: 'footer.companyBlog' },
      { href: '/careers', labelKey: 'footer.companyCareers' },
      { href: '#cta', labelKey: 'footer.companyContact' },
    ],
  },
] as const;

const FOOTER_LEGAL = [
  { href: '/privacy', labelKey: 'footer.privacy' },
  { href: '/terms', labelKey: 'footer.terms' },
  { href: '/security', labelKey: 'footer.security' },
] as const;

export {
  NAV_LINKS,
  FLOW_STEPS,
  TRUSTED_WORDMARKS,
  FEATURE_CHECKLIST,
  HOW_IT_WORKS_STEPS,
  TESTIMONIAL_INITIALS,
  TESTIMONIAL_STAR_COUNT,
  PILOT_CAPABILITIES,
  PILOT_FLOW_STEPS,
  PILOT_USPS,
  PILOT_AUDIENCES,
  PRICING_TIERS,
  FAQ_ITEMS,
  FOOTER_SOCIALS,
  FOOTER_COLUMNS,
  FOOTER_LEGAL,
};
