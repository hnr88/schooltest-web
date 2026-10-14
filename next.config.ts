import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

// Mirrors DISALLOWED_PATHS in src/modules/seo/constants/public-routes.ts (a
// unit test keeps the two identical). Inlined because Next's config loader
// cannot resolve TypeScript modules imported from next.config.ts.
const NOINDEX_PATHS = [
  '/dashboard',
  '/api',
  '/auth',
  '/sign-in',
  '/sign-up',
  '/forgot-password',
  '/reset-password',
  '/onboarding',
  '/school-onboarding',
  '/invite',
  '/design-system',
];

// Inlined mirror of isStagingAppUrl (src/modules/seo/lib/deployment.ts) — same
// config-loader limitation as the mirrored list above. A staging image (the CI
// matrix bakes https://staging.schooltest.com.au into it; production
// https://schooltest.com.au) must never be indexed, so headers() below gates
// on this instead of on hardcoded paths.
function isStagingAppUrl(appUrl: string): boolean {
  try {
    const host = new URL(appUrl).hostname.toLowerCase();
    return host === 'staging' || host.startsWith('staging.') || host.includes('.staging.');
  } catch {
    return false;
  }
}

const nextConfig: NextConfig = {
  output: 'standalone',
  // Drops the framework banner (`x-powered-by: Next.js`). The security headers
  // themselves are NOT added in headers() below: that is evaluated at build
  // time, and they are switchable at runtime, so src/proxy.ts sets them.
  poweredByHeader: false,
  reactCompiler: true,
  // SEO/AEO: resolve metadata before streaming for EVERY user agent, so canonical,
  // hreflang, description, og:* and twitter:* always sit in <head>. By default
  // Next streams them into <body> for Googlebot, AI crawlers (GPTBot, ClaudeBot,
  // PerplexityBot…) and browsers, and many parsers only read <head>.
  htmlLimitedBots: /.*/,
  // Dev-only scoping (Next's own recommendation when it warns about multiple
  // lockfiles): without it Turbopack picks the MONOREPO root (a stray
  // pnpm-lock.yaml beside this app) and watches schooltest-api, vendor trees
  // and downloads too, which exhausts the OS inotify watch limit (observed as
  // "OS file watch limit reached" and every on-demand route compiling to
  // Internal Server Error under parallel e2e load). Production builds are
  // unaffected.
  turbopack: { root: __dirname },
  // Local QA runs drive the app over 127.0.0.1 as well as localhost.
  allowedDevOrigins: ['127.0.0.1'],
  async headers() {
    // Evaluated when the config loads, which happens per variant image: the
    // CI matrix builds staging and production separately, each with its own
    // baked NEXT_PUBLIC_APP_URL, so production can never evaluate as staging.
    const staging = isStagingAppUrl(process.env.NEXT_PUBLIC_APP_URL ?? '');
    return [
      {
        // Prevent a returning browser from keeping HTML that refers to chunks
        // removed by a newer rolling deployment. Hashed assets remain cacheable.
        source: '/:path*',
        has: [{ type: 'header', key: 'accept', value: '(.*text/html.*)' }],
        headers: [{ key: 'Cache-Control', value: 'no-cache, must-revalidate' }],
      },
      // A staging deployment is noindex on EVERY route (search engines must
      // not index it; robots.txt already disallows everything): one catch-all
      // replaces the per-path rules, so no route carries the header twice.
      // Production sends no X-Robots-Tag beyond the per-path rules below.
      ...(staging
        ? [{ source: '/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] }]
        : // Private surfaces and the API stay out of every index even when a
          // crawler reaches them by a link robots.txt cannot see (the HTML pages
          // also say noindex in <meta>; this covers JSON, files and redirects).
          NOINDEX_PATHS.flatMap((path) =>
            [
              path,
              `${path}/:rest*`,
              `/:locale([a-z]{2})${path}`,
              `/:locale([a-z]{2})${path}/:rest*`,
            ].map((source) => ({
              source,
              headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
            })),
          )),
    ];
  },
};

export default withNextIntl(nextConfig);
