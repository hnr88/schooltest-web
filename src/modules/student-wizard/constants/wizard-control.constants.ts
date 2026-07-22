// Portal control box (spec 03 §1.4 `PortalInput` / `PortalSelect`): 48px tall,
// 12px radius, #D8DFEA rule, 15px inline padding (12px on a select), 14px navy ink
// on white, focus border #2563EB. The vendored base-ui primitives ship a 32px
// transparent field, so the height, fill and type size are corrected from the
// WRAPPER — never in components/ui. `md:text-body-md` is not redundant: the
// primitive carries `md:text-sm`, which wins at md unless the variant is restated.
export const WIZARD_CONTROL =
  'h-12 rounded-tile border-portal-input bg-card px-3.75 text-body-md text-foreground transition-colors duration-200 ease-out focus-visible:border-primary motion-reduce:transition-none md:text-body-md';

// Same box, but for a `button` trigger: base-ui's Select trigger pins its height with
// `data-[size=default]:h-8`, so a bare `h-12` loses on specificity and silently does
// nothing. The override has to repeat the variant.
export const WIZARD_TRIGGER =
  'min-h-12 w-full justify-between rounded-tile border-portal-input bg-card px-3 text-body-md font-normal text-foreground transition-colors duration-200 ease-out data-[size=default]:h-12 motion-reduce:transition-none';

// Portal chip (spec 03 §1.4 `PortalChip`): 44px tall, 12px radius, 13.5px label,
// navy-on-white when selected. The 2px `::after` bleed is a POINTER target only —
// a drawn 44px box measures 43.5 under a real elementFromPoint walk because
// device-pixel rounding eats the boundary half-pixel.
export const WIZARD_CHIP =
  'relative inline-flex h-11 min-w-0 items-center justify-center rounded-tile border text-body-sm font-medium transition duration-200 ease-out-expo after:absolute after:inset-x-0 after:-inset-y-0.5 hover:-translate-y-px focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-95 motion-reduce:transition-none motion-reduce:hover:translate-y-0';

export const WIZARD_CHIP_SELECTED = 'border-foreground bg-foreground text-card';

export const WIZARD_CHIP_IDLE =
  'border-portal-input bg-card text-body hover:border-foreground hover:bg-surface-hover';
