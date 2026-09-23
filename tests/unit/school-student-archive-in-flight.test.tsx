import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

/**
 * The roster's Archive / Unarchive confirm fires its mutation ONCE per press.
 *
 * The confirm button disables on `isPending`, which TanStack Query publishes
 * after mutate() on a later tick. A double-click lands its second click before
 * that re-render, on the same enabled button and the same handler closure, so
 * the handler itself must refuse a second call while the first is in flight.
 * Live e2e (fleet5-status 44, 2026-09-23): a double-click on "Archive student"
 * sent the archive twice and showed two success toasts.
 */

const mocks = vi.hoisted(() => ({
  archiveMutateAsync: vi.fn(),
  unarchiveMutateAsync: vi.fn(),
  showOpsToast: vi.fn(),
}));

vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) => `${namespace}.${key}`,
}));
vi.mock('@/modules/ops/actions', () => ({ showOpsToast: mocks.showOpsToast }));
vi.mock('@/modules/school-students/queries/use-archive-student.mutation', () => ({
  useArchiveStudentMutation: () => ({ mutateAsync: mocks.archiveMutateAsync, isPending: false }),
}));
vi.mock('@/modules/school-students/queries/use-unarchive-student.mutation', () => ({
  useUnarchiveStudentMutation: () => ({ mutateAsync: mocks.unarchiveMutateAsync, isPending: false }),
}));

import {
  useStudentArchive,
  useStudentUnarchive,
} from '@/modules/school-students/hooks/use-student-row-actions';
import type { SchoolStudent } from '@/modules/school-students/types/school-students.types';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

const STUDENT: SchoolStudent = {
  documentId: 'stu-doc-1',
  given_name: 'Dee',
  family_name: 'DblArch',
  student_status: 'active',
  email_fix_requested: false,
  first_language: null,
  acara_phase: null,
  diagnostic_status: null,
  class: null,
};

let container: HTMLDivElement | null = null;
let root: Root | null = null;

function mount<T>(useHook: () => T): { current: T } {
  const handle = { current: null as unknown as T };
  function Probe() {
    handle.current = useHook();
    return null;
  }
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root?.render(createElement(Probe));
  });
  return handle;
}

function deferred(): { promise: Promise<unknown>; resolve: (value: unknown) => void } {
  let resolve: (value: unknown) => void = () => undefined;
  const promise = new Promise<unknown>((settle) => {
    resolve = settle;
  });
  return { promise, resolve };
}

beforeEach(() => {
  mocks.archiveMutateAsync.mockReset();
  mocks.unarchiveMutateAsync.mockReset();
  mocks.showOpsToast.mockReset();
});

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
  root = null;
  container = null;
});

describe('roster archive confirm: one request per press', () => {
  test('a double-click on the archive confirm sends ONE archive request and one toast', async () => {
    const request = deferred();
    mocks.archiveMutateAsync.mockImplementation(() => request.promise);
    const handle = mount(useStudentArchive);
    act(() => handle.current.requestArchive(STUDENT));

    const { confirmArchive } = handle.current;
    let first: Promise<void> = Promise.resolve();
    let second: Promise<void> = Promise.resolve();
    act(() => {
      first = confirmArchive();
      second = confirmArchive();
    });
    expect(mocks.archiveMutateAsync).toHaveBeenCalledTimes(1);
    expect(mocks.archiveMutateAsync).toHaveBeenCalledWith('stu-doc-1');

    await act(async () => {
      request.resolve({});
      await Promise.all([first, second]);
    });
    expect(mocks.archiveMutateAsync).toHaveBeenCalledTimes(1);
    expect(mocks.showOpsToast).toHaveBeenCalledTimes(1);
    expect(mocks.showOpsToast).toHaveBeenCalledWith(expect.objectContaining({ tone: 'ok' }));
    expect(handle.current.archiveTarget).toBeNull();

    // A late press on the same closing dialog (the handler it rendered with)
    // still sends nothing.
    await act(async () => {
      await confirmArchive();
    });
    expect(mocks.archiveMutateAsync).toHaveBeenCalledTimes(1);
  });

  test('the next confirm opened after a success sends its own request', async () => {
    mocks.archiveMutateAsync.mockResolvedValue({});
    const handle = mount(useStudentArchive);
    act(() => handle.current.requestArchive(STUDENT));
    await act(async () => {
      await handle.current.confirmArchive();
    });
    act(() => handle.current.requestArchive({ ...STUDENT, documentId: 'stu-doc-2' }));
    await act(async () => {
      await handle.current.confirmArchive();
    });
    expect(mocks.archiveMutateAsync).toHaveBeenCalledTimes(2);
    expect(mocks.archiveMutateAsync).toHaveBeenLastCalledWith('stu-doc-2');
  });

  test('after a failed archive, pressing confirm again sends a second request', async () => {
    mocks.archiveMutateAsync.mockRejectedValueOnce(new Error('network down')).mockResolvedValueOnce({});
    const handle = mount(useStudentArchive);
    act(() => handle.current.requestArchive(STUDENT));

    await act(async () => {
      await handle.current.confirmArchive();
    });
    expect(mocks.showOpsToast).toHaveBeenLastCalledWith(expect.objectContaining({ tone: 'error' }));
    await act(async () => {
      await handle.current.confirmArchive();
    });
    expect(mocks.archiveMutateAsync).toHaveBeenCalledTimes(2);
    expect(mocks.showOpsToast).toHaveBeenLastCalledWith(expect.objectContaining({ tone: 'ok' }));
  });
});

describe('roster unarchive confirm: one request per press', () => {
  test('a double-click on the unarchive confirm sends ONE unarchive request and one toast', async () => {
    const request = deferred();
    mocks.unarchiveMutateAsync.mockImplementation(() => request.promise);
    const handle = mount(useStudentUnarchive);
    act(() => handle.current.requestUnarchive({ ...STUDENT, student_status: 'archived' }));

    const { confirmUnarchive } = handle.current;
    let first: Promise<void> = Promise.resolve();
    let second: Promise<void> = Promise.resolve();
    act(() => {
      first = confirmUnarchive();
      second = confirmUnarchive();
    });
    expect(mocks.unarchiveMutateAsync).toHaveBeenCalledTimes(1);

    await act(async () => {
      request.resolve({});
      await Promise.all([first, second]);
    });
    expect(mocks.unarchiveMutateAsync).toHaveBeenCalledTimes(1);
    expect(mocks.showOpsToast).toHaveBeenCalledTimes(1);
    expect(handle.current.unarchiveTarget).toBeNull();
  });
});
