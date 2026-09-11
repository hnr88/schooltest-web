import path from 'node:path';

import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { createTranslator } from 'next-intl';

import enMessages from '@/i18n/messages/en.json';
import { teacherDashboardResponseSchema } from '@/modules/teacher/schemas/teacher.schema';
import type { TeacherDashboardResponse } from '@/modules/teacher/types/teacher.types';

import { cat } from './helpers/i18n';
import { closeSession, createSession, readTests } from './helpers/teacher-past-sessions-api';
import { en, SCREENSHOTS, signInTeacher } from './helpers/teacher-rail';
import { API_BASE, bearer } from './helpers/teacher-results-live';

// teacher/06 — the Classes screen's URL-held state and its live strip (Teacher Portal
// v2.dc.html:57–216), proven against the RUNNING app and the REAL Strapi as the fixture
// teacher (teacher@schooltest.local owns several classes, so a sort has rows to
// reorder): the tiles ⇄ list choice and the sort survive a reload because the URL is
// the store, and the live strip plus the rail's live dot follow a sitting this file
// really opens (C-TS-1) and really closes (C-TS-4). The list itself, search, the status
// filter, the exports and the row link are proven by teacher-v2/classes.spec.ts.

const FIXTURE_TEACHER = 'teacher@schooltest.local';
const C = 'TeacherPortal.classes';
const KIT = 'TeacherPortal.kit';
const tClasses = createTranslator({ locale: 'en', messages: enMessages, namespace: C });

test.describe.configure({ mode: 'serial' });

let page: Page;
let request: APIRequestContext;
let jwt: string;
let started: string | null = null;

const surface = () => page.locator('[data-surface="teacher-results"]');
const tilesBody = () => page.locator('[data-layout="tiles"]');
const tableBody = () => page.locator('[data-slot="teacher-classes-list"] table');
const toggle = () => page.locator('[data-slot="directory-layout-toggle"]');
const rowIds = () =>
  tableBody()
    .locator('tbody [data-slot="results-class-row"]')
    .evaluateAll((rows) => rows.map((row) => row.getAttribute('data-class-id') ?? ''));

async function openClasses(): Promise<void> {
  await page.goto('/dashboard/results');
  await expect(surface()).toHaveAttribute('data-status', 'ready', { timeout: 60_000 });
}

async function readDashboard(): Promise<TeacherDashboardResponse> {
  const response = await request.get(`${API_BASE}/api/teacher/dashboard`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  expect(response.status(), 'GET /api/teacher/dashboard').toBe(200);
  return teacherDashboardResponseSchema.parse(await response.json());
}

test.beforeAll(async ({ browser, playwright }) => {
  test.setTimeout(180_000);
  request = await playwright.request.newContext();
  jwt = await bearer(request, FIXTURE_TEACHER);
  // 1440×900 — the proof viewport, set on the page itself.
  page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await signInTeacher(page, FIXTURE_TEACHER);
  await openClasses();
});

test.afterAll(async () => {
  // Leave no sitting of this spec's own making open behind.
  if (started !== null) await closeSession(request, jwt, started);
  await page?.close();
  await request?.dispose();
});

test('the tiles choice is held in the URL: it swaps the body and survives a reload', async () => {
  await expect(tableBody()).toBeVisible();
  await expect(page).not.toHaveURL(/layout=/);
  const count = await tableBody().locator('tbody [data-slot="results-class-row"]').count();
  expect(count, 'the fixture teacher owns classes').toBeGreaterThan(0);

  await toggle().getByRole('button', { name: cat(en, `${KIT}.tiles`) }).click();
  await expect(page).toHaveURL(/layout=tiles/);
  await expect(tilesBody()).toBeVisible();
  await expect(tableBody()).toHaveCount(0);

  await page.reload();
  await expect(surface()).toHaveAttribute('data-status', 'ready', { timeout: 60_000 });
  await expect(page).toHaveURL(/layout=tiles/);
  await expect(tilesBody().locator('[data-slot="results-class-row"]')).toHaveCount(count);
  await page.screenshot({ path: path.join(SCREENSHOTS, '06-tiles-after-reload.png') });

  await toggle().getByRole('button', { name: cat(en, `${KIT}.list`) }).click();
  await expect(tableBody()).toBeVisible();
  await expect(page).not.toHaveURL(/layout=/);
});

test('Most students first reorders the rows and survives a reload', async () => {
  const { classes } = await readDashboard();
  expect(classes.length, 'a sort needs two classes to reorder').toBeGreaterThan(1);
  const expected = [...classes]
    .sort((a, b) => b.student_count - a.student_count || a.name.localeCompare(b.name))
    .map((klass) => klass.class_document_id);
  const sort = page.getByRole('combobox', { name: cat(en, `${C}.sortLabel`) });

  await openClasses();
  await sort.selectOption('students');
  await expect(page).toHaveURL(/sort=students/);
  await expect.poll(rowIds).toEqual(expected);

  await page.reload();
  await expect(surface()).toHaveAttribute('data-status', 'ready', { timeout: 60_000 });
  await expect(sort).toHaveValue('students');
  await expect.poll(rowIds).toEqual(expected);
  await openClasses();
});

test('a sitting this file opens enters the live strip and lights the rail dot; closing takes it out', async () => {
  const { classes } = await readDashboard();
  const [form] = await readTests(request, jwt);
  const [klass] = classes;
  if (klass === undefined || form === undefined) throw new Error('the fixture teacher has no class or no test');

  started = await createSession(request, jwt, klass.class_document_id, form.form_document_id);
  const wire = (await readDashboard()).live_sessions.find((entry) => entry.sitting_document_id === started);
  expect(wire, 'C-TD-1 lists the new sitting as live').toBeDefined();

  await openClasses();
  const strip = page.locator('[data-slot="live-strip"]');
  const card = strip.locator(`[data-slot="live-strip-card"][data-sitting-id="${started}"]`);
  await expect(card).toHaveCount(1);
  await expect(card).toContainText(klass.name);
  if (wire?.code) await expect(card).toContainText(wire.code);
  await expect(card).toHaveAttribute(
    'href',
    new RegExp(`/dashboard/results/${klass.class_document_id}\\?tab=live&session=${started}$`),
  );
  const cards = await strip.locator('[data-slot="live-strip-card"]').count();
  await expect(strip.locator('[data-slot="live-strip-label"]')).toHaveText(tClasses('liveStrip', { count: cards }));
  await expect(page.locator('[data-slot="rail-live-dot"]')).toBeVisible();
  await page.screenshot({ path: path.join(SCREENSHOTS, '06-live-strip.png') });

  await closeSession(request, jwt, started);
  const closed = started;
  started = null;
  const remaining = (await readDashboard()).live_sessions;

  await openClasses();
  await expect(page.locator(`[data-slot="live-strip-card"][data-sitting-id="${closed}"]`)).toHaveCount(0);
  if (remaining.length === 0) {
    await expect(page.locator('[data-slot="live-strip"]')).toHaveCount(0);
    await expect(page.locator('[data-slot="rail-live-dot"]')).toHaveCount(0);
  } else {
    await expect(page.locator('[data-slot="live-strip"]')).toBeVisible();
    await expect(page.locator('[data-slot="rail-live-dot"]')).toBeVisible();
  }
});
