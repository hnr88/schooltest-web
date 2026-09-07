// Breadcrumb link ink and hit area, shared by the dashboard topbar trail and the
// public trail so both read identically.
//
// The trail sits on the WELL (#EEF2F7), not on white chrome: --muted-foreground
// measures 4.23:1 there and drops under AA, so the crumb ink steps to
// --color-body (#475569, 6.74:1). Links keep their 20px canonical text box; the
// ::after inset expands the pointer target to 44px without changing layout.
export const CRUMB_LINK_CLASSES =
  'relative inline-flex rounded-sm text-body transition-colors duration-200 ease-out after:absolute after:inset-x-0 after:-inset-y-3 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none motion-reduce:transition-none';

// A label-only crumb (TRAIL_NONLINK_PATHS): a real level of the hierarchy with
// no page behind it. Same --color-body ink as a link so the trail still reads as
// one row, and NONE of the interactive affordances — no hover colour, no focus
// ring, no 44px expanded target — because there is nothing to press. It is also
// not the current page, so it never takes the current crumb's 600 weight.
export const CRUMB_TEXT_CLASSES = 'inline-flex text-body';
