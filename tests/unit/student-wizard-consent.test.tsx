import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { NextIntlClientProvider } from 'next-intl';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { FormProvider } from 'react-hook-form';
import { afterEach, beforeEach, describe, expect, test, vi, type MockInstance } from 'vitest';

import enMessages from '@/i18n/messages/en.json';
import { strapi } from '@/lib/axios/strapi';
import { StepPersonal } from '@/modules/student-wizard/components/StepPersonal';
import { StepReview } from '@/modules/student-wizard/components/StepReview';
import { useStudentWizard } from '@/modules/student-wizard/hooks/use-student-wizard';
import { buildStudentPayload } from '@/modules/student-wizard/lib/build-student-payload';
import type {
  StudentWizardOutput,
  StudentWizardValues,
} from '@/modules/student-wizard/schemas/student-wizard.schema';
import type { WizardMode } from '@/modules/student-wizard/types/student-wizard.types';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

// W4-19 (D5 S1/S4). The real wizard hook, step components and consent config
// query run against the strapi axios request adapter (the repo's REST boundary
// seam, as privacy-consent-panel.test.tsx). No product code is stubbed.

const STATEMENTS = [
  { key: 'data_collection@1', type: 'data_collection', text: 'API wording for data collection.' },
  { key: 'ai_processing@1', type: 'ai_processing', text: 'API wording for AI-assisted marking.' },
];

const config = (over: Record<string, unknown> = {}) => ({
  consent_records_enabled: false,
  guardian_consent_required: false,
  ai_consent_required: false,
  ai_consent_source: 'off',
  minimised_student_profile: false,
  student_erasure_enabled: false,
  policy: { slug: 'privacy-policy', version: '2.1' },
  statements: STATEMENTS,
  ...over,
});

const FILLED: Partial<StudentWizardValues> = {
  given_name: 'Mia',
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
};

const originalAdapter = strapi.defaults.adapter;
let configReply: { status: number; body: unknown };

function useAdapter() {
  strapi.defaults.adapter = async (requestConfig: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
    const { status, body } = configReply;
    const response: AxiosResponse = {
      data: body,
      status,
      statusText: String(status),
      headers: {},
      config: requestConfig,
    };
    if (status >= 200 && status < 300) return response;
    throw new AxiosError('request failed', 'ERR_BAD_REQUEST', requestConfig, undefined, response);
  };
}

const served = (over: Record<string, unknown> = {}) => ({ status: 200, body: { data: config(over) } });

interface Submitted {
  valid: StudentWizardOutput[];
  invalid: string[][];
}

function Harness({ mode, submitted }: { mode: WizardMode; submitted: Submitted }) {
  const wizard = useStudentWizard({ mode, initialValues: FILLED });
  const { form } = wizard;
  return (
    <FormProvider {...form}>
      <StepPersonal />
      <StepReview error={null} onDismissError={() => undefined} />
      <button
        type="button"
        data-testid="submit"
        onClick={() =>
          void form.handleSubmit(
            (values) => submitted.valid.push(values),
            (errors) => submitted.invalid.push(Object.keys(errors)),
          )()
        }
      >
        submit
      </button>
    </FormProvider>
  );
}

let host: HTMLElement | undefined;
let root: Root | undefined;
let submitted: Submitted;

async function settle() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 30));
  });
}

async function mount(mode: WizardMode = 'create'): Promise<HTMLElement> {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  await act(async () => {
    root!.render(
      <QueryClientProvider client={client}>
        <NextIntlClientProvider locale="en" messages={enMessages} timeZone="Australia/Sydney">
          <Harness mode={mode} submitted={submitted} />
        </NextIntlClientProvider>
      </QueryClientProvider>,
    );
  });
  await settle();
  return host;
}

async function click(el: Element) {
  await act(async () => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  await settle();
}

// The visible control is the role=checkbox element; a person ticks it by
// clicking its label (jsdom has no PointerEvent, which the checkbox root needs).
const box = (el: HTMLElement, type: string) =>
  el.querySelector<HTMLElement>(`[data-consent-type="${type}"] [role="checkbox"]`);
const label = (el: HTMLElement, type: string) =>
  el.querySelector<HTMLElement>(`[data-consent-type="${type}"] label`);
const T = enMessages.StudentWizard;

// The first render of the nationality combobox builds the localised country
// list, which is slow on a cold, throttled machine.
vi.setConfig({ testTimeout: 60_000 });
let setItem: MockInstance;

beforeEach(() => {
  submitted = { valid: [], invalid: [] };
  setItem = vi.spyOn(Storage.prototype, 'setItem');
  useAdapter();
});

afterEach(() => {
  strapi.defaults.adapter = originalAdapter;
  if (root !== undefined && host !== undefined) {
    act(() => root!.unmount());
    host.remove();
  }
  root = undefined;
  host = undefined;
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('step 1 notice', () => {
  test('shows what is asked, why, and the three policy links with every switch off', async () => {
    configReply = served();
    const el = await mount();
    const notice = el.querySelector('[data-slot="wizard-privacy-notice"]');
    expect(notice).not.toBeNull();
    expect(notice!.textContent).toContain(T.notice.title);
    expect(notice!.textContent).toContain(T.notice.rows.extras.why);
    const hrefs = [...notice!.querySelectorAll('a')].map((a) => a.getAttribute('href'));
    expect(hrefs.join(' ')).toMatch(/privacy-policy.*terms-of-service.*cookie-policy/);
    // Today's required set: passport is asked for, the consent block is absent.
    expect(el.querySelector('#wizard-passport')).not.toBeNull();
    expect(el.querySelector('[data-slot="wizard-consent"]')).toBeNull();
  });

  test('a failed config request falls back to exactly today\'s wizard', async () => {
    configReply = { status: 500, body: { error: { status: 500, name: 'Err', message: 'x' } } };
    const el = await mount();
    expect(el.querySelector('[data-slot="wizard-privacy-notice"]')).not.toBeNull();
    expect(el.querySelector('#wizard-passport')).not.toBeNull();
    expect(el.querySelector('[data-slot="wizard-consent"]')).toBeNull();
  });
});

describe('minimised profile', () => {
  test('hides passport, marks gender and nationality optional and explains why', async () => {
    configReply = served({ minimised_student_profile: true });
    const el = await mount();
    expect(el.querySelector('#wizard-passport')).toBeNull();
    expect(el.textContent).toContain(T.whyWeAsk.gender);
    expect(el.textContent).toContain(T.whyWeAsk.nationality);
    expect(el.textContent).toContain(T.notice.rows.extrasOptional.label);
    await click(el.querySelector('[data-testid="submit"]')!);
    expect(submitted.invalid).toEqual([]);
    expect(submitted.valid).toHaveLength(1);
    expect(buildStudentPayload(submitted.valid[0], { minimised: true })).not.toHaveProperty(
      'passport_number',
    );
  });
});

describe('consent block', () => {
  test('renders the API statements as two separate unticked boxes', async () => {
    configReply = served({ consent_records_enabled: true });
    const el = await mount();
    const block = el.querySelector('[data-slot="wizard-consent"]');
    expect(block).not.toBeNull();
    expect(block!.textContent).toContain(STATEMENTS[0].text);
    expect(block!.textContent).toContain(STATEMENTS[1].text);
    expect(block!.textContent).toContain('privacy policy version 2.1');
    for (const type of ['data_collection', 'ai_processing']) {
      expect(box(el, type)).not.toBeNull();
      expect(box(el, type)!.getAttribute('aria-checked')).toBe('false');
    }
  });

  test('guardian consent required blocks submit until data collection is ticked', async () => {
    configReply = served({ consent_records_enabled: true, guardian_consent_required: true });
    const el = await mount();
    await click(el.querySelector('[data-testid="submit"]')!);
    expect(submitted.valid).toHaveLength(0);
    expect(submitted.invalid).toEqual([['consent_data_collection']]);
    expect(el.textContent).toContain(enMessages.StudentWizardSchema.consentDataCollectionRequired);

    await click(label(el, 'data_collection')!);
    await click(el.querySelector('[data-testid="submit"]')!);
    expect(submitted.valid).toHaveLength(1);
    // Declining AI never blocks enrolment and sends no AI grant.
    expect(buildStudentPayload(submitted.valid[0], { recordsEnabled: true }).consents).toEqual([
      { consent_type: 'data_collection' },
    ]);
  });

  test('ticking both sends two separate grants', async () => {
    configReply = served({ consent_records_enabled: true });
    const el = await mount();
    await click(label(el, 'data_collection')!);
    await click(label(el, 'ai_processing')!);
    await click(el.querySelector('[data-testid="submit"]')!);
    expect(buildStudentPayload(submitted.valid[0]).consents).toEqual([
      { consent_type: 'data_collection' },
      { consent_type: 'ai_processing' },
    ]);
  });

  test('is absent in edit mode, which keeps today\'s rules and never sends consents', async () => {
    configReply = served({
      consent_records_enabled: true,
      guardian_consent_required: true,
      minimised_student_profile: true,
    });
    const el = await mount('edit');
    expect(el.querySelector('[data-slot="wizard-consent"]')).toBeNull();
    expect(el.querySelector('#wizard-passport')).not.toBeNull();
    await click(el.querySelector('[data-testid="submit"]')!);
    expect(submitted.valid).toHaveLength(1);
    expect(buildStudentPayload(submitted.valid[0])).not.toHaveProperty('consents');
  });

  test('writes nothing to localStorage', async () => {
    configReply = served({ consent_records_enabled: true });
    const el = await mount();
    await click(label(el, 'data_collection')!);
    expect(setItem).not.toHaveBeenCalled();
  });
});
