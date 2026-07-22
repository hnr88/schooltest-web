import fs from 'node:fs';
import path from 'node:path';

const SRC = 'dashbaord-design';
const OUT = '.qa/design/screens';
const files = [
  ['SchoolTest Design System.dc.html', 'ds'],
  ['Parent Portal.dc.html', 'portal'],
  ['SchoolTest App Screens.dc.html', 'app'],
  ['SchoolTest Landing.dc.html', 'landing'],
];
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const index = [];
for (const [file, prefix] of files) {
  const html = fs.readFileSync(path.join(SRC, file), 'utf8');
  const re = /<section[^>]*data-screen-label="([^"]+)"[\s\S]*?(?=<section[^>]*data-screen-label=|<\/x-dc>)/g;
  let m, n = 0, seen = new Map();
  while ((m = re.exec(html)) !== null) {
    n++;
    let s = slug(m[1]);
    const c = (seen.get(s) || 0) + 1; seen.set(s, c);
    if (c > 1) s = `${s}-${c}`;
    const name = `${prefix}--${s}.html`;
    fs.writeFileSync(path.join(OUT, name), m[0]);
    index.push({ file, label: m[1], slice: `${OUT}/${name}`, bytes: m[0].length, lines: m[0].split('\n').length });
  }
  if (n === 0) {
    const body = html.slice(html.indexOf('<x-dc>'), html.lastIndexOf('</x-dc>'));
    const name = `${prefix}--full.html`;
    fs.writeFileSync(path.join(OUT, name), body);
    index.push({ file, label: '(whole file — no data-screen-label)', slice: `${OUT}/${name}`, bytes: body.length, lines: body.split('\n').length });
  }
}
fs.writeFileSync('.qa/design/screens-index.json', JSON.stringify(index, null, 2));
console.log(`${index.length} slices written`);
for (const i of index) console.log(String(i.lines).padStart(5), String(i.bytes).padStart(8), i.slice, '|', i.label);
