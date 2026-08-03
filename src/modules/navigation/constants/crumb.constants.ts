// Public-trail link ink and hit area.
//
// The public crumb row sits on --background (white), where --muted-foreground
// (#64748B) measures 4.76:1 — AA for body text, but the row also renders over
// the tinted sections some pages start with, so the ink takes --color-body
// (#475569, 7.58:1 on white) for a single consistent value that clears AA on
// every surface it can land on. The ::after inset expands the pointer target to
// 44px without changing the 20px text box.
export const PUBLIC_CRUMB_LINK_CLASSES =
  'relative inline-flex rounded-sm text-body transition-colors duration-200 ease-out after:absolute after:inset-x-0 after:-inset-y-3 hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-reduce:transition-none';
