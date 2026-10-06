import { PDFDocument } from '../lib/pdf-lib.esm.min.js';
import { loadPdf } from './pdf-load.js';

// 複数のPDFを、渡した順番どおりに1つにまとめる
export async function mergePdfs(pdfs, onProgress = async () => {}) {
  const out = await PDFDocument.create();
  for (let i = 0; i < pdfs.length; i++) {
    const source = await loadPdf(pdfs[i]);
    const pages = await out.copyPages(source, source.getPageIndices());
    pages.forEach((page) => out.addPage(page));
    await onProgress(i + 1, pdfs.length);
  }
  return out.save();
}
