'use client';

import { useMemo } from 'react';

import { deriveAttestationOptions } from '@/modules/privacy-consent/lib/consent-attestation';
import { useConsentConfigQuery } from '@/modules/privacy-consent/queries/use-consent-config.query';
import type { ConsentAttestationOptions } from '@/modules/privacy-consent/types/consent.types';

// What the school attestation may show, from the live `GET /api/consents/config`
// (the same cached read the panel uses). Hidden while the config loads, cannot be
// read, or `consent_records_enabled` is OFF, so every surface that mounts the
// attestation stays exactly as it was with the switches off.
export function useConsentAttestationOptions(): ConsentAttestationOptions {
  const config = useConsentConfigQuery().data;
  return useMemo(() => deriveAttestationOptions(config), [config]);
}
