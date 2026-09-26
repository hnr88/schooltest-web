import { expect, test, vi } from 'vitest';

import { useTeachingInsights } from '@/modules/teacher/hooks/useTeachingInsights';
import { teachingRow } from '@/modules/teacher/lib/v2/teaching/test-roster';

vi.mock('@/modules/test-day', () => ({
  useClassSittingsQuery: () => { throw new Error('Teaching plan must use only the roster'); },
}));

test('Teaching hook derives the new model without requesting sittings or diagnostic data', () => {
  const rows = [teachingRow('A', { Gist: [10, 'emerging'] })];
  const state = useTeachingInsights(rows);
  expect(state.hasResults).toBe(true);
  expect(state.view.strands.comprehension[0].skill).toBe('Gist');
  expect(state.view).not.toHaveProperty('kpis');
  expect(useTeachingInsights([]).hasResults).toBe(false);
});
