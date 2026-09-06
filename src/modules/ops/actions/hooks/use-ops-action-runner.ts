'use client';

import { useCallback, useMemo, useRef, useState } from 'react';

import { restFailureOf } from '@/lib/axios/strapi';
import { OPS_ACTION_MAX_IN_FLIGHT } from '@/modules/ops/actions/constants/ops-action.constants';
import {
  dispositionOfFailure,
  envelopeOfDisposition,
  statusOfDisposition,
  type OpsActionDisposition,
} from '@/modules/ops/actions/lib/ops-action-disposition';
import { selectionKey } from '@/modules/ops/actions/lib/ops-selection';
import type {
  OpsActionDefinition,
  OpsActionResultItem,
  OpsActionRunState,
  OpsActionSummary,
  OpsActionTarget,
} from '@/modules/ops/actions/types/ops-action.types';

const IDLE: OpsActionRunState = {
  status: 'idle',
  total: 0,
  inFlight: 0,
  results: [],
  denied: false,
  requiresReauthentication: false,
  cooldownSeconds: null,
};

/**
 * Ask the API whether the write is visible. A read that itself fails answers
 * `null` — "still unknown" — because a failed read is not evidence of a failed
 * write, and treating it as one is how a bulk run comes to claim a rollback it
 * never observed.
 */
async function readBackOrUnknown<T extends OpsActionTarget>(
  definition: OpsActionDefinition<T>,
  target: T,
): Promise<boolean | null> {
  try {
    return await definition.readBack(target);
  } catch {
    return null;
  }
}

/**
 * Decide one item's terminal outcome from what the transport proved plus, where
 * the transport proved nothing, what an authorized read can see.
 *
 * The asymmetry is deliberate. A settled 4xx is the server declining, so the
 * item is `failed` without a read. Everything else that touched the wire is
 * read back, and a read that cannot confirm leaves the item `uncertain` rather
 * than inventing either verdict.
 */
async function settleItem<T extends OpsActionTarget>(
  definition: OpsActionDefinition<T>,
  target: T,
  disposition: OpsActionDisposition,
): Promise<OpsActionResultItem> {
  const base = {
    documentId: target.documentId,
    kind: target.kind,
    status: statusOfDisposition(disposition),
    error: envelopeOfDisposition(disposition),
  };

  if (disposition.kind === 'refused') return { ...base, outcome: 'failed' };
  if (disposition.kind === 'denied' || disposition.kind === 'unauthenticated') {
    return { ...base, outcome: 'failed' };
  }
  if (disposition.kind === 'cooldown') return { ...base, outcome: 'failed' };

  const applied = await readBackOrUnknown(definition, target);
  if (applied === true) return { ...base, outcome: 'success' };
  // Acknowledged but not visible, or never acknowledged at all: both are open
  // questions, and neither is a rollback anyone watched happen.
  return { ...base, outcome: 'uncertain' };
}

/**
 * The one runner every ops action and bulk action goes through.
 *
 * It dispatches at most `OPS_ACTION_MAX_IN_FLIGHT` single-item writes at a
 * time against the endpoints that already exist — there is no bulk-jobs API to
 * call. Cancelling stops dispatching and settles what is already in the air; it
 * never reverses a completed write, because nothing here can.
 */
export function useOpsActionRunner<T extends OpsActionTarget>(definition: OpsActionDefinition<T>) {
  const [state, setState] = useState<OpsActionRunState>(IDLE);
  const abortRef = useRef<AbortController | null>(null);
  const cancelledRef = useRef(false);
  const definitionRef = useRef(definition);
  definitionRef.current = definition;

  const execute = useCallback(async (targets: readonly T[]) => {
    if (targets.length === 0) return;
    const controller = new AbortController();
    abortRef.current = controller;
    cancelledRef.current = false;
    setState({ ...IDLE, status: 'running', total: targets.length });

    const queue = [...targets];
    const results: OpsActionResultItem[] = [];

    const record = (item: OpsActionResultItem) => {
      results.push(item);
      setState((previous) => ({
        ...previous,
        results: [...results],
        denied: previous.denied || item.status === 403,
        requiresReauthentication: previous.requiresReauthentication || item.status === 401,
      }));
    };

    const worker = async () => {
      for (;;) {
        const target = queue.shift();
        if (target === undefined) return;
        if (cancelledRef.current) {
          record({
            documentId: target.documentId,
            kind: target.kind,
            outcome: 'not_started',
            status: null,
            error: null,
          });
          continue;
        }
        setState((previous) => ({ ...previous, inFlight: previous.inFlight + 1 }));
        let disposition: OpsActionDisposition;
        try {
          await definitionRef.current.perform(target, controller.signal);
          disposition = { kind: 'acknowledged', status: 200 };
        } catch (error) {
          disposition = dispositionOfFailure(restFailureOf(error));
        }
        if (disposition.kind === 'cooldown') {
          const seconds = disposition.retryAfterSeconds;
          setState((previous) => ({ ...previous, cooldownSeconds: seconds }));
        }
        record(await settleItem(definitionRef.current, target, disposition));
        setState((previous) => ({ ...previous, inFlight: previous.inFlight - 1 }));
      }
    };

    const lanes = Math.min(OPS_ACTION_MAX_IN_FLIGHT, targets.length);
    await Promise.all(Array.from({ length: lanes }, worker));
    abortRef.current = null;
    setState((previous) => ({ ...previous, status: 'settled', inFlight: 0 }));
  }, []);

  /** Stop dispatching. In-flight work is still settled and still reported. */
  const cancel = useCallback(() => {
    cancelledRef.current = true;
    setState((previous) =>
      previous.status === 'running' ? { ...previous, status: 'cancelling' } : previous,
    );
  }, []);

  /**
   * Re-run only the items that are not proven applied, and only those still
   * eligible: an item another operator has since changed is dropped rather than
   * written over.
   */
  const retryUnsettled = useCallback(
    async (targets: readonly T[]) => {
      const unsettled = new Set(
        state.results
          .filter((item) => item.outcome === 'failed' || item.outcome === 'uncertain')
          .map((item) => `${item.kind}:${item.documentId}`),
      );
      const candidates = targets.filter((target) => unsettled.has(selectionKey(target)));
      const isEligible = definitionRef.current.isEligible;
      if (isEligible === undefined) return execute(candidates);
      const eligible = await Promise.all(candidates.map((target) => isEligible(target)));
      return execute(candidates.filter((_target, index) => eligible[index] === true));
    },
    [execute, state.results],
  );

  const reset = useCallback(() => {
    cancelledRef.current = false;
    abortRef.current = null;
    setState(IDLE);
  }, []);

  const summary: OpsActionSummary = useMemo(() => {
    const count = (outcome: OpsActionResultItem['outcome']) =>
      state.results.filter((item) => item.outcome === outcome).length;
    const succeeded = count('success');
    const uncertain = count('uncertain');
    return {
      succeeded,
      failed: count('failed'),
      notStarted: count('not_started'),
      uncertain,
      // Every accepted target, read back. A shorter result list means the run
      // is unfinished, and an unfinished run is never an all-success run.
      allSucceeded:
        state.total > 0 && state.results.length === state.total && succeeded === state.total,
      hasUnresolved: uncertain > 0,
    };
  }, [state.results, state.total]);

  return { state, summary, run: execute, cancel, retryUnsettled, reset };
}
