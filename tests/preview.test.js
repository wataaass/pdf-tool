import { test } from 'node:test';
import assert from 'node:assert/strict';
import { closePreviewDoc, openPreviewDoc } from '../js/preview.js';
import { makePdf, rejectsWithCode } from './helpers.js';

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

test('closePreviewDoc：何も開いていなくてもエラーにならない', async () => {
  await closePreviewDoc(null);
});
