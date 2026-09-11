import type { ReportFormat, ReportKind } from '@/modules/teacher/types/class-reports.types';

/** The three radio cards of "What to produce", in the design's order (l.4426–4430). */
export const REPORT_KINDS: readonly ReportKind[] = ['student', 'class', 'ai'];

/** Picking a kind sets its formats; the first one is selected (design `rk.pick`). */
export const REPORT_FORMATS: Readonly<Record<ReportKind, readonly ReportFormat[]>> = {
  student: ['pdf', 'csv', 'print'],
  class: ['pdf', 'csv', 'print'],
  ai: ['markdown'],
};

/** Excel reads a UTF-8 CSV without mojibake only when it starts with a byte-order mark. */
export const CSV_BOM = '\uFEFF';

export const CSV_LINE_BREAK = '\r\n';

export const CSV_CONTENT_TYPE = 'text/csv;charset=utf-8';

/**
 * S30 panel (`Teacher Portal v2.dc.html:1628`): #FAFBFC, r11, 30/32 padding, no om-rise. The
 * design's div is content-box, so its declared 640 draws 640 + 2×32 = 704 wide (overlay-reports.png).
 */
export const REPORTS_PANEL_CLASS =
  'block w-[704px] animate-none rounded-[11px] bg-[#FAFBFC] px-8 py-[30px] leading-[normal]';

export const REPORTS_LABEL_CLASS = 'mb-[9px] block text-[12.5px] font-semibold text-navy-900';

/** The radio cards' descriptions draw at line-height 1.5 (l.1644); the shared ChoiceCard leaves it normal. */
export const REPORTS_KIND_GROUP_CLASS =
  'flex flex-col gap-2.5 [&_[data-slot=start-choice]>span:last-child>span+span]:leading-[1.5]';

/** The 50px footer buttons (l.1700–1701): radius 8 on both. */
export const REPORTS_CTA_CLASS =
  'h-[50px] rounded-[8px] px-[26px] text-[15px] font-bold disabled:bg-[#C4CEDC] disabled:opacity-100';

export const REPORTS_CANCEL_CLASS = 'h-[50px] rounded-[8px] px-[22px] text-[14px] font-semibold';
