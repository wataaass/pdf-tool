import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergePdfs } from '../js/merge.js';
import { makePdf, pageMarks, rejectsWithCode } from './helpers.js';

test('3ページ＋2ページを順番どおりに結合する', async () => {
  const merged = await mergePdfs([await makePdf(3), await makePdf(2)]);
  assert.deepEqual(await pageMarks(merged), [101, 102, 103, 101, 102]);
});

test('同じPDFを2回選んでも結合でき、元のデータは変わらない', async () => {
  const pdf = await makePdf(2);
  const lengthBefore = pdf.length;
  const merged = await mergePdfs([pdf, pdf]);
  assert.deepEqual(await pageMarks(merged), [101, 102, 101, 102]);
  assert.equal(pdf.length, lengthBefore);
});

test('1ファイルごとに進み具合を知らせる', async () => {
  const calls = [];
  await mergePdfs([await makePdf(1), await makePdf(1)], async (done, total) => calls.push([done, total]));
  assert.deepEqual(calls, [[1, 2], [2, 2]]);
});

test('壊れたPDFが混ざっていたら INVALID_PDF', async () => {
  await rejectsWithCode(mergePdfs([await makePdf(1), new TextEncoder().encode('hello')]), 'INVALID_PDF');
});
