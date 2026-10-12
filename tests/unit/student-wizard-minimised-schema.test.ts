import { describe, expect, test, vi } from 'vitest';

// The full (parent views ON) payload shape is exercised by flipping the one
// flag seam the builder reads; the schema itself reads the same seam.
const flag = vi.hoisted(() => ({ parentViews: false }));
vi.mock('@/modules/flags', () => ({ parentViewsEnabled: () => flag.parentViews }));

import { buildStudentPayload } from '@/modules/student-wizard/lib/build-student-payload';
import {
  activeStepFields,
  createStudentWizardSchema,
} from '@/modules/student-wizard/schemas/student-wizard.schema';
import { DEFAULT_WIZARD_SCHEMA_OPTIONS } from '@/modules/student-wizard/constants/student-wizard.constants';
import { resolveWizardOptions } from '@/modules/student-wizard/hooks/use-student-wizard';
import type { ConsentConfig } from '@/modules/privacy-consent/types/consent.types';

// W4-19 (D5 S1/S4). The schema and the payload builder are the web half of the
// W4-13 contract: OFF is today's required set, byte for byte; minimised drops
// passport and makes four fields optional; consents ride along only when ticked.

const t = (key: string) => key;

const FILLED = {
  given_name: ' Mia ',
  family_name: 'Chen',
  email: 'mia@example.com',
  date_of_birth: '2012-03-04',
  gender: 'female',
  nationality: 'Australia',
  passport_number: 'E12345678',
  current_school: 'Springfield High',
  current_year_level: 'Year 9',
  year_level: 9,
  target_entry_year: String(new Date().getFullYear() + 1),
  target_entry_term: 'Term 1',
  parent_guardian_name: 'Sam Chen',
  parent_guardian_phone: '0400000000',
  parent_guardian_email: 'sam@example.com',
  parent_guardian_wechat: '',
  preferred_contact_channel: 'whatsapp',
  photo: 11,
  voice_intro: 12,
} as const;

const MINIMISED = { minimised: true, guardianConsentRequired: false, recordsEnabled: false };
const GUARDIAN = { minimised: false, guardianConsentRequired: true, recordsEnabled: true };

function parse(input: Record<string, unknown>, opts = DEFAULT_WIZARD_SCHEMA_OPTIONS) {
  return createStudentWizardSchema(t, opts).safeParse(input);
}

function failedFields(input: Record<string, unknown>, opts = DEFAULT_WIZARD_SCHEMA_OPTIONS) {
  const result = parse(input, opts);
  if (result.success) return [];
  return result.error.issues.map((issue) => String(issue.path[0]));
}

const without = (...keys: string[]) =>
  Object.fromEntries(Object.entries(FILLED).filter(([key]) => !keys.includes(key)));

describe('default options reproduce today', () => {
  test('a filled fixture parses and the payload is exactly today\'s key order and content', () => {
    flag.parentViews = true;
    const result = parse(FILLED);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(JSON.stringify(buildStudentPayload(result.data))).toBe(
      JSON.stringify({
        given_name: 'Mia',
        family_name: 'Chen',
        email: 'mia@example.com',
        date_of_birth: '2012-03-04',
        gender: 'female',
        nationality: 'Australia',
        passport_number: 'E12345678',
        current_school: 'Springfield High',
        current_year_level: 'Year 9',
        target_entry_year: FILLED.target_entry_year,
        target_entry_term: 'Term 1',
        parent_guardian_name: 'Sam Chen',
        parent_guardian_phone: '0400000000',
        parent_guardian_email: 'sam@example.com',
        preferred_contact_channel: 'whatsapp',
        photo: 11,
        voice_intro: 12,
        year_level: 9,
      }),
    );
  });

  test('no options argument is the same schema as the explicit all-OFF options', () => {
    const implicit = createStudentWizardSchema(t).safeParse(FILLED);
    const explicit = parse(FILLED);
    expect(implicit).toEqual(explicit);
  });

  test('passport, gender, nationality, photo and voice are all still required', () => {
    flag.parentViews = true;
    const fields = failedFields(
      { ...FILLED, passport_number: '', gender: undefined, nationality: '', photo: null, voice_intro: null },
    );
    expect(fields).toEqual(
      expect.arrayContaining(['passport_number', 'gender', 'nationality', 'photo', 'voice_intro']),
    );
  });

  test('the consent boxes never gate the submit with every switch off', () => {
    expect(parse({ ...FILLED, consent_data_collection: false }).success).toBe(true);
    const parsed = parse(FILLED);
    expect(parsed.success && parsed.data.consent_data_collection).toBe(false);
    expect(parsed.success && parsed.data.consent_ai_processing).toBe(false);
  });
});

describe('minimised profile', () => {
  test('parses without passport, gender, nationality, photo and voice intro', () => {
    flag.parentViews = true;
    const input = {
      ...without('passport_number', 'gender', 'nationality', 'photo', 'voice_intro'),
      passport_number: '',
      nationality: '',
      photo: null,
      voice_intro: null,
    };
    const result = parse(input, MINIMISED);
    expect(result.success).toBe(true);
    if (!result.success) return;
    const payload = buildStudentPayload(result.data, { minimised: true });
    for (const key of ['passport_number', 'gender', 'nationality', 'photo', 'voice_intro']) {
      expect(payload).not.toHaveProperty(key);
    }
    expect(payload).toMatchObject({
      parent_guardian_name: 'Sam Chen',
      parent_guardian_phone: '0400000000',
      parent_guardian_email: 'sam@example.com',
    });
  });

  test('guardian name, email and phone stay required', () => {
    flag.parentViews = true;
    const fields = failedFields(
      { ...FILLED, parent_guardian_name: '', parent_guardian_phone: '', parent_guardian_email: '' },
      MINIMISED,
    );
    expect(fields).toEqual(
      expect.arrayContaining(['parent_guardian_name', 'parent_guardian_phone', 'parent_guardian_email']),
    );
  });

  test('never sends passport_number even if a value is present', () => {
    flag.parentViews = false;
    const result = parse(FILLED, MINIMISED);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(buildStudentPayload(result.data, { minimised: true })).not.toHaveProperty('passport_number');
  });

  test('optional values the parent did give are still sent', () => {
    flag.parentViews = true;
    const result = parse(FILLED, MINIMISED);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(buildStudentPayload(result.data, { minimised: true })).toMatchObject({
      gender: 'female',
      nationality: 'Australia',
      photo: 11,
      voice_intro: 12,
    });
  });
});

describe('guardian consent', () => {
  test('required together with the data collection box', () => {
    const missing = parse({ ...FILLED, consent_data_collection: false }, GUARDIAN);
    expect(missing.success).toBe(false);
    expect(failedFields({ ...FILLED }, GUARDIAN)).toEqual(['consent_data_collection']);
    expect(parse({ ...FILLED, consent_data_collection: true }, GUARDIAN).success).toBe(true);
  });

  test('the AI box never blocks enrolment', () => {
    const result = parse(
      { ...FILLED, consent_data_collection: true, consent_ai_processing: false },
      GUARDIAN,
    );
    expect(result.success).toBe(true);
  });

  test('is not required when records are disabled, whatever the guardian flag says', () => {
    expect(parse(FILLED, { ...GUARDIAN, recordsEnabled: false }).success).toBe(true);
  });

  test('the consent fields belong to the review step', () => {
    flag.parentViews = true;
    const steps = activeStepFields();
    expect(steps[steps.length - 1]).toEqual(['consent_data_collection', 'consent_ai_processing']);
    flag.parentViews = false;
    const masked = activeStepFields();
    expect(masked[masked.length - 1]).toEqual(['consent_data_collection', 'consent_ai_processing']);
  });
});

describe('payload consents', () => {
  const ticked = (over: Record<string, unknown>) => {
    const result = parse({ ...FILLED, ...over }, { ...GUARDIAN, guardianConsentRequired: false });
    if (!result.success) throw new Error('fixture must parse');
    return result.data;
  };

  test.each([true, false])('emits one grant per ticked box in order (parent views %s)', (views) => {
    flag.parentViews = views;
    const payload = buildStudentPayload(
      ticked({ consent_data_collection: true, consent_ai_processing: true }),
      { recordsEnabled: true },
    );
    expect(payload.consents).toEqual([
      { consent_type: 'data_collection' },
      { consent_type: 'ai_processing' },
    ]);
  });

  test('declining AI sends only the data collection grant', () => {
    flag.parentViews = true;
    const payload = buildStudentPayload(
      ticked({ consent_data_collection: true, consent_ai_processing: false }),
      { recordsEnabled: true },
    );
    expect(payload.consents).toEqual([{ consent_type: 'data_collection' }]);
  });

  test('never emits consents when records are disabled', () => {
    flag.parentViews = true;
    const payload = buildStudentPayload(
      ticked({ consent_data_collection: true, consent_ai_processing: true }),
      { recordsEnabled: false },
    );
    expect(payload).not.toHaveProperty('consents');
  });

  test('nothing ticked means no consents key at all', () => {
    flag.parentViews = true;
    expect(buildStudentPayload(ticked({}))).not.toHaveProperty('consents');
  });
});

describe('resolveWizardOptions', () => {
  const config = (over: Partial<ConsentConfig> = {}): ConsentConfig => ({
    consent_records_enabled: false,
    guardian_consent_required: false,
    ai_consent_required: false,
    ai_consent_source: 'off',
    minimised_student_profile: false,
    student_erasure_enabled: false,
    policy: { slug: 'privacy-policy', version: '1.1' },
    statements: [],
    ...over,
  });

  test('a pending or failed config is today\'s behaviour', () => {
    expect(resolveWizardOptions(undefined, 'create')).toEqual(DEFAULT_WIZARD_SCHEMA_OPTIONS);
  });

  test('edit mode keeps today\'s rules whatever the config says', () => {
    const on = config({
      consent_records_enabled: true,
      guardian_consent_required: true,
      minimised_student_profile: true,
    });
    expect(resolveWizardOptions(on, 'edit')).toEqual(DEFAULT_WIZARD_SCHEMA_OPTIONS);
  });

  test('create maps the three switches; guardian consent needs records enabled', () => {
    expect(
      resolveWizardOptions(
        config({ consent_records_enabled: true, guardian_consent_required: true, minimised_student_profile: true }),
        'create',
      ),
    ).toEqual({ minimised: true, recordsEnabled: true, guardianConsentRequired: true });
    expect(
      resolveWizardOptions(config({ guardian_consent_required: true }), 'create'),
    ).toEqual(DEFAULT_WIZARD_SCHEMA_OPTIONS);
  });
});
