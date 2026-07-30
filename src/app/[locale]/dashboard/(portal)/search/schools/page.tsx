import { getLocale } from 'next-intl/server';

import { permanentRedirect } from '@/i18n/navigation';

// C-UI-SEARCH-UNIFIED: the former W6 standalone /dashboard/search/schools route now
// 308-permanent-redirects into the unified shell. Server component — permanentRedirect
// is server-only; NO middleware/proxy (C-UI-SHELL).
export default async function SchoolSearchRedirectPage() {
  permanentRedirect({ href: '/dashboard/search?mode=schools', locale: await getLocale() });
}
