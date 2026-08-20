/**
 * The ONE route→label registry (mission st-legal-seo-ops, task 208). Both the
 * visible breadcrumbs (public + dashboard) and the BreadcrumbList JSON-LD are
 * built from it, so structured data can never disagree with the DOM.
 *
 * Keys are locale-less path patterns exactly as they appear under
 * `src/app/[locale]`; `[param]` marks a dynamic segment. Values are FULL
 * next-intl message keys — existing `Shell.nav.*` labels are reused rather than
 * duplicated into a second catalog.
 *
 * Every entry corresponds to a route that really exists. Adding a route without
 * adding it here leaves an unlabeled crumb, which the mission's breadcrumb e2e
 * fails on.
 */
export const TRAIL_ROOT_KEY = 'Navigation.home';

export const TRAIL_LABELS: Readonly<Record<string, string>> = {
  // --- public ---------------------------------------------------------------
  '/': TRAIL_ROOT_KEY,
  '/articles': 'Navigation.articles',
  '/design-system': 'Navigation.designSystem',
  '/eald': 'Navigation.eald',
  '/eald/diagnose': 'Eald.nav.diagnose',
  '/eald/teach': 'Eald.nav.teach',
  '/eald/track': 'Eald.nav.track',
  '/eald/predict': 'Eald.nav.predict',
  // --- legal (C-LEG-02) -----------------------------------------------------
  '/privacy-policy': 'Navigation.privacyPolicy',
  '/terms-of-service': 'Navigation.termsOfService',
  '/cookie-policy': 'Navigation.cookiePolicy',
  '/gdpr': 'Navigation.gdpr',
  // --- auth / guest surfaces ------------------------------------------------
  '/sign-in': 'Navigation.signIn',
  '/sign-up': 'Navigation.signUp',
  '/forgot-password': 'Navigation.forgotPassword',
  '/reset-password': 'Navigation.resetPassword',
  '/onboarding': 'Navigation.onboarding',
  '/invite': 'Navigation.invite',
  '/school-onboarding': 'Navigation.schoolOnboarding',
  // --- dashboard ------------------------------------------------------------
  '/dashboard': 'Shell.topbar.dashboard',
  '/dashboard/children': 'Shell.nav.myChildren',
  '/dashboard/children/new': 'Navigation.newChild',
  '/dashboard/children/[documentId]/edit': 'Navigation.edit',
  '/dashboard/notifications': 'Shell.nav.notifications',
  '/dashboard/reports': 'Shell.nav.reports',
  '/dashboard/search': 'Shell.nav.search',
  '/dashboard/search/agents': 'Navigation.searchAgents',
  '/dashboard/search/schools': 'Navigation.searchSchools',
  '/dashboard/settings': 'Shell.nav.settings',
  // --- school admin ---------------------------------------------------------
  '/dashboard/school': 'Shell.nav.school',
  '/dashboard/school/account': 'Shell.nav.account',
  // Reachable by URL only — both were dropped from the rail (spec §Sidebar
  // Navigation), so their labels moved out of the Shell.nav catalog.
  '/dashboard/school/analytics': 'Navigation.analytics',
  '/dashboard/school/participation': 'Navigation.participation',
  '/dashboard/school/students': 'Shell.nav.students',
  '/dashboard/school/students/new': 'Navigation.newStudent',
  '/dashboard/school/classes': 'Shell.nav.classes',
  '/dashboard/school/teachers': 'Shell.nav.teachers',
  // --- teacher --------------------------------------------------------------
  '/dashboard/teach': 'Shell.nav.teach',
  '/dashboard/teach/notifications': 'Shell.nav.notifications',
  '/dashboard/teach/classes': 'Shell.nav.classes',
  '/dashboard/teach/classes/[documentId]/test-day': 'Navigation.testDay',
  '/dashboard/teach/results': 'Navigation.results',
  '/dashboard/teach/run-sheet': 'Navigation.runSheet',
  // --- ops console ----------------------------------------------------------
  '/dashboard/ops': 'Shell.nav.ops',
  '/dashboard/ops/schools': 'Navigation.opsSchools',
  '/dashboard/ops/timers': 'Navigation.opsTimers',
  '/dashboard/ops/users': 'Navigation.opsUsers',
  '/dashboard/ops/invitations': 'Navigation.opsInvitations',
  '/dashboard/ops/content': 'Navigation.opsContent',
  '/dashboard/ops/system': 'Navigation.opsSystem',
  '/dashboard/ops/comms': 'Navigation.opsComms',
  '/dashboard/ops/flags': 'Navigation.opsFlags',
  '/dashboard/ops/audit': 'Navigation.opsAudit',
  '/dashboard/ops/settings': 'Navigation.opsSettings',
};

/**
 * Path patterns whose LAST segment is dynamic and carries a record name the
 * page supplies at runtime (class, school, child, result). Listed explicitly so
 * an unregistered path can never be silently treated as a record.
 */
export const TRAIL_RECORD_PATTERNS: readonly string[] = [
  '/dashboard/children/[documentId]',
  '/dashboard/reports/[resultDocumentId]',
  '/dashboard/school/classes/[documentId]',
  '/dashboard/school/classes/[documentId]/students/[studentDocumentId]',
  '/dashboard/teach/classes/[documentId]',
  '/dashboard/teach/results/[classId]',
  '/dashboard/ops/schools/[documentId]',
  '/invite/[token]',
  '/school-onboarding/[token]',
];

/** Segments that are route groups or catch-alls and never appear in a trail. */
export const TRAIL_IGNORED_SEGMENTS: readonly string[] = ['(portal)', '(teacher)', '(legal)'];

export const RECORD_PATTERNS = new Set(TRAIL_RECORD_PATTERNS);
export const IGNORED = new Set(TRAIL_IGNORED_SEGMENTS);
