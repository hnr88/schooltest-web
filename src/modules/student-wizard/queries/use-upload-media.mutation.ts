'use client';

import { useMutation } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { toAbsoluteMediaUrl } from '@/modules/student-wizard/lib/media-url';
import { uploadResponseSchema } from '@/modules/student-wizard/schemas/upload.schema';
import type { UploadedMedia } from '@/modules/student-wizard/types/media.types';

// C-UPLOAD-PARENT: POST /api/upload multipart (part name `files`, exactly one
// binary file per call). The browser sets the multipart boundary — do NOT force a
// Content-Type header. The 201 body is a bare array: zod-parse the boundary, take
// [0], and absolutize its relative url for the preview.
async function uploadMediaRequest(file: File): Promise<UploadedMedia> {
  const formData = new FormData();
  formData.append('files', file, file.name);

  const res = await strapi.post('/api/upload', formData);
  const [uploaded] = uploadResponseSchema.parse(res.data);

  return {
    id: uploaded.id,
    url: toAbsoluteMediaUrl(uploaded.url),
    mime: uploaded.mime,
    name: uploaded.name,
  };
}

export function useUploadMediaMutation() {
  return useMutation({ mutationFn: uploadMediaRequest });
}
