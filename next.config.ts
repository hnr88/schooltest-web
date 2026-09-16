import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  output: 'standalone',
  reactCompiler: true,
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
    return [
      {
        // Prevent a returning browser from keeping HTML that refers to chunks
        // removed by a newer rolling deployment. Hashed assets remain cacheable.
        source: '/:path*',
        has: [{ type: 'header', key: 'accept', value: '(.*text/html.*)' }],
        headers: [{ key: 'Cache-Control', value: 'no-cache, must-revalidate' }],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
