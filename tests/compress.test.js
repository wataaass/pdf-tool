import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument, degrees } from '../lib/pdf-lib.esm.min.js';
import { compressLight, compressStrong, displaySize, STRONG_LEVELS } from '../js/compress.js';
import { makePdf, pageMarks, pageRotations, pageSizes, rejectsWithCode, TINY_JPEG } from './helpers.js';

// 本物の描画の代わりに、呼ばれた内容を記録して極小JPEGを返す
function fakeRenderer() {
  const calls = [];
  const render = async (pageNumber, setting) => {
    calls.push([pageNumber, setting]);
    return TINY_JPEG;
  };
  return { calls, render };
}

test('compressLight：ページ数と中身を保ったPDFを返す', async () => {
  const result = await compressLight(await makePdf(3));
  assert.deepEqual(await pageMarks(result), [101, 102, 103]);
});

test('compressLight：壊れたPDFは INVALID_PDF', async () => {
  await rejectsWithCode(compressLight(new TextEncoder().encode('hello')), 'INVALID_PDF');
});

test('compressStrong：全ページを指定の設定で描き、同じ見た目の大きさのページを作る', async () => {
  const { calls, render } = fakeRenderer();
  const result = await compressStrong(await makePdf(2, { rotations: { 2: 90 } }), 'medium', render);
  assert.deepEqual(calls, [[1, STRONG_LEVELS.medium], [2, STRONG_LEVELS.medium]]);
  assert.deepEqual(await pageSizes(result), [[101, 200], [200, 102]]); // 2ページ目は回転を反映して横長
  assert.deepEqual(await pageRotations(result), [0, 0]); // 回転は描いた画像に反映済み
});

test('compressStrong：1ページごとに進み具合を知らせる', async () => {
  const progress = [];
  await compressStrong(await makePdf(2), 'low', fakeRenderer().render, async (done, total) => progress.push([done, total]));
  assert.deepEqual(progress, [[1, 2], [2, 2]]);
});

test('compressStrong：知らない段階はエラー', async () => {
  await assert.rejects(compressStrong(await makePdf(1), 'ultra', fakeRenderer().render));
});

test('displaySize：CropBox（表示範囲）と回転を使う', async () => {
  const doc = await PDFDocument.create();
  const page = doc.addPage([300, 400]);
  page.setCropBox(0, 0, 100, 200);
  assert.deepEqual(displaySize(page), { width: 100, height: 200 });
  page.setRotation(degrees(270));
  assert.deepEqual(displaySize(page), { width: 200, height: 100 });
});
