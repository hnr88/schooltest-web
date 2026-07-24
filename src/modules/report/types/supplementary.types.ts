// E11-05. The out-of-model vocabulary strand (Doc 2a s.5.2 task 2E). A band the
// sitting never served has NO accuracy field to default to 0 — the shape itself
// makes "0%" unrepresentable for an unadministered band, which is the whole
// point of the row: 0% is "every item served was wrong", not administered is
// "no item was served".
export type SupplementaryBandCode = 'a2' | 'b1';

export type SupplementaryBandView =
  | { code: SupplementaryBandCode; state: 'measured'; accuracy: number }
  | { code: SupplementaryBandCode; state: 'not_administered' };

// The strand as a whole resolves absence through the SAME machine as every
// other field on this report: 'pending' = a receptive result whose scoring has
// not written the bands yet; 'not_applicable' = a result the strand is never
// administered with (placement parent, speaking, writing).
export type SupplementaryStrandView =
  | { state: 'bands'; bands: SupplementaryBandView[]; qualifiers: string[] }
  | { state: 'pending' }
  | { state: 'not_applicable' };
