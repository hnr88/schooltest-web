/**
 * Builds the static Google Sans subsets the social card renders with
 * (src/modules/seo/assets/fonts). next/og cannot read the variable font in
 * src/app/fonts (its fvar parser throws) nor GSUB extension lookups, so each
 * weight is instanced, subset to Latin + Vietnamese + Thai, stripped of GSUB,
 * and given PUA cmap entries for the Thai `.small` / `.narrow` mark forms
 * (see og-thai.constants.ts).
 *
 * Needs HarfBuzz's `hb-subset` / `hb-shape` (brew install harfbuzz).
 * Run: node scripts/build-og-fonts.ts
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

type ThaiConstants = typeof import('../src/modules/seo/constants/og-thai.constants');

const ROOT = join(import.meta.dirname, '..');
const SOURCE = join(ROOT, 'src/app/fonts/GoogleSans-Variable.ttf');
const OUT_DIR = join(ROOT, 'src/modules/seo/assets/fonts');
const UNICODES = '20-7E,A0-24F,300-36F,E00-E7F,1E00-1EFF,2000-206F,20AC,2122,2190-2193';
const WEIGHTS = [
  { name: 'Regular', wght: 400 },
  { name: 'Bold', wght: 700 },
] as const;

function shapeGids(text: string): { names: string[]; gids: number[] } {
  const run = (extra: string[]): string[] =>
    execFileSync('hb-shape', [...extra, '--no-positions', '--no-clusters', SOURCE, text], { encoding: 'utf8' })
      .trim()
      .replace(/^\[|\]$/g, '')
      .split('|');
  return { names: run([]), gids: run(['--no-glyph-names']).map(Number) };
}

function glyphId(context: string, glyphName: string): number {
  const { names, gids } = shapeGids(context);
  const index = names.indexOf(glyphName);
  if (index < 0) throw new Error(`${glyphName} not produced by shaping ${context}`);
  return gids[index];
}

function puaGlyphs(thai: ThaiConstants): Map<number, number> {
  const map = new Map<number, number>();
  const hex = (cp: number): string => cp.toString(16).toUpperCase().padStart(4, '0');
  for (const [mark, pua] of Object.entries(thai.THAI_SMALL_FORMS)) {
    const cp = Number(mark);
    map.set(pua, glyphId(`กิ${String.fromCodePoint(cp)}`, `uni${hex(cp)}.small`));
  }
  for (const [mark, pua] of Object.entries(thai.THAI_NARROW_FORMS)) {
    const cp = Number(mark);
    map.set(pua, glyphId(`ป${String.fromCodePoint(cp)}`, `uni${hex(cp)}.narrow`));
  }
  map.set(thai.OG_NO_BREAK_SLASH, glyphId('/', 'slash'));
  return map;
}

interface Table {
  tag: string;
  data: Buffer;
}

function readTables(font: Buffer): Table[] {
  const count = font.readUInt16BE(4);
  const tables: Table[] = [];
  for (let i = 0; i < count; i += 1) {
    const at = 12 + i * 16;
    const offset = font.readUInt32BE(at + 8);
    tables.push({ tag: font.toString('latin1', at, at + 4), data: font.subarray(offset, offset + font.readUInt32BE(at + 12)) });
  }
  return tables;
}

function readFormat4(sub: Buffer, into: Map<number, number>): void {
  const segCount = sub.readUInt16BE(6) / 2;
  const ends = 14;
  const starts = ends + segCount * 2 + 2;
  const deltas = starts + segCount * 2;
  const ranges = deltas + segCount * 2;
  for (let s = 0; s < segCount; s += 1) {
    const start = sub.readUInt16BE(starts + s * 2);
    const end = sub.readUInt16BE(ends + s * 2);
    const delta = sub.readInt16BE(deltas + s * 2);
    const rangeOffset = sub.readUInt16BE(ranges + s * 2);
    for (let cp = start; cp <= end && cp !== 0xffff; cp += 1) {
      let gid: number;
      if (rangeOffset === 0) gid = (cp + delta) & 0xffff;
      else {
        const raw = sub.readUInt16BE(ranges + s * 2 + rangeOffset + (cp - start) * 2);
        gid = raw === 0 ? 0 : (raw + delta) & 0xffff;
      }
      if (gid !== 0) into.set(cp, gid);
    }
  }
}

function readCmap(cmap: Buffer): Map<number, number> {
  const map = new Map<number, number>();
  const count = cmap.readUInt16BE(2);
  for (let i = 0; i < count; i += 1) {
    const sub = cmap.subarray(cmap.readUInt32BE(4 + i * 8 + 4));
    if (sub.readUInt16BE(0) === 4) readFormat4(sub, map);
  }
  return map;
}

function writeCmap(map: Map<number, number>): Buffer {
  const groups: [number, number, number][] = [];
  for (const [cp, gid] of [...map.entries()].sort((a, b) => a[0] - b[0])) {
    const last = groups.at(-1);
    if (last && cp === last[1] + 1 && gid === last[2] + (cp - last[0])) last[1] = cp;
    else groups.push([cp, cp, gid]);
  }
  const sub = Buffer.alloc(16 + groups.length * 12);
  sub.writeUInt16BE(12, 0);
  sub.writeUInt32BE(sub.length, 4);
  sub.writeUInt32BE(groups.length, 12);
  groups.forEach(([start, end, gid], i) => {
    sub.writeUInt32BE(start, 16 + i * 12);
    sub.writeUInt32BE(end, 20 + i * 12);
    sub.writeUInt32BE(gid, 24 + i * 12);
  });
  const header = Buffer.alloc(4 + 2 * 8);
  header.writeUInt16BE(2, 2);
  [[0, 4], [3, 10]].forEach(([platform, encoding], i) => {
    header.writeUInt16BE(platform, 4 + i * 8);
    header.writeUInt16BE(encoding, 6 + i * 8);
    header.writeUInt32BE(header.length, 8 + i * 8);
  });
  return Buffer.concat([header, sub]);
}

function checksum(data: Buffer): number {
  const padded = Buffer.concat([data, Buffer.alloc((4 - (data.length % 4)) % 4)]);
  let sum = 0;
  for (let i = 0; i < padded.length; i += 4) sum = (sum + padded.readUInt32BE(i)) >>> 0;
  return sum;
}

function writeFont(tables: Table[]): Buffer {
  const sorted = [...tables].sort((a, b) => (a.tag < b.tag ? -1 : 1));
  const header = Buffer.alloc(12 + sorted.length * 16);
  const power = 2 ** Math.floor(Math.log2(sorted.length));
  header.writeUInt32BE(0x00010000, 0);
  header.writeUInt16BE(sorted.length, 4);
  header.writeUInt16BE(power * 16, 6);
  header.writeUInt16BE(Math.log2(power), 8);
  header.writeUInt16BE(sorted.length * 16 - power * 16, 10);
  const bodies: Buffer[] = [];
  let offset = header.length;
  sorted.forEach((table, i) => {
    const data = table.tag === 'head' ? Buffer.from(table.data) : table.data;
    if (table.tag === 'head') data.writeUInt32BE(0, 8);
    const at = 12 + i * 16;
    header.write(table.tag, at, 'latin1');
    header.writeUInt32BE(checksum(data), at + 4);
    header.writeUInt32BE(offset, at + 8);
    header.writeUInt32BE(data.length, at + 12);
    const padded = Buffer.concat([data, Buffer.alloc((4 - (data.length % 4)) % 4)]);
    bodies.push(padded);
    offset += padded.length;
  });
  const font = Buffer.concat([header, ...bodies]);
  const headAt = sorted.findIndex((t) => t.tag === 'head');
  const headOffset = header.readUInt32BE(12 + headAt * 16 + 8);
  font.writeUInt32BE((0xb1b0afba - checksum(font)) >>> 0, headOffset + 8);
  return font;
}

async function main(): Promise<void> {
  const thai = (await import(
    join(ROOT, 'src/modules/seo/constants/og-thai.constants.ts')
  )) as ThaiConstants;
  const pua = puaGlyphs(thai);
  for (const { name, wght } of WEIGHTS) {
    const out = join(OUT_DIR, `GoogleSans-${name}.ttf`);
    execFileSync('hb-subset', [
      SOURCE,
      `--variations=wght=${wght} opsz=18 GRAD=0`,
      `--unicodes=${UNICODES}`,
      `--gids=${[...pua.values()].join(',')}`,
      '--retain-gids',
      '--no-hinting',
      '--layout-features=kern',
      '--drop-tables+=GSUB',
      '-o',
      out,
    ]);
    const tables = readTables(readFileSync(out));
    const cmap = tables.find((t) => t.tag === 'cmap');
    if (!cmap) throw new Error('subset has no cmap');
    const map = readCmap(cmap.data);
    for (const [cp, gid] of pua) map.set(cp, gid);
    cmap.data = writeCmap(map);
    writeFileSync(out, writeFont(tables));
    console.log(`${out}: ${map.size} code points`);
  }
}

await main();
