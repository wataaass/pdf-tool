import { PDFDocument } from '../lib/pdf-lib.esm.min.js';
import { loadPdf } from './pdf-load.js';
import { normalizeAngle } from './rotate.js';

// 「強く圧縮」の段階ごとの設定
export const STRONG_LEVELS = Object.freeze({
  low: Object.freeze({ dpi: 200, quality: 0.85 }),
  medium: Object.freeze({ dpi: 150, quality: 0.7 }),
  high: Object.freeze({ dpi: 100, quality: 0.5 }),
});

// 「画質そのまま」：中身の構造を整理して保存し直す
export async function compressLight(pdf) {
  const doc = await loadPdf(pdf);
  return doc.save({ useObjectStreams: true });
}

// ページの見た目の大きさ（回転を反映）。pdf.js と同じく CropBox（表示範囲）を使う
export function displaySize(page) {
  const { width, height } = page.getCropBox();
  const sideways = normalizeAngle(page.getRotation().angle) % 180 === 90;
  return sideways ? { width: height, height: width } : { width, height };
}

// 「強く圧縮」：各ページを JPEG にして作り直す。
// renderPage(ページ番号, { dpi, quality }) は、ページの見た目を JPEG にして返す関数（ブラウザでは preview.js が作る）
export async function compressStrong(pdf, level, renderPage, onProgress = async () => {}) {
  const setting = STRONG_LEVELS[level];
  if (!setting) throw new Error(`unknown level: ${level}`);
  const source = await loadPdf(pdf);
  const out = await PDFDocument.create();
  const pages = source.getPages();
  for (let i = 0; i < pages.length; i++) {
    const { width, height } = displaySize(pages[i]);
    const image = await out.embedJpg(await renderPage(i + 1, setting));
    out.addPage([width, height]).drawImage(image, { x: 0, y: 0, width, height });
    await onProgress(i + 1, pages.length);
  }
  return out.save({ useObjectStreams: true });
}
