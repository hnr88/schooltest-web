import { expect, test } from '@playwright/test';
import { apiEnv, runSql } from './helpers/auth-db';
const API = process.env.E2E_API_URL ?? 'http://127.0.0.1:5500';
test('probe counts', async ({ request }) => {
  const login = await request.post(`${API}/api/auth/local`, {
    data: { identifier: 'apiadmin@schooltest.local', password: apiEnv('SEED_APIADMIN_PASSWORD') },
  });
  const { jwt } = (await login.json()) as { jwt: string };
  const res = await request.get(`${API}/api/ops/schools`, { headers: { Authorization: `Bearer ${jwt}` } });
  const body = (await res.json()) as { data: unknown[] };
  console.log('PLAYWRIGHT-REQUEST api rows:', body.data?.length, 'status', res.status());
  console.log('SQL count:', runSql('select count(*) from schools'));
  console.log('SQL not-deleted:', runSql('select count(*) from schools where deleted_at is null'));
  console.log('SQL with documentId:', runSql('select count(*) from schools where document_id is not null'));
});
