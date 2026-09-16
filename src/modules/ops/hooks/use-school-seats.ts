'use client';

import { isAxiosError } from 'axios';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useSchoolEntitlementQuery } from '@/modules/ops/queries/use-school-entitlement.query';
import { useSchoolSeatsMutation } from '@/modules/ops/queries/use-school-seats.mutation';

// Seat-assignment wiring for the ops school detail (C-ENT-02). The draft is
// seeded from the SAVED total and re-seeded whenever the server value changes,
// so a refused write can never leave the panel showing a cap the school does
// not hold — the same rule the plan panel follows. A 403 (wrong role) gets its
// own toast; anything else is the generic failure.
export function useSchoolSeats(schoolDocumentId: string, enabled: boolean) {
  const t = useTranslations('Ops.seats');
  const entitlement = useSchoolEntitlementQuery(schoolDocumentId, enabled);
  const mutation = useSchoolSeatsMutation(schoolDocumentId);

  const savedTotal = entitlement.data?.seats_total ?? null;
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (savedTotal !== null) setDraft(String(savedTotal));
  }, [savedTotal]);

  const parsed = Number(draft);
  const isValid = draft.trim() !== '' && Number.isInteger(parsed) && parsed >= 0;
  const used = entitlement.data?.seats_used ?? 0;

  const save = async () => {
    if (!isValid) {
      toast.error(t('invalidToast'));
      return;
    }
    try {
      const view = await mutation.mutateAsync(parsed);
      toast.success(t('savedToast', { total: view.seats_total }));
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 403) {
        toast.error(t('forbiddenToast'));
        return;
      }
      toast.error(t('errorToast'));
    }
  };

  return {
    draft,
    setDraft,
    save,
    isValid,
    // Nothing to save until the typed number differs from the stored one.
    dirty: savedTotal !== null && isValid && parsed !== savedTotal,
    // A cap BELOW the live roster is a legitimate state — students are never
    // evicted to fit a smaller plan — but it means no further student can be
    // added, so the panel says that instead of showing a healthy meter.
    overAllocated: isValid && parsed < used,
    used,
    total: entitlement.data?.seats_total ?? 0,
    remaining: entitlement.data?.seats_remaining ?? 0,
    isLoading: entitlement.isPending,
    isError: entitlement.isError,
    pending: mutation.isPending,
  };
}
