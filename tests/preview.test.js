import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { closePreviewDoc, openPreviewDoc, RESOURCE_OPTIONS } from '../js/preview.js';
import { collectWarnings, makeCcittImagePdf, makePdf, rejectsWithCode } from './helpers.js';

test('openPreviewDoc：ページ数が分かり、渡したデータは空にならない', async () => {
  const pdf = await makePdf(3);
  const lengthBefore = pdf.length;
  const doc = await openPreviewDoc(pdf);
  assert.equal(doc.numPages, 3);
  assert.equal(pdf.length, lengthBefore); // コピーを渡していなければ 0 になる
  await closePreviewDoc(doc);
});

test('openPreviewDoc：PDFでないデータは INVALID_PDF', async () => {
  await rejectsWithCode(openPreviewDoc(new TextEncoder().encode('hello')), 'INVALID_PDF');
});

test('白黒スキャン（CCITT）の画像も、画像を読む部品を使って描ける', async () => {
  const doc = await openPreviewDoc(await makeCcittImagePdf());
  const warnings = await collectWarnings(async () => (await doc.getPage(1)).getOperatorList());
  await closePreviewDoc(doc);
  assert.deepEqual(warnings.filter((w) => /wasmUrl|Unable to decode image/.test(w)), []);
});

// 埋め込みのない日本語フォントの文字が実際に描かれるかはブラウザで確かめる
// （Node.js の pdf.js は、日本語を含むフォルダの file:// アドレスから文字対応表を読めないため）。
// ここでは、補助ファイルがプレビュー部品の指す場所に実在することを確かめる
test('補助ファイル（文字対応表・標準フォント・画像部品・色変換表）がプレビュー部品の指す場所にある', () => {
  const required = [
    `${RESOURCE_OPTIONS.cMapUrl}UniJIS-UCS2-H.bcmap`,
    `${RESOURCE_OPTIONS.standardFontDataUrl}FoxitSerif.pfb`,
    `${RESOURCE_OPTIONS.wasmUrl}jbig2.wasm`,
    `${RESOURCE_OPTIONS.wasmUrl}openjpeg.wasm`,
    `${RESOURCE_OPTIONS.wasmUrl}qcms_bg.wasm`,
    `${RESOURCE_OPTIONS.iccUrl}CGATS001Compat-v2-micro.icc`,
  ];
  assert.deepEqual(required.filter((url) => !existsSync(fileURLToPath(url))), []);
  assert.equal(RESOURCE_OPTIONS.cMapPacked, true);
});

test('closePreviewDoc：何も開いていなくてもエラーにならない', async () => {
  await closePreviewDoc(null);
});
