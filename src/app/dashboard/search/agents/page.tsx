import { permanentRedirect } from 'next/navigation';

// C-UI-SEARCH-UNIFIED: the planned standalone agent route 308-permanent-redirects into
// the unified shell. Server component — permanentRedirect is server-only; NO
// middleware/proxy (C-UI-SHELL).
export default function AgentSearchRedirectPage() {
  permanentRedirect('/dashboard/search?mode=agents');
}
