import {
  TRAIL_IGNORED_SEGMENTS,
  TRAIL_LABELS,
  TRAIL_RECORD_PATTERNS,
  TRAIL_ROOT_KEY,
} from '@/modules/navigation/constants/trail.constants';
import { IGNORED, RECORD_PATTERNS } from '@/modules/navigation/constants/trail.constants';
import type { BuildTrailOptions, Trail, TrailCrumb } from '@/modules/navigation/types/navigation.types';

/** A path segment that looks like an opaque record id rather than a literal route. */
function isDynamicSegment(segment: string): boolean {
  return /^[a-z0-9]{16,}$/i.test(segment) || /^\d+$/.test(segment);
}

/**
 * Resolve one cumulative path to its registry pattern. Literal segments match
 * directly; an id-shaped segment is tried as `[param]` against every registered
 * record pattern of the same depth.
 */
function patternFor(parts: readonly string[]): string | null {
  const literal = `/${parts.join('/')}`;
  if (literal in TRAIL_LABELS) return literal;

  const last = parts[parts.length - 1];
  if (!last || !isDynamicSegment(last)) return null;

  // Every `[param]` part matches an id-shaped segment at the same position, so a
  // record NESTED inside another record (a student inside a class) resolves too
  // — matching only the head literally would drop it, because the head itself
  // contains the class's id.
  for (const pattern of RECORD_PATTERNS) {
    const patternParts = pattern.split('/').filter(Boolean);
    if (patternParts.length !== parts.length) continue;
    if (!patternParts[patternParts.length - 1].startsWith('[')) continue;
    const matches = patternParts.every((part, index) =>
      part.startsWith('[') ? isDynamicSegment(parts[index]) : part === parts[index],
    );
    if (matches) return pattern;
  }
  return null;
}

/**
 * Turn a locale-less pathname into an ordered breadcrumb trail (mission task
 * 208). This is the single derivation both the visible crumbs and the
 * BreadcrumbList JSON-LD use, so they cannot drift.
 *
 * A dynamic record segment is emitted only when the caller supplies
 * `recordLabel`; otherwise it is dropped, because a raw documentId is never an
 * acceptable crumb.
 */
export function buildTrail(pathname: string, options: BuildTrailOptions = {}): Trail {
  const {
    recordLabel = null,
    recordLabels = null,
    currentLabel = null,
    includeRoot = true,
  } = options;

  const segments = pathname.split('?')[0].split('/').filter((s) => s && !IGNORED.has(s));
  const crumbs: TrailCrumb[] = [];

  if (includeRoot) {
    crumbs.push({ href: '/', labelKey: TRAIL_ROOT_KEY, isCurrent: segments.length === 0, isRecord: false });
  }

  const walked: string[] = [];
  for (const segment of segments) {
    walked.push(segment);
    const pattern = patternFor(walked);
    if (!pattern) continue;

    const href = `/${walked.join('/')}`;
    const isRecord = pattern.split('/').pop()?.startsWith('[') ?? false;
    // An ancestor record (the class a student sits in) takes its own name from
    // `recordLabels`; the trailing one falls back to `recordLabel`. A record
    // segment with no name is still dropped — a raw documentId is never a crumb.
    const ownLabel = isRecord ? (recordLabels?.[href] ?? null) : null;
    if (isRecord && !ownLabel && !recordLabel) continue;

    crumbs.push({
      href,
      ...(ownLabel ? { label: ownLabel } : {}),
      labelKey: isRecord ? '' : TRAIL_LABELS[pattern],
      isCurrent: false,
      isRecord,
    });
  }

  const last = crumbs[crumbs.length - 1];
  if (last) {
    last.isCurrent = true;
    // A data-driven page title wins over the catalog label for its own crumb.
    if (currentLabel) {
      last.labelKey = '';
      last.isRecord = true;
    }
  }
  return { crumbs };
}
