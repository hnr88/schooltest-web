'use client';

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { ConsentAttestationContext } from '@/modules/privacy-consent/hooks/use-consent-attestation';
import { useConsentAttestationOptions } from '@/modules/privacy-consent/hooks/use-consent-attestation-options';
import {
  buildConsentAttestation,
  EMPTY_ATTESTATION_SELECTION,
  isAttestationMissing,
} from '@/modules/privacy-consent/lib/consent-attestation';
import type {
  ConsentAttestationRefusal,
  ConsentAttestationSelection,
} from '@/modules/privacy-consent/types/consent.types';

// Holds the add-student form's attestation boxes. Mounted fresh with the form, so
// the boxes always start unticked and a ticked box never outlives the form.
export function ConsentAttestationProvider({ children }: { children: ReactNode }) {
  const options = useConsentAttestationOptions();
  const [selection, setSelectionState] = useState<ConsentAttestationSelection>(EMPTY_ATTESTATION_SELECTION);
  const [refusal, setRefusal] = useState<ConsentAttestationRefusal | null>(null);

  const value = useMemo(
    () => ({
      options,
      selection,
      setSelection: (next: ConsentAttestationSelection) => {
        setSelectionState(next);
        setRefusal(null);
      },
      refusal,
      reportRefusal: setRefusal,
      attestation: buildConsentAttestation(options, selection),
      missing: isAttestationMissing(options, selection),
    }),
    [options, selection, refusal],
  );

  return <ConsentAttestationContext.Provider value={value}>{children}</ConsentAttestationContext.Provider>;
}
