// make.fun news-image entry: publish the committed artwork to /output/entry.png.
// Deterministic by construction: fixed source bytes, no network, no clock, no randomness.
import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const source = new URL('./entry.png', import.meta.url);
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const target = join(outDir, 'entry.png');
const bytes = readFileSync(source);

const png = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 &&
             bytes[bytes.length - 2] === 0xff && bytes[bytes.length - 1] === 0xd9;
if (!png && !jpeg) throw new Error('entry.png is not a whole PNG or JPEG');
if (bytes.length > 1048576) throw new Error('image is larger than 1 MiB');
if (png) {
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  if (width > 1024 || height > 1024) throw new Error('image exceeds 1024 x 1024');
  // A whole PNG ends with a well-formed IEND chunk; check the trailer before copying.
  const iend = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]);
  if (!bytes.subarray(bytes.length - 12).equals(iend)) throw new Error('PNG has no valid IEND chunk');
}

mkdirSync(outDir, { recursive: true });
copyFileSync(source, target);
console.log(`wrote ${target}: ${bytes.length} bytes`);
