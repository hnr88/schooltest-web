import { strapi } from '@/lib/axios/strapi';

/** Resolves Strapi's local-upload paths against the API origin. */
export function toAbsoluteStrapiMediaUrl(url: string): string {
  if (/^(?:https?:|blob:|data:)/.test(url)) {
    return url;
  }
  const baseUrl = (strapi.defaults.baseURL ?? '').replace(/\/+$/, '');
  return `${baseUrl}${url}`;
}
