// Geometry of every pill in the search filter bar, read from the design
// (.qa/design/spec/01 §8.2): 13px type, 9px 16px padding, radius 999. The DRAWN pill
// stays at that size; the 44px pointer target comes from the ::after expansion, the
// idiom ChoicePillGroup and IconButton already use.
export const SEARCH_CHIP_BASE =
  'relative inline-flex items-center gap-1.75 rounded-full border px-4 py-2.25 text-caption transition-[background-color,border-color,color,transform] duration-200 ease-out-expo select-none after:absolute after:inset-x-0 after:-inset-y-1 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100';
