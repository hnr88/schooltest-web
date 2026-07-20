import { z } from 'zod';

// C-UPLOAD-PARENT — POST /api/upload returns a BARE JSON array (no data/meta
// envelope; the stock upload controller sets ctx.status = 201). Only the fields
// the wizard consumes are parsed; the client takes [0].id and absolutizes
// [0].url (relative /uploads/<hash><ext> on the local provider).
export const uploadedFileSchema = z.object({
  id: z.number().int().positive(),
  url: z.string().min(1),
  mime: z.string().min(1),
  name: z.string().min(1),
});

export const uploadResponseSchema = z.array(uploadedFileSchema).min(1);
