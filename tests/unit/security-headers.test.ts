// @vitest-environment node
import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GET, POST } from '@/app/api/csp-report/route';
import { isPlaceholderSecret } from '@/lib/env';
import {
  applySecurityHeaders,
  buildContentSecurityPolicy,
  buildSecurityHeaders,
} from '@/lib/security-headers';
import proxy from '@/proxy';

const API = 'https://api.schooltest.example';
const BASELINE = [
  'Permissions-Policy',
  'Referrer-Policy',
  'Strict-Transport-Security',
  'X-Content-Type-Options',
  'X-Frame-Options',
];

describe('buildSecurityHeaders', () => {
  it('adds nothing when both flags are off or unset', () => {
    expect(buildSecurityHeaders({})).toEqual([]);
    expect(
      buildSecurityHeaders({ SECURITY_HEADERS_ENABLED: 'false', SECURITY_CSP_MODE: 'off' }),
    ).toEqual([]);
  });

  it('treats only the exact string "true" as enabled', () => {
    for (const value of ['TRUE', '1', 'yes', ' true']) {
      expect(buildSecurityHeaders({ SECURITY_HEADERS_ENABLED: value })).toEqual([]);
    }
  });

  it('adds exactly the five baseline headers when enabled', () => {
    const headers = buildSecurityHeaders({ SECURITY_HEADERS_ENABLED: 'true' });
    expect(headers.map(([name]) => name).sort()).toEqual(BASELINE);
    const map = Object.fromEntries(headers);
    expect(map['X-Content-Type-Options']).toBe('nosniff');
    expect(map['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    expect(map['X-Frame-Options']).toBe('SAMEORIGIN');
    expect(map['Permissions-Policy']).toBe('camera=(), microphone=(), geolocation=(), payment=()');
    expect(map['Strict-Transport-Security']).toBe('max-age=31536000; includeSubDomains');
    expect(map['Strict-Transport-Security']).not.toMatch(/preload/);
  });

  it('uses the Report-Only header name for report-only and the enforcing name for enforce', () => {
    const reportOnly = buildSecurityHeaders({ SECURITY_CSP_MODE: 'report-only' });
    expect(reportOnly.map(([name]) => name)).toEqual(['Content-Security-Policy-Report-Only']);
    const enforce = buildSecurityHeaders({ SECURITY_CSP_MODE: 'enforce' });
    expect(enforce.map(([name]) => name)).toEqual(['Content-Security-Policy']);
  });

  it('ignores an unknown CSP mode', () => {
    expect(buildSecurityHeaders({ SECURITY_CSP_MODE: 'strict' })).toEqual([]);
  });

  it('combines the baseline and the CSP header independently', () => {
    const names = buildSecurityHeaders({
      SECURITY_HEADERS_ENABLED: 'true',
      SECURITY_CSP_MODE: 'enforce',
    }).map(([name]) => name);
    expect(names).toHaveLength(6);
    expect(names).toContain('Content-Security-Policy');
  });
});

describe('buildContentSecurityPolicy', () => {
  const csp = buildContentSecurityPolicy({ NEXT_PUBLIC_API_BASE_URL: `${API}/some/path` });

  it('contains the API origin (not its path) for connect, img and media', () => {
    expect(csp).toContain(`connect-src 'self' ${API}`);
    expect(csp).toContain(`img-src 'self' data: blob: ${API}`);
    expect(csp).toContain(`media-src 'self' blob: ${API}`);
    expect(csp).not.toContain('/some/path');
  });

  it("carries frame-ancestors 'self', object-src 'none' and the report endpoint", () => {
    expect(csp).toContain("frame-ancestors 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");
    expect(csp).toContain('report-uri /api/csp-report');
    expect(csp).not.toMatch(/unsafe-eval/);
  });

  it('falls back to the local API default when the base URL is missing or invalid', () => {
    expect(buildContentSecurityPolicy({})).toContain('connect-src \'self\' http://localhost:1337');
    expect(buildContentSecurityPolicy({ NEXT_PUBLIC_API_BASE_URL: 'not a url' })).toContain(
      'http://localhost:1337',
    );
  });
});

describe('applySecurityHeaders', () => {
  it('leaves a response untouched when flags are off', () => {
    const response = new Response('x');
    applySecurityHeaders(response, {});
    expect([...response.headers.keys()].filter((k) => k !== 'content-type')).toEqual([]);
  });

  it('sets the headers on the response and returns the same object', () => {
    const response = new Response('x');
    const out = applySecurityHeaders(response, {
      SECURITY_HEADERS_ENABLED: 'true',
      SECURITY_CSP_MODE: 'report-only',
    });
    expect(out).toBe(response);
    expect(response.headers.get('x-frame-options')).toBe('SAMEORIGIN');
    expect(response.headers.get('content-security-policy-report-only')).toContain(
      "frame-ancestors 'self'",
    );
  });
});

describe('proxy', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('adds no security headers by default (runtime flags unset)', () => {
    const response = proxy(new NextRequest('http://localhost:3000/en/sign-in'));
    for (const name of [...BASELINE, 'Content-Security-Policy', 'Content-Security-Policy-Report-Only']) {
      expect(response.headers.get(name)).toBeNull();
    }
  });

  it('reads the flags per request, so a runtime change applies without a reload', () => {
    vi.stubEnv('SECURITY_HEADERS_ENABLED', 'true');
    vi.stubEnv('SECURITY_CSP_MODE', 'report-only');
    vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', API);
    const response = proxy(new NextRequest('http://localhost:3000/en/sign-in'));
    for (const name of BASELINE) expect(response.headers.get(name)).not.toBeNull();
    expect(response.headers.get('content-security-policy-report-only')).toContain(API);
    expect(response.headers.get('content-security-policy')).toBeNull();

    vi.stubEnv('SECURITY_HEADERS_ENABLED', 'false');
    vi.stubEnv('SECURITY_CSP_MODE', 'off');
    const after = proxy(new NextRequest('http://localhost:3000/en/sign-in'));
    expect(after.headers.get('x-frame-options')).toBeNull();
    expect(after.headers.get('content-security-policy-report-only')).toBeNull();
  });

  it('keeps the legacy /eald redirect first and unchanged, with no headers added', () => {
    vi.stubEnv('SECURITY_HEADERS_ENABLED', 'true');
    vi.stubEnv('SECURITY_CSP_MODE', 'enforce');
    const response = proxy(new NextRequest('http://localhost:3000/eald/diagnose'));
    expect(response.status).toBe(308);
    expect(new URL(response.headers.get('location') ?? '').pathname).toBe('/diagnose');
    expect(response.headers.get('x-frame-options')).toBeNull();
    expect(response.headers.get('content-security-policy')).toBeNull();
  });
});

describe('POST /api/csp-report', () => {
  let info: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
  });
  afterEach(() => {
    info.mockRestore();
  });

  const post = (body: string, type = 'application/csp-report') =>
    POST(new Request('http://localhost:3000/api/csp-report', {
      method: 'POST',
      headers: { 'content-type': type },
      body,
    }));

  it('logs one line with directives and the blocked ORIGIN only, then answers 204', async () => {
    const response = await post(
      JSON.stringify({
        'csp-report': {
          'document-uri': 'https://app.example/en/dashboard?student=42',
          'violated-directive': "script-src 'self' 'unsafe-inline'",
          'effective-directive': 'script-src',
          'blocked-uri': 'https://cdn.evil.test/path/to/a.js?token=abc#frag',
          'script-sample': 'alert(secret)',
        },
      }),
    );
    expect(response.status).toBe(204);
    expect(info).toHaveBeenCalledTimes(1);
    const line = String(info.mock.calls[0]?.[0]);
    expect(line).toContain('violatedDirective=script-src');
    expect(line).toContain('effectiveDirective=script-src');
    expect(line).toContain('blockedOrigin=https://cdn.evil.test');
    for (const leaked of ['/path/to', 'token=abc', 'frag', 'alert', 'secret', 'student=42', 'unsafe-inline']) {
      expect(line).not.toContain(leaked);
    }
  });

  it('accepts the Reporting API format (application/reports+json)', async () => {
    const response = await post(
      JSON.stringify([
        {
          type: 'csp-violation',
          body: {
            effectiveDirective: 'img-src',
            blockedURL: 'https://img.host.test/a/b.png?x=1',
            sample: 'nope',
          },
        },
      ]),
      'application/reports+json',
    );
    expect(response.status).toBe(204);
    expect(String(info.mock.calls[0]?.[0])).toBe(
      '[csp-report] violatedDirective=unknown effectiveDirective=img-src blockedOrigin=https://img.host.test',
    );
  });

  it('keeps CSP keyword sources and reduces opaque-origin URLs to their scheme', async () => {
    await post(JSON.stringify({ 'csp-report': { 'violated-directive': 'script-src', 'blocked-uri': 'inline' } }));
    await post(
      JSON.stringify({ 'csp-report': { 'violated-directive': 'img-src', 'blocked-uri': 'data:image/png;base64,AAAA' } }),
    );
    expect(String(info.mock.calls[0]?.[0])).toContain('blockedOrigin=inline');
    expect(String(info.mock.calls[1]?.[0])).toContain('blockedOrigin=data');
    expect(String(info.mock.calls[1]?.[0])).not.toContain('AAAA');
  });

  it('caps the body at 8 KB: an oversized report is dropped, still 204', async () => {
    const big = JSON.stringify({
      'csp-report': { 'violated-directive': 'script-src', 'blocked-uri': 'https://a.test/', pad: 'x'.repeat(9 * 1024) },
    });
    expect(big.length).toBeGreaterThan(8 * 1024);
    const response = await post(big);
    expect(response.status).toBe(204);
    expect(info).not.toHaveBeenCalled();
  });

  it('answers 204 and logs nothing for malformed JSON or another content type', async () => {
    expect((await post('{not json')).status).toBe(204);
    expect(
      (await post(JSON.stringify({ 'csp-report': { 'violated-directive': 'script-src' } }), 'text/plain')).status,
    ).toBe(204);
    expect(info).not.toHaveBeenCalled();
  });

  it('GET answers 405', () => {
    const response = GET();
    expect(response.status).toBe(405);
    expect(response.headers.get('allow')).toBe('POST');
  });
});

describe('isPlaceholderSecret', () => {
  it('flags sample and placeholder markers, case-insensitively', () => {
    for (const value of [
      'CHANGE_ME_generate_a_random_32_char_secret',
      'change-me-at-least-16-chars',
      'ToBeModified-0123456789',
      'my-example-secret-value',
      'PLACEHOLDER-value-1234567',
    ]) {
      expect(isPlaceholderSecret(value)).toBe(true);
    }
  });

  it('does not flag a random value or an unset one', () => {
    expect(isPlaceholderSecret('q8Zr2vLw0xTn5bKd9HcYe3Ua7PjMf4Gs')).toBe(false);
    expect(isPlaceholderSecret(undefined)).toBe(false);
    expect(isPlaceholderSecret('')).toBe(false);
  });
});
