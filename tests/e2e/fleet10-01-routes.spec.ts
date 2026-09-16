/**
 * F10 SWEEP 1 — the route matrix.
 *
 * EVERY role (ops, school-admin, teacher, parent, signed-out) × EVERY route in
 * the app. The route universe is generated from src/app/[locale]/**\/page.tsx
 * at load time (fleet10-helpers.ts), never hand-listed. Idiots type URLs:
 *   · signed-out  → every dashboard route must land on sign-in or a clean
 *     refusal — never a half-rendered authed page;
 *   · wrong role  → clean redirect / mask / not-found — never a white screen,
 *     a stack trace or a rendered forbidden screen;
 *   · owning role → the route renders (screenshot) or, for a bogus
 *     documentId, a clean not-found.
 * Every page lands in tests/e2e/captures/fleet10/<audience>/<slug>.png and its
 * console errors feed the shared sweep store.
 */
import { writeFileSync } from 'node:fs';
import path from 'node:path';

import { expect, test } from '@playwright/test';

import {
  BOGUS_ID,
  F10_ROLES,
  F10_ROUTES,
  capturesDir,
  classify,
  dumpF10Console,
  fillRoute,
  firstHref,
  ownsRoute,
  readRealIds,
  settle,
  shot,
  signedInAs,
  waitOutGuard,
  watchF10,
  writeRealIds,
  type F10RealIds,
  type F10Role,
} from './fleet10-helpers';

test.describe('F10 route matrix', () => {
  const CATCHALL = '/f10-zz-no-such-page';

  /** The concrete URL a route token resolves to for this audience. */
  function urlFor(routePath: string, ids: F10RealIds): string {
    // REAL documentIds where the harvest found them, so owning roles prove a
    // real-data render; every other param gets the bogus id (direct-URL abuse
    // is also a subject under test).
    if (routePath === '/__f10_catchall__') return CATCHALL;
    if (routePath === '/dashboard/ops/schools/:documentId/classes/:classDocumentId' && ids.opsSchool && ids.opsSchoolClass) {
      return `/dashboard/ops/schools/${ids.opsSchool}/classes/${ids.opsSchoolClass}`;
    }
    if (routePath === '/dashboard/ops/schools/:documentId' && ids.opsSchool) {
      return `/dashboard/ops/schools/${ids.opsSchool}`;
    }
    if (routePath === '/dashboard/school/classes/:documentId/students/:studentDocumentId') {
      if (ids.saClass) return `/dashboard/school/classes/${ids.saClass}/students/${BOGUS_ID}`;
    }
    if (routePath === '/dashboard/school/classes/:documentId' && ids.saClass) {
      return `/dashboard/school/classes/${ids.saClass}`;
    }
    if (routePath === '/dashboard/school/teachers/:documentId' && ids.saTeacher) {
      return `/dashboard/school/teachers/${ids.saTeacher}`;
    }
    if (routePath === '/dashboard/results/:classDocumentId/students/:studentDocumentId' && ids.teacherClassResults) {
      return `/dashboard/results/${ids.teacherClassResults}/students/${BOGUS_ID}`;
    }
    if (routePath === '/dashboard/results/:classDocumentId' && ids.teacherClassResults) {
      return `/dashboard/results/${ids.teacherClassResults}`;
    }
    if (routePath === '/dashboard/teach/classes/:documentId/test-day' && ids.teacherClassTeach) {
      return `/dashboard/teach/classes/${ids.teacherClassTeach}/test-day`;
    }
    if (routePath === '/dashboard/teach/classes/:documentId' && ids.teacherClassTeach) {
      return `/dashboard/teach/classes/${ids.teacherClassTeach}`;
    }
    if (routePath === '/dashboard/teach/results/:classId' && ids.teacherClassResults) {
      return `/dashboard/teach/results/${ids.teacherClassResults}`;
    }
    if (routePath === '/dashboard/test-sessions/:sittingDocumentId' && ids.sitting) {
      return `/dashboard/test-sessions/${ids.sitting}`;
    }
    if (routePath === '/dashboard/teacher/results/:resultId/family') {
      return `/dashboard/teacher/results/${BOGUS_ID}/family`;
    }
    return fillRoute({ path: routePath, params: (routePath.match(/:[^/]+/g) ?? []).map((p) => p.slice(1)) });
  }

  function slugFor(url: string): string {
    return url.replace(/^\//, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'root';
  }

  interface MatrixRow {
    url: string;
    outcome: string;
    note: string;
  }

  /**
   * Walk one chunk of routes for one audience. Shared by every test below so
   * the classification rules live in exactly one place.
   */
  async function walk(
    page: import('@playwright/test').Page,
    audience: string,
    urls: string[],
    testInfo: import('@playwright/test').TestInfo,
  ): Promise<MatrixRow[]> {
    const rows: MatrixRow[] = [];
    for (const target of urls) {
      const label = `${audience}/${slugFor(target)}`;
      try {
        await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 45_000 });
        await settle(page);
        // A still-pending role guard under the dev compile is not the final
        // answer — give the URL time to move before judging the page.
        if (target.startsWith('/dashboard') || target.startsWith('/onboarding')) {
          await waitOutGuard(page, target);
          await settle(page, 12_000);
        }
        const outcome = await classify(page, target.split('?')[0]);
        await shot(page, label);
        rows.push({ url: target, outcome, note: page.url() });
      } catch (error) {
        await shot(page, `${label}-THREW`).catch(() => {});
        rows.push({ url: target, outcome: 'threw', note: String(error).slice(0, 300) });
      }
    }
    const file = path.join(capturesDir(), `matrix-${audience}-${testInfo.title.replace(/\W+/g, '-').slice(0, 30)}.jsonl`);
    try {
      writeFileSync(file, `${rows.map((r) => JSON.stringify(r)).join('\n')}\n`);
    } catch {
      // The captures tree must never fail the sweep (another agent's disk
      // churn is not an app defect).
    }
    console.log(`[f10 matrix ${audience}] ${rows.map((r) => `${r.url} -> ${r.outcome}`).join(' | ')}`);
    return rows;
  }

  function chunk<T>(items: T[], size: number): T[][] {
    const out: T[][] = [];
    for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
    return out;
  }

  const CHUNK = 9;
  // Chunk the STATIC route paths at load time; concrete URLs (with freshly
  // harvested real ids) are built inside each test — the harvest test runs
  // first in this file, and --workers=1 keeps that order true.
  const pathChunks = chunk(F10_ROUTES.map((r) => r.path), CHUNK);

  // -----------------------------------------------------------------------
  // Harvest — resolve REAL documentIds once so owning roles can be proved
  // against real data, not just bogus ids.
  // -----------------------------------------------------------------------
  test('harvest real documentIds', async ({ browser }, testInfo) => {
    test.setTimeout(240_000);
    const ids: F10RealIds = {};
    const tryLink = async (role: F10Role, listUrl: string, needle: string): Promise<string | undefined> => {
      const { context, page } = await signedInAs(browser, role, testInfo);
      watchF10(page, `harvest:${listUrl}`);
      try {
        await page.goto(listUrl, { waitUntil: 'domcontentloaded', timeout: 45_000 });
        await settle(page);
        return await firstHref(page, needle);
      } finally {
        await context.close();
      }
    };

    ids.opsSchool = (
      await tryLink('ops', '/dashboard/ops/schools', '/dashboard/ops/schools/')
    )?.replace(/^.*\/dashboard\/ops\/schools\//, '').split(/[/?]/)[0];
    if (ids.opsSchool) {
      ids.opsSchoolClass = (
        await tryLink('ops', `/dashboard/ops/schools/${ids.opsSchool}`, '/classes/')
      )?.replace(/^.*\/classes\//, '').split(/[/?]/)[0];
    }
    ids.saClass = (
      await tryLink('schoolAdmin', '/dashboard/school/classes', '/dashboard/school/classes/')
    )?.replace(/^.*\/dashboard\/school\/classes\//, '').split(/[/?]/)[0];
    ids.saTeacher = (
      await tryLink('schoolAdmin', '/dashboard/school/teachers', '/dashboard/school/teachers/')
    )?.replace(/^.*\/dashboard\/school\/teachers\//, '').split(/[/?]/)[0];
    ids.teacherClassResults = (
      await tryLink('teacher', '/dashboard/results', '/dashboard/results/')
    )?.replace(/^.*\/dashboard\/results\//, '').split(/[/?]/)[0];
    ids.teacherClassTeach = (
      await tryLink('teacher', '/dashboard/teach/classes', '/dashboard/teach/classes/')
    )?.replace(/^.*\/dashboard\/teach\/classes\//, '').split(/[/?]/)[0];
    ids.sitting = (
      await tryLink('teacher', '/dashboard/test-sessions', '/dashboard/test-sessions/')
    )?.replace(/^.*\/dashboard\/test-sessions\//, '').split(/[/?]/)[0];

    writeRealIds(ids);
    console.log(`[f10 harvest] ${JSON.stringify(ids)}`);
    dumpF10Console(testInfo);
  });

  // -----------------------------------------------------------------------
  // Signed-out — nothing authed may render
  // -----------------------------------------------------------------------
  pathChunks.forEach((paths, index) => {
    test(`signed-out routes ${index + 1}/${pathChunks.length}`, async ({ browser }, testInfo) => {
      test.setTimeout(300_000);
      const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
      const page = await context.newPage();
      page.setDefaultTimeout(30_000);
      watchF10(page, `signed-out#${index}`);
      const urls = paths.map((p) => urlFor(p, readRealIds()));
      const rows = await walk(page, "signed-out", urls, testInfo);

      const badRender = rows.filter(
        (r) => r.outcome === 'rendered' && /^\/(dashboard|onboarding)/.test(r.url),
      );
      for (const row of badRender) {
        console.log(`[F10-FINDING] signed-out saw authed content at ${row.url} (landed ${row.note})`);
      }
      const broken = rows.filter((r) => r.outcome === 'white' || r.outcome === 'crash' || r.outcome === 'threw');
      expect(broken, `broken pages: ${JSON.stringify(broken)}`).toEqual([]);
      expect(badRender, 'signed-out rendered an authed route').toEqual([]);
      await context.close();
      dumpF10Console(testInfo);
    });
  });

  // -----------------------------------------------------------------------
  // Each authed role × every route
  // -----------------------------------------------------------------------
  for (const role of F10_ROLES) {
    pathChunks.forEach((paths, index) => {
      test(`${role} routes ${index + 1}/${pathChunks.length}`, async ({ browser }, testInfo) => {
        test.setTimeout(300_000);
        const { context, page } = await signedInAs(browser, role, testInfo);
        page.setDefaultTimeout(30_000);
        watchF10(page, `${role}#${index}`);
        const urls = paths.map((p) => urlFor(p, readRealIds()));
        const rows = await walk(page, role, urls, testInfo);

        const broken = rows.filter((r) => r.outcome === 'white' || r.outcome === 'crash' || r.outcome === 'threw');
        // Owning routes must RENDER (or, for a bogus id, not-found) — never
        // bounce to sign-in. Forbidden routes must never RENDER.
        const ownBounced = rows.filter(
          (r) =>
            ownsRoute(role, r.url) &&
            !r.url.includes(BOGUS_ID) &&
            r.url !== '/dashboard' &&
            (r.outcome === 'signin' || r.outcome === 'redirect-role'),
        );
        const forbiddenRendered = rows.filter(
          (r) => !ownsRoute(role, r.url) && r.outcome === 'rendered' && /^\/dashboard/.test(r.url),
        );
        // The one sanctioned exception: /dashboard itself redirects sectioned
        // roles to their own root (ROLE_DESTINATIONS) — recorded, not a fault.
        for (const finding of [...ownBounced]) {
          console.log(`[F10-FINDING] ${role} was BOUNCED off its own route ${finding.url} (landed ${finding.note})`);
        }
        for (const finding of forbiddenRendered) {
          console.log(`[F10-FINDING] ${role} RENDERED a forbidden route ${finding.url}`);
        }
        expect(broken, `broken pages for ${role}: ${JSON.stringify(broken)}`).toEqual([]);
        expect(ownBounced, `${role} bounced off its own routes`).toEqual([]);
        expect(forbiddenRendered, `${role} rendered forbidden routes`).toEqual([]);
        await context.close();
        dumpF10Console(testInfo);
      });
    });
  }

  // -----------------------------------------------------------------------
  // Bogus-id direct-URL abuse — every :param route with zzzz ids, per owner
  // -----------------------------------------------------------------------
  const paramRoutes = F10_ROUTES.filter((r) => r.params.length > 0 || r.path === '/__f10_catchall__');
  test('bogus documentIds refuse cleanly for every owner', async ({ browser }, testInfo) => {
    test.setTimeout(300_000);
    const targets = paramRoutes.map((r) => fillRoute(r));
    for (const role of F10_ROLES) {
      const relevant = targets.filter((t) => ownsRoute(role, t) || role === 'parent');
      if (relevant.length === 0) continue;
      const { context, page } = await signedInAs(browser, role, testInfo);
      page.setDefaultTimeout(30_000);
      watchF10(page, `bogus:${role}`);
      try {
        for (const target of relevant) {
          await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 45_000 });
          await settle(page);
          const outcome = await classify(page, target);
          await shot(page, `bogus/${role}-${slugFor(target)}`);
          const clean =
            outcome === 'notfound' || outcome === 'redirect-role' || outcome === 'unavailable' || outcome === 'signin';
          console.log(`[f10 bogus] ${role} ${target} -> ${outcome}`);
          if (!clean) {
            console.log(`[F10-FINDING] bogus id at ${target} for ${role} landed ${outcome} — not a clean refusal`);
          }
          expect(clean, `${role} + bogus ${target} -> ${outcome}`).toBe(true);
        }
      } finally {
        await context.close();
      }
    }
    dumpF10Console(testInfo);
  });
});
