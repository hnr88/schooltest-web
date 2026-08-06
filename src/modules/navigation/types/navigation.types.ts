/** One crumb in a breadcrumb trail. `label` is already translated. */
export interface TrailCrumb {
  /** Locale-less href (`/dashboard/school`); the root crumb is `/`. */
  href: string;
  /** A literal label resolved for this crumb (a record name), when one is known. */
  label?: string;
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
  /**
   * Labels for record segments ABOVE the trailing one, keyed by their href.
   * A route with two dynamic segments — a student inside a class — needs a
   * name for each, and `recordLabel` can only carry the last one.
   */
  recordLabels?: Readonly<Record<string, string>> | null;
  /**
   * Overrides the LAST crumb's label with a literal string. Used by pages whose
   * heading comes from data rather than the catalog (a legal document an ops
   * user has renamed), so the crumb and the JSON-LD follow the page instead of
   * drifting from it.
   */
  currentLabel?: string | null;
  /** Include the site-root crumb. Public pages do; the dashboard starts at `/dashboard`. */
  includeRoot?: boolean;
}

export interface PublicBreadcrumbProps {
  /** Locale-less pathname, e.g. `/eald/diagnose`. */
  readonly pathname: string;
  /** Human label for a trailing dynamic segment (article title, …). */
  readonly recordLabel?: string | null;
  /** Overrides the current page's crumb with a data-driven title. */
  readonly currentLabel?: string | null;
  readonly className?: string;
}
