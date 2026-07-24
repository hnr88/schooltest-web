/**
 * Stack-specific helpers for the independent st-portal verification.
 * The current sandbox runs web :3110, api :5510, mailpit UI :8130 (per .qa/STACK.json).
 * These helpers mirror the shape of tests/e2e/helpers/mailpit.ts and
 * throwaway-parent.ts so the verifier spec can stay self-contained without
 * mutating the existing mission-2 helpers.
 */
import { expect, type APIRequestContext } from '@playwright/test';

import { userRoleType } from './auth-db';

export const STACK_API_BASE_URL = 'http://localhost:5510';
export const STACK_MAILPIT_API = 'http://127.0.0.1:8130/api/v1';
export const STACK_E2E_PASSWORD = 'E2eParent1234!';

export const RESET_LINK_RE = /reset-password\?code=([0-9a-f]{128})/;
export const CONFIRMATION_LINK_RE = /email-confirmation\?confirmation=([0-9a-f]{40})/;
export const RESET_SUBJECT = 'Reset your SchoolTest password';
export const CONFIRMATION_SUBJECT = 'Confirm your SchoolTest email';

export interface MailpitAddress {
  Name: string;
  Address: string;
}

export interface MailpitSummary {
  ID: string;
  From: MailpitAddress;
  To: MailpitAddress[];
  Subject: string;
  Created: string;
}

export interface MailpitMessage {
  ID: string;
  Subject: string;
  From: MailpitAddress;
  HTML: string;
  Text: string;
}

export interface ThrowawayParent {
  email: string;
  username: string;
  password: string;
}

export function freshEmail(flow: string): string {
  const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  return `e2e-${flow}-${suffix}@schooltest.test`;
}

export async function searchMessages(
  request: APIRequestContext,
  query: string,
  limit = 100,
): Promise<MailpitSummary[]> {
  const res = await request.get(
    `${STACK_MAILPIT_API}/search?query=${encodeURIComponent(query)}&limit=${limit}`,
  );
  if (!res.ok()) {
    throw new Error(`[verify] mailpit search "${query}" failed: ${res.status()} ${await res.text()}`);
  }
  const body = (await res.json()) as { messages?: MailpitSummary[] };
  return body.messages ?? [];
}

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
  throw new Error(`[verify] mailpit never delivered ${count} message(s) to ${email}`);
}

export async function latestMessage(
  request: APIRequestContext,
  email: string,
  count = 1,
): Promise<MailpitMessage> {
  const summaries = await waitForMessages(request, email, count);
  const res = await request.get(`${STACK_MAILPIT_API}/message/${summaries[0].ID}`);
  if (!res.ok()) {
    throw new Error(`[verify] mailpit message ${summaries[0].ID} failed: ${res.status()}`);
  }
  return (await res.json()) as MailpitMessage;
}

export function extractToken(html: string, re: RegExp, label: string): string {
  const match = html.match(re);
  if (!match) {
    throw new Error(`[verify] no ${label} link in email HTML (first 500 chars): ${html.slice(0, 500)}`);
  }
  return match[1];
}

export async function registerParent(
  request: APIRequestContext,
  flow: string,
  password = STACK_E2E_PASSWORD,
): Promise<ThrowawayParent> {
  const email = freshEmail(flow);
  const suffix = email.match(/-([a-z0-9]+)@/)?.[1] ?? '';
  const username = `e2e${suffix}${flow.replace(/[^a-z0-9]/g, '')}`.slice(0, 20);
  const res = await request.post(`${STACK_API_BASE_URL}/api/auth/local/register`, {
    data: { username, email, password },
  });
  if (res.status() !== 200) {
    throw new Error(`[verify] register ${email} failed: ${res.status()} ${await res.text()}`);
  }
  const body = (await res.json()) as { jwt?: string; user?: { confirmed?: boolean } };
  if ('jwt' in body || body.user?.confirmed !== false) {
    throw new Error(`[verify] register ${email}: expected {user} with confirmed=false and NO jwt`);
  }
  return { email, username, password };
}

export async function fetchConfirmationLink(
  request: APIRequestContext,
  email: string,
  count = 1,
): Promise<string> {
  const message = await latestMessage(request, email, count);
  expect(message.Subject, 'confirmation email subject').toBe(CONFIRMATION_SUBJECT);
  const token = extractToken(message.HTML, CONFIRMATION_LINK_RE, 'confirmation');
  return `${STACK_API_BASE_URL}/api/auth/email-confirmation?confirmation=${token}`;
}

export async function registerAndConfirmParent(
  request: APIRequestContext,
  flow: string,
  password = STACK_E2E_PASSWORD,
): Promise<ThrowawayParent> {
  const account = await registerParent(request, flow, password);
  const link = await fetchConfirmationLink(request, account.email);
  const res = await request.get(link, { maxRedirects: 0 });
  if (res.status() !== 302) {
    throw new Error(`[verify] confirm ${account.email} failed: ${res.status()} ${await res.text()}`);
  }
  await expect
    .poll(() => userRoleType(account.email), { message: `parent role assigned to ${account.email}` })
    .toBe('parent');
  return account;
}
