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

export { NAV_LINKS, FLOW_STEPS, TRUSTED_WORDMARKS, FEATURE_CHECKLIST };
