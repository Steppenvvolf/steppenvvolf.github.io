import { readFileSync } from 'node:fs';
import path from 'node:path';

// Reads real pixel dimensions of a local WebP under /public at build time so
// every <img> can carry true width/height (no layout shift, no letterboxing).
export function imageSize(src: string): { width: number; height: number } {
  const fallback = { width: 1600, height: 900 };
  try {
    if (!src.endsWith('.webp')) return fallback;
    const buf = readFileSync(path.join(process.cwd(), 'public', src));
    const kind = buf.toString('ascii', 12, 16);
    if (kind === 'VP8 ')
      return {
        width: buf.readUInt16LE(26) & 0x3fff,
        height: buf.readUInt16LE(28) & 0x3fff,
      };
    if (kind === 'VP8L') {
      const bits = buf.readUInt32LE(21);
      return {
        width: (bits & 0x3fff) + 1,
        height: ((bits >> 14) & 0x3fff) + 1,
      };
    }
    if (kind === 'VP8X')
      return {
        width: 1 + buf.readUIntLE(24, 3),
        height: 1 + buf.readUIntLE(27, 3),
      };
  } catch {
    /* fall through */
  }
  return fallback;
}
