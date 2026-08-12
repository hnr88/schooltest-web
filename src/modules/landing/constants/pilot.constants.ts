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

export { PILOT_CAPABILITIES, PILOT_FLOW_STEPS, PILOT_USPS, PILOT_AUDIENCES };
