/**
 * W8 (NIGHT-2) parent-fixture helpers — the API twins of the wizard's real
 * flows, used only by w8-parent-portal.spec.ts:
 * - uploadStudentMediaShape: the photo + voice_intro upload pair the
 *   C-STUDENT-CREATE whitelist mandates (real POST /api/upload).
 * - registerFreshParent: register → styled Mailpit confirmation link → 302
 *   redeem → parent-role login → onboarding skip. Everything through the REAL
 *   contracts; no DB writes anywhere.
 */
import { expect, type APIRequestContext } from '@playwright/test';

const API = process.env.API_BASE_URL ?? 'http://127.0.0.1:5500';
const MAILPIT = process.env.MAILPIT_API_URL ?? 'http://127.0.0.1:8125/api/v1';
export const W8_PASSWORD = 'W8Parent1234!';

const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

function wavBuffer(): Buffer {
  const wav = Buffer.alloc(44, 0);
  wav.write('RIFF', 0);
  wav.writeUInt32LE(36, 4);
  wav.write('WAVE', 8);
  wav.write('fmt ', 12);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(8000, 24);
  wav.writeUInt32LE(8000, 28);
  wav.writeUInt16LE(1, 32);
  wav.writeUInt16LE(8, 34);
  wav.write('data', 36);
  wav.writeUInt32LE(0, 40);
  return wav;
}

/** Real POST /api/upload pair — { photo, voice_intro } media ids for a create. */
export async function uploadStudentMediaShape(
  request: APIRequestContext,
  token?: string,
): Promise<{ photo: number; voice_intro: number }> {
  async function upload(file: { name: string; mimeType: string; buffer: Buffer }): Promise<number> {
    const res = await request.post(`${API}/api/upload`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      multipart: { files: { name: file.name, mimeType: file.mimeType, buffer: file.buffer } },
    });
    expect(res.status(), await res.text()).toBe(201);
    return ((await res.json()) as { id: number }[])[0].id;
  }
  const photo = await upload({ name: 'w8-photo.png', mimeType: 'image/png', buffer: PNG_1PX });
  const voiceIntro = await upload({ name: 'w8-voice.wav', mimeType: 'audio/wav', buffer: wavBuffer() });
  return { photo, voice_intro: voiceIntro };
}

export interface FreshParent {
  email: string;
  username: string;
  jwt: string;
}

/** register → Mailpit confirm → login → onboarding skip. Returns the session. */
export async function registerFreshParent(
  request: APIRequestContext,
  flow: string,
  password = W8_PASSWORD,
): Promise<FreshParent> {
  const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
  const username = `e2e${flow}${suffix}`.slice(0, 20);
  const email = `e2e-${flow}-${suffix}@schooltest.test`;
  let regStatus = 0;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const reg = await request
      .post(`${API}/api/auth/local/register`, { data: { username, email, password } })
      .catch(() => null);
    if (reg && reg.status() === 200) {
      regStatus = 200;
      break;
    }
    await new Promise((r) => setTimeout(r, 5000));
  }
  expect(regStatus).toBe(200);

  const search = await request.get(
    `${MAILPIT}/search?query=${encodeURIComponent(`to:${email}`)}&limit=5`,
  );
  const msgs = ((await search.json()) as { messages?: { ID: string }[] }).messages ?? [];
  expect(msgs.length, `confirmation email for ${email}`).toBeGreaterThan(0);
  const msg = await request.get(`${MAILPIT}/message/${msgs[0].ID}`);
  const html = (await msg.json()) as { HTML?: string };
  const token = html.HTML?.match(/email-confirmation\?confirmation=([0-9a-f]{40})/)?.[1];
  expect(token, 'confirmation token').toBeTruthy();
  const confirm = await request.get(`${API}/api/auth/email-confirmation?confirmation=${token}`, {
    maxRedirects: 0,
  });
  expect(confirm.status()).toBe(302);

  let jwt = '';
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const login = await request
      .post(`${API}/api/auth/local`, { data: { identifier: email, password } })
      .catch(() => null);
    if (login && login.status() === 200) {
      jwt = ((await login.json()) as { jwt: string }).jwt;
      break;
    }
    await new Promise((r) => setTimeout(r, 5000));
  }
  expect(jwt, `parent login for ${email}`).toBeTruthy();
  const onboard = await request.post(`${API}/api/users/me/onboarding`, {
    headers: { Authorization: `Bearer ${jwt}` },
    data: { status: 'skipped' },
  });
  expect(onboard.status()).toBe(200);
  return { email, username, jwt };
}
