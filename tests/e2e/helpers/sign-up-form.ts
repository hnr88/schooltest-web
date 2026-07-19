/**
 * Shared sign-up UI fixtures (tasks 017/020) — one throwaway-identity factory
 * and the sign-up form fill used by both sign-up.spec.ts (validation/error
 * legs) and sign-up-confirm.spec.ts (the registration round-trip).
 */
import type { Page } from '@playwright/test';

import { cat, loadMessages } from './i18n';

const en = loadMessages('en');

export interface FreshParent {
  username: string;
  email: string;
  password: string;
}

/** Fresh throwaway identity — unique per call, never the seeded parent. */
export function freshParent(): FreshParent {
  const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  return {
    username: `e2e${suffix}`.slice(0, 20),
    email: `e2e-${suffix}@schooltest.test`,
    password: 'Parent1234!',
  };
}

/** Fills the /sign-up card (en catalog) and submits it. */
export async function fillSignUpForm(page: Page, parent: FreshParent): Promise<void> {
  await page.getByLabel(cat(en, 'Auth.usernameLabel'), { exact: true }).fill(parent.username);
  await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(parent.email);
  await page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }).fill(parent.password);
  await page
    .getByLabel(cat(en, 'Auth.confirmPasswordLabel'), { exact: true })
    .fill(parent.password);
  await page.getByRole('button', { name: cat(en, 'Auth.signUpButton'), exact: true }).click();
}
