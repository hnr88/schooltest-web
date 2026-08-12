import { expect, type APIRequestContext, type Page } from '@playwright/test';

import { teacherDashboardResponseSchema } from '@/modules/teacher/schemas/teacher.schema';
import type {
  DashboardClass,
  DashboardLiveSession,
  TeacherDashboardResponse,
} from '@/modules/teacher/types/teacher.types';

import { cat, icu, type Messages } from './i18n';
import { API_BASE } from './teacher-auth-rail';
import { plural } from './teacher-dashboard-live';
import { navLink } from './teacher-rail';

// Harness for brief flows 3 and 4 (task 051). Every expectation is built from a
// SECOND, independent read of the real C-TD-1 endpoint made by Node — not from
// the response the browser itself consumed — so a card that echoed its own
// request, cached a stale payload or rendered a literal cannot pass. Nothing
// here fixtures, intercepts or perturbs a response.

export const TD = 'Teacher.dashboard';
export const DASHBOARD_SURFACE = '[data-surface="teacher-dashboard"]';
const BANNER = '[data-slot="teacher-live-session-banner"]';

/** Walks the rail back to /dashboard and waits for the live read to land. */
export async function openDashboard(page: Page, messages: Messages): Promise<void> {
  await navLink(page, cat(messages, 'Shell.nav.teacherDashboard')).click();
  await page.waitForURL('**/dashboard');
  await expect(page.locator(DASHBOARD_SURFACE)).toHaveAttribute('data-status', 'ready', {
    timeout: 60_000,
  });
}

/** C-TD-1, read Node-side and strict-parsed through the SHIPPED Zod mirror. */
export async function readDashboard(
  request: APIRequestContext,
  jwt: string,
): Promise<TeacherDashboardResponse> {
  const response = await request.get(`${API_BASE}/api/teacher/dashboard`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  expect(response.status(), 'GET /api/teacher/dashboard').toBe(200);
  return teacherDashboardResponseSchema.parse(await response.json());
}

export interface CardText {
  name: string;
  roster: string;
  testA: string;
  testB: string;
  topGapAttribute: string;
  gapTile: string[];
}

async function completionValue(page: Page, classId: string, label: string): Promise<string> {
  // The <dd> PAIRED with this <dt>, so Test B can never pass on Test A's row.
  return page
    .locator(`[data-class-id="${classId}"] dt`, { hasText: label })
    .locator('xpath=following-sibling::dd[1]')
    .innerText();
}

/** One rendered class card, read out of the DOM as plain text. */
export async function readCard(
  page: Page,
  messages: Messages,
  classId: string,
): Promise<CardText> {
  const card = page.locator(`[data-slot="teacher-class-card"][data-class-id="${classId}"]`);
  await expect(card).toHaveCount(1);
  return {
    name: await card.getByRole('heading', { level: 2 }).innerText(),
    roster: await card.locator('header p').innerText(),
    testA: await completionValue(page, classId, cat(messages, `${TD}.testA`)),
    testB: await completionValue(page, classId, cat(messages, `${TD}.testB`)),
    topGapAttribute: (await card.getAttribute('data-top-gap')) ?? '',
    // textContent, not innerText: these spans are `uppercase` in CSS only and the
    // catalog string is the truth being compared.
    gapTile: (await card.locator(':scope > div > *').allTextContents()).map((line) => line.trim()),
  };
}

function completionText(
  messages: Messages,
  completion: { completed: number; total: number },
): string {
  return icu(cat(messages, `${TD}.completionValue`), {
    completed: String(completion.completed),
    total: String(completion.total),
  });
}

/** What the card MUST print, derived only from the wire class and the catalog. */
export function expectedCard(messages: Messages, wire: DashboardClass): CardText {
  const gap = wire.top_gap;
  return {
    name: wire.name,
    roster: plural(cat(messages, `${TD}.students`), wire.student_count),
    testA: completionText(messages, wire.test_a),
    testB: completionText(messages, wire.test_b),
    topGapAttribute: gap === null ? 'none' : gap.attribute,
    gapTile:
      gap === null
        ? [cat(messages, `${TD}.topGap`), cat(messages, `${TD}.noGap`), cat(messages, `${TD}.noGapHint`)]
        : [
            cat(messages, `${TD}.topGap`),
            gap.name,
            plural(cat(messages, `${TD}.notYetCount`), gap.not_yet_count),
          ],
  };
}

export interface BannerView {
  sittingId: string;
  /** The state word beside the tint — never colour alone (WCAG 2.2 AA). */
  pill: string;
  title: string;
  detail: string;
  linkName: string;
  linkHref: string;
  /** The computed background, and its hue once really rasterised to sRGB. */
  background: string;
  hue: number;
  linkBox: { width: number; height: number };
}

/** The rendered banner, or `null` when the page carries none. */
export async function readBanner(page: Page): Promise<BannerView | null> {
  const banner = page.locator(BANNER);
  if ((await banner.count()) === 0) return null;
  const link = banner.getByRole('link');
  const box = await link.boundingBox();
  if (box === null) throw new Error('the banner link has no box');
  return {
    sittingId: (await banner.getAttribute('data-sitting-id')) ?? '',
    pill: (await banner.locator('[data-slot="status-pill"]').textContent()) ?? '',
    title: (await banner.locator('#teacher-live-session-title').textContent()) ?? '',
    detail: (await banner.locator('p:not([id])').textContent()) ?? '',
    linkName: await link.innerText(),
    linkHref: (await link.getAttribute('href')) ?? '',
    background: await banner.evaluate((node) => getComputedStyle(node).backgroundColor),
    // Chrome computes an OKLCH token to `oklab(...)`, so the channels are
    // rasterised through a canvas rather than parsed out of the string.
    hue: await banner.evaluate((node) => {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const context = canvas.getContext('2d');
      if (context === null) throw new Error('no 2d context to rasterise the tint');
      context.fillStyle = getComputedStyle(node).backgroundColor;
      context.fillRect(0, 0, 1, 1);
      const [r, g, b] = Array.from(context.getImageData(0, 0, 1, 1).data)
        .slice(0, 3)
        .map((channel) => channel / 255);
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      if (max === min) return -1;
      const d = max - min;
      const raw =
        max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
      return Math.round(raw * 60);
    }),
    linkBox: { width: box.width, height: box.height },
  };
}

/** The banner's detail line as the live session's own fields require it to read. */
export function expectedBannerDetail(messages: Messages, live: DashboardLiveSession): string {
  const key = 'Teacher.dashboard.liveBanner';
  const parts = [
    live.class_name,
    live.code === null
      ? cat(messages, `${key}.codeMissing`)
      : icu(cat(messages, `${key}.code`), { code: live.code }),
  ];
  if (live.opened_at !== null) {
    const time = new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(
      new Date(live.opened_at),
    );
    parts.push(icu(cat(messages, `${key}.opened`), { time }));
  }
  return parts.join(' · ');
}
