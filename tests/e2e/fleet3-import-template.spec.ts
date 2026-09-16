/**
 * F3 — TODAY'S CHANGE: the import template downloads as
 * `student-import-template.csv` for EVERY school (no school slug in the name)
 * with the exact email-column bytes. Proven in the REAL browser for two
 * schools — the live seeded demo school, and a scratch school created for this
 * run (F3-stamped, one class, deleted afterwards).
 *
 * The bytes are asserted, not the UI copy: header line, sample row, CRLF
 * line endings, and the SUGGESTED FILENAME the browser saves under.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { expect, test, type Download, type Page } from '@playwright/test';

import { z } from 'zod';

import {
  CAPTURES,
  PORTAL_HEADER,
  apiJwt,
  f3Stamp,
  liveDemoSchoolId,
  liveDemoClassId,
  openImportModal,
  signInAsOps,
} from './fleet3-helpers';
import {
  OpsFixtureLedger,
  createOpsFixtureSchool,
  setOpsFixtureSeats,
} from './helpers/ops-portal';

const SAMPLE_ROW = 'Sample,Student,sample.student@example.com,2013-03-04,8,english';
const TEMPLATE_URL = '/import-students/template.csv';

async function saveDownload(download: Download): Promise<Buffer> {
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks);
}

async function downloadTemplateFromUi(page: Page): Promise<{ filename: string; csv: Buffer }> {
  const [request, download] = await Promise.all([
    page.waitForRequest((candidate) => candidate.url().includes(TEMPLATE_URL), {
      timeout: 30_000,
    }),
    page.waitForEvent('download', { timeout: 30_000 }),
    page
      .locator('[data-surface="ops-import-template-download"]')
      .click({ timeout: 30_000 }),
  ]);
  expect(request.headers()['x-ops-portal-version']).toBe('1');
  expect(request.headers().authorization).toContain('Bearer ');
  return {
    filename: download.suggestedFilename(),
    csv: await saveDownload(download),
  };
}

test.describe('F3 import template download (name + exact bytes, every school)', () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(240_000);

  test('demo school: the saved file is exactly student-import-template.csv with the email-column bytes', async ({
    page,
  }, testInfo) => {
    const schoolId = await liveDemoSchoolId();
    await signInAsOps(page);
    const panel = await openImportModal(page, schoolId);

    // The help row names the REQUIRED email column.
    await expect(
      panel.locator('[data-surface="ops-import-template-columns"]'),
    ).toContainText('email', { timeout: 30_000 });
    await mkdir(CAPTURES, { recursive: true });
    await panel.screenshot({
      path: path.join(CAPTURES, '01-import-modal-idle-demo.png'),
    });
    console.log('CAPTURE', path.join(CAPTURES, '01-import-modal-idle-demo.png'));

    const { filename, csv } = await downloadTemplateFromUi(page);

    // THE NAME: the contract's ONE filename, no school slug.
    expect(filename).toBe('student-import-template.csv');

    // THE BYTES: header + sample row, CRLF line endings.
    const text = csv.toString('utf8');
    const lines = text.split('\r\n');
    expect(lines[0], 'header line').toBe(PORTAL_HEADER);
    expect(lines[1], 'sample row').toBe(SAMPLE_ROW);
    // CRLF everywhere: no bare LF in the payload at all.
    expect(text.replace(/\r\n/g, '')).not.toContain('\n');
    expect(lines[2], 'nothing after the sample row but the trailing CRLF').toBe('');
    console.log('TEMPLATE BYTES', JSON.stringify(text));

    await testInfo.attach('student-import-template.csv', {
      body: csv,
      contentType: 'text/csv',
    });
  });

  test('a second school (F3 scratch): same exact filename, same bytes', async ({
    page,
    request,
  }, testInfo) => {
    const ledger = new OpsFixtureLedger();
    const stamp = f3Stamp();
    const school = await createOpsFixtureSchool(request, ledger, `F3-template ${stamp}`);
    await setOpsFixtureSeats(request, school.documentId, 25);
    // A school with no classes cannot render the import block (the picker is a
    // hard dependency), so the scratch school gets one class via the ops API.
    const jwt = await apiJwt(request);
    const classRes = await request.post(
      `http://127.0.0.1:5500/api/ops/schools/${school.documentId}/classes`,
      {
        headers: { Authorization: `Bearer ${jwt}` },
        data: { name: `F3 template class ${stamp}`, year_band: null },
      },
    );
    expect(classRes.ok(), await classRes.text()).toBeTruthy();
    const { documentId: classId } = z
      .object({ data: z.object({ documentId: z.string() }) })
      .parse(await classRes.json()).data;

    try {
      await signInAsOps(page);
      const panel = await openImportModal(page, school.documentId);
      // The picker lists the scratch class — proof this modal belongs to the
      // OTHER school, not the demo school.
      await panel.locator('#ops-import-class').click();
      await page.getByRole('option', { name: `F3 template class ${stamp}` }).click();

      const { filename, csv } = await downloadTemplateFromUi(page);
      expect(filename).toBe('student-import-template.csv');
      const lines = csv.toString('utf8').split('\r\n');
      expect(lines[0]).toBe(PORTAL_HEADER);
      expect(lines[1]).toBe(SAMPLE_ROW);
      console.log('SCRATCH SCHOOL TEMPLATE', school.name, filename);

      await testInfo.attach('scratch-student-import-template.csv', {
        body: csv,
        contentType: 'text/csv',
      });
    } finally {
      // Archive the class so the school delete cannot trip over it, then the
      // ledger removes the school itself.
      await request
        .post(
          `http://127.0.0.1:5500/api/ops/schools/${school.documentId}/classes/${classId}/archive`,
          { headers: { Authorization: `Bearer ${jwt}` }, data: {} },
        )
        .catch(() => undefined);
      await ledger.cleanup(request);
    }
  });

  test('the served bytes equal the API bytes the UI saves (server is the source)', async ({
    page,
    request,
  }) => {
    const schoolId = await liveDemoSchoolId();
    const classId = await liveDemoClassId(request, schoolId);
    const jwt = await apiJwt(request);
    const direct = await request.get(
      `http://127.0.0.1:5500/api/ops/schools/${schoolId}/import-students/template.csv?class_documentId=${classId}`,
      {
        headers: { Authorization: `Bearer ${jwt}`, 'X-Ops-Portal-Version': '1' },
      },
    );
    expect(direct.ok()).toBeTruthy();
    const disposition = direct.headers()['content-disposition'] ?? '';
    expect(disposition).toContain('student-import-template.csv');
    const apiBytes = await direct.body();

    await signInAsOps(page);
    const panel = await openImportModal(page, schoolId);
    await panel.locator('#ops-import-class').click();
    await page.getByRole('option', { name: 'EAL/D Year 7 - Room 4' }).click();
    const { filename, csv } = await downloadTemplateFromUi(page);
    expect(filename).toBe('student-import-template.csv');
    expect(csv.equals(apiBytes), 'UI-saved bytes === served bytes').toBe(true);
    await writeFile(path.join(CAPTURES, '02-template-bytes.csv'), csv);
  });
});
