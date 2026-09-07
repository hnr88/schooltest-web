/**
 * OPS-077 / C-OPS-PORTAL-067 — helpers for the settings-read browser spec.
 *
 * Not a `*.spec.ts`, so Playwright collects nothing from it.
 *
 * The API allows 20 POST /api/auth/local per minute per IP and every suite on
 * this machine shares that budget, so the file mints ONE token and rides out a
 * 429 with a bounded backoff instead of failing the contract over it.
 */
import { mkdirSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import type { Page } from '@playwright/test';

import { roleCredentials } from '../helpers/credentials';

export const API_BASE_URL =
  process.env.E2E_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:5500';
export const SETTINGS_ROUTE = '/dashboard/ops/settings';
export const READY = '[data-surface="ops-platform-settings"][data-state="ready"]';
export const RETRY = '[data-ops-action="settings-retry"]';
export const STORAGE_STATE = path.join(os.tmpdir(), 'schooltest-ops-077-state.json');
export const ACTION_TIMEOUT = 15_000;

const CAPTURES = path.resolve(
  __dirname,
  '../../../../.codephant/missions/msn-ab5a6a54-f385-42e1-826a-aeba2bbdbc66/captures',
);

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let cachedJwt: string | null = null;

/** One API login for the whole file, riding out the shared per-IP limiter. */
export async function opsJwt(): Promise<string> {
  if (cachedJwt) return cachedJwt;
  const { email, password } = roleCredentials('ops');
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const res = await fetch(`${API_BASE_URL}/api/auth/local`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: email, password }),
    });
    if (res.ok) {
      cachedJwt = ((await res.json()) as { jwt: string }).jwt;
      return cachedJwt;
    }
    if (res.status !== 429 || attempt === 3) throw new Error(`[e2e] ops login: HTTP ${res.status}`);
    await wait(4000 * attempt);
  }
  throw new Error('[e2e] ops login never succeeded');
}

/** The live contracted row, read through the real endpoint as ops. */
export async function liveSettings(): Promise<Record<string, unknown>> {
  const res = await fetch(`${API_BASE_URL}/api/platform-settings`, {
    headers: { Authorization: `Bearer ${await opsJwt()}`, 'X-Ops-Portal-Version': '1' },
  });
  if (!res.ok) throw new Error(`[e2e] settings read failed: HTTP ${res.status}`);
  return ((await res.json()) as { data: Record<string, unknown> }).data;
}

export async function capture(page: Page, name: string): Promise<string> {
  mkdirSync(CAPTURES, { recursive: true });
  const file = path.join(CAPTURES, `077-${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  return file;
}

/** Records the version header of every settings read the browser issues. */
export function settingsReads(page: Page): string[] {
  const seen: string[] = [];
  page.on('request', (request) => {
    if (request.method() === 'GET' && /\/api\/platform-settings(\?|$)/.test(request.url())) {
      seen.push(request.headers()['x-ops-portal-version'] ?? '');
    }
  });
  return seen;
}

/**
 * Block until the API answers. The dev API is reloaded by whoever is editing
 * it, and a sign-in during a restart surfaces as the form's offline banner —
 * a green contract reported as a red login. Waiting is bounded; a stack that
 * never comes back still fails, with the right message.
 */
export async function waitForApi(maxMs = 150_000): Promise<void> {
  const deadline = Date.now() + maxMs;
  for (;;) {
    const alive = await fetch(`${API_BASE_URL}/api/readiness`).catch(() => null);
    if (alive?.ok) return;
    if (Date.now() > deadline) throw new Error('[e2e] the API never answered /api/readiness');
    await wait(3000);
  }
}
