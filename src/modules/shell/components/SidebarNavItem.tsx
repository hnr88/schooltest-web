'use client';

import {
  NavCountBadge,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/modules/design-system';
import { Link } from '@/i18n/navigation';
import type { NavItem } from '@/modules/shell/types/shell.types';

// Canonical parent-rail item (Parent overview aside, DS §12 Navigation card):
// gap 11px, 14px label, 10px/12px padding, radius 10, 17px icon at stroke-width 2.
// Idle #475569 on transparent, hover #F1F5F9 with the label darkening to navy.
// The 40px visual box keeps the rail's rhythm; the ::after inset grows the hit
// area to 46px instead of inflating the padding. The inset is symmetric because
// the COLLAPSED rail squares the same item to 40x40 — a vertical-only expansion
// left it 41px WIDE there, failing in the other dimension.
//
// `overflow-visible` is LOAD-BEARING, not tidying. The vendored primitive's base
// (src/components/ui/sidebar.tsx, sidebarMenuButtonVariants) sets `overflow-hidden`
// together with `[&>span:last-child]:truncate`, and overflow-hidden CLIPS the
// pseudo-element: the CSS said 44 while a real elementFromPoint scan measured
// 40.5. The vendored file is read-only, so the override lands here and the
// truncation moves onto the label span itself (`min-w-0 truncate`), where it
// belongs — the span, not the button, is what must clip a long label.
//
// ACTIVE = SOLID PRIMARY (.qa/CONTRAST-SPEC.md → sidebarSpec §5, the single biggest
// fix in that spec). ds-Navigation.html specifies the active rail item verbatim as
// `color:#FFFFFF;background:#2563EB;padding:10px 12px;border-radius:10px;font-weight:600`.
// This is a choice between two canonical variants, not an invention: the App-Screens
// soft pill (#2563EB on #EFF5FF) measured 1.10:1 against the white rail, so the
// shell's most important state was carried by a 9% luminance step with no border,
// no shadow and no left rule. White on #2563EB is 5.17:1. Same radius, same padding,
// same 600 weight — only the two colours move. No left bar, no shadow, no border on
// the active item: canonical has zero of all three.
// Collapsed rail (no canonical state exists — defined here once): the same solid
// active, squared to 40x40 with the 17px icon centred, so the rail keeps its
// rhythm instead of shrinking to the primitive's 32px default.
const NAV_ITEM_CLASSES =
  'relative h-auto gap-2.75 overflow-visible rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors duration-200 ease-out after:absolute after:-inset-0.75 hover:bg-muted hover:text-foreground data-active:bg-sidebar-primary data-active:font-semibold data-active:text-sidebar-primary-foreground data-active:hover:bg-sidebar-primary data-active:hover:text-sidebar-primary-foreground motion-reduce:transition-none group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0! [&_svg]:size-4.25';

// The badge sits ON the active slab, so it inverts: #FFFFFF fill / #2563EB ink
// (8.59:1). Idle keeps the canonical #EFF5FF / #2563EB (4.72:1). The inversion
// idiom is canonical — white-on-navy CTA band, #2DD4BF status pill on navy.
const ACTIVE_BADGE_CLASSES = 'bg-card text-sidebar-primary';

interface SidebarNavItemProps {
  item: NavItem;
  label: string;
  isActive: boolean;
  count?: number;
  onNavigate: () => void;
}

function SidebarNavItem({ item, label, isActive, count, onNavigate }: SidebarNavItemProps) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isActive}
        tooltip={label}
        aria-label={label}
        className={NAV_ITEM_CLASSES}
        render={<Link href={item.href} onClick={onNavigate} />}
      >
        <item.icon aria-hidden="true" strokeWidth={2} />
        <span className="min-w-0 truncate group-data-[collapsible=icon]:hidden">{label}</span>
      </SidebarMenuButton>
      {count !== undefined && count > 0 ? (
        <SidebarMenuBadge className="top-2.5 right-3 h-5 p-0">
          <NavCountBadge count={count} className={isActive ? ACTIVE_BADGE_CLASSES : undefined} />
        </SidebarMenuBadge>
      ) : null}
    </SidebarMenuItem>
  );
}

export { SidebarNavItem };
