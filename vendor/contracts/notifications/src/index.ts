/**
 * @schooltest/notification-contracts — ONE source of truth for the notification
 * wire shapes (mvp/notifications row 02, D-05).
 *
 * Before this package the same taxonomy existed FOUR times in source and the
 * preference shape had no schema at all. `schooltest-api/src/contracts/notifications.ts`
 * admitted it: "hand-mirrored; the desktop declares no contracts package".
 *
 * THREE HOMES, not one. Verified 2026-09-10:
 *   schooltest-api  -> file:vendor/contracts/notifications   (committed mirror)
 *   schooltest-web  -> file:vendor/contracts/notifications   (committed mirror)
 *   schooltest-app  -> file:../mvp/contracts/notifications   (the canonical copy)
 * The gate is byte parity across all three. A pnpm `file:` dep does not
 * propagate into the resolved copy on its own, and grep against a stale copy is
 * a FALSE POSITIVE that reads like success — only `diff -qr` exposes it.
 */
export * from './event-types';
export * from './notification';
export * from './preference';
export * from './push-subscription';
export * from './school-feed';
