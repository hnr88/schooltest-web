import { permanentRedirect } from 'next/navigation';

// C-UI-SEARCH-UNIFIED: the former W6 standalone /dashboard/search/schools route now
// 308-permanent-redirects into the unified shell. Server component — permanentRedirect
// is server-only; NO middleware/proxy (C-UI-SHELL).
export default function SchoolSearchRedirectPage() {
  permanentRedirect('/dashboard/search?mode=schools');
}
