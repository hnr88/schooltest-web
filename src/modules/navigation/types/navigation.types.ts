/** One crumb in a breadcrumb trail. `label` is already translated. */
export interface TrailCrumb {
  /** Locale-less href (`/dashboard/school`); the root crumb is `/`. */
  href: string;
  /** Full next-intl message key, e.g. `Shell.nav.school` or `Navigation.privacyPolicy`. */
  labelKey: string;
  /** True for the last crumb — rendered as `BreadcrumbPage`, never a link. */
  isCurrent: boolean;
  /**
   * A dynamic segment (`[documentId]`) whose label is not in the registry. The
   * caller supplies the real record name; until it resolves the crumb is
   * dropped rather than showing a raw id.
   */
  isRecord: boolean;
}

export interface Trail {
  crumbs: TrailCrumb[];
}

export interface BuildTrailOptions {
  /** Label for the trailing dynamic segment (class name, school name, …). */
  recordLabel?: string | null;
  /** Include the site-root crumb. Public pages do; the dashboard starts at `/dashboard`. */
  includeRoot?: boolean;
}
