'use client';

import { useCallback, useMemo, useRef, useState } from 'react';

import { restFailureOf } from '@/lib/axios/strapi';
import { OPS_ACTION_MAX_IN_FLIGHT } from '@/modules/ops/actions/constants/ops-action.constants';
import { useOpsWriteGate } from '@/modules/ops/actions/hooks/use-ops-write-gate';
import {
  dispositionOfFailure,
  type OpsActionDisposition,
} from '@/modules/ops/actions/lib/ops-action-disposition';
import {
  settleOpsActionItem,
  summariseOpsActionRun,
} from '@/modules/ops/actions/lib/ops-action-run';
import { selectionKey } from '@/modules/ops/actions/lib/ops-selection';
import { showOpsToast } from '@/modules/ops/actions/lib/ops-toast';
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
 * The one runner every ops action and bulk action goes through.
 *
 * It dispatches at most `OPS_ACTION_MAX_IN_FLIGHT` single-item writes at a
 * time against the endpoints that already exist — there is no bulk-jobs API to
 * call. Cancelling stops dispatching and settles what is already in the air; it
 * never reverses a completed write, because nothing here can.
 */
export function useOpsActionRunner<T extends OpsActionTarget>(definition: OpsActionDefinition<T>) {
  const [state, setState] = useState<OpsActionRunState>(IDLE);
  const writeGate = useOpsWriteGate();
  const abortRef = useRef<AbortController | null>(null);
  const cancelledRef = useRef(false);
  const definitionRef = useRef(definition);
  const writeGateRef = useRef(writeGate);
  definitionRef.current = definition;
  writeGateRef.current = writeGate;

  const execute = useCallback(async function runTargets(
    targets: readonly T[],
  ): Promise<OpsActionSummary> {
    if (targets.length === 0) return summariseOpsActionRun([], 0);

    if (definitionRef.current.write) {
      const gate = writeGateRef.current;
      const reason = gate.blockedReason();
      if (reason !== null) {
        const results: OpsActionResultItem[] = targets.map((target) => ({
          documentId: target.documentId,
          kind: target.kind,
          outcome: 'not_started',
          status: null,
          error: null,
        }));
        setState({ ...IDLE, status: 'settled', total: targets.length, results });
        showOpsToast({
          tone: 'error',
          message: reason,
          ...(gate.retryWhenBlocked
            ? {
                action: {
                  label: gate.retryLabel,
                  run: async () => {
                    await runTargets(targets);
                  },
                },
              }
            : {}),
        });
        return summariseOpsActionRun(results, targets.length);
      }
    }

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
        record(await settleOpsActionItem(definitionRef.current, target, disposition));
        setState((previous) => ({ ...previous, inFlight: previous.inFlight - 1 }));
      }
    };

    const lanes = Math.min(OPS_ACTION_MAX_IN_FLIGHT, targets.length);
    await Promise.all(Array.from({ length: lanes }, worker));
    abortRef.current = null;
    setState((previous) => ({ ...previous, status: 'settled', inFlight: 0 }));
    return summariseOpsActionRun(results, targets.length);
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

  const summary: OpsActionSummary = useMemo(
    () => summariseOpsActionRun(state.results, state.total),
    [state.results, state.total],
  );

  return { state, summary, run: execute, cancel, retryUnsettled, reset };
}
