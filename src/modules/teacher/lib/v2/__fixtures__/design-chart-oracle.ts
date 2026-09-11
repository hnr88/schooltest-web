const DESIGN_ACARA = [
  { label: 'Consolidating', v: 90 },
  { label: 'Developing', v: 70 },
  { label: 'Emerging', v: 50 },
  { label: 'Beginning', v: 20 },
];

export function designAcaraChart(vals: number[]) {
  const W = 720;
  const H = 200;
  const padL = 118;
  const padR = 24;
  const padT = 20;
  const padB = 38;
  const pw = W - padL - padR;
  const ph = H - padT - padB;
  const n = vals.length;
  const yOf = (v: number) => Math.round(padT + (1 - v / 100) * ph);
  const pts = vals.map((v, i) => ({
    cx: Math.round(padL + (i / (n - 1)) * pw),
    cy: yOf(v),
    labelX: Math.round(padL + (i / (n - 1)) * pw),
    lastFg: i === n - 1 ? '#0E2350' : '#8A94A6',
  }));
  const polyline = pts.map((p) => `${p.cx},${p.cy}`).join(' ');
  const areaPath = `M${pts[0].cx},${H - padB} L${pts.map((p) => `${p.cx},${p.cy}`).join(' L')} L${pts[n - 1].cx},${H - padB} Z`;
  const acara = DESIGN_ACARA.map((bd) => ({ label: bd.label, y: yOf(bd.v) }));
  const bands = [
    { label: 'Consolidating', top: yOf(100), bot: yOf(80), fill: '#E9F6EF' },
    { label: 'Developing', top: yOf(80), bot: yOf(62), fill: '#EAF0FB' },
    { label: 'Emerging', top: yOf(62), bot: yOf(45), fill: '#FDF4E3' },
    { label: 'Beginning', top: yOf(45), bot: yOf(0), fill: '#FBEEEC' },
  ].map((b) => ({ label: b.label, y: Math.min(b.top, b.bot), h: Math.abs(b.bot - b.top), fill: b.fill, midY: (b.top + b.bot) / 2 }));
  return {
    polyline,
    areaPath,
    points: pts,
    acara,
    bands,
    legend: bands.slice().reverse(),
    W,
    H,
    bandW: W - padL - padR,
    axisX: padL,
    axisY: H - padB,
    axisTop: padT,
    axisRight: W - padR,
    xLabelY: H - padB + 18,
    xSubY: H - padB + 31,
  };
}

export function designStudentChart(vals: number[]) {
  const W = 640;
  const H = 250;
  const padL = 132;
  const padR = 18;
  const padT = 16;
  const padB = 44;
  const pw = W - padL - padR;
  const ph = H - padT - padB;
  const n = vals.length;
  const yOf = (v: number) => Math.round(padT + (1 - v / 100) * ph);
  const cpts = vals.map((v, i) => ({
    cx: Math.round(padL + (i / (n - 1)) * pw),
    cy: yOf(v),
    labelX: Math.round(padL + (i / (n - 1)) * pw),
    lastFg: i === n - 1 ? '#0E2350' : '#8A94A6',
  }));
  const polyline = cpts.map((p) => `${p.cx},${p.cy}`).join(' ');
  const areaPath = `M${cpts[0].cx},${H - padB} L${cpts.map((p) => `${p.cx},${p.cy}`).join(' L')} L${cpts[n - 1].cx},${H - padB} Z`;
  const acara = DESIGN_ACARA.map((bd) => ({ label: bd.label, y: yOf(bd.v) }));
  const bounds = [40, 60, 80].map((g) => ({ y: yOf(g) }));
  return { polyline, areaPath, points: cpts, acara, bounds, axisX: padL, axisY: H - padB, axisRight: W - padR, xLabelY: H - padB + 18, xSubY: H - padB + 32 };
}

export function designSparkline(vals: number[]) {
  const w = 132;
  const h = 40;
  const pad = 6;
  const lo = 20;
  const hi = 98;
  const yOf = (v: number) => pad + (1 - (Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo)) * (h - 2 * pad);
  const pts = vals.map((v, i) => ({ cx: Math.round(pad + (i / (vals.length - 1)) * (w - 2 * pad)), cy: Math.round(yOf(v)) }));
  return { w, h, polyline: pts.map((p) => `${p.cx},${p.cy}`).join(' '), last: pts[pts.length - 1] };
}
