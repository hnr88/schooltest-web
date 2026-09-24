import type { FaqEntry, HowToStepInput } from '@/modules/seo/types/json-ld-input.types';

export type AeoPage = 'home' | 'diagnose' | 'teach' | 'track' | 'predict' | 'report';

export type AeoServicePage = Exclude<AeoPage, 'home'>;

/** Translated AEO copy for one page: the visible FAQ plus its section chrome. */
export interface AeoFaqContent {
  readonly heading: string;
  readonly intro: string;
  readonly entries: readonly FaqEntry[];
}

export interface AeoHowToContent {
  readonly heading: string;
  readonly intro: string;
  readonly steps: readonly HowToStepInput[];
}

export interface AeoServiceContent {
  readonly name: string;
  readonly serviceType: string;
}
