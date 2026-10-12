import type { ConsentConfig, ConsentRowModel } from '@/modules/privacy-consent/types/consent.types';

export type PrivacyConsentPanelModel =
  | { status: 'hidden' }
  | { status: 'loading'; config: ConsentConfig }
  | {
      status: 'error';
      kind: 'notFound' | 'generic';
      config: ConsentConfig;
      retry: () => void;
      retrying: boolean;
    }
  | { status: 'ready'; config: ConsentConfig; rows: ConsentRowModel[] };
