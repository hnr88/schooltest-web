import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * ST4S W4-04 (G-30) regression guard. The web portal writes no cookie, loads no
 * analytics or tracker package and keeps a short, documented set of
 * browser-storage writers. Any change to that set must edit THIS file and the
 * public cookie policy in the same change:
 *   - schooltest-api/src/bootstrap/legal-data/cookie-policy.ts
 *   - the storage inventory in schooltest-api/src/bootstrap/legal-data/data-handling.ts
 * Mirrors schooltest-app/src/lib/storage-guard.test.ts (copied, not shared).
 */

// vitest runs from the repo root (same convention as the other web specs that read repo files).
const ROOT = process.cwd();
const SCAN_DIRS = ['src'];
const SKIP_DIRS = new Set(['node_modules', '.next', 'out', 'dist', 'build', 'tests']);
const UPDATE_HINT =
  'A cookie, tracker or browser-storage writer was introduced. Update this guard AND the cookie policy ' +
  '(schooltest-api/src/bootstrap/legal-data/cookie-policy.ts) and the storage inventory ' +
  '(schooltest-api/src/bootstrap/legal-data/data-handling.ts) in the same change.';

export const COOKIE_PATTERNS: readonly RegExp[] = [
  /\bdocument\.cookie\b/,
  /import\s*\{[^}]*\bcookies\b[^}]*\}\s*from\s*['"]next\/headers['"]/,
  /set-cookie/i,
  /\bcookieStore\.set\(/,
  /\bdefaultSession\.cookies\b/,
  /\.cookies\.set\(/,
  /\bcookies\(\)\s*\.set\b/,
];

export const STORAGE_WRITER_PATTERNS: readonly RegExp[] = [
  /\blocalStorage\.setItem\(/,
  /\bsessionStorage\.setItem\(/,
  /\bindexedDB\.open\(/,
  /\bnew\s+(?:Electron)?Store\b\s*[<(]/,
  /electron-store/,
  /\bcreateJSONStorage\s*\(/, // zustand persist -> storage
  /\bpersist\s*[(<]/,
  /import\s*\{[^}]*\bThemeProvider\b[^}]*\}\s*from\s*['"]next-themes['"]/, // next-themes writes `theme`
];

export const TRACKER_PACKAGE_PATTERN = new RegExp(
  [
    '^@vercel/analytics$', '^@vercel/speed-insights$', '^react-ga', '^ga-4-react$', '^@sentry/',
    '^posthog', '^mixpanel', '^@segment/', '^@next/third-parties$', '^hotjar', '^plausible',
    '^js-cookie$', '^react-cookie$', '^cookies-next$', '^@amplitude/', '^logrocket$',
    '^@datadog/browser', '^newrelic$', '^clarity', '^@microsoft/clarity',
  ].join('|'),
);

/** Files that touch `document.cookie` or write a cookie today. The web portal has none. */
const KNOWN_COOKIE_FILES: readonly string[] = [];

/** One entry per file that writes browser storage; `covers` is the STORAGE_INVENTORY id. */
const KNOWN_STORAGE_WRITERS: readonly { file: string; covers: string }[] = [
  // localStorage `app.auth.token`: the sign-in token, written at sign-in, removed at sign-out.
  { file: 'src/lib/axios/strapi.ts', covers: 'web-auth-token' },
  // zustand persist -> localStorage `school.activeSchoolDocumentId`: the school a staff member selected.
  { file: 'src/modules/school-admin/stores/use-active-school-store.ts', covers: 'web-active-school' },
  // zustand persist -> localStorage `school-onboarding.<token>`: the school set-up wizard draft.
  { file: 'src/modules/school-onboarding/stores/use-school-onboarding-store.ts', covers: 'web-school-onboarding-draft' },
  // next-themes ThemeProvider -> localStorage `theme`; the site pins the light theme.
  { file: 'src/modules/providers/components/Providers.tsx', covers: 'web-theme' },
];

type PackageJson = Partial<
  Record<'dependencies' | 'devDependencies' | 'optionalDependencies' | 'peerDependencies', Record<string, string>>
>;

export function matchingPatterns(text: string, patterns: readonly RegExp[]): string[] {
  return patterns.filter((pattern) => pattern.test(text)).map((pattern) => pattern.source);
}

export function trackerPackages(pkg: PackageJson): string[] {
  const groups = [pkg.dependencies, pkg.devDependencies, pkg.optionalDependencies, pkg.peerDependencies];
  return groups.flatMap((group) => Object.keys(group ?? {})).filter((name) => TRACKER_PACKAGE_PATTERN.test(name));
}

function listSourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return SKIP_DIRS.has(entry.name) ? [] : listSourceFiles(full);
    const isSource = /\.(?:ts|tsx|js|mjs)$/.test(entry.name) && !/\.(?:test|spec)\./.test(entry.name);
    return isSource ? [full] : [];
  });
}

function filesMatching(patterns: readonly RegExp[]): string[] {
  return SCAN_DIRS.flatMap((dir) => listSourceFiles(join(ROOT, dir)))
    .filter((file) => matchingPatterns(readFileSync(file, 'utf8'), patterns).length > 0)
    .map((file) => relative(ROOT, file).split(sep).join('/'))
    .sort();
}

describe('storage and tracker guard (web)', () => {
  it('writes no cookie anywhere in src', () => {
    expect(filesMatching(COOKIE_PATTERNS), UPDATE_HINT).toEqual([...KNOWN_COOKIE_FILES]);
  });

  it('declares no analytics, tracker or cookie-helper package', () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as PackageJson;
    expect(trackerPackages(pkg), UPDATE_HINT).toEqual([]);
  });

  it('writes browser storage only from the documented files', () => {
    const known = KNOWN_STORAGE_WRITERS.map((entry) => entry.file).sort();
    expect(filesMatching(STORAGE_WRITER_PATTERNS), UPDATE_HINT).toEqual(known);
  });

  it('names a storage inventory id for every known writer', () => {
    KNOWN_STORAGE_WRITERS.forEach((entry) => expect(entry.covers).toMatch(/^web-[a-z-]+$/));
  });

  it('keeps the locale in the URL, not a cookie', () => {
    const routing = readFileSync(join(ROOT, 'src/i18n/routing.ts'), 'utf8');
    expect(routing, UPDATE_HINT).toMatch(/localeCookie:\s*false/);
  });

  describe('scanner sensitivity', () => {
    it('reports cookie writers and ignores clean source', () => {
      expect(matchingPatterns("document.cookie = 'a=b';", COOKIE_PATTERNS)).not.toEqual([]);
      expect(matchingPatterns("res.headers.set('Set-Cookie', 'a=b');", COOKIE_PATTERNS)).not.toEqual([]);
      expect(matchingPatterns("import { cookies } from 'next/headers';", COOKIE_PATTERNS)).not.toEqual([]);
      expect(matchingPatterns('const total = items.length;', COOKIE_PATTERNS)).toEqual([]);
    });

    it('reports storage writers and ignores reads', () => {
      expect(matchingPatterns("localStorage.setItem('k', 'v');", STORAGE_WRITER_PATTERNS)).not.toEqual([]);
      expect(matchingPatterns("indexedDB.open('db');", STORAGE_WRITER_PATTERNS)).not.toEqual([]);
      expect(matchingPatterns("localStorage.getItem('k');", STORAGE_WRITER_PATTERNS)).toEqual([]);
    });

    it('reports tracker packages and ignores ordinary ones', () => {
      expect(trackerPackages({ dependencies: { '@sentry/nextjs': '^9.0.0' } })).toEqual(['@sentry/nextjs']);
      expect(trackerPackages({ devDependencies: { 'js-cookie': '^3.0.0' } })).toEqual(['js-cookie']);
      expect(trackerPackages({ dependencies: { zustand: '^5.0.0' } })).toEqual([]);
    });
  });
});
