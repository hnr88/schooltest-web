import type { Page, Route } from '@playwright/test';

// Harness for the teacher /dashboard spec (task 032, contract C-TD-1). Nothing
// here fixtures the dashboard: the payload is whatever the REAL
// GET /api/teacher/dashboard answered, captured off the wire.

export interface WireCompletion {
  completed: number;
  total: number;
}

export interface WireClass {
  class_document_id: string;
  name: string;
  student_count: number;
  test_a: WireCompletion;
  test_b: WireCompletion;
  top_gap: { attribute: string; name: string; not_yet_count: number } | null;
}

export interface WireBody {
  classes: WireClass[];
}

/** Renders one branch of an ICU plural from the REAL catalog string. */
export function plural(template: string, count: number): string {
  const form = count === 1 ? 'one' : 'other';
  const branch = new RegExp(`${form}\\s*\\{([^}]*)\\}`).exec(template);
  if (!branch) throw new Error(`no ${form} branch in ${template}`);
  return branch[1].replaceAll('#', String(count));
}

/**
 * Classifies the painted persona once per animation frame, installed BEFORE the
 * first app script so a single wrong-persona frame cannot hide between
 * assertions. Since task 10 (R-16) `/dashboard` redirects a teacher to
 * `/dashboard/results`, so the teacher arm reads the results surface; the
 * losing persona must never paint — it would also issue its own reads.
 */
export async function installPersonaSampler(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const frames: string[] = [];
    (window as unknown as { __personaFrames: string[] }).__personaFrames = frames;
    const classify = (): string => {
      const content = document.querySelector('[data-slot="dashboard-content"]');
      if (!content) return '';
      const teacher = content.querySelector('[data-surface="teacher-results"]');
      if (teacher) return `teacher:${teacher.getAttribute('data-status')}`;
      if (content.querySelector('[data-surface="parent-overview"]')) return 'PARENT:overview';
      // Since task 10 (R-16) the role gate holds EVERY sectioned role on
      // DashboardSkeleton (shimmer-sweep) while /api/users/me resolves, so a
      // shimmer frame is the role-gate hold, not a parent persona painting —
      // the parent leak guard is the parent-overview surface check above.
      if (content.querySelector('.shimmer-sweep')) return 'PENDING:role-gate';
      const main = content.querySelector('main');
      if (main) return `UNKNOWN-MAIN:${(main.textContent ?? '').trim().slice(0, 40)}`;
      return '';
    };
    const tick = () => {
      const frame = classify();
      if (frame && frames[frames.length - 1] !== frame) frames.push(frame);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

export async function personaFrames(page: Page): Promise<string[]> {
  return page.evaluate(
    () => (window as unknown as { __personaFrames?: string[] }).__personaFrames ?? [],
  );
}

export interface OverflowProbe {
  doc: number;
  cards: number[];
  columns: number;
}

/**
 * Horizontal overflow of the page and of every card, plus how many columns the
 * grid actually resolved to. Zero means nothing scrolls sideways and no card's
 * content escapes its own box.
 */
export async function measureOverflow(page: Page): Promise<OverflowProbe> {
  return page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('[data-class-id]'));
    return {
      doc: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      cards: cards.map((el) => el.scrollWidth - el.clientWidth),
      columns: new Set(cards.map((el) => Math.round(el.getBoundingClientRect().left))).size,
    };
  });
}

/**
 * Perturbs STRAPI'S OWN response in flight — not a fixture and not a stub: the
 * real request goes out, the real body comes back, and only the named fields
 * change on the way through. A card rendering literals cannot follow this.
 */
export async function withWire(page: Page, mutate: (body: WireBody) => void): Promise<void> {
  await page.route('**/api/teacher/dashboard', async (route: Route) => {
    const response = await route.fetch();
    const body = (await response.json()) as WireBody;
    mutate(body);
    await route.fulfill({ response, json: body });
  });
  await page.reload();
}
