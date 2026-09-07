'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  legalUpdateBodySchema,
  type LegalSlug,
  type LegalUpdateBody,
  type LegalUpdateResponse,
} from '@schooltest/ops-contracts';

import { useAuthStore } from '@/modules/auth';
import { saveLegalDocument } from '@/modules/ops/actions/save-legal-document.action';
import { LEGAL_DOCUMENT_QUERY_KEY } from '@/modules/ops/queries/use-legal-document.query';

/**
 * Ledger 10 (D-008) — C-LEG-03 via the `saveLegalDocument` server action.
 *
 * This editor does NOT call Strapi from the browser, for the same measured
 * reason as the announcement editor: the public legal pages are CACHED under
 * the `legal-documents` tag and only the Next server can invalidate it. The
 * operator's token is forwarded so Strapi's own ops-only policy authorises the
 * write; the tag is bumped inside the action, after a real 200.
 */
export function useLegalUpdateMutation() {
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);

  return useMutation({
    mutationFn: async (input: {
      slug: LegalSlug;
      body: LegalUpdateBody;
    }): Promise<LegalUpdateResponse['data']> => {
      if (!token) throw new Error('the legal-document save needs a signed-in ops session');
      const body = legalUpdateBodySchema.parse(input.body);
      return saveLegalDocument({ token, slug: input.slug, body });
    },
    onSuccess: async () => {
      // Prefix match: every slug's hydration read goes stale together, and the
      // write just added an audit row the audit console would show stale.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['ops', 'legal-document'] }),
        queryClient.invalidateQueries({ queryKey: ['ops', 'audit-logs'] }),
      ]);
    },
  });
}
