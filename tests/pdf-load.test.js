import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getPageCount, loadPdf } from '../js/pdf-load.js';
import { makeEmptyPdf, makeEncryptedPdf, makePdf, rejectsWithCode } from './helpers.js';

test('正しいPDFのページ数を返す', async () => {
  assert.equal(await getPageCount(await makePdf(3)), 3);
});

test('loadPdf は pdf-lib の文書を返す', async () => {
  const doc = await loadPdf(await makePdf(2));
  assert.equal(doc.getPageCount(), 2);
});

test('PDFでないデータは INVALID_PDF', async () => {
  await rejectsWithCode(loadPdf(new TextEncoder().encode('hello')), 'INVALID_PDF');
});

test('空のデータは INVALID_PDF', async () => {
  await rejectsWithCode(loadPdf(new Uint8Array(0)), 'INVALID_PDF');
});

test('0ページのPDFは INVALID_PDF', async () => {
  await rejectsWithCode(loadPdf(await makeEmptyPdf()), 'INVALID_PDF');
});

test('途中で切れたPDFは INVALID_PDF', async () => {
  const bytes = await makePdf(2);
  await rejectsWithCode(loadPdf(bytes.slice(0, 40)), 'INVALID_PDF');
});

test('パスワード付きPDFは PASSWORD_PROTECTED', async () => {
  await rejectsWithCode(loadPdf(await makeEncryptedPdf()), 'PASSWORD_PROTECTED');
});
