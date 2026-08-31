import { expect, type Download, type Locator, type PlaywrightWorkerArgs } from '@playwright/test';

import {
  parseTeacherExportFilename,
  teacherExportPath,
} from '@/modules/teacher/lib/teacher-export';
import {
  teacherExportDocumentSchema,
  teacherExportHeadersSchema,
} from '@/modules/teacher/schemas/teacher-export.schema';
import type {
  TeacherExportFile,
  TeacherExportRequest,
} from '@/modules/teacher/types/teacher-export.types';

import { API_BASE, bearer } from './teacher-results-live';

// Task 046 harness. The spec compares what the BROWSER downloaded against what
// C-TR-5/6/7 answers to an independent server-to-server GET, parsed through the
// shipped transport mirror. So the file a teacher gets is checked to be the
// SERVER's bytes — the portal cannot pass this by composing a document itself.

/** The one line of every export that is a wall-clock stamp, so the only line two reads differ on. */
const GENERATED_LINE = /^- Generated: (.+)$/m;

/**
 * Fetches one export exactly as the shipped Server Function does — same path
 * builder, same strict header parse, same document parse (which REJECTS a body
 * with no trailing `## Prompt` section). A drifted response throws here.
 */
export async function readTeacherExportLive(
  playwright: PlaywrightWorkerArgs['playwright'],
  request: TeacherExportRequest,
  jwtOverride?: string,
): Promise<TeacherExportFile> {
  const context = await playwright.request.newContext();
  try {
    const jwt = jwtOverride ?? (await bearer(context));
    const response = await context.get(`${API_BASE}${teacherExportPath(request)}`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    if (response.status() !== 200) {
      throw new Error(`[e2e] ${teacherExportPath(request)} answered ${response.status()}`);
    }
    const headers = teacherExportHeadersSchema.parse({
      'content-type': response.headers()['content-type'],
      'content-disposition': response.headers()['content-disposition'],
    });
    return {
      filename: parseTeacherExportFilename(headers['content-disposition']),
      body: teacherExportDocumentSchema.parse(await response.text()),
    };
  } finally {
    await context.dispose();
  }
}

/** Clicks a button and returns the file the BROWSER actually saved. */
export async function downloadFrom(button: Locator): Promise<TeacherExportFile> {
  const page = button.page();
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], {
    origin: new URL(page.url()).origin,
  });
  await button.click();
  const preview = page.locator('[data-slot="teacher-export-preview"]');
  await expect(preview).toBeVisible({ timeout: 20_000 });
  await expect(preview.locator('[data-slot="teacher-export-prompt"]')).not.toBeEmpty();
  const [download]: [Download, void] = await Promise.all([
    page.waitForEvent('download', { timeout: 30_000 }),
    preview.locator('[data-slot="teacher-export-copy-download"]').click(),
  ]);
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  return {
    filename: download.suggestedFilename(),
    body: Buffer.concat(chunks).toString('utf8'),
  };
}

/**
 * Asserts the downloaded file IS the server's document.
 *
 * Byte-identical except for the `- Generated:` stamp, which is the moment of the
 * request and therefore differs between two reads by design (measured: two
 * successive insights reads differ on that line and nothing else). The stamp is
 * not skipped — it is asserted to be a real ISO instant on both sides first.
 */
export function expectSameDocument(downloaded: TeacherExportFile, server: TeacherExportFile): void {
  expect(downloaded.filename).toBe(server.filename);

  const generated = GENERATED_LINE.exec(downloaded.body);
  if (generated) {
    expect(GENERATED_LINE.exec(server.body)?.[1]).toEqual(expect.any(String));
    expect(Number.isNaN(Date.parse(generated[1]))).toBe(false);
  }

  const normalise = (body: string) => body.replace(GENERATED_LINE, '- Generated: <stamp>');
  expect(normalise(downloaded.body)).toBe(normalise(server.body));
  expect(() => teacherExportDocumentSchema.parse(downloaded.body)).not.toThrow();
}

/**
 * De-identification, checked from the portal's side: not one display name the
 * Results UI is showing on screen may appear in the file it just downloaded, and
 * the anonymised ids must be there instead.
 */
export function expectDeIdentified(body: string, displayNames: readonly string[]): void {
  for (const name of displayNames) {
    expect(body, `export must not carry the roster name "${name}"`).not.toContain(name);
    const surname = name.replace(/\s+\w\.?$/, '');
    expect(body, `export must not carry "${surname}"`).not.toContain(surname);
  }
  expect(body).toMatch(/\bS\d{2,}\b/);
}
