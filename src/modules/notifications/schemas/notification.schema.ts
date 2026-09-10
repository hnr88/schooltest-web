/**
 * Notification wire contracts — now a RE-EXPORT SHIM over
 * `@schooltest/notification-contracts` (mvp/notifications row 02, D-05).
 *
 * This file used to hand-type the taxonomy-open row shape; the package is the
 * one source now. The LENIENT variants are deliberate and named in the package:
 * `eventType` parses as an open string at the CLIENT boundary so an older
 * bundle renders a newer server's unknown event type instead of rejecting the
 * whole row (see the package's `event-types.ts` for the reasoning).
 *
 * Public names are unchanged, so every importer of this file keeps working
 * byte-identically.
 */
export {
  notificationCategorySchema,
  notificationListParamsSchema,
  notificationPrioritySchema,
} from '@schooltest/notification-contracts';
export {
  notificationListWireSchema as notificationListResponseSchema,
  notificationMarkAllSchema as notificationReadAllResponseSchema,
  notificationMarkReadSchema as notificationReadResponseSchema,
  notificationRowWireSchema as notificationSchema,
} from '@schooltest/notification-contracts';
