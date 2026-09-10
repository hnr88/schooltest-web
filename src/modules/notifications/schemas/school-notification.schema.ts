/**
 * C-NOT-01 school feed wire contracts — now a RE-EXPORT SHIM over
 * `@schooltest/notification-contracts` (mvp/notifications row 02, D-05; the
 * shapes live in the package's `school-feed.ts`). The school-staff projection
 * of a notification row — type from eventType, link from linkUrl, read from
 * `readAt != null` — sits beside the parent feed's row in the package, so the
 * two projections cannot drift (row 08: one reader, two projections).
 *
 * Public names are unchanged, so every importer of this file keeps working
 * byte-identically.
 */
export {
  schoolNotificationListParamsSchema,
  schoolNotificationListSchema as schoolNotificationListResponseSchema,
  schoolNotificationRowSchema as schoolNotificationSchema,
} from '@schooltest/notification-contracts';
