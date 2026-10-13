'use client';

import { createContext, useContext } from 'react';

import type { ConsentAttestationContextValue } from '@/modules/privacy-consent/types/hooks.types';

export const ConsentAttestationContext = createContext<ConsentAttestationContextValue | null>(null);

// The attestation of the nearest provider, or null outside one. The create mutation
// reads it, so a create made anywhere without a provider sends no attestation.
export function useConsentAttestation(): ConsentAttestationContextValue | null {
  return useContext(ConsentAttestationContext);
}
