import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

/**
 * The school-admin roster reads the server again every time a screen shows it.
 *
 * The app's QueryClient keeps data fresh for QUERY_STALE_TIME_MS (60 s), and a
 * fresh cached query is not refetched when it mounts again. So a student
 * archived elsewhere (another admin, ops, or the API) while the admin sat on
 * the student's detail page still read "Active" on the roster after Back.
 * Live e2e (fleet5-status 46, 2026-09-23): the row stayed `active` for 30 s
 * after the archive.
 */

vi.mock('@/lib/axios/strapi', () => ({
  strapi: { get: vi.fn() },
}));

import { strapi } from '@/lib/axios/strapi';
import { QUERY_STALE_TIME_MS } from '@/modules/providers/constants/query-client.constants';
import { useSchoolStudentsQuery } from '@/modules/school-students/queries/use-school-students.query';
import type { SchoolStudentsPage } from '@/modules/school-students/types/school-students.types';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

const get = vi.mocked(strapi.get);

function page(status: string): { data: unknown } {
  return {
    data: {
      data: [
        {
          documentId: 'stu-doc-1',
          given_name: 'Bak',
          family_name: 'BackNav',
          student_status: status,
          email_fix_requested: false,
          first_language: null,
          acara_phase: null,
          diagnostic_status: 'not_started',
          class: null,
        },
      ],
      meta: { pagination: { page: 1, pageSize: 25, pageCount: 1, total: 1 } },
    },
  };
}

const QUERY = { status: 'all', classId: 'all', q: 'BackNav', page: 1 } as const;

let container: HTMLDivElement | null = null;
let root: Root | null = null;

function mountRoster(client: QueryClient): { current: SchoolStudentsPage | undefined } {
  const handle: { current: SchoolStudentsPage | undefined } = { current: undefined };
  function Roster() {
    handle.current = useSchoolStudentsQuery(QUERY, true).data;
    return null;
  }
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root?.render(createElement(QueryClientProvider, { client }, createElement(Roster)));
  });
  return handle;
}

function unmountRoster(): void {
  act(() => {
    root?.unmount();
  });
  container?.remove();
  root = null;
  container = null;
}

async function settle(): Promise<void> {
  for (let tick = 0; tick < 5; tick += 1) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
    });
  }
}

beforeEach(() => {
  get.mockReset();
});

afterEach(() => {
  unmountRoster();
});

describe('school-admin roster: fresh on every mount', () => {
  test('Back to the roster within the stale window refetches and shows the new status', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { staleTime: QUERY_STALE_TIME_MS, retry: false } },
    });
    get.mockResolvedValueOnce(page('active'));
    const first = mountRoster(client);
    await settle();
    expect(first.current?.rows[0]?.student_status).toBe('active');

    // The admin opens the student's detail page (the roster unmounts) and the
    // student is archived elsewhere; then Back mounts the roster again, well
    // inside the 60 s the cached page counts as fresh.
    unmountRoster();
    get.mockResolvedValueOnce(page('archived'));
    const second = mountRoster(client);
    await settle();

    expect(get).toHaveBeenCalledTimes(2);
    expect(second.current?.rows[0]?.student_status).toBe('archived');
    client.clear();
  });
});
