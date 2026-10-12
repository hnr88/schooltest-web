import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, test } from 'vitest';

/**
 * W6-04 (gap G-34) — the public RFC 9116 contact file served from
 * `public/.well-known/security.txt`. It is a static file, so the only way it
 * goes wrong is by lapsing or by drifting from the published contact. These
 * tests read the REAL file (no mocks) and fail CI loudly when `Expires` has
 * passed or was set more than a year ahead, which is the point: the yearly
 * refresh is action GOV-13 and CAL-A09.
 */

const FILE = resolve(process.cwd(), 'public/.well-known/security.txt');
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const ALLOWED_FIELDS = ['Contact', 'Expires', 'Preferred-Languages', 'Canonical'];

const raw = readFileSync(FILE, 'utf8');
const lines = raw.split('\n');
const fieldLines = lines.filter((line) => line.trim() !== '' && !line.startsWith('#'));

function fieldValue(name: string): string | undefined {
  const prefix = `${name}:`;
  const line = fieldLines.find((candidate) => candidate.startsWith(prefix));
  return line?.slice(prefix.length).trim();
}

describe('public/.well-known/security.txt (RFC 9116)', () => {
  test('is plain text with LF line endings, no BOM, and ends with a newline', () => {
    expect(raw.charCodeAt(0)).not.toBe(0xfeff);
    expect(raw).not.toContain('\r');
    expect(raw.endsWith('\n')).toBe(true);
  });

  test('has a Contact field that is the published schooltest.com.au mailbox', () => {
    const contact = fieldValue('Contact');
    expect(contact).toBeDefined();
    expect(contact).toMatch(/^mailto:[^@\s]+@schooltest\.com\.au$/);
  });

  test('has an Expires field strictly in the future and at most 366 days away', () => {
    const expires = fieldValue('Expires');
    expect(expires).toBeDefined();
    expect(expires).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/);

    const expiresAt = new Date(expires as string).getTime();
    expect(Number.isNaN(expiresAt)).toBe(false);

    const now = Date.now();
    expect(expiresAt).toBeGreaterThan(now);
    expect(expiresAt - now).toBeLessThanOrEqual(366 * MS_PER_DAY);
  });

  test('has a Canonical field over https that points at itself', () => {
    expect(fieldValue('Canonical')).toBe('https://schooltest.com.au/.well-known/security.txt');
  });

  test('contains no http:// URLs', () => {
    expect(raw).not.toMatch(/http:\/\//i);
  });

  test('carries no fields beyond Contact, Expires, Preferred-Languages and Canonical', () => {
    const names = fieldLines.map((line) => line.slice(0, line.indexOf(':')));
    for (const name of names) {
      expect(ALLOWED_FIELDS).toContain(name);
    }
    // Each field appears exactly once.
    expect([...names].sort()).toEqual([...ALLOWED_FIELDS].sort());
    // No Encryption, Policy or Hiring field was added.
    expect(raw).not.toMatch(/^(Encryption|Policy|Hiring|Acknowledgments):/m);
  });
});
