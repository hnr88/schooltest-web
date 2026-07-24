import { spawn } from 'node:child_process';
import { readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// There is deliberately NO HTTP route that creates notifications (the surface is
// read/mark only — src/api/notification/routes/01-custom-notification.ts), so the
// only REAL creation path is the internal dispatch fan-out. This helper drives it
// through `strapi console` against the LIVE api database: same dispatch service,
// same preference gating, same content-types — zero mocks. The console boot skips
// the HTTP rate limiter entirely, so seeded suites never eat the 120 req/min window.

const API_DIR = process.env.API_REPO_DIR ?? path.resolve(process.cwd(), '..', 'schooltest-api');
const CONSOLE_TIMEOUT_MS = 170_000;

/** The dispatch event used to seed each of the five categories (D-G-3: coverage, no new event types). */
export const CATEGORY_EVENTS = [
  { eventType: 'student_created', category: 'children' },
  { eventType: 'session_completed', category: 'testActivity' },
  { eventType: 'test_results_ready', category: 'testResults' },
  { eventType: 'account_email_confirmed', category: 'account' },
  { eventType: 'security_password_changed', category: 'security' },
] as const;

export type CategoryEvent = (typeof CATEGORY_EVENTS)[number];

export interface DispatchedNotification {
  documentId: string;
  category: string;
  title: string;
}

interface ConsoleOutcome<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

/**
 * Runs a script in a booted `strapi console` (PORT remapped so it never collides
 * with the live api). The script MUST end in process.exit — stdin stays open so
 * the REPL cannot end the process before the async work settles (the
 * `(cat script; sleep N) | strapi console` recipe, without the sleep).
 */
async function runStrapiConsole(script: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn('pnpm', ['strapi', 'console'], {
      cwd: API_DIR,
      env: { ...process.env, PORT: '5599' },
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error(`strapi console timed out. stderr tail: ${stderr.slice(-600)}`));
    }, CONSOLE_TIMEOUT_MS);
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`strapi console exited ${code}. stderr tail: ${stderr.slice(-600)}`));
      }
    });
    child.stdin.write(script);
  });
}

/**
 * Runs `body` in the console and returns its result. The REPL echoes piped input
 * and prints its prompt without a trailing newline, so stdout markers are racy —
 * the result crosses the process boundary as a JSON temp file instead.
 */
async function runConsoleJob<T>(body: string): Promise<T> {
  const outFile = path.join(
    os.tmpdir(),
    `strapi-console-${Date.now()}-${Math.random().toString(36).slice(2)}.json`,
  );
  rmSync(outFile, { force: true });
  const script = `(async () => {
  let outcome;
  try {
    const data = await (async () => { ${body} })();
    outcome = { ok: true, data };
  } catch (error) {
    outcome = { ok: false, error: error && error.message ? error.message : String(error) };
  }
  require('node:fs').writeFileSync(${JSON.stringify(outFile)}, JSON.stringify(outcome));
  process.exit(0);
})();\n`;
  await runStrapiConsole(script);
  const outcome = JSON.parse(readFileSync(outFile, 'utf8')) as ConsoleOutcome<T>;
  rmSync(outFile, { force: true });
  if (!outcome.ok) throw new Error(`strapi console job failed: ${outcome.error ?? 'unknown'}`);
  return outcome.data as T;
}

/**
 * Dispatches one tagged notification per event through the REAL dispatch service
 * (recipient: the seeded parent, resolved by email inside the console). Every
 * title starts with `tag` so cleanup deletes exactly these rows.
 */
export async function dispatchNotifications(
  tag: string,
  events: readonly CategoryEvent[],
): Promise<DispatchedNotification[]> {
  return runConsoleJob<DispatchedNotification[]>(`
    const users = await strapi.documents('plugin::users-permissions.user').findMany({
      filters: { email: { $eq: 'parent@schooltest.local' } },
      fields: ['email'],
    });
    const user = users[0];
    if (!user) throw new Error('seeded parent not found');
    const service = strapi.service('api::notification.notification');
    const events = ${JSON.stringify(events)};
    const seeded = [];
    for (const event of events) {
      const title = ${JSON.stringify(tag)} + ' ' + event.category;
      const documentId = await service.dispatch(user.documentId, event.eventType, {
        title,
        body: ${JSON.stringify(tag)} + ' body for ' + event.category,
        linkUrl: '/dashboard',
      });
      if (!documentId) throw new Error('dispatch no-op for ' + event.eventType);
      seeded.push({ documentId, category: event.category, title });
    }
    return seeded;
  `);
}

/** Deletes every notification whose title starts with `tag` (real deleteMany). */
export async function cleanupSeededNotifications(tag: string): Promise<number> {
  const result = await runConsoleJob<{ count: number }>(`
    const deleted = await strapi.db
      .query('api::notification.notification')
      .deleteMany({ where: { title: { $startsWith: ${JSON.stringify(tag)} } } });
    return { count: deleted.count };
  `);
  return result.count;
}
