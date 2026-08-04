/**
 * Postgres and Mailpit probes for the ops school onboarding e2e
 * (mission st-ops-onboarding). Split out of `ops-onboarding.ts` to keep both
 * files under the 200-line cap.
 */
import { runSql } from './auth-db';

// This instance's Mailpit (the neighbouring Mailhog on 8025 is off-limits).
const MAILPIT_API = process.env.MAILPIT_API_URL ?? 'http://127.0.0.1:8125/api/v1';

/** Escape a SQL literal (test-owned documentIds only). */
function lit(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

/** The school's two lifecycle columns, straight out of Postgres. */
export function schoolStatuses(documentId: string): { account: string; onboarding: string } {
  const [account, onboarding] = runSql(
    `select account_status || '|' || onboarding_status from schools where document_id = ${lit(documentId)}`,
  )
    .trim()
    .split('|');
  return { account, onboarding };
}

/** The stored contact triple, straight out of Postgres. */
export function schoolContact(documentId: string): string {
  return runSql(
    `select coalesce(contact_first_name,'-') || '|' || coalesce(contact_last_name,'-') || '|' || coalesce(contact_email,'-') from schools where document_id = ${lit(documentId)}`,
  ).trim();
}

/** Every onboarding-link status of the school, oldest first. */
export function linkStatuses(documentId: string): string[] {
  const raw = runSql(
    `select so.status from school_onboardings so
       join school_onboardings_school_lnk l on l.school_onboarding_id = so.id
       join schools s on s.id = l.school_id
      where s.document_id = ${lit(documentId)}
      order by so.id asc`,
  ).trim();
  return raw === '' ? [] : raw.split('\n').map((line) => line.trim());
}

export function activeLinkCount(documentId: string): number {
  return linkStatuses(documentId).filter((status) => status === 'active').length;
}

interface MailpitSummary {
  ID: string;
  Subject: string;
  Created: string;
}

/** Newest-first Mailpit summaries for a recipient. */
export async function messagesTo(email: string): Promise<MailpitSummary[]> {
  const res = await fetch(`${MAILPIT_API}/search?query=${encodeURIComponent(`to:${email}`)}&limit=50`);
  if (!res.ok) throw new Error(`[e2e] mailpit search failed: ${res.status}`);
  return ((await res.json()) as { messages?: MailpitSummary[] }).messages ?? [];
}

/** Poll Mailpit until `count` messages have arrived, then return the newest magic link URL. */
export async function magicLinkFromEmail(email: string, count = 1): Promise<string> {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const found = await messagesTo(email);
    if (found.length >= count) {
      const res = await fetch(`${MAILPIT_API}/message/${found[0].ID}`);
      const body = (await res.json()) as { Text: string };
      const match = body.Text.match(/https?:\/\/\S+\/school-onboarding\/[0-9a-f]{64}/);
      if (match) return match[0];
      throw new Error(`[e2e] no magic link in the email to ${email}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`[e2e] mailpit never delivered ${count} message(s) to ${email}`);
}
