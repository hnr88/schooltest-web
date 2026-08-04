'use client';

import { SidebarMenuButton, SidebarMenuItem } from '@/modules/design-system';
import { Link } from '@/i18n/navigation';
import type { NavItem } from '@/modules/shell/types/shell.types';
import { NAV_ITEM_CLASSES } from '@/modules/shell/constants/shell-classes.constants';

import type { SidebarNavItemProps } from '@/modules/shell/types/shell.types';

// Nav item, verbatim from the DETACHED rail slice (.qa/design/spec/01 §1.2,
// portal--detached-sidebar.html:6): `gap:12px; padding:11px 14px; border-radius:12px;
// font-size:14.5px`, an 18px icon at stroke-width 1.8, and two states —
// active `600 / #0E2350 / #FFFFFF`, inactive `500 / transparent / #7C8698`.
//
// ONE substitution, recorded: inactive ink is --muted-foreground (#64748B, 4.76:1
// on the white card) instead of the slice's #7C8698, which measures 3.67:1 and
// fails WCAG AA 1.4.3 for a 14.5px label. Active white-on-navy is 15.4:1.
//
// The slice declares NO hover and NO focus state (spec §11.3: "the sidebar nav has
// no hover style at all"; UNKNOWNS: "no :focus … anywhere"). Both are authored here
// from tokens: hover is the canonical recess (--color-surface-inset) with the label
// darkening to --foreground, press is a 2% scale-down. Only transform and colour move.
//
// FOCUS RING: --ring / --sidebar-ring both ship at 35% alpha, which composites to
// ~#B3C8F8 on the white card — 1.68:1, below the 3:1 WCAG 2.1 SC 1.4.11 floor for a
// focus indicator. The ring is therefore drawn from --primary: the SAME hue at full
// alpha, 5.17:1. Every focusable surface in this module uses that one ring.
//
// `overflow-visible` is LOAD-BEARING, not tidying: the vendored primitive's base
// (src/components/ui/sidebar.tsx, sidebarMenuButtonVariants) sets `overflow-hidden`
// with `[&>span:last-child]:truncate`, and overflow-hidden CLIPS the ::after that
// carries the 46px pointer target. The vendored file is read-only, so the override
// lands here and the truncation moves onto the label span itself.
//
// Collapsed rail (the slice has no collapsed state at all — defined here once): the
// same solid active slab squared to 40x40 with the 18px icon centred.
function SidebarNavItem({ item, label, isActive, onNavigate }: SidebarNavItemProps) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isActive}
        tooltip={label}
        aria-label={label}
        className={NAV_ITEM_CLASSES}
        render={<Link href={item.href} onClick={onNavigate} />}
      >
        <item.icon aria-hidden="true" strokeWidth={1.8} />
        <span className="min-w-0 truncate group-data-[collapsible=icon]:hidden">{label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export { SidebarNavItem };
