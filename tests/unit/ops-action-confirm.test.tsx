import { act, useEffect } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { afterEach, describe, expect, test, vi } from 'vitest';

import { useOpsConfirmAction } from '@/modules/ops/actions/hooks/use-ops-confirm-action';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLElement;
let root: Root;
let confirm: ReturnType<typeof useOpsConfirmAction>;

function Harness({
  typed,
  onConfirm,
  onUpdate,
}: {
  typed?: string;
  onConfirm: () => Promise<void>;
  onUpdate: (value: ReturnType<typeof useOpsConfirmAction>) => void;
}) {
  const current = useOpsConfirmAction({ typed, onConfirm });
  useEffect(() => onUpdate(current), [current, onUpdate]);
  return null;
}

function renderConfirm(typed: string | undefined, onConfirm: () => Promise<void>) {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  const onUpdate = (value: ReturnType<typeof useOpsConfirmAction>) => {
    confirm = value;
  };
  act(() => root.render(<Harness typed={typed} onConfirm={onConfirm} onUpdate={onUpdate} />));
}

afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

describe('typed ops confirmation bindings', () => {
  test('typed declares and wires every stateful OpsTypedNameConfirm prop once', async () => {
    const onConfirm = vi.fn(async () => undefined);
    renderConfirm('Riverview Grammar', onConfirm);

    expect(confirm.typedConfirmProps).toEqual(
      expect.objectContaining({
        requiredName: 'Riverview Grammar',
        typedName: '',
        canConfirm: false,
      }),
    );
    act(() => confirm.typedConfirmProps?.onTypedNameChange('  riverview grammar  '));
    expect(confirm.typedConfirmProps?.canConfirm).toBe(true);
    await act(async () => {
      confirm.typedConfirmProps?.onConfirm();
    });
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  test('a plain confirmation exposes no typed component binding', () => {
    renderConfirm(undefined, async () => undefined);
    expect(confirm.typedConfirmProps).toBeNull();
    expect(confirm.canConfirm).toBe(true);
  });
});
