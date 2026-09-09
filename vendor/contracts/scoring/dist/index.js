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
 * Package entry point — @schooltest/scoring-contracts.
 *
 * ONE contract in three places (house rule 2): schooltest-api, schooltest-web,
 * schooltest-app and every HTTP test import these schemas rather than mirroring
 * them. The hand-written web mirror at
 * schooltest-web/src/modules/report/schemas/result-view.schema.ts is replaced by
 * this package in task 29, not extended.
 *
 * ./core carries the primitives and imports nothing local — see the note in that
 * file for the CommonJS cycle that rule prevents.
 */
__exportStar(require("./core"), exports);
__exportStar(require("./enums"), exports);
__exportStar(require("./constants"), exports);
__exportStar(require("./score-req"), exports);
__exportStar(require("./score-resp"), exports);
__exportStar(require("./stored-result"), exports);
__exportStar(require("./result-view.supplementary"), exports);
__exportStar(require("./result-view"), exports);
__exportStar(require("./diagnostic-export"), exports);
__exportStar(require("./scoring-config"), exports);
__exportStar(require("./legacy-result-view"), exports);
