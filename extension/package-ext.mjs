// Zips dist/ into writing-twin-ai-extension.zip for Chrome Web Store upload.
// Run: node package-ext.mjs
import { createWriteStream, readdirSync, statSync, readFileSync } from 'fs';
import { join, relative } from 'path';

const OUT = 'writing-twin-ai-extension.zip';

// Minimal ZIP writer — no external deps required
function zipFiles(files) {
  const entries = [];
  for (const { name, data } of files) {
    const nameBuf = Buffer.from(name);
    const crc = crc32(data);
    const local = Buffer.alloc(30 + nameBuf.length);
    local.writeUInt32LE(0x04034b50, 0);  // local file header sig
    local.writeUInt16LE(20, 4);           // version needed
    local.writeUInt16LE(0, 6);            // flags
    local.writeUInt16LE(0, 8);            // compression (stored)
    local.writeUInt32LE(0, 10);           // mod time/date
    local.writeUInt32LE(crc >>> 0, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    nameBuf.copy(local, 30);
    entries.push({ name: nameBuf, data, crc, offset: 0, local });
  }

  const parts = [];
  let offset = 0;
  for (const e of entries) {
    e.offset = offset;
    parts.push(e.local, e.data);
    offset += e.local.length + e.data.length;
  }

  const centralDir = [];
  for (const e of entries) {
    const cd = Buffer.alloc(46 + e.name.length);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE(20, 4); cd.writeUInt16LE(20, 6);
    cd.writeUInt16LE(0, 8); cd.writeUInt16LE(0, 10);
    cd.writeUInt32LE(0, 12);
    cd.writeUInt32LE(e.crc >>> 0, 16);
    cd.writeUInt32LE(e.data.length, 20);
    cd.writeUInt32LE(e.data.length, 24);
    cd.writeUInt16LE(e.name.length, 28);
    cd.writeUInt16LE(0, 30); cd.writeUInt16LE(0, 32);
    cd.writeUInt16LE(0, 34); cd.writeUInt16LE(0, 36);
    cd.writeUInt32LE(0, 38);
    cd.writeUInt32LE(e.offset, 42);
    e.name.copy(cd, 46);
    centralDir.push(cd);
    offset += cd.length;
  }

  const cdSize = centralDir.reduce((s, b) => s + b.length, 0);
  const cdOffset = parts.reduce((s, b) => s + b.length, 0);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4); eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(cdSize, 12);
  eocd.writeUInt32LE(cdOffset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...parts, ...centralDir, eocd]);
}

function crc32(buf) {
  let table = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c;
  }
  let crc = 0xffffffff;
  for (const byte of buf) crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function collectFiles(dir, base = dir) {
  const result = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      result.push(...collectFiles(full, base));
    } else {
      result.push({ name: relative(base, full).replace(/\\/g, '/'), data: readFileSync(full) });
    }
  }
  return result;
}

const files = collectFiles('dist');
const zip = zipFiles(files);
const ws = createWriteStream(OUT);
ws.write(zip);
ws.end();
console.log(`✓ ${OUT} (${(zip.length / 1024).toFixed(0)} KB, ${files.length} files)`);
console.log('\nNext steps:');
console.log('  1. Go to https://chrome.google.com/webstore/devconsole');
console.log('  2. New item → Upload ZIP → writing-twin-ai-extension.zip');
console.log('  3. Fill in store listing (see WEBSTORE_LISTING.md)');
