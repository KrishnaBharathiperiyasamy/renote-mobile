/**
 * High-performance, lightweight pure TypeScript GIF89a Animated Encoder.
 * Zero external dependencies. Fully compliant with CompuServe GIF89a spec.
 */

export interface GifFrameInput {
  data: Uint8ClampedArray | Uint8Array;
  delay: number; // in milliseconds
}

function quantizeFrame(
  rgba: Uint8ClampedArray | Uint8Array,
  width: number,
  height: number
): { palette: [number, number, number][]; indexedPixels: Uint8Array } {
  const pixelCount = width * height;
  const colorMap = new Map<number, number>();

  // 1. Group pixels into 15-bit RGB bins (5-5-5) to identify dominant colors
  for (let i = 0; i < pixelCount; i++) {
    const idx = i * 4;
    const r = rgba[idx] >> 3;
    const g = rgba[idx + 1] >> 3;
    const b = rgba[idx + 2] >> 3;
    const key = (r << 10) | (g << 5) | b;
    colorMap.set(key, (colorMap.get(key) || 0) + 1);
  }

  // 2. Select top 256 most frequent colors for local color table
  const sorted = Array.from(colorMap.entries()).sort((a, b) => b[1] - a[1]);
  const palette: [number, number, number][] = [];
  const keyToPaletteIndex = new Map<number, number>();

  const paletteSize = Math.min(256, sorted.length);
  for (let i = 0; i < paletteSize; i++) {
    const key = sorted[i][0];
    const r = ((key >> 10) & 0x1f) << 3;
    const g = ((key >> 5) & 0x1f) << 3;
    const b = (key & 0x1f) << 3;
    palette.push([r, g, b]);
    keyToPaletteIndex.set(key, i);
  }

  // Pad to exact 256 entries
  while (palette.length < 256) {
    palette.push([0, 0, 0]);
  }

  // 3. Map pixels to palette indices using Euclidean distance fallback
  const indexedPixels = new Uint8Array(pixelCount);
  for (let i = 0; i < pixelCount; i++) {
    const idx = i * 4;
    const r = rgba[idx] >> 3;
    const g = rgba[idx + 1] >> 3;
    const b = rgba[idx + 2] >> 3;
    const key = (r << 10) | (g << 5) | b;

    let palIdx = keyToPaletteIndex.get(key);
    if (palIdx === undefined) {
      const pr = rgba[idx];
      const pg = rgba[idx + 1];
      const pb = rgba[idx + 2];
      let minDist = Infinity;
      palIdx = 0;
      for (let p = 0; p < paletteSize; p++) {
        const [cr, cg, cb] = palette[p];
        const dist = (pr - cr) ** 2 + (pg - cg) ** 2 + (pb - cb) ** 2;
        if (dist < minDist) {
          minDist = dist;
          palIdx = p;
        }
      }
      keyToPaletteIndex.set(key, palIdx);
    }
    indexedPixels[i] = palIdx;
  }

  return { palette, indexedPixels };
}

function lzwCompress(minCodeSize: number, indexedPixels: Uint8Array): number[] {
  const clearCode = 1 << minCodeSize;
  const eoiCode = clearCode + 1;
  let codeSize = minCodeSize + 1;
  let nextCode = clearCode + 2;

  const dict = new Map<string, number>();
  function resetDict() {
    dict.clear();
    for (let i = 0; i < clearCode; i++) {
      dict.set(String(i), i);
    }
    codeSize = minCodeSize + 1;
    nextCode = clearCode + 2;
  }

  resetDict();

  const outBits: number[] = [];
  let curBits = 0;
  let curBitLen = 0;

  function writeBits(code: number, length: number) {
    curBits |= code << curBitLen;
    curBitLen += length;
    while (curBitLen >= 8) {
      outBits.push(curBits & 0xff);
      curBits >>= 8;
      curBitLen -= 8;
    }
  }

  writeBits(clearCode, codeSize);

  let prefix = String(indexedPixels[0]);
  for (let i = 1; i < indexedPixels.length; i++) {
    const c = indexedPixels[i];
    const combined = prefix + "," + c;
    if (dict.has(combined)) {
      prefix = combined;
    } else {
      writeBits(dict.get(prefix)!, codeSize);
      if (nextCode < 4096) {
        dict.set(combined, nextCode++);
        if (nextCode > (1 << codeSize) && codeSize < 12) {
          codeSize++;
        }
      } else {
        writeBits(clearCode, codeSize);
        resetDict();
      }
      prefix = String(c);
    }
  }

  writeBits(dict.get(prefix)!, codeSize);
  writeBits(eoiCode, codeSize);

  if (curBitLen > 0) {
    outBits.push(curBits & 0xff);
  }

  // Split into chunks <= 254 bytes
  const blocks: number[] = [];
  let offset = 0;
  while (offset < outBits.length) {
    const chunkLen = Math.min(254, outBits.length - offset);
    blocks.push(chunkLen);
    for (let i = 0; i < chunkLen; i++) {
      blocks.push(outBits[offset + i]);
    }
    offset += chunkLen;
  }
  blocks.push(0); // Block terminator
  return blocks;
}

export function encodeGif(
  frames: GifFrameInput[],
  width: number,
  height: number
): Blob {
  const bytes: number[] = [];

  // Header: GIF89a
  bytes.push(0x47, 0x49, 0x46, 0x38, 0x39, 0x61);

  // Logical Screen Descriptor
  bytes.push(width & 0xff, (width >> 8) & 0xff);
  bytes.push(height & 0xff, (height >> 8) & 0xff);
  bytes.push(0x70, 0x00, 0x00);

  // Netscape 2.0 loop extension (infinite loop)
  bytes.push(0x21, 0xff, 0x0b);
  for (const c of "NETSCAPE2.0") bytes.push(c.charCodeAt(0));
  bytes.push(0x03, 0x01, 0x00, 0x00, 0x00);

  for (const frame of frames) {
    const { palette, indexedPixels } = quantizeFrame(frame.data, width, height);
    const delayCentis = Math.max(2, Math.round(frame.delay / 10)); // hundredths of a second

    // Graphic Control Extension
    bytes.push(
      0x21,
      0xf9,
      0x04,
      0x00, // packed field: no disposal, no user input, no transparency
      delayCentis & 0xff,
      (delayCentis >> 8) & 0xff,
      0x00,
      0x00
    );

    // Image Descriptor
    bytes.push(
      0x2c,
      0x00,
      0x00,
      0x00,
      0x00, // Left 0, Top 0
      width & 0xff,
      (width >> 8) & 0xff,
      height & 0xff,
      (height >> 8) & 0xff,
      0x87 // Local color table enabled, 256 colors
    );

    // Local Color Table
    for (const [r, g, b] of palette) {
      bytes.push(r, g, b);
    }

    // Image Data
    bytes.push(8); // minCodeSize = 8
    const lzwBlocks = lzwCompress(8, indexedPixels);
    for (const b of lzwBlocks) {
      bytes.push(b);
    }
  }

  // Trailer: ';'
  bytes.push(0x3b);

  return new Blob([new Uint8Array(bytes)], { type: "image/gif" });
}
