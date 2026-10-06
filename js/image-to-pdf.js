import { PDFDocument } from '../lib/pdf-lib.esm.min.js';

export const PX_TO_PT = 0.75; // 1ピクセル = 0.75pt（pt は PDF の長さの単位。1pt = 1/72 インチ）
export const A4 = Object.freeze({ width: 595.28, height: 841.89 });
export const A4_MARGIN = 28.35; // 10mm

// 画像をページのどこに、どの大きさで置くかを計算する（単位は pt）
// mode: "a4" = A4に余白付きで収める（縮小のみ）、"fit" = ページを画像と同じ大きさにする
export function computePlacement(widthPx, heightPx, mode) {
  const w = widthPx * PX_TO_PT;
  const h = heightPx * PX_TO_PT;
  if (mode === 'fit') return { pageWidth: w, pageHeight: h, x: 0, y: 0, width: w, height: h };
  const landscape = widthPx > heightPx;
  const pageWidth = landscape ? A4.height : A4.width;
  const pageHeight = landscape ? A4.width : A4.height;
  const scale = Math.min(1, (pageWidth - 2 * A4_MARGIN) / w, (pageHeight - 2 * A4_MARGIN) / h);
  const width = w * scale;
  const height = h * scale;
  return { pageWidth, pageHeight, x: (pageWidth - width) / 2, y: (pageHeight - height) / 2, width, height };
}

// images: [{ bytes, type: "jpeg" | "png", widthPx, heightPx }] を1つのPDFにする
export async function imagesToPdf(images, mode, onProgress = async () => {}) {
  const doc = await PDFDocument.create();
  for (let i = 0; i < images.length; i++) {
    const { bytes, type, widthPx, heightPx } = images[i];
    const image = type === 'png' ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
    const p = computePlacement(widthPx, heightPx, mode);
    doc.addPage([p.pageWidth, p.pageHeight]).drawImage(image, { x: p.x, y: p.y, width: p.width, height: p.height });
    await onProgress(i + 1, images.length);
  }
  return doc.save();
}
