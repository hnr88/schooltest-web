// C-UPLOAD-PARENT — media the wizard consumes from POST /api/upload. The shared
// RHF form stores ONLY the numeric file id (photo / voice_intro = number | null);
// url/mime/name are held by MediaUpload for the preview (image thumb / audio).
export interface UploadedMedia {
  id: number;
  url: string;
  mime: string;
  name: string;
}

export type MediaAccept = 'image/*' | 'audio/*';

export interface MediaUploadLabels {
  dropTitle: string;
  browse: string;
  helper: string;
  uploading: string;
  remove: string;
  previewAlt: string;
  invalidType: string;
  tooLarge: string;
  uploadFailed: string;
}

export interface MediaUploadProps {
  accept: MediaAccept;
  maxBytes: number;
  value: number | null;
  onChange: (value: number | null) => void;
  labels: MediaUploadLabels;
  inputId: string;
}
