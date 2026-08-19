// Vitest stub for `next/navigation` — a Next runtime module that does not exist
// outside a Next build. Aliased in vitest.config.ts so any module graph that
// imports it (next-intl navigation helpers, the auth-store redirect, the typed
// axios instances) resolves to inert doubles under jsdom. Mirrors
// schooltest-app/vitest-stubs/next-navigation.ts.
export const useRouter = () => ({
  push: () => {},
  replace: () => {},
  refresh: () => {},
  back: () => {},
  forward: () => {},
  prefetch: () => {},
});
export const usePathname = () => '/';
export class ReadonlyURLSearchParams extends URLSearchParams {}
export const useSearchParams = () => new ReadonlyURLSearchParams();
export const useParams = () => ({});
export const useSelectedLayoutSegment = () => null;
export const useSelectedLayoutSegments = () => [];
export const redirect = () => {};
export const permanentRedirect = () => {};
export const notFound = () => {};
export const RedirectType = { push: 'push', replace: 'replace' };