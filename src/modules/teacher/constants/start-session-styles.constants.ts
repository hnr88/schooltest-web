// Teacher Portal v2 "Start a new session" (`:1350–1599`), drawn values. Greys the
// design sets below AA (#9CA3AF sub-labels and fact labels, #7C8698 idle tabs)
// are drawn #6B7280, the kit's rule.

/**
 * Panel: #FAFBFC, r11, 30/32 padding, the design's `normal` line height. The
 * design's box is content-box, so its drawn size is 640 + 64 = 704 wide and
 * 88vh + 60 tall at most (`modal-start-test--test.png`: x 368–1072, y 24–876).
 */
export const START_SESSION_PANEL_CLASS =
  'block w-[704px] max-h-[calc(88vh+60px)] rounded-[11px] bg-[#FAFBFC] px-8 py-[30px] leading-[normal]';

export const FOCUS_RING_CLASS =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-900';

export const FIELD_LABEL_CLASS = 'mb-[9px] block text-[12.5px] font-semibold text-navy-900';

export const SCHEDULE_LABEL_CLASS = 'mb-1.5 block text-[12px] font-semibold text-[#6B7280]';

export const SCHEDULE_INPUT_CLASS =
  'h-[46px] w-full rounded-[12px] border-[1.5px] border-[#E5E7EB] bg-white px-3 text-[14px] text-navy-900 outline-none focus-visible:border-navy-900';

export const CLASS_SELECT_CLASS =
  'h-12 w-full cursor-pointer rounded-[12px] border-[1.5px] border-[#E5E7EB] bg-white px-3 text-[14px] text-navy-900 outline-none focus-visible:border-navy-900';

export const TIME_LIMIT_SELECT_CLASS =
  'h-10 shrink-0 cursor-pointer rounded-[10px] border border-[#E5E7EB] bg-white px-3 text-[13.5px] font-semibold text-navy-900 outline-none focus-visible:border-navy-900';

export const DEMO_NOTE_CLASS =
  'mt-4 rounded-[12px] border border-[#D6E2FA] bg-[#EEF4FF] px-4 py-3.5 text-[13px] leading-[1.55] text-[#26467E]';

export const NO_FREE_NOTE_CLASS =
  'mb-2.5 rounded-[10px] border border-[#F2DFB6] bg-[#FDF3E0] px-4 py-3.5 text-[13px] leading-[1.55] text-[#8A5A00]';

export const SCHEDULE_ERROR_BOX_CLASS = 'mt-2.5 rounded-[10px] border border-[#E9C4C0] bg-[#FDEEEC] px-4 py-[13px]';

export const TAB_LIST_CLASS =
  'mt-5 flex h-auto w-full flex-wrap items-stretch justify-start gap-0 rounded-none border-b border-[#ECEEF2] bg-transparent p-0 group-data-horizontal/tabs:h-auto';

export const TAB_TRIGGER_CLASS =
  'h-auto flex-none flex-col items-start justify-start gap-0 rounded-none border-0 border-b-[3px] border-transparent -mb-px px-5 pt-3 pb-[11px] text-[14.5px] leading-[normal] font-medium text-[#6B7280] transition-colors after:hidden hover:text-navy-900 data-active:border-navy-900 data-active:font-bold data-active:text-navy-900 motion-reduce:transition-none';

/**
 * The design-system ToggleRow, redrawn as the design's setting row (`ms`, `:1492`):
 * a 70.8px row — 15px/15px around an 18px label line (`normal`, not the primitive's
 * `text-sm` 20px), 3px, then the 18.8px description (P1 parity row 14).
 */
export const TOGGLE_ROW_CLASS =
  'gap-4 border-b-0 border-t border-[#F5F6F8] py-[15px] [&_label]:text-[14px] [&_label]:leading-[normal] [&_label]:text-navy-900 [&>div]:gap-[3px] [&>div>span]:text-[12.5px] [&>div>span]:leading-[1.5] [&>div>span]:text-[#6B7280] [&_[data-slot=switch][data-checked]]:bg-navy-900 [&_[data-slot=switch][data-unchecked]]:bg-[#D8DFEA]';

export const CTA_CLASS = 'h-[50px] rounded-[8px] px-[26px] text-[15px] font-bold text-white transition-colors';

export const CANCEL_CLASS =
  'h-[50px] cursor-pointer rounded-[12px] border border-[#E5E7EB] bg-white px-[22px] text-[14px] font-semibold text-navy-900 transition-colors hover:border-navy-900';

/**
 * Radio cards: "When" (`:1360`), skill (`:1408`), test (`:1432`) and scope (`:1456`).
 * Every dot is the design's 22px — on the skill card that is the whole 48 → 50px of
 * P1 parity row 16; the When card stays 78px, its two-line label being the taller child.
 */
export const CHOICE_CARD_SIZES = {
  when: { box: 'flex-1 basis-0 gap-2.5 px-3.5 py-[13px]', dot: 'size-[22px]', inner: 'size-[7px]', label: 'text-[14.5px]', desc: 'mt-0.5 text-[12px]' },
  skill: { box: 'flex-1 basis-0 gap-2 px-3 py-[13px]', dot: 'size-[22px]', inner: 'size-[7px]', label: 'text-[14px]', desc: '' },
  test: { box: 'gap-3.5 px-[18px] py-4', dot: 'size-[22px]', inner: 'size-2', label: 'text-[15px]', desc: 'mt-[3px] text-[12.5px]' },
  scope: { box: 'gap-3.5 px-[18px] py-[15px]', dot: 'size-[22px]', inner: 'size-2', label: 'text-[15px]', desc: 'mt-[3px] text-[12.5px]' },
} as const;
