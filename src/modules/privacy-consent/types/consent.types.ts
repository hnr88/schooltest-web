import type { z } from 'zod';

import type {
  consentAttestationBodySchema,
  consentAttestationTypeSchema,
  consentConfigSchema,
  consentGrantBodySchema,
  consentRecordSchema,
  consentSourceSchema,
  consentTypeSchema,
  eraseChannelSchema,
  eraseStudentBodySchema,
  eraseStudentResponseSchema,
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

// ---- W4-21: school attestation and student erasure ----------------------------

export type ConsentAttestationType = z.infer<typeof consentAttestationTypeSchema>;
export type ConsentAttestationBody = z.infer<typeof consentAttestationBodySchema>;

/** The two boxes of the attestation, as the administrator ticks them. Both start false. */
export type ConsentAttestationSelection = Record<ConsentAttestationType, boolean>;

/** What the live config allows the attestation to show. `visible` is false while records are off. */
export interface ConsentAttestationOptions {
  visible: boolean;
  /** `guardian_consent_required` (only counts while records are enabled): data collection must be ticked. */
  required: boolean;
  /** `ai_consent_required`: declining AI marking sends the writing to a teacher. */
  aiConsentRequired: boolean;
  policyVersion: string | null;
  /** The API-served wording per type; absent when the config carries none. */
  statements: Partial<Record<ConsentAttestationType, ConsentStatement>>;
}

/** A server refusal the attestation can show inline (409 `details.code`). */
export type ConsentAttestationRefusal = 'guardianRequired' | 'disabled';

export type EraseChannel = z.infer<typeof eraseChannelSchema>;
export type EraseStudentBody = z.infer<typeof eraseStudentBodySchema>;
export type EraseStudentResult = z.infer<typeof eraseStudentResponseSchema>['data'];

export interface EraseStudentInput {
  documentId: string;
  body: EraseStudentBody;
}

/** What the erase dialog collects. `receivedOn` is a `YYYY-MM-DD` date. */
export interface EraseRequestValues {
  typedName: string;
  channel: EraseChannel;
  reference: string;
  receivedOn: string;
}
