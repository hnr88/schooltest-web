import { describe, expect, it } from 'vitest';

import { extractTeacherExportPrompt } from '@/modules/teacher/lib/teacher-overlays';

describe('teacher overlay contracts', () => {
  it('extracts the exact final Prompt section from the server export bundle', () => {
    const body = [
      '# Class export',
      '',
      'Measured class data.',
      '',
      '## Prompt',
      '',
      'Use only the data above.',
      'Do not invent students.',
    ].join('\n');

    expect(extractTeacherExportPrompt(body)).toBe(
      'Use only the data above.\nDo not invent students.',
    );
  });
});
