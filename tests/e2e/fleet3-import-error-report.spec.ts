/**
 * F3 — the import panel's error-report download: the button appears once a
 * preview carries rejects, and the saved file lists `row,reason` ONLY — the
 * server's own account (header + one line per rejected row), not a client
 * rebuild. Pinned live: the report for a 2-row csv with a bad email is
 * `row,reason\r\n2,email must be a valid email address\r\n`.
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import { expect, test } from '@playwright/test';

import {
  CAPTURES,
  PORTAL_HEADER,
  f3Stamp,
  liveDemoSchoolId,
  openImportModal,
  pickClass,
  portalRow,
  trackRequests,
} from './fleet3-helpers';

const CLASS_NAME = 'EAL/D Year 7 - Room 4';

test.describe.configure({ retries: 1 });
test.setTimeout(120_000);

test('error report lists row,reason only — saved bytes from the server', async ({
  page,
}, testInfo) => {
  const stamp = f3Stamp();
  const schoolId = await liveDemoSchoolId();
  await signInAsOps(page);
  const panel = await openImportModal(page, schoolId);
  await mkdir(CAPTURES, { recursive: true });
  const previews = trackRequests(page, '/import-students/preview');

  const csv = [
    PORTAL_HEADER,
    portalRow('F3', `Report Ok ${stamp}`, `f3.report.${stamp}@import.invalid`),
    portalRow('F3', `Report Bad ${stamp}`, 'also-not-an-email'),
  ].join('\n');
  await panel
    .locator('#ops-import-file')
    .setInputFiles({ name: `f3-report-${stamp}.csv`, mimeType: 'text/csv', buffer: Buffer.from(csv) });
  await pickClass(page, CLASS_NAME);

  await expect(panel).toHaveAttribute('data-card', 'rowErrors', { timeout: 30_000 });
  expect(previews.count()).toBe(1);

  // The button the rejected preview reveals.
  const reportButton = panel.getByRole('button', { name: 'Download the error report', exact: true });
  await expect(reportButton).toBeVisible();
  await panel.screenshot({ path: path.join(CAPTURES, '14-rowerrors-with-report-button.png') });
  console.log('CAPTURE', path.join(CAPTURES, '14-rowerrors-with-report-button.png'));

  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 30_000 }),
    reportButton.click(),
  ]);
  expect(download.suggestedFilename()).toBe('import-errors.csv');

  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(chunk as Buffer);
  const text = Buffer.concat(chunks).toString('utf8');
  await testInfo.attach('import-errors.csv', { body: Buffer.concat(chunks), contentType: 'text/csv' });

  // row,reason ONLY — header plus exactly one line per rejected row (row 3).
  const lines = text.split('\r\n');
  expect(lines[0], 'the header is exactly the two columns').toBe('row,reason');
  expect(lines, 'no email/name columns leak into the report').toHaveLength(3);
  expect(lines[1]).toMatch(/^3,email must be a valid email address$/);
  expect(lines[2]).toBe('');
  expect(text).not.toContain('@');
  console.log('ERROR REPORT BYTES', JSON.stringify(text));
});
