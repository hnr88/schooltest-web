import { afterEach, describe, expect, test } from 'vitest';

import { t2Row } from '@/modules/teacher/lib/v2/__fixtures__/t2';
import { useClassOverlaysStore } from '@/modules/teacher/stores/use-class-overlays-store';

afterEach(() => {
  useClassOverlaysStore.getState().close();
});

describe('useClassOverlaysStore', () => {
  test('starts with both overlays closed', () => {
    const state = useClassOverlaysStore.getState();
    expect(state.reportsOpen).toBe(false);
    expect(state.askAiOpen).toBe(false);
  });

  test('opening one overlay closes the other', () => {
    useClassOverlaysStore.getState().openReports();
    expect(useClassOverlaysStore.getState()).toMatchObject({ reportsOpen: true, askAiOpen: false });
    useClassOverlaysStore.getState().openAskAi();
    expect(useClassOverlaysStore.getState()).toMatchObject({ reportsOpen: false, askAiOpen: true });
  });

  test('close shuts both', () => {
    useClassOverlaysStore.getState().openAskAi();
    useClassOverlaysStore.getState().close();
    expect(useClassOverlaysStore.getState()).toMatchObject({ reportsOpen: false, askAiOpen: false });
  });

  test('the student page asks about its student; a bare call (the class header) asks about the class', () => {
    const studentDocumentId = t2Row('Dilnoza').student.document_id;
    useClassOverlaysStore.getState().openAskAi({ scope: 'student', studentDocumentId });
    expect(useClassOverlaysStore.getState()).toMatchObject({
      askAiOpen: true,
      askAiTarget: { scope: 'student', studentDocumentId },
    });
    useClassOverlaysStore.getState().openAskAi();
    expect(useClassOverlaysStore.getState().askAiTarget).toEqual({ scope: 'class' });
  });
});
