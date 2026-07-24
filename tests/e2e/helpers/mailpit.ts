/**
 * Mailpit probe helpers (task 020) — real inbox assertions over the Mailpit
 * HTTP API (dev SMTP sink 127.0.0.1:1125, HTTP 127.0.0.1:8125; the
 * neighbouring Mailhog on 1025/8025 is OFF-LIMITS). Mirrors the api-side
 * task-008 helper so web + api suites assert the same email contract.
 * Search: GET /api/v1/search?query=to:<email> → summaries (newest first);
 * body:  GET /api/v1/message/<ID> → { Subject, From: {Name, Address}, HTML }.
 */
import { expect, type APIRequestContext } from '@playwright/test';

export const MAILPIT_API =
  process.env.MAILPIT_API_URL ?? 'http://127.0.0.1:8130/api/v1';
export const API_BASE_URL =
  process.env.API_BASE_URL ?? 'http://localhost:5510';

/** C-EMAIL-TEMPLATES link regexes (zero latitude — quoted from the contract). */
export const RESET_LINK_RE = /reset-password\?code=([0-9a-f]{128})/;
export const CONFIRMATION_LINK_RE = /email-confirmation\?confirmation=([0-9a-f]{40})/;

/** C-EMAIL-TEMPLATES header + copy constants (asserted exact). */
export const RESET_SUBJECT = 'Reset your SchoolTest password';
export const CONFIRMATION_SUBJECT = 'Confirm your SchoolTest email';
export const EMAIL_FROM = { name: 'SchoolTest', address: 'no-reply@schooltest.local' } as const;
export const RESET_EXPIRY_SENTENCE =
  'This link expires in 30 minutes. If you did not request a password reset, you can safely ignore this email.';

export interface MailpitAddress {
  Name: string;
  Address: string;
}

/** Search-result summary row (subset of Mailpit's fields the suite asserts on). */
export interface MailpitSummary {
  ID: string;
  From: MailpitAddress;
  To: MailpitAddress[];
  Subject: string;
  Created: string;
}

/** Full message body (subset — `Text` is the raw HTML too, stock u-p behavior). */
export interface MailpitMessage {
  ID: string;
  Subject: string;
  From: MailpitAddress;
  HTML: string;
  Text: string;
}

/** Raw Mailpit search — summaries newest-first (absolute URL bypasses baseURL). */
export async function searchMessages(
  request: APIRequestContext,
  query: string,
  limit = 100,
): Promise<MailpitSummary[]> {
  const res = await request.get(
    `${MAILPIT_API}/search?query=${encodeURIComponent(query)}&limit=${limit}`,
  );
  if (!res.ok()) {
    throw new Error(`[e2e] mailpit search "${query}" failed: ${res.status()} ${await res.text()}`);
  }
  const body = (await res.json()) as { messages?: MailpitSummary[] };
  return body.messages ?? [];
}

/** Fetch one full message by summary ID. */
export async function getMessage(request: APIRequestContext, id: string): Promise<MailpitMessage> {
  const res = await request.get(`${MAILPIT_API}/message/${id}`);
  if (!res.ok()) {
    throw new Error(`[e2e] mailpit message ${id} failed: ${res.status()} ${await res.text()}`);
  }
  return (await res.json()) as MailpitMessage;
}

/** Poll (40×500ms) until ≥`count` messages exist for `email`; newest first. */
export async function waitForMessages(
  request: APIRequestContext,
  email: string,
  count = 1,
): Promise<MailpitSummary[]> {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const found = await searchMessages(request, `to:${email}`);
    if (found.length >= count) return found;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`[e2e] mailpit never delivered ${count} message(s) to ${email}`);
}

/** Wait until ≥`count` messages exist for `email` and return the NEWEST body. */
export async function latestMessage(
  request: APIRequestContext,
  email: string,
  count = 1,
): Promise<MailpitMessage> {
  const summaries = await waitForMessages(request, email, count);
  return getMessage(request, summaries[0].ID);
}

/** Extract a link token (reset code / confirmation token) from the email HTML. */
export function extractToken(html: string, re: RegExp, label: string): string {
  const match = html.match(re);
  if (!match) {
    throw new Error(`[e2e] no ${label} link in email HTML (first 500 chars): ${html.slice(0, 500)}`);
  }
  return match[1];
}

/** C-EMAIL-TEMPLATES header assert: exact Subject + styled From (D-AUTH-4). */
export function expectStyledEmail(message: MailpitMessage, subject: string): void {
  expect(message.Subject, 'styled email subject').toBe(subject);
  expect(message.From.Name, 'styled email from-name').toBe(EMAIL_FROM.name);
  expect(message.From.Address, 'styled email from-address').toBe(EMAIL_FROM.address);
}

/**
 * Newest confirmation email for `email` (asserted styled, C-EMAIL-TEMPLATES)
 * → the full api redemption URL. `count` = messages the mailbox must hold
 * first (resend flows wait for their regenerated token that way).
 */
export async function fetchConfirmationLink(
  request: APIRequestContext,
  email: string,
  count = 1,
): Promise<string> {
  const message = await latestMessage(request, email, count);
  expectStyledEmail(message, CONFIRMATION_SUBJECT);
  const token = extractToken(message.HTML, CONFIRMATION_LINK_RE, 'confirmation');
  return `${API_BASE_URL}/api/auth/email-confirmation?confirmation=${token}`;
}

/**
 * C-EMAIL-TEMPLATES zero-assert support: stock strapi.io emails delivered AT
 * or AFTER `since`. Pre-mission mailbox history contains stock messages from
 * before the styled templates landed, so the suite scopes the
 * "no-reply@strapi.io appears in ZERO messages" contract to its own run
 * window (same discipline as the api-side task-008 helper).
 */
export async function stockStrapiMessagesSince(
  request: APIRequestContext,
  since: Date,
): Promise<MailpitSummary[]> {
  const hits = await searchMessages(request, 'from:no-reply@strapi.io', 200);
  return hits.filter((message) => Date.parse(message.Created) >= since.getTime());
}
