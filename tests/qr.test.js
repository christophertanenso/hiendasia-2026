// The ticket QR code: qrMatrix() (shared by the page and the email) and qrPng_() (the image in the email).
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const zlib = require('node:zlib');
const { loadBackend, VISITOR } = require('./helpers/gas-mock');

const { gs } = loadBackend();
const N = 21;

// An independent reader: undoes the mask, walks the data path and checks the error-correction codewords,
// so a wrong matrix cannot pass just because the generator agrees with itself.
const MASKS = [(x, y) => (x + y) % 2 === 0, (x, y) => y % 2 === 0, (x, y) => x % 3 === 0, (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0, (x, y) => (x * y) % 2 + (x * y) % 3 === 0,
  (x, y) => ((x * y) % 2 + (x * y) % 3) % 2 === 0, (x, y) => ((x + y) % 2 + (x * y) % 3) % 2 === 0];
const isFunction = (x, y) => (x < 9 && y < 9) || (x >= 13 && y < 9) || (x < 9 && y >= 13) || x === 6 || y === 6;
function formatBits(m) {
  let v = 0;
  const cells = [[8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8], [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]];
  cells.forEach(([x, y], i) => { v |= m[y][x] << i; });
  return v ^ 0x5412;
}
function gfMul(a, b) { let z = 0; for (let i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11D); z ^= ((b >>> i) & 1) * a; } return z; }
function read(m) {
  const fmt = formatBits(m), level = fmt >>> 13, mask = (fmt >>> 10) & 7;
  const bits = [];
  for (let right = N - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < N; vert++) for (let j = 0; j < 2; j++) {
      const x = right - j, y = ((right + 1) & 2) === 0 ? N - 1 - vert : vert;
      if (!isFunction(x, y)) bits.push(m[y][x] ^ (MASKS[mask](x, y) ? 1 : 0));
    }
  }
  const cw = [];
  for (let i = 0; i < 26; i++) cw.push(parseInt(bits.slice(i * 8, i * 8 + 8).join(''), 2));
  // Reed-Solomon syndromes: all zero means the 26 codewords are a valid code word.
  const syndromes = [];
  for (let s = 0, root = 1; s < 10; s++, root = gfMul(root, 2)) syndromes.push(cw.reduce((acc, c) => gfMul(acc, root) ^ c, 0));
  const mode = cw[0] >>> 4, len = ((cw[0] & 15) << 4) | (cw[1] >>> 4);
  let text = '';
  for (let i = 0; i < len; i++) text += String.fromCharCode(((cw[1 + i] & 15) << 4) | (cw[2 + i] >>> 4));
  return { level, mask, mode, text, syndromes };
}

describe('qrMatrix', () => {
  const samples = ['HEA26-7K3M9Q', 'HEA26-222222', 'HEA26-ZZZZZZ', 'HEA26-SAMPLE', 'HEA26-9A8B7C'];
  it('is 21 by 21 modules', () => {
    const m = gs.qrMatrix('HEA26-7K3M9Q');
    assert.equal(m.length, 21);
    assert.ok(m.every(r => r.length === 21));
  });
  it('contains only 0 and 1', () => {
    assert.ok(gs.qrMatrix('HEA26-7K3M9Q').every(r => r.every(v => v === 0 || v === 1)));
  });
  for (const t of samples) {
    it('reads back as ' + t, () => { assert.equal(read(gs.qrMatrix(t)).text, t); });
    it('has valid error correction for ' + t, () => { assert.deepEqual(read(gs.qrMatrix(t)).syndromes, Array(10).fill(0)); });
  }
  it('declares byte mode', () => { assert.equal(read(gs.qrMatrix('HEA26-7K3M9Q')).mode, 4); });
  it('declares error-correction level M', () => { assert.equal(read(gs.qrMatrix('HEA26-7K3M9Q')).level, 0); });
  it('carries the same format bits in both copies', () => {
    const m = gs.qrMatrix('HEA26-7K3M9Q');
    let second = 0;
    for (let i = 0; i < 8; i++) second |= m[8][N - 1 - i] << i;
    for (let i = 8; i < 15; i++) second |= m[N - 15 + i][8] << i;
    assert.equal(second ^ 0x5412, formatBits(m));
  });
  it('has the three finder patterns', () => {
    const m = gs.qrMatrix('HEA26-7K3M9Q');
    const finder = ['1111111', '1000001', '1011101', '1011101', '1011101', '1000001', '1111111'];
    for (const [ox, oy] of [[0, 0], [14, 0], [0, 14]]) {
      assert.deepEqual(finder.map((_, y) => m[oy + y].slice(ox, ox + 7).join('')), finder);
    }
  });
  it('has the fixed dark module', () => { assert.equal(gs.qrMatrix('HEA26-7K3M9Q')[13][8], 1); });
  it('matches the segno reference library for a full-length code', () => {
    const gold = ["111111100001101111111", "100000100010001000001", "101110101000001011101", "101110101111101011101", "101110101110101011101", "100000101100101000001", "111111101010101111111", "000000001000100000000", "101111100110001111100", "000101011100100101100", "101011110001101001110", "000000010101010001100", "001100101101100100101", "000000001100100100100", "111111100111111001110", "100000101110010000101", "101110101101100011011", "101110101010110110100", "101110101001100100000", "100000100111110110100", "111111101001100001010"];
    const m = gs.qrMatrix('HEA26-ABCDEFGH');
    assert.equal(read(m).mask, 2);
    assert.deepEqual(Array.from(m, r => r.join('')), gold);
  });
  it('gives the same matrix every time for the same ticket', () => {
    assert.equal(JSON.stringify(gs.qrMatrix('HEA26-7K3M9Q')), JSON.stringify(gs.qrMatrix('HEA26-7K3M9Q')));
  });
});

// Any size from version 1 to 6 (error correction M), read by the same independent method: the function patterns
// (finders, timing, alignment, format) are skipped, the codewords are de-interleaved into their blocks, and each
// block's Reed-Solomon syndromes must be zero.
const BLOCKS = { 1: [1, 26, 16], 2: [1, 44, 28], 3: [1, 70, 44], 4: [2, 50, 32], 5: [2, 67, 43], 6: [4, 43, 27] };
function readAny(m) {
  const n = m.length, v = (n - 17) / 4, [nb, total, data] = BLOCKS[v];
  const al = v > 1 ? n - 7 : -99;
  const fn = (x, y) => (x < 9 && y < 9) || (x >= n - 8 && y < 9) || (x < 9 && y >= n - 8) || x === 6 || y === 6 ||
    (Math.abs(x - al) <= 2 && Math.abs(y - al) <= 2);
  const cells = [[8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8], [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]];
  let fmt = 0; cells.forEach(([x, y], i) => { fmt |= m[y][x] << i; }); fmt ^= 0x5412;
  const mask = (fmt >>> 10) & 7, bits = [];
  for (let right = n - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < n; vert++) for (let j = 0; j < 2; j++) {
      const x = right - j, y = ((right + 1) & 2) === 0 ? n - 1 - vert : vert;
      if (!fn(x, y)) bits.push(m[y][x] ^ (MASKS[mask](x, y) ? 1 : 0));
    }
  }
  const cw = [];
  for (let i = 0; i < total * nb; i++) cw.push(parseInt(bits.slice(i * 8, i * 8 + 8).join(''), 2));
  const ec = total - data, blocks = Array.from({ length: nb }, () => []);
  for (let i = 0; i < data; i++) for (let b = 0; b < nb; b++) blocks[b].push(cw[i * nb + b]);
  for (let i = 0; i < ec; i++) for (let b = 0; b < nb; b++) blocks[b].push(cw[data * nb + i * nb + b]);
  const syndromes = blocks.map(bl => { const s = []; for (let k = 0, root = 1; k < ec; k++, root = gfMul(root, 2)) s.push(bl.reduce((a, c) => gfMul(a, root) ^ c, 0)); return s; });
  const d = [].concat(...blocks.map(bl => bl.slice(0, data)));
  const len = ((d[0] & 15) << 4) | (d[1] >>> 4);
  let text = '';
  for (let i = 0; i < len; i++) text += String.fromCharCode(((d[1 + i] & 15) << 4) | (d[2 + i] >>> 4));
  return { version: v, mode: d[0] >>> 4, text, ok: syndromes.every(s => s.every(x => x === 0)) };
}

describe('qrMatrix for the check-in link', () => {
  const site = 'https://christophertanenso.github.io/hiendasia-2026/';
  const urls = ['HEA26-7K3M9Q', 'HEA26-222222', 'HEA26-ZZZZZZ'].map(t => site + 'in.html?t=' + t);
  for (const u of urls) {
    it('reads back as ' + u.slice(-24), () => { assert.equal(readAny(gs.qrMatrix(u)).text, u); });
    it('has valid error correction in every block for ' + u.slice(-12), () => { assert.equal(readAny(gs.qrMatrix(u)).ok, true); });
  }
  it('grows to version 5 (37 by 37) for the link', () => { assert.equal(gs.qrMatrix(urls[0]).length, 37); });
  it('uses the smallest version that fits', () => {
    for (const [len, v] of [[14, 1], [15, 2], [40, 3], [60, 4], [84, 5], [85, 6], [106, 6]]) assert.equal(readAny(gs.qrMatrix('x'.repeat(len))).version, v, len + ' chars');
  });
  it('reads back at every size', () => {
    for (const len of [15, 40, 60, 84, 106]) { const r = readAny(gs.qrMatrix('y'.repeat(len))); assert.equal(r.text, 'y'.repeat(len)); assert.equal(r.ok, true); }
  });
  // Reference: the Python qrcode library (7.x) with the same mask, 2. Libraries differ in which mask they prefer
  // (segno picks 4 and also adds a spare zero byte before the padding); the mask does not affect reading.
  it('matches the qrcode reference library for the check-in link', () => {
    const gold = ["1111111000111100010001011000101111111", "1000001001100100110010001001101000001", "1011101010100001101001110001101011101", "1011101011101110010000100110101011101", "1011101010000110011100010100101011101", "1000001011000001010001101011101000001", "1111111010101010101010101010101111111", "0000000011011010111101110000100000000", "1011111001111000100000010100001111100", "1000110000001101011010111110100001110", "0010011010100111101100101001001010011", "1110110111000101000111111001110100001", "0000011000001111010100001111011011111", "0011000110010000101111010100100100000", "1011101100110001001010100111010111011", "1101110111101110100011100011110110010", "0101101000111100001001100111111110101", "1111000111000111110000011010100001010", "1100111010110010010010100011000010011", "0100110000100100100001001011001001001", "1100001010000110011010101110111011100", "0110000011111100111110010010110001010", "1011101011100011110000001011100111011", "0110000100001011111001110000011110011", "1000011101000111100110011101011110101", "1011010110010101011011100010100000100", "1000011110000011110010100101001000011", "1010110100011101000001100000100001000", "1000011101101001010100101110111110100", "0000000011111000101111010110100011000", "1111111001100111101000000010101010111", "1000001011011101000011101010100011001", "1011101011100010001011101011111110111", "1011101010101111110100000000011011001", "1011101010001110001011001011100001111", "1000001000010100101011101001110011001", "1111111011010100010110111111000010111"];
    assert.deepEqual(Array.from(gs.qrMatrix(urls[0]), r => r.join('')), gold);
  });
  it('refuses text too long for version 6', () => { assert.throws(() => gs.qrMatrix('x'.repeat(107)), /too long/); });
});

// The QR code in the ticket email, read back from the PNG itself.
function pngModules(blob) {
  const png = Buffer.from(Array.from(blob.bytes, v => v & 255));
  let o = 8, ihdr, idat;
  while (o < png.length) {
    const len = png.readUInt32BE(o), type = png.toString('latin1', o + 4, o + 8);
    if (type === 'IHDR') ihdr = png.subarray(o + 8, o + 8 + len); if (type === 'IDAT') idat = png.subarray(o + 8, o + 8 + len);
    o += 12 + len;
  }
  const size = ihdr.readUInt32BE(0), raw = zlib.inflateSync(idat), stride = Math.ceil(size / 8) + 1;
  const dark = (x, y) => ((raw[y * stride + 1 + (x >> 3)] >> (7 - (x & 7))) & 1) === 0;
  const n = size / 10 - 8;
  return Array.from({ length: n }, (_, y) => Array.from({ length: n }, (_, x) => (dark(40 + x * 10 + 5, 40 + y * 10 + 5) ? 1 : 0)));
}

describe('the ticket email QR code', () => {
  const b = loadBackend();
  const res = b.post(VISITOR);
  const read = readAny(pngModules(b.state.mails[0].inlineImages.qr));
  it('opens the check-in page for that ticket', () => {
    assert.equal(read.text, 'https://christophertanenso.github.io/hiendasia-2026/in.html?t=' + res.ticket);
  });
  it('reads back with valid error correction', () => assert.equal(read.ok, true));
});

describe('qrPng_', () => {
  const blob = gs.qrPng_('HEA26-7K3M9Q');
  const png = Buffer.from(Array.from(blob.bytes, v => v & 255));
  const chunks = [];
  for (let o = 8; o < png.length;) {
    const len = png.readUInt32BE(o), type = png.toString('latin1', o + 4, o + 8);
    chunks.push({ type, data: png.subarray(o + 8, o + 8 + len), crc: png.readUInt32BE(o + 8 + len), crcOf: png.subarray(o + 4, o + 8 + len) });
    o += 12 + len;
  }
  const ihdr = chunks[0].data, size = ihdr.readUInt32BE(0);
  it('is typed as a PNG image', () => { assert.equal(blob.type, 'image/png'); });
  it('uses signed bytes, as Apps Script requires', () => { assert.ok(Array.from(blob.bytes).every(v => v >= -128 && v <= 127)); });
  it('starts with the PNG signature', () => { assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a'); });
  it('has header, data and end chunks in order', () => { assert.deepEqual(chunks.map(c => c.type), ['IHDR', 'IDAT', 'IEND']); });
  it('has a correct checksum on every chunk', () => { for (const c of chunks) assert.equal(zlib.crc32(c.crcOf), c.crc, c.type); });
  it('is square, 290 pixels a side', () => { assert.equal(size, 290); assert.equal(ihdr.readUInt32BE(4), 290); });
  it('is 1-bit greyscale', () => { assert.deepEqual([ihdr[8], ihdr[9]], [1, 0]); });
  const raw = zlib.inflateSync(chunks[1].data), stride = Math.ceil(size / 8) + 1;
  const pixelDark = (x, y) => ((raw[y * stride + 1 + (x >> 3)] >> (7 - (x & 7))) & 1) === 0;
  it('inflates to one row per pixel line', () => { assert.equal(raw.length, size * stride); });
  it('has a white quiet zone four modules wide', () => {
    for (let i = 0; i < size; i++) for (const k of [0, 39, size - 40, size - 1]) { assert.equal(pixelDark(i, k), false); assert.equal(pixelDark(k, i), false); }
  });
  it('draws the same modules as qrMatrix', () => {
    const m = gs.qrMatrix('HEA26-7K3M9Q');
    for (let y = 0; y < 21; y++) for (let x = 0; x < 21; x++) assert.equal(pixelDark(40 + x * 10 + 5, 40 + y * 10 + 5), m[y][x] === 1, x + ',' + y);
  });
});
