import type { BrowserContext } from '@playwright/test';

// A worktree run boots its own `next dev` on a port the API's FRONTEND_ORIGIN
// allow-list does not name (it lists 3000/3001/3010), so the browser's calls to
// the live API fail CORS before they reach it. Opt in with E2E_CORS_BRIDGE=1:
// each API request is replayed from Node against the SAME API, unchanged, and the
// answer is handed back with the page's origin allowed. Off by default.
const API_ORIGIN = new URL(process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:5500').origin;

export async function bridgeApiCors(context: BrowserContext): Promise<void> {
  if (process.env.E2E_CORS_BRIDGE !== '1') return;
  await context.route(`${API_ORIGIN}/**`, async (route) => {
    const request = route.request();
    const origin = (await request.headerValue('origin')) ?? '*';
    const cors = {
      'access-control-allow-origin': origin,
      'access-control-allow-credentials': 'true',
      'access-control-expose-headers': '*',
      vary: 'Origin',
    };
    if (request.method() === 'OPTIONS') {
      await route.fulfill({
        status: 204,
        headers: {
          ...cors,
          'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
          'access-control-allow-headers': (await request.headerValue('access-control-request-headers')) ?? '*',
        },
      });
      return;
    }
    // A request still in flight when the test ends has nobody left to answer.
    const response = await route.fetch().catch(() => null);
    if (response === null) return;
    await route.fulfill({ response, headers: { ...response.headers(), ...cors } }).catch(() => undefined);
  });
}
