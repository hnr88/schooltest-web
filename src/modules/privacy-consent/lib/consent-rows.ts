import {
  ALWAYS_LISTED_CONSENT_TYPES,
  GUARDIAN_CONSENT_SOURCES,
  RECORD_ONLY_CONSENT_TYPES,
} from '@/modules/privacy-consent/constants/components.constants';
import type {
  ConsentConfig,
  ConsentRecord,
  ConsentRowModel,
  ConsentType,
} from '@/modules/privacy-consent/types/consent.types';

const byGrantedDesc = (a: ConsentRecord, b: ConsentRecord) =>
  Date.parse(b.granted_at) - Date.parse(a.granted_at);

const isGuardian = (record: ConsentRecord) => GUARDIAN_CONSENT_SOURCES.includes(record.source);

const empty = (type: ConsentType): ConsentRowModel => ({
  type,
  state: 'none',
  statement: null,
  statementKey: null,
  at: null,
  policyVersion: null,
  source: null,
  withdrawTarget: null,
  withdrawnByGuardian: false,
});

// The same reading the API gates use (`hasActiveConsent`): a guardian's most recent
// withdrawal denies even while a school attestation is still on file; otherwise any
// non-withdrawn row allows. Display only; the server stays the authority.
export function resolveConsentRow(
  type: ConsentType,
  config: ConsentConfig,
  records: readonly ConsentRecord[],
): ConsentRowModel {
  const current = config.statements.find((statement) => statement.type === type) ?? null;
  const rows = records.filter((record) => record.consent_type === type).sort(byGrantedDesc);
  const base = { ...empty(type), statement: current };
  if (rows.length === 0) {
    return base;
  }

  const latestGuardian = rows.find(isGuardian);
  if (latestGuardian?.withdrawn_at != null) {
    return {
      ...base,
      state: 'withdrawn',
      at: latestGuardian.withdrawn_at,
      policyVersion: latestGuardian.policy_version,
      source: latestGuardian.source,
      withdrawnByGuardian: true,
    };
  }

  const active = rows.filter((record) => record.withdrawn_at === null);
  const shown = active.find(isGuardian) ?? active[0];
  if (shown !== undefined) {
    const stated = config.statements.find((statement) => statement.key === shown.statement_key);
    return {
      ...base,
      state: 'active',
      statement: stated ?? null,
      statementKey: stated === undefined ? shown.statement_key : null,
      at: shown.granted_at,
      policyVersion: shown.policy_version,
      source: shown.source,
      withdrawTarget: shown.documentId,
    };
  }

  const lastWithdrawn = rows.reduce((latest, record) =>
    Date.parse(record.withdrawn_at ?? '') > Date.parse(latest.withdrawn_at ?? '') ? record : latest,
  );
  return {
    ...base,
    state: 'withdrawn',
    at: lastWithdrawn.withdrawn_at,
    policyVersion: lastWithdrawn.policy_version,
    source: lastWithdrawn.source,
  };
}

export function buildConsentRows(
  config: ConsentConfig,
  records: readonly ConsentRecord[],
): ConsentRowModel[] {
  const hasStatement = (type: ConsentType) =>
    config.statements.some((statement) => statement.type === type);
  const hasRecord = (type: ConsentType) => records.some((record) => record.consent_type === type);
  return [
    ...ALWAYS_LISTED_CONSENT_TYPES.filter(hasStatement),
    ...RECORD_ONLY_CONSENT_TYPES.filter(hasRecord),
  ].map((type) => resolveConsentRow(type, config, records));
}
