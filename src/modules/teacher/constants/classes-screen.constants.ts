/**
 * The Classes screen (`Teacher Portal v2.dc.html:57–216`): its sorts, filter
 * keys and layouts (URL values — keep them stable, specs and links read them),
 * and the list's column recipe.
 */
export const CLASSES_SORTS = ['name', 'students', 'progress'] as const;

/** C-TD-1 `status` values, in the design's option order (`:102`). */
export const CLASSES_STATUS_FILTER = ['sitting_now', 'scheduled', 'no_tests_yet', 'complete'] as const;

export const CLASSES_FILTER_KEYS = { year: 'year', status: 'status' } as const;

/** List is the design's default body (`classView:'list'`); tiles ride `?layout=tiles`. */
export const CLASSES_LAYOUTS = ['table', 'tiles'] as const;

export const SOON_COLUMNS = ['listening', 'writing', 'speaking'] as const;
export const SOON_TILE_SKILLS = ['listen', 'write', 'speak'] as const;

/**
 * Column widths — content plus the design's 12px gap — that reproduce its flex
 * row (`:170–178`) at 1440px; the Class column takes the rest.
 */
export const CLASSES_TABLE_COLS = {
  reading: 'w-[138px]',
  listening: 'w-[110px]',
  writing: 'w-[104px]',
  speaking: 'w-[110px]',
  status: 'w-[144px]',
  export: 'w-[216px]',
} as const;

export const CLASSES_TH =
  'sticky top-0 z-[2] border-y border-[#ECEEF2] bg-white py-2.5 pl-3 text-left text-[11px] font-medium tracking-[0.07em] whitespace-nowrap text-[#6B7280] uppercase';

export const CLASSES_TD = 'border-b border-[#F3F4F6] py-[13px] pl-3 align-middle';

export const CLASSES_STATE_BOX =
  'flex flex-col items-center gap-2 border-t border-[#ECEEF2] px-8 py-14 text-center';
