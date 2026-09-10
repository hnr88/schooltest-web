import { act, useEffect } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import type {
  OpsActionDefinition,
  OpsActionSummary,
  OpsActionTarget,
} from '@/modules/ops/actions/types/ops-action.types';
import type { OpsToastInput } from '@/modules/ops/actions/lib/ops-toast';

const mocks = vi.hoisted(() => ({
  gate: {
    blockedReason: vi.fn<() => string | null>(() => null),
    retryWhenBlocked: false,
    retryLabel: 'Retry',
  },
  showToast: vi.fn<(input: OpsToastInput) => string | number>(() => 'toast-id'),
}));

vi.mock('@/modules/ops/actions/hooks/use-ops-write-gate', () => ({
  useOpsWriteGate: () => mocks.gate,
}));
vi.mock('@/modules/ops/actions/lib/ops-toast', () => ({ showOpsToast: mocks.showToast }));

import { useOpsActionRunner } from '@/modules/ops/actions/hooks/use-ops-action-runner';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

const TARGETS = [
  { kind: 'school', documentId: 'school-a' },
  { kind: 'school', documentId: 'school-b' },
] as const;

let host: HTMLElement;
let root: Root;
let runner: ReturnType<typeof useOpsActionRunner<OpsActionTarget>>;

function Harness({
  definition,
  onRunner,
}: {
  definition: OpsActionDefinition<OpsActionTarget>;
  onRunner: (value: ReturnType<typeof useOpsActionRunner<OpsActionTarget>>) => void;
}) {
  const current = useOpsActionRunner(definition);
  useEffect(() => onRunner(current), [current, onRunner]);
  return null;
}

function renderRunner(definition: OpsActionDefinition<OpsActionTarget>) {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  const onRunner = (value: ReturnType<typeof useOpsActionRunner<OpsActionTarget>>) => {
    runner = value;
  };
  act(() => root.render(<Harness definition={definition} onRunner={onRunner} />));
}

function definition(write = true): OpsActionDefinition<OpsActionTarget> {
  return {
    write,
    perform: vi.fn(async () => undefined),
    readBack: vi.fn(async () => true),
  };
}

beforeEach(() => {
  Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
  mocks.gate.blockedReason.mockReset().mockReturnValue(null);
  mocks.gate.retryWhenBlocked = false;
  mocks.gate.retryLabel = 'Retry';
  mocks.showToast.mockClear();
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

describe('ops action runner write gate', () => {
  test('read-only blocks before any request and reports every target notStarted', async () => {
    const action = definition();
    mocks.gate.blockedReason.mockReturnValue('READ_ONLY');
    renderRunner(action);

    let summary: OpsActionSummary | undefined;
    await act(async () => {
      summary = await runner.run(TARGETS);
    });

    expect(action.perform).not.toHaveBeenCalled();
    expect(action.readBack).not.toHaveBeenCalled();
    expect(summary).toEqual({
      succeeded: 0,
      failed: 0,
      notStarted: 2,
      uncertain: 0,
      allSucceeded: false,
      hasUnresolved: false,
    });
    expect(runner.state.results.every((item) => item.outcome === 'not_started')).toBe(true);
    expect(mocks.showToast).toHaveBeenCalledWith({ tone: 'error', message: 'READ_ONLY' });
  });

  test('offline Retry re-runs the same targets after the gate clears', async () => {
    const action = definition();
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
    window.dispatchEvent(new Event('offline'));
    mocks.gate.blockedReason.mockImplementation(() =>
      navigator.onLine ? null : 'OFFLINE',
    );
    mocks.gate.retryWhenBlocked = true;
    renderRunner(action);
    await act(async () => {
      await runner.run(TARGETS);
    });

    const toast = mocks.showToast.mock.calls[0]?.[0];
    expect(action.perform).not.toHaveBeenCalled();
    expect(toast?.action?.label).toBe('Retry');

    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
    window.dispatchEvent(new Event('online'));
    await act(async () => {
      await toast?.action?.run();
    });
    expect(action.perform).toHaveBeenCalledTimes(2);
    expect(action.readBack).toHaveBeenCalledTimes(2);
    expect(runner.summary.allSucceeded).toBe(true);
  });

  test('a write:false action bypasses both capability and offline refusal', async () => {
    const action = definition(false);
    mocks.gate.blockedReason.mockReturnValue('READ_ONLY');
    renderRunner(action);
    await act(async () => {
      await runner.run(TARGETS.slice(0, 1));
    });

    expect(mocks.gate.blockedReason).not.toHaveBeenCalled();
    expect(action.perform).toHaveBeenCalledOnce();
    expect(action.readBack).toHaveBeenCalledOnce();
    expect(runner.summary.allSucceeded).toBe(true);
  });

  test('write is required on every definition at compile time', () => {
    const withoutWrite = {
      perform: async () => undefined,
      readBack: async () => true,
    };
    // @ts-expect-error -- removing required `write` must keep `pnpm typecheck` red.
    const invalid: OpsActionDefinition<OpsActionTarget> = withoutWrite;
    expect(invalid.perform).toBe(withoutWrite.perform);
  });
});
