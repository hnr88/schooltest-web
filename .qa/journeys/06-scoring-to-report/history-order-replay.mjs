// The 14 real sittings of student cxjfszn4s2domw78yrn3ze7i, in the order the
// sibling read returns them (createdAt DESC), with self excluded and pushed last.
const rows = [
  ['v7x6mpib694x0majp6551ugg', '2026-09-10T10:34:48', 84],
  ['x9wcw8zznewues7m7e5rqqa2', '2026-09-10T10:25:23', 76],
  ['w95dzm8bm2dioaldvjt6vmz5', '2026-09-10T10:20:16', null],
  ['hi8x0p6ureb1ugtldpio31yt', '2026-09-10T10:19:50', null],
  ['b7nf5yb6u1lsg3lrqbff6obb', '2026-09-10T10:19:24', null],
  ['fzyfa1x20rqyoiw7g6fcjkdw', '2026-09-10T04:37:03', null],
  ['y1d7o6oibaqly6ou4uoomjsh', '2026-09-10T04:35:12', null],
  ['mvv6vhb3g6qu31vyr6tm3wgb', '2026-09-10T04:32:56', null],
  ['zfosvbah0v8votght70lut94', '2026-09-10T04:31:41', null],
  ['q89i6jijxdxiignp6p6frcv8', '2026-09-10T04:29:59', null],
  ['m2b5bc3d920blqtt2geu8zto', '2026-09-10T04:27:19', null],
  ['ff46za9f4ss3zbudye73ccre', '2026-09-10T04:26:04', null],
  ['hbxhfxd4ywgvea0limwa7t7f', '2026-09-10T04:24:46', null],
];
const self = ['gdijynxot3d31d0pt053jv37', '2026-09-10T13:56:23', 41];
const day = (ts) => ts.slice(0, 10);

const build = (cmp) => {
  const pts = [...rows, self].map(([id, ts, overall]) => ({ id, satAt: day(ts), stamp: ts, overall }));
  return pts.sort(cmp).slice(-8).map((p) => p.overall);
};

// BEFORE: day only. Same-day rows tie, so a stable sort keeps arrival order.
const before = build((a, b) => (a.satAt < b.satAt ? -1 : a.satAt > b.satAt ? 1 : 0));
// AFTER: day then createdAt, as one fixed-width key.
const key = (p) => `${p.satAt}#${p.stamp}`;
const after = build((a, b) => (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0));

console.log('BEFORE (day-only sort)  history[].overall =', JSON.stringify(before));
console.log('AFTER  (day+createdAt)  history[].overall =', JSON.stringify(after));
console.log('live C-4 measured BEFORE the fix        =', JSON.stringify([null,null,null,null,null,null,null,41]));
