import { mkdirSync } from 'node:fs';
import path from 'node:path';

import { expect, test } from '@playwright/test';

import {
  familyReportDetailSchema,
  familyReportListSchema,
} from '@/modules/report/schemas/family-report.schema';

import { bridgeApiCors } from './helpers/api-cors-bridge';
import { API } from './helpers/class-detail';
import { loginCached } from './helpers/http';
import { cat, loadMessages } from './helpers/i18n';
import { loginAs, ROLE_CREDENTIALS } from './helpers/roles';

// BUG-008 follow-up — the family report's "What this means" printed the API's English audit
// narrative verbatim to families ("Vocab_A2: secure — A2-level vocabulary knowledge… (probability
// 1.00 from 6 evidence items)"), and it stayed English under /zh. It is now one plain carer line per
// assessed skill, built from the structured attributes the family wire already carries, in the
// family's locale. The expected lines are re-derived here from the live payload, with no app code.
const PROOF = path.join(process.env.E2E_PROOF_DIR ?? path.resolve('test-results'), 'BUG-008-followup');
const DISPLAY_ORDER = ['Decoding', 'Vocab_A2', 'Grammar', 'Vocab_B1', 'Gist', 'Detail', 'Inference'] as const;
const CARER_SUFFIX: Record<(typeof DISPLAY_ORDER)[number], string> = {
  Decoding: 'decoding',
  Vocab_A2: 'vocabA2',
  Grammar: 'grammar',
  Vocab_B1: 'vocabB1',
  Gist: 'gist',
  Detail: 'detail',
  Inference: 'inference',
};

function expectedKeys(attributes: Record<string, { status: string }>): string[] {
  return DISPLAY_ORDER.flatMap((name) => {
    const status = attributes[name]?.status;
    if (status === undefined || status === 'not_assessed') return [];
    return [`TeacherPortal.viewModel.carer.${status === 'not_yet' ? 'next' : 'can'}.${CARER_SUFFIX[name]}`];
  });
}

test.use({ viewport: { width: 1280, height: 900 } });
test.beforeAll(() => mkdirSync(PROOF, { recursive: true }));
test.beforeEach(async ({ context }) => bridgeApiCors(context));

test('family report "What this means": Everyday / Classroom Vocabulary in plain, localized words — no key, CEFR code or probability', async ({
  page,
}) => {
  test.setTimeout(180_000);
  const jwt = await loginCached(page.request, API, {
    email: ROLE_CREDENTIALS.parent.email,
    password: ROLE_CREDENTIALS.parent.password,
  });
  const auth = { headers: { Authorization: `Bearer ${jwt}` } };
  const list = familyReportListSchema.parse(await (await page.request.get(`${API}/api/my/results`, auth)).json());

  let target: { id: string; attributes: Record<string, { status: string }> } | null = null;
  for (const row of list.filter((entry) => entry.state === 'released')) {
    const detail = familyReportDetailSchema.parse(await (await page.request.get(`${API}/api/my/results/${row.documentId}`, auth)).json());
    if (detail.state !== 'released') continue;
    const strands = ['Vocab_A2', 'Vocab_B1'].filter((name) => (detail.view.attributes[name]?.status ?? 'not_assessed') !== 'not_assessed');
    if (strands.length > 0) {
      target = { id: detail.view.documentId, attributes: detail.view.attributes };
      break;
    }
  }
  expect(target, 'the seeded parent has a released report with a vocabulary strand assessed').not.toBeNull();
  const keys = expectedKeys(target!.attributes);
  expect(keys.some((key) => /vocabA2|vocabB1/.test(key))).toBe(true);

  await loginAs(page, 'parent');
  for (const locale of ['en', 'zh'] as const) {
    const messages = loadMessages(locale);
    await page.goto(`${locale === 'en' ? '' : `/${locale}`}/dashboard/reports/${target!.id}`);
    const section = page.locator('[data-slot="family-report-commentary"]');
    await expect(section).toBeVisible({ timeout: 60_000 });
    await expect(section.locator('h2')).toHaveText(cat(messages, 'Report.family.commentaryHeading'));
    const lines = await section.locator('[data-slot="family-report-commentary-line"]').allInnerTexts();
    expect(lines.map((line) => line.trim())).toEqual(keys.map((key) => cat(messages, key)));
    expect(await section.innerText(), `${locale}: no internal key, CEFR level or probability`).not.toMatch(
      /Vocab_|probab|\bA2\b|\bB1\b|\d\.\d\d|evidence items|not_assessed/,
    );
    await section.scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(PROOF, `05-family-report-what-this-means-${locale}.png`), fullPage: true, animations: 'disabled' });
  }
});
