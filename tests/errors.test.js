import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ErrorCode, PdfToolError, toToolError } from '../js/errors.js';

test('PdfToolError はコードと詳細を持つ Error', () => {
  const err = new PdfToolError(ErrorCode.INVALID_PDF, { page: 3 });
  assert.ok(err instanceof Error);
  assert.equal(err.code, 'INVALID_PDF');
  assert.deepEqual(err.detail, { page: 3 });
});

test('toToolError: PdfToolError はそのまま返す', () => {
  const err = new PdfToolError(ErrorCode.PASSWORD_PROTECTED);
  assert.equal(toToolError(err), err);
});

test('toToolError: RangeError やメモリ不足の文は TOO_LARGE', () => {
  assert.equal(toToolError(new RangeError('Array buffer allocation failed')).code, 'TOO_LARGE');
  assert.equal(toToolError(new Error('out of memory')).code, 'TOO_LARGE');
});

test('toToolError: その他は UNKNOWN で、元のエラーを cause に持つ', () => {
  const original = new TypeError('x is undefined');
  const err = toToolError(original);
  assert.equal(err.code, 'UNKNOWN');
  assert.equal(err.detail.cause, original);
});
