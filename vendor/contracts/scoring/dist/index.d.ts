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
export * from './core';
export * from './enums';
export * from './constants';
export * from './score-req';
export * from './score-resp';
export * from './stored-result';
export * from './result-view.supplementary';
export * from './result-view';
export * from './diagnostic-export';
export * from './scoring-config';
export * from './legacy-result-view';
