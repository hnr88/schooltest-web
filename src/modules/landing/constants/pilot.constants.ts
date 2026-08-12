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

// Locale-invariant data — the client numbers the five USPs 01-05. `bodyKey` carries the
// client's own paragraph for each; `detail` names the illustrative block that USP shows.
const PILOT_USPS = [
  {
    number: '01',
    nameKey: 'pilot.uspOneName',
    titleKey: 'pilot.uspOneTitle',
    bodyKey: 'pilot.uspOneBody',
    kickerKey: 'pilot.uspOneKicker',
    detail: null,
  },
  {
    number: '02',
    nameKey: 'pilot.uspTwoName',
    titleKey: 'pilot.uspTwoTitle',
    bodyKey: 'pilot.uspTwoBody',
    kickerKey: 'pilot.uspTwoKicker',
    detail: 'llm',
  },
  {
    number: '03',
    nameKey: 'pilot.uspThreeName',
    titleKey: 'pilot.uspThreeTitle',
    bodyKey: 'pilot.uspThreeBody',
    kickerKey: 'pilot.uspThreeKicker',
    detail: null,
  },
  {
    number: '04',
    nameKey: 'pilot.uspFourName',
    titleKey: 'pilot.uspFourTitle',
    bodyKey: 'pilot.uspFourBody',
    kickerKey: 'pilot.uspFourKicker',
    detail: null,
  },
  {
    number: '05',
    nameKey: 'pilot.uspFiveName',
    titleKey: 'pilot.uspFiveTitle',
    bodyKey: 'pilot.uspFiveBody',
    kickerKey: 'pilot.uspFiveKicker',
    detail: 'audiences',
  },
] as const;

// Presentation-only audience labels under USP 05 — no data source, no API.
const PILOT_AUDIENCES = [
  'pilot.audienceTeacher',
  'pilot.audienceLeader',
  'pilot.audienceFamily',
] as const;

/**
 * USP 05's three audience views, as the client's draft shows them. PRESENTATION ONLY —
 * illustrative marketing copy, deliberately wired to no API and no student record. The
 * family view's point is that a report can be issued in the family's home language; the
 * draft demonstrates that with sample Chinese, which is DEMO CONTENT and not a UI locale.
 */
const PILOT_AUDIENCE_VIEWS = [
  {
    id: 'teacher',
    labelKey: 'pilot.viewTeacherLabel',
    headlineKey: 'pilot.viewTeacherHeadline',
    bodyKey: 'pilot.viewTeacherBody',
  },
  {
    id: 'leader',
    labelKey: 'pilot.viewLeaderLabel',
    headlineKey: 'pilot.viewLeaderHeadline',
    bodyKey: 'pilot.viewLeaderBody',
  },
  {
    id: 'family',
    labelKey: 'pilot.viewFamilyLabel',
    headlineKey: 'pilot.viewFamilyHeadline',
    bodyKey: 'pilot.viewFamilyBody',
  },
] as const;

/** USP 02's export targets. Names of third-party tools, so not translated. */
const PILOT_LLM_TARGETS = ['pilot.llmChatgpt', 'pilot.llmGemini', 'pilot.llmClaude'] as const;

export {
  PILOT_CAPABILITIES,
  PILOT_FLOW_STEPS,
  PILOT_USPS,
  PILOT_AUDIENCES,
  PILOT_AUDIENCE_VIEWS,
  PILOT_LLM_TARGETS,
};
