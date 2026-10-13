'use client';

import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';

import { opsImportCommitResultSchema, opsImportReceiptSchema } from '@schooltest/ops-contracts';
import type { OpsImportReject } from '@schooltest/ops-contracts';

import { idempotencyHeaders, strapi } from '@/lib/axios/strapi';
import { portalImportPreviewSchema } from '@/modules/ops/schemas/import.schema';
import type { ConsentAttestationBody } from '@/modules/privacy-consent';

// The ONE write path behind every school admin import dialog (Students page
// with its class picker, class detail with the class fixed). It drives the SAME
// engine the ops portal uses — POST /api/schools/me/import-students/preview,
// then commit with a client-minted Idempotency-Key — replacing the retired
// one-POST-per-row loop: one csv, one preview, one transactional commit, and a
// receipt read to reconcile a lost connection instead of a blind re-send.
// Response shapes are parsed with the SAME boundary schemas the ops import
// panel uses, so the two portals cannot disagree about what came back.

export interface ImportStudentsInput {
  /** The raw csv text — the engine parses it server-side, never a client row. */
  csv: string;
  classDocumentId: string;
  /**
   * W4-21: the school's guardian-consent attestation (consent records ON, a box
   * ticked). Sent only with the commit; absent, the commit body is unchanged.
   */
  consentAttestation?: ConsentAttestationBody;
}

export type ImportStudentsResult =
  | { kind: 'rejected'; rejected: readonly OpsImportReject[] }
  | {
      kind: 'committed';
      created: number;
      skipped: number;
      /** The rows the server refused, each with its csv row number and reason. */
      rejected: readonly OpsImportReject[];
    };

/** 36 chars — inside the contract's 16..128 request-key bounds. */
function mintRequestKey(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `import-${Date.now()}-${Math.random().toString(36).slice(2, 12)}-${Math.random()
        .toString(36)
        .slice(2, 12)}`;
}

const receiptResultSchema = z.object({
  result: opsImportCommitResultSchema.nullable(),
});

async function importStudentsRequest({
  csv,
  classDocumentId,
  consentAttestation,
}: ImportStudentsInput): Promise<ImportStudentsResult> {
  // Validate first, write second — the preview is never trusted (the commit
  // re-validates server-side); it exists so a file with broken rows is named
  // BEFORE anything is created, and so an all-bad file writes nothing at all.
  const preview = await strapi.post<{ data: unknown }>('/api/schools/me/import-students/preview', {
    csv,
    class_documentId: classDocumentId,
  });
  const validated = portalImportPreviewSchema.parse(preview.data.data);
  // A file whose EVERY row is bad has nothing to write: name the rows and stop.
  // A file with SOME bad rows still commits. The server validates row by row,
  // creates the good ones and returns the bad ones per row, so one broken line
  // no longer throws away the rest of the roster — which is what refusing the
  // whole commit here used to do.
  if (validated.create.length === 0 && validated.skip_existing.length === 0) {
    return { kind: 'rejected', rejected: validated.reject };
  }

  const requestKey = mintRequestKey();
  // The attestation is part of the commit's own body, so a replay under the same
  // Idempotency-Key re-sends it and the idempotent attestation write is repaired.
  const commitBody = {
    csv,
    class_documentId: classDocumentId,
    ...(consentAttestation === undefined ? {} : { consent_attestation: consentAttestation }),
  };
  const commitOnce = async (): Promise<ImportStudentsResult> => {
    const commit = await strapi.post<{ data: unknown }>(
      '/api/schools/me/import-students/commit',
      commitBody,
      { headers: idempotencyHeaders(requestKey) },
    );
    const result = opsImportCommitResultSchema.parse(commit.data.data);
    return {
      kind: 'committed',
      created: result.created,
      skipped: result.skipped,
      rejected: result.rejected,
    };
  };
  try {
    return await commitOnce();
  } catch (error) {
    // A commit that lost its CONNECTION (no response) may still have landed:
    // ask the receipt instead of re-sending the write. A server REFUSAL (4xx/
    // 5xx with a response) is surfaced — a failed receipt is cleared, so the
    // same file can simply be retried.
    if (isLostConnection(error)) {
      // With an attestation the receipt alone is not enough: the attestation is
      // written after the commit, so a lost answer may hide a missing write. The
      // same key resolves to the stored commit and re-runs it (idempotent).
      if (consentAttestation !== undefined) {
        try {
          return await commitOnce();
        } catch (replayError) {
          if (!isLostConnection(replayError)) {
            throw replayError;
          }
        }
      }
      const receipt = await strapi.get<{ data: unknown }>(
        `/api/schools/me/import-students/receipts/${encodeURIComponent(requestKey)}`,
      );
      const stored = receiptResultSchema.parse(receipt.data.data);
      if (stored.result) {
        return {
          kind: 'committed',
          created: stored.result.created,
          skipped: stored.result.skipped,
          rejected: stored.result.rejected,
        };
      }
    }
    throw error;
  }
}

function isLostConnection(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'isAxiosError' in error &&
    (error as { response?: unknown }).response === undefined
  );
}

export function useImportStudentsMutation() {
  return useMutation({ mutationFn: importStudentsRequest });
}
