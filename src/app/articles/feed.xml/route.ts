import { routing } from '@/i18n/routing';
import { articlesFeedResponse } from '@/modules/cms';

// /articles/feed.xml — the default-locale feed. The proxy skips dotted paths,
// so the unprefixed URL never reaches the [locale] segment.
export function GET(): Promise<Response> {
  return articlesFeedResponse(routing.defaultLocale);
}
