import { OPS_SELECTION_MAX } from '@/modules/ops/actions/constants/ops-action.constants';
import type { OpsActionTarget } from '@/modules/ops/actions/types/ops-action.types';

/** `kind:documentId` — two entities of different kinds never collide. */
export function selectionKey(target: OpsActionTarget): string {
  return `${target.kind}:${target.documentId}`;
}

/** The inverse, so a stored key still names the entity it addresses. */
export function targetFromKey(key: string): OpsActionTarget | null {
  const separator = key.indexOf(':');
  if (separator <= 0 || separator === key.length - 1) return null;
  return { kind: key.slice(0, separator), documentId: key.slice(separator + 1) };
}

export function isSelected(selected: ReadonlySet<string>, target: OpsActionTarget): boolean {
  return selected.has(selectionKey(target));
}

export function toggleTarget(
  selected: ReadonlySet<string>,
  target: OpsActionTarget,
): Set<string> {
  const next = new Set(selected);
  const key = selectionKey(target);
  if (next.has(key)) next.delete(key);
  else if (next.size < OPS_SELECTION_MAX) next.add(key);
  return next;
}

/**
 * "Select all" means THIS PAGE, and the cap is enforced here rather than in the
 * UI: a page larger than the cap adds rows in order and stops, so the count the
 * bulk bar shows is always the count that will actually be dispatched.
 */
export function selectPage(
  selected: ReadonlySet<string>,
  page: readonly OpsActionTarget[],
): Set<string> {
  const next = new Set(selected);
  for (const target of page) {
    if (next.size >= OPS_SELECTION_MAX) break;
    next.add(selectionKey(target));
  }
  return next;
}

export function clearPage(
  selected: ReadonlySet<string>,
  page: readonly OpsActionTarget[],
): Set<string> {
  const next = new Set(selected);
  for (const target of page) next.delete(selectionKey(target));
  return next;
}

export type OpsHeaderCheckboxState = 'none' | 'some' | 'all';

/**
 * Drives the indeterminate header checkbox. An empty page reads `none`, never
 * `all`: a header that claims everything is selected over zero rows is a lie
 * the operator would act on.
 */
export function headerCheckboxState(
  selected: ReadonlySet<string>,
  page: readonly OpsActionTarget[],
): OpsHeaderCheckboxState {
  if (page.length === 0) return 'none';
  let count = 0;
  for (const target of page) if (selected.has(selectionKey(target))) count += 1;
  if (count === 0) return 'none';
  return count === page.length ? 'all' : 'some';
}

/** Selected targets, in the page's own order, capped. */
export function selectedTargets(
  selected: ReadonlySet<string>,
  page: readonly OpsActionTarget[],
): OpsActionTarget[] {
  return page.filter((target) => selected.has(selectionKey(target))).slice(0, OPS_SELECTION_MAX);
}

/** True when the cap stopped the selection growing — the UI must say so. */
export function selectionAtCap(selected: ReadonlySet<string>): boolean {
  return selected.size >= OPS_SELECTION_MAX;
}
