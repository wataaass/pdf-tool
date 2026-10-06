// 手動確認用のサンプルファイルを samples/ フォルダに作る（Git には入れない）
// 使い方：npm run samples
import { mkdir, writeFile } from 'node:fs/promises';
import { crc32, deflateSync } from 'node:zlib';
import { PDFDocument, StandardFonts, degrees, rgb } from '../lib/pdf-lib.esm.min.js';
import { makeCcittImagePdf, makeNonEmbeddedJapaneseFontPdf } from '../tests/helpers.js';

const outDir = new URL('../samples/', import.meta.url);

// 各ページに大きなページ番号を書いたA4のPDF（プレビューで見分けやすくするため）
async function numberedPdf(pageCount, { rotate = {} } = {}) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 1; i <= pageCount; i++) {
    const page = doc.addPage([595.28, 841.89]);
    page.drawText(String(i), { x: 180, y: 380, size: 200, font, color: rgb(0.14, 0.34, 0.78) });
    page.drawText(`page ${i} / ${pageCount}`, { x: 40, y: 40, size: 24, font });
    if (rotate[i]) page.setRotation(degrees(rotate[i]));
  }
  return doc.save();
}

async function encryptedPdf() {
  const doc = await PDFDocument.create();
  doc.addPage([595.28, 841.89]);
  doc.context.trailerInfo.Encrypt = doc.context.obj({ Filter: 'Standard' });
  return doc.save({ useObjectStreams: false });
}

// 単色のPNG画像を作る（PNGの形式どおりにバイト列を組み立てる）
function solidPng(width, height, [r, g, b]) {
  const row = Buffer.alloc(1 + width * 3); // 先頭の1バイトは「フィルターなし」の印
  for (let x = 0; x < width; x++) row.set([r, g, b], 1 + x * 3);
  const raw = Buffer.concat(Array.from({ length: height }, () => row));
  const chunk = (type, data) => {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body));
    return Buffer.concat([length, body, crc]);
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.set([8, 2, 0, 0, 0], 8); // 8bit・RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

await mkdir(outDir, { recursive: true });
const files = {
  'sample-3p.pdf': await numberedPdf(3),
  'sample-12p.pdf': await numberedPdf(12),
  'sample-60p.pdf': await numberedPdf(60),
  'rotated-2p.pdf': await numberedPdf(2, { rotate: { 2: 90 } }),
  'encrypted.pdf': await encryptedPdf(),
  'japanese-font.pdf': await makeNonEmbeddedJapaneseFontPdf(),
  'scan-ccitt.pdf': await makeCcittImagePdf(),
  'broken.pdf': new TextEncoder().encode('this is not a pdf'),
  'not-pdf.txt': new TextEncoder().encode('not a pdf'),
  'landscape.png': solidPng(1200, 800, [220, 60, 60]),
  'portrait.png': solidPng(800, 1200, [60, 120, 220]),
};
for (const [name, bytes] of Object.entries(files)) {
  await writeFile(new URL(name, outDir), bytes);
  console.log(`作成: samples/${name}`);
}
