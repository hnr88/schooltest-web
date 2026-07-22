import { notFound } from 'next/navigation';

// Lowest-priority catch-all (next-intl's documented pattern): any locale-prefixed
// path that no more-specific route matches lands here and throws into the
// segment's own not-found boundary, so the branded [locale]/not-found.tsx renders
// inside the intl provider instead of Next's unstyled framework default.
export default function CatchAllNotFound(): never {
  notFound();
}
