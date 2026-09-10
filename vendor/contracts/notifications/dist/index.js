"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
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
__exportStar(require("./event-types"), exports);
__exportStar(require("./notification"), exports);
__exportStar(require("./preference"), exports);
__exportStar(require("./push-subscription"), exports);
__exportStar(require("./school-feed"), exports);
