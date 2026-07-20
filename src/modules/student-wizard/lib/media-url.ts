import { strapi } from '@/lib/axios/strapi';

// Strapi's local provider returns RELATIVE upload URLs (`/uploads/<hash><ext>`),
// which 404 against the web origin. Resolve to the API origin (the `strapi` axios
// baseURL); already-absolute or in-memory (blob:/data:) URLs pass through.
export function toAbsoluteMediaUrl(url: string): string {
  if (/^(?:https?:|blob:|data:)/.test(url)) {
    return url;
  }
  const base = (strapi.defaults.baseURL ?? '').replace(/\/+$/, '');
  return `${base}${url}`;
}
