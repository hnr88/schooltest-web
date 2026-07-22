import fs from 'node:fs';
import path from 'node:path';
const OUT = '.qa/design/screens';
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const index = JSON.parse(fs.readFileSync('.qa/design/screens-index.json', 'utf8')).filter(
  (i) => !i.slice.includes('--full')
);
fs.rmSync(`${OUT}/portal--full.html`, { force: true });
fs.rmSync(`${OUT}/app--full.html`, { force: true });

// Parent Portal — split on <!-- ===== NAME ===== -->
{
  const file = 'dashbaord-design/Parent Portal.dc.html';
  const html = fs.readFileSync(file, 'utf8');
  const re = /<!--\s*=====\s*([^=]+?)\s*=====\s*-->/g;
  const marks = [];
  let m;
  while ((m = re.exec(html)) !== null) marks.push({ label: m[1].trim(), start: m.index });
  marks.forEach((mk, i) => {
    const end = i + 1 < marks.length ? marks[i + 1].start : html.lastIndexOf('</x-dc>');
    const body = html.slice(mk.start, end);
    const name = `portal--${slug(mk.label)}.html`;
    fs.writeFileSync(path.join(OUT, name), body);
    index.push({ file, label: mk.label, slice: `${OUT}/${name}`, bytes: body.length, lines: body.split('\n').length });
  });
}

// App Screens — split on <div data-screen-label="X"
{
  const file = 'dashbaord-design/SchoolTest App Screens.dc.html';
  const html = fs.readFileSync(file, 'utf8');
  const re = /<div[^>]*data-screen-label="([^"]+)"/g;
  const marks = [];
  let m;
  while ((m = re.exec(html)) !== null) marks.push({ label: m[1], start: m.index });
  const seen = new Map();
  marks.forEach((mk, i) => {
    const end = i + 1 < marks.length ? marks[i + 1].start : html.lastIndexOf('</x-dc>');
    const body = html.slice(mk.start, end);
    let s = slug(mk.label);
    const c = (seen.get(s) || 0) + 1;
    seen.set(s, c);
    if (c > 1) s = `${s}-${c}`;
    const name = `app--${s}.html`;
    fs.writeFileSync(path.join(OUT, name), body);
    index.push({ file, label: mk.label, slice: `${OUT}/${name}`, bytes: body.length, lines: body.split('\n').length });
  });
}
fs.writeFileSync('.qa/design/screens-index.json', JSON.stringify(index, null, 2));
console.log(`${index.length} slices total`);
for (const i of index.filter((x) => !x.slice.includes('/ds--') && !x.slice.includes('/landing--')))
  console.log(String(i.lines).padStart(5), String(i.bytes).padStart(7), i.slice, '|', i.label);
