import { getLocale } from 'next-intl/server';

import { permanentRedirect } from '@/i18n/navigation';

// C-UI-SEARCH-UNIFIED: the planned standalone agent route 308-permanent-redirects into
// the unified shell. Server component — permanentRedirect is server-only; NO
// middleware/proxy (C-UI-SHELL).
export default async function AgentSearchRedirectPage() {
  permanentRedirect({ href: '/dashboard/search?mode=agents', locale: await getLocale() });
}
