/**
 * Push-subscription wire contracts — now a RE-EXPORT SHIM over
 * `@schooltest/notification-contracts` (mvp/notifications row 02, D-05).
 *
 * The package is the one source; these are the same shapes under the local
 * names this module's importers use. Two deliberate differences from the old
 * hand-copy, both inherited from the package:
 * - `endpoint` is capped at 255 (C-05): the storage column is varchar(255), so
 *   the browser-side check now fails at the same limit the server enforces —
 *   an over-length endpoint fails locally with the honest message instead of
 *   as a server 400.
 * - `expirationTime` is optional: browsers legitimately omit it, and the api
 *   contract has always allowed that.
 */
export {
  pushSubscribeSchema as pushSubscriptionRequestSchema,
  pushSubscriptionResponseSchema as pushSubscriptionResponseSchema,
  pushUnsubscribeResultSchema as pushUnsubscribeResponseSchema,
  pushUnsubscribeSchema as pushUnsubscribeRequestSchema,
  pushVapidPublicKeyResponseSchema as pushVapidConfigResponseSchema,
} from '@schooltest/notification-contracts';
