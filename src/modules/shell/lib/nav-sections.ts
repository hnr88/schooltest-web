import { NAV_GROUP_LABEL_KEYS, NAV_GROUP_ORDER } from '@/modules/shell/constants/nav.constants';
import type { NavItem, NavSection } from '@/modules/shell/types/shell.types';

// Splits the already role-filtered rail into its rendered sections, in the order
// NAV_GROUP_ORDER declares. Empty groups are dropped, so a parent never sees a
// bare "Teach" overline and a teacher never sees a bare "Manage" one.
export function buildNavSections(items: readonly NavItem[]): readonly NavSection[] {
  return NAV_GROUP_ORDER.map((group) => ({
    group,
    labelKey: NAV_GROUP_LABEL_KEYS[group],
    items: items.filter((item) => item.group === group),
  })).filter((section) => section.items.length > 0);
}
