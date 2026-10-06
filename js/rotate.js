import { degrees } from '../lib/pdf-lib.esm.min.js';
import { loadPdf } from './pdf-load.js';

// 角度を 0, 90, 180, 270 のどれかにそろえる（-90 → 270、450 → 90）
export function normalizeAngle(angle) {
  return ((angle % 360) + 360) % 360;
}

// rotations: { ページ番号: 追加する角度 }（例 { 2: 90 }）。元からの回転に足す
export async function rotatePages(pdf, rotations) {
  const doc = await loadPdf(pdf);
  const pages = doc.getPages();
  for (const [pageNumber, added] of Object.entries(rotations)) {
    const page = pages[Number(pageNumber) - 1];
    page.setRotation(degrees(normalizeAngle(page.getRotation().angle + added)));
  }
  return doc.save();
}
