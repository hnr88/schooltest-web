import { create } from 'zustand';

import type { UploadedMedia } from '@/modules/student-wizard/types/media.types';
import type { WizardMediaKey } from '@/modules/student-wizard/types/student-wizard.types';

import type { WizardMediaState } from '@/modules/student-wizard/types/stores.types';
import { EMPTY_MEDIA } from '@/modules/student-wizard/constants/stores.constants';

// The RHF form holds only the numeric photo/voice_intro id; the absolutized
// upload url/mime/name (052) live here so the Step 5 review can render the
// thumbnail/audio preview and step revisits restore it (the step body unmounts
// on navigation). Reset when a fresh wizard mounts — legacy "abandon loses input".
export const useWizardMediaStore = create<WizardMediaState>((set) => ({
  media: EMPTY_MEDIA,
  setMedia: (key, media) => set((state) => ({ media: { ...state.media, [key]: media } })),
  clearMedia: (key) => set((state) => ({ media: { ...state.media, [key]: null } })),
  reset: () => set({ media: EMPTY_MEDIA }),
}));
