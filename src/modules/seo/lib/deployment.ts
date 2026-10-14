/**
 * Which indexing regime applies to THIS deployment.
 *
 * The one per-environment signal available everywhere it is needed is
 * `NEXT_PUBLIC_APP_URL`: it is baked into each variant image at build (robots.txt
 * is prerendered from it and the Dockerfile passes it as an ARG) and read again
 * at request time for metadata. The CI matrix bakes `https://staging.schooltest.com.au`
 * into the staging variant and `https://schooltest.com.au` into production
 * (ci.yml `app_url`, DEPLOYMENT.md "Image variants"), so a `staging` label in
 * the host means "this deployment must never be indexed".
 *
 * Deliberately keyed on the staging label and never on "equals the production
 * host": host equality would noindex any build that lost its env (the
 * `http://localhost:3000` default), silently hiding production on a bad build.
 * A label match cannot fire for production — production's baked URL has no
 * `staging` label — while staging is guaranteed its host by the build matrix.
 */
export function isStagingAppUrl(appUrl: string): boolean {
  let host = appUrl.toLowerCase();
  try {
    host = new URL(appUrl).hostname.toLowerCase();
  } catch {
    // Not an absolute URL — fall through with the raw string, still matching
    // a `staging` label in whatever was passed.
  }
  return host === 'staging' || host.startsWith('staging.') || host.includes('.staging.');
}
