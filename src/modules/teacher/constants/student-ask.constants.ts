/** The three suggestion chips, in the design's order (`studentVals` ask.suggest). */
export const STUDENT_ASK_TOPICS = ['change', 'focus', 'vocab'] as const;

/** A typed question is matched in the design's order (`ask.resolve`): focus, vocabulary, then change. */
export const STUDENT_ASK_MATCH_ORDER = ['focus', 'vocab', 'change'] as const;

/** The voice answers are read in (the design speaks en-AU), per catalog locale. */
export const STUDENT_ASK_SPEECH_LANG: Readonly<Record<string, string>> = {
  en: 'en-AU',
  ko: 'ko-KR',
  ms: 'ms-MY',
  th: 'th-TH',
  vi: 'vi-VN',
  zh: 'zh-CN',
};

/** The drawer's dark round buttons (Speak, Close, mic): #3A404B hairline on the #23262E panel. */
export const STUDENT_ASK_ICON_BUTTON_CLASS =
  'flex flex-none cursor-pointer items-center justify-center border border-[#3A404B] outline-none focus-visible:ring-2 focus-visible:ring-[#8FA6EA]';
