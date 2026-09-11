import type { ShellSkin, UserMenuSkinClasses } from '@/modules/shell/types/shell.types';

// Long utility strings for the shell chrome. Extracted verbatim; every class,
// including the pointer-target ::after insets, is unchanged.

export const RAIL_CLASSES =
  'h-svh shrink-0 p-6 group-data-[side=left]:border-r-0 max-md:hidden [&_[data-slot=sidebar-inner]]:animate-in [&_[data-slot=sidebar-inner]]:rounded-card [&_[data-slot=sidebar-inner]]:shadow-float [&_[data-slot=sidebar-inner]]:duration-300 [&_[data-slot=sidebar-inner]]:ease-out-expo [&_[data-slot=sidebar-inner]]:fade-in [&_[data-slot=sidebar-inner]]:slide-in-from-left-3 [&_[data-slot=sidebar-inner]]:motion-reduce:animate-none';

export const CONTROL_CLASSES =
  'relative size-11 rounded-full border-0 bg-card text-body shadow-sm transition-[transform,color] duration-200 ease-out after:absolute after:-inset-1 hover:bg-card hover:-translate-y-px hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none motion-reduce:transition-none motion-reduce:hover:translate-y-0 [&_svg]:size-4.5';

export const BELL_SKIN_CLASSES =
  'flex items-center gap-2 [&_[data-slot=notification-bell]]:rounded-full [&_[data-slot=notification-bell]]:bg-card [&_[data-slot=notification-bell]]:shadow-sm';

export const LOGO_LINK_CLASSES =
  'relative mb-9 ml-3 self-start rounded-md transition-[opacity,transform] duration-200 ease-out after:absolute after:-inset-2.5 hover:-translate-y-px hover:opacity-80 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none motion-reduce:transition-none motion-reduce:hover:translate-y-0 group-data-[collapsible=icon]:mb-6 group-data-[collapsible=icon]:ml-0';

export const NAV_ITEM_CLASSES =
  'relative h-auto gap-3 overflow-visible rounded-tile px-3.5 py-2.75 text-lede leading-tight font-medium text-muted-foreground transition-[color,background-color,transform] duration-200 ease-out after:absolute after:-inset-0.75 hover:bg-surface-inset hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary active:scale-98 active:bg-surface-inset active:text-foreground data-active:bg-navy-900 data-active:font-semibold data-active:text-white data-active:hover:bg-navy-900 data-active:hover:text-white data-active:active:bg-navy-900 data-active:active:text-white motion-reduce:transition-none motion-reduce:active:scale-100 group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0! [&_svg]:size-4.5';

export const USER_CARD_CLASSES =
  'relative flex w-full items-center gap-2.75 rounded-panel bg-surface-inset px-3.5 py-3 text-left transition-[transform,background-color] duration-200 ease-out hover:-translate-y-px hover:bg-divider focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none motion-reduce:transition-none motion-reduce:hover:translate-y-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:hover:translate-y-0';

// ── Teacher Portal v2 (Teacher Portal v2.dc.html:25–52) ─────────────────────────
// Teacher-only: the shell picks these when isTeacherFrame() holds; every other role
// renders the set above, untouched.

// The rail card: radius 10, a 1px #ECEEF2 border, no float shadow (:25).
export const TEACHER_RAIL_CLASSES =
  'h-svh shrink-0 p-6 group-data-[side=left]:border-r-0 max-md:hidden [&_[data-slot=sidebar-inner]]:animate-in [&_[data-slot=sidebar-inner]]:rounded-[10px] [&_[data-slot=sidebar-inner]]:border [&_[data-slot=sidebar-inner]]:border-[#ECEEF2] [&_[data-slot=sidebar-inner]]:duration-300 [&_[data-slot=sidebar-inner]]:ease-out-expo [&_[data-slot=sidebar-inner]]:fade-in [&_[data-slot=sidebar-inner]]:slide-in-from-left-3 [&_[data-slot=sidebar-inner]]:motion-reduce:animate-none';

// The 40px lockup's link: margin 0 12px 26px (:26).
export const TEACHER_LOGO_LINK_CLASSES =
  'relative mb-6.5 ml-3 self-start rounded-md transition-[opacity,transform] duration-200 ease-out after:absolute after:-inset-2.5 hover:-translate-y-px hover:opacity-80 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none motion-reduce:transition-none motion-reduce:hover:translate-y-0 group-data-[collapsible=icon]:mb-6 group-data-[collapsible=icon]:ml-0';

// Nav item (:29/:32, states from nav() at :2972): active 600 navy on #EEF1F6, idle
// 500 #5B6879 (5.6:1 on white, AA as drawn) on transparent.
export const TEACHER_NAV_ITEM_CLASSES =
  'relative h-auto gap-3 overflow-visible rounded-tile px-3.5 py-2.75 text-lede leading-tight font-medium text-[#5B6879] transition-[color,background-color,transform] duration-200 ease-out after:absolute after:-inset-0.75 hover:bg-[#F5F6F8] hover:text-navy-900 focus-visible:ring-2 focus-visible:ring-primary active:scale-98 active:bg-[#F5F6F8] active:text-navy-900 data-active:bg-[#EEF1F6] data-active:font-semibold data-active:text-navy-900 data-active:hover:bg-[#EEF1F6] data-active:hover:text-navy-900 data-active:active:bg-[#EEF1F6] data-active:active:text-navy-900 motion-reduce:transition-none motion-reduce:active:scale-100 group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0! [&_svg]:size-4.5';

// The live dot on Live sessions (:34): 9px #DC2626 on a 1.4s ease-in-out pulse.
export const TEACHER_LIVE_DOT_CLASSES =
  'ml-auto size-[9px] shrink-0 animate-om-pulse rounded-full bg-destructive motion-reduce:animate-none group-data-[collapsible=icon]:hidden';

// The rule above the user card (:38): 1px #F5F6F8 with a 12px 6px margin.
export const TEACHER_FOOTER_RULE_CLASSES = 'mx-1.5 my-3 h-px shrink-0 bg-[#F5F6F8]';

// The user card and its menu, per frame. 'default' is the card above, byte for
// byte; 'teacher' is :40–50: a transparent 10px card (hover #F5F6F8, open #EEF1F6),
// a 34px navy initial, a 13.5/600 name, an 11.5px #6B7280 role, and a card-wide
// 10px menu holding one #B42318 Sign out row.
export const USER_MENU_SKIN_CLASSES: Record<ShellSkin, UserMenuSkinClasses> = {
  default: {
    card: USER_CARD_CLASSES,
    avatar:
      'grid size-9 shrink-0 place-items-center rounded-full bg-navy-900 text-caption font-semibold text-white',
    text: 'flex min-w-0 flex-col gap-px group-data-[collapsible=icon]:hidden',
    name: 'truncate text-body-sm font-semibold text-foreground',
    role: 'truncate text-xs text-body',
    content: 'w-56',
  },
  teacher: {
    card: 'relative flex w-full items-center gap-2.75 rounded-[10px] bg-transparent px-3.5 py-2.75 text-left transition-colors duration-200 ease-out hover:bg-[#F5F6F8] focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none data-popup-open:bg-[#EEF1F6] data-popup-open:hover:bg-[#EEF1F6] motion-reduce:transition-none group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0',
    avatar:
      'grid size-8.5 shrink-0 place-items-center rounded-full bg-navy-900 text-[13px] leading-none font-semibold text-white',
    text: 'flex min-w-0 flex-1 flex-col leading-tight group-data-[collapsible=icon]:hidden',
    name: 'truncate text-[13.5px] font-semibold text-navy-900',
    role: 'mt-px truncate text-[11.5px] text-[#6B7280]',
    content:
      'w-(--anchor-width) min-w-0 rounded-[10px] border border-[#F5F6F8] p-1.5 shadow-[0_16px_40px_rgba(14,35,80,0.18)] ring-0',
    signOut:
      'gap-2.5 rounded-[10px] px-3 py-2.5 text-[13.5px] leading-tight font-medium data-[variant=destructive]:text-[#B42318] data-[variant=destructive]:focus:bg-[#FDEEEC] data-[variant=destructive]:focus:text-[#B42318] data-[variant=destructive]:*:[svg]:text-[#B42318]',
  },
};
