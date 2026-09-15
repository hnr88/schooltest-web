import { expect, type APIRequestContext } from '@playwright/test';
import { roleCredentials } from './credentials';

export async function opsJwtHelper(request: APIRequestContext): Promise<string> {
  const { email, password } = roleCredentials('opsApi');
  const res = await request.post('http://127.0.0.1:5500/api/auth/local', {
    data: { identifier: email, password },
  });
  expect(res.status()).toBe(200);
  return ((await res.json()) as { jwt: string }).jwt;
}
