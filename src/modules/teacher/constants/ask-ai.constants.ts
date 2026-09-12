/** The class drawer's three suggestion chips, in the design's order (`dak.suggest`). */
export const CLASS_ASK_SUGGESTIONS = ['teach', 'moved', 'vocab'] as const;

/** The student drawer's three, in the design's order (`stu.ask.suggest`). */
export const STUDENT_ASK_SUGGESTIONS = ['change', 'focus', 'vocab'] as const;

/** The voice answers are read in (the design speaks en-AU), per catalog locale. */
export const ASK_AI_SPEECH_LANG: Readonly<Record<string, string>> = {
  en: 'en-AU',
  ko: 'ko-KR',
  ms: 'ms-MY',
  th: 'th-TH',
  vi: 'vi-VN',
  zh: 'zh-CN',
};

/** The drawer's dark round buttons (Speak, Close, mic): #3A404B hairline on the #23262E panel. */
export const ASK_AI_ICON_BUTTON_CLASS =
  'flex flex-none cursor-pointer items-center justify-center border border-[#3A404B] outline-none focus-visible:ring-2 focus-visible:ring-[#8FA6EA] disabled:cursor-not-allowed disabled:opacity-60';
