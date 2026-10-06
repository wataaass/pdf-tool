import { PDFDocument } from '../lib/pdf-lib.esm.min.js';
import { loadPdf } from './pdf-load.js';

// source（読み込み済みの文書）から、指定ページ（1から数える）だけのPDFを作る
async function buildFromPages(source, pages) {
  const out = await PDFDocument.create();
  const copied = await out.copyPages(source, pages.map((page) => page - 1));
  copied.forEach((page) => out.addPage(page));
  return out.save();
}

async function splitDoc(source, groups, onProgress) {
  const results = [];
  for (const pages of groups) {
    results.push({ pages, bytes: await buildFromPages(source, pages) });
    await onProgress(results.length, groups.length);
  }
  return results;
}

// 「ページを選んで取り出す」：指定ページを集めた PDF を1つ返す
export async function extractPages(pdf, pages) {
  return buildFromPages(await loadPdf(pdf), pages);
}

// 「1ページずつバラバラに」：[{ pages: [1], bytes }, { pages: [2], bytes }, …]
export async function splitEach(pdf, onProgress = async () => {}) {
  const source = await loadPdf(pdf);
  const groups = source.getPageIndices().map((index) => [index + 1]);
  return splitDoc(source, groups, onProgress);
}

// 「指定ページで区切る」：groups（例 [[1,2,3],[4,5]]）の項目ごとに PDF を作る
export async function splitByRanges(pdf, groups, onProgress = async () => {}) {
  return splitDoc(await loadPdf(pdf), groups, onProgress);
}
