import type { z } from 'zod';

import type {
  consentConfigSchema,
  consentGrantBodySchema,
  consentRecordSchema,
  consentSourceSchema,
  consentTypeSchema,
} from '@/modules/privacy-consent/schemas/consent.schema';

export type ConsentConfig = z.infer<typeof consentConfigSchema>;
export type ConsentRecord = z.infer<typeof consentRecordSchema>;
export type ConsentType = z.infer<typeof consentTypeSchema>;
export type ConsentSource = z.infer<typeof consentSourceSchema>;
export type ConsentGrantBody = z.infer<typeof consentGrantBodySchema>;
export type ConsentStatement = ConsentConfig['statements'][number];

export type ConsentAudience = 'parent' | 'school_admin';

export type ConsentRowState = 'active' | 'withdrawn' | 'none';

// One row of the panel, resolved from the live config and the live ledger rows.
export interface ConsentRowModel {
  type: ConsentType;
  state: ConsentRowState;
  statement: ConsentStatement | null;
  /** The key of the record the row shows, when its wording is no longer current. */
  statementKey: string | null;
  /** ISO instant: granted (active) or withdrawn (withdrawn); null for `none`. */
  at: string | null;
  policyVersion: string | null;
  source: ConsentSource | null;
  /** documentId of the record a Withdraw acts on; null when nothing is active. */
  withdrawTarget: string | null;
  /** The resolved withdrawal is a guardian's, which a school attestation cannot override. */
  withdrawnByGuardian: boolean;
}

export interface ConsentWithdrawInput {
  documentId: string;
}
