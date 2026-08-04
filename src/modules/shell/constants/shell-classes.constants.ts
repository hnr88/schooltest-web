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
