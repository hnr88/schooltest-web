import { describe, expect, it } from 'vitest';

import {
  extractTeacherExportPrompt,
  shouldApplyConfirmOpenChange,
} from '@/modules/teacher/lib/teacher-overlays';

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

  it('keeps destructive confirmation open on accidental dismissal', () => {
    expect(shouldApplyConfirmOpenChange('destructive', false, 'escape-key')).toBe(false);
    expect(shouldApplyConfirmOpenChange('destructive', false, 'outside-press')).toBe(false);
    expect(shouldApplyConfirmOpenChange('destructive', false, 'close-press')).toBe(true);
    expect(shouldApplyConfirmOpenChange('neutral', false, 'escape-key')).toBe(true);
    expect(shouldApplyConfirmOpenChange('destructive', true, 'none')).toBe(true);
  });
});
