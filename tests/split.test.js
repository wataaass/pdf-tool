import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractPages, splitByRanges, splitEach } from '../js/split.js';
import { makePdf, pageMarks, pageRotations, rejectsWithCode } from './helpers.js';

test('extractPages：指定したページだけを順番どおりに取り出す', async () => {
  const result = await extractPages(await makePdf(12), [1, 2, 3, 5]);
  assert.deepEqual(await pageMarks(result), [101, 102, 103, 105]);
});

test('extractPages：ページの回転を引き継ぐ', async () => {
  const result = await extractPages(await makePdf(2, { rotations: { 2: 90 } }), [2]);
  assert.deepEqual(await pageRotations(result), [90]);
});

test('splitEach：1ページずつ別々のPDFにする', async () => {
  const results = await splitEach(await makePdf(3));
  assert.deepEqual(results.map((r) => r.pages), [[1], [2], [3]]);
  assert.deepEqual(await Promise.all(results.map((r) => pageMarks(r.bytes))), [[101], [102], [103]]);
});

test('splitByRanges：範囲ごとにPDFを作る', async () => {
  const groups = [[1, 2, 3], [4, 5, 6, 7, 8, 9, 10]];
  const results = await splitByRanges(await makePdf(10), groups);
  assert.deepEqual(results.map((r) => r.pages), groups);
  assert.deepEqual(await pageMarks(results[0].bytes), [101, 102, 103]);
  assert.deepEqual(await pageMarks(results[1].bytes), [104, 105, 106, 107, 108, 109, 110]);
});

test('splitByRanges：範囲が重なっていても作れる', async () => {
  const results = await splitByRanges(await makePdf(3), [[1, 2], [2, 3]]);
  assert.deepEqual(await pageMarks(results[1].bytes), [102, 103]);
});

test('splitByRanges：1ファイルごとに進み具合を知らせる', async () => {
  const calls = [];
  await splitByRanges(await makePdf(3), [[1], [2, 3]], async (done, total) => calls.push([done, total]));
  assert.deepEqual(calls, [[1, 2], [2, 2]]);
});

test('壊れたPDFは INVALID_PDF', async () => {
  await rejectsWithCode(splitEach(new TextEncoder().encode('hello')), 'INVALID_PDF');
});
