// ROOT_CLASSES is the other half of the pointer target, and it is load-bearing.
// A consumer that makes this row scroll (Settings adds `overflow-x-auto`) turns the
// root into a 33px-tall scroll container, and `overflow-x:auto` forces overflow-y to
// compute to `auto` as well — so the ::before was CLIPPED and all four tabs really
// hit-tested at 33px however generous the inset looked in CSS. The 7px padding gives
// the pseudo 1px of room to spare INSIDE the clip rectangle and the matching
// negative margin hands the space straight back, so nothing in the surrounding
// column moves a pixel.
export const ROOT_CLASSES = 'gap-0 py-2 -my-2';

export const LIST_CLASSES =
  'w-full justify-start gap-6.5 rounded-none border-b border-border bg-transparent p-0 group-data-horizontal/tabs:h-auto';

export const TRIGGER_CLASSES =
  'relative h-auto flex-none rounded-none border-0 px-0.5 pt-0 pb-3 text-sm font-semibold whitespace-nowrap text-muted-foreground transition-colors duration-200 ease-out before:absolute before:inset-x-0 before:-inset-y-1.75 hover:text-foreground data-active:text-primary after:bg-primary group-data-horizontal/tabs:after:-bottom-px motion-reduce:transition-none dark:text-muted-foreground dark:data-active:text-primary';
