import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ErrorCode, PdfToolError } from '../js/errors.js';
import { errorMessage, formatBytes, sizeChangeText } from '../js/messages.js';

const message = (code, detail, fileName) => errorMessage(new PdfToolError(code, detail), fileName);

test('ファイルに関するエラーの文', () => {
  assert.equal(message(ErrorCode.UNSUPPORTED_FILE, {}, 'a.jpg'), '「a.jpg」はPDFではないため追加しませんでした。');
  assert.equal(message(ErrorCode.INVALID_PDF, {}, 'a.pdf'), '「a.pdf」を読み込めませんでした。ファイルが壊れている可能性があります。');
  assert.equal(message(ErrorCode.UNSUPPORTED_IMAGE, {}, 'a.heic'), '「a.heic」は開けない画像形式です。JPEGやPNGで保存し直してください。');
});

test('パスワード付きの文は「編集制限」にも触れる（パスワードなしで開けるが制限付きのPDFもあるため）', () => {
  assert.equal(message(ErrorCode.PASSWORD_PROTECTED, {}, 'a.pdf'), '「a.pdf」はパスワードや編集制限で保護されているため、対応していません。');
});

test('ファイル名がなければ「ファイル」と書く', () => {
  assert.equal(message(ErrorCode.INVALID_PDF, {}), 'ファイルを読み込めませんでした。ファイルが壊れている可能性があります。');
});

test('大きすぎる・想定外のエラーの文', () => {
  assert.equal(message(ErrorCode.TOO_LARGE, {}), 'ファイルが大きすぎてこの端末では処理できませんでした。ページ数を減らすか、PCでお試しください。');
  assert.equal(message(ErrorCode.UNKNOWN, {}), '予期しないエラーが発生しました。');
});

test('ページ指定のエラーの文', () => {
  const range = (detail) => message(ErrorCode.INVALID_PAGE_RANGE, detail);
  assert.equal(range({ reason: 'empty' }), 'ページを指定してください（例：1-3, 5）。');
  assert.equal(range({ reason: 'syntax', token: 'abc' }), '「abc」の書き方が正しくありません（例：1-3, 5）。');
  assert.equal(range({ reason: 'zero', token: '0' }), 'ページ番号は1から数えます。');
  assert.equal(range({ reason: 'over', page: 15, pageCount: 12 }), '15ページはありません（全12ページ）。');
  assert.equal(range({ reason: 'reversed', token: '5-3' }), '「5-3」は始まりのページが終わりより後になっています。');
});

test('formatBytes', () => {
  assert.equal(formatBytes(500), '500B');
  assert.equal(formatBytes(2048), '2.0KB');
  assert.equal(formatBytes(3355443), '3.2MB');
});

test('sizeChangeText：小さくなった場合は減った割合', () => {
  assert.deepEqual(sizeChangeText(3355443, 838861), { text: '3.2MB → 819.2KB（75%減）', grew: false });
  assert.deepEqual(sizeChangeText(1000, 1000), { text: '1000B → 1000B（0%減）', grew: false });
});

test('sizeChangeText：大きくなった場合は保存不要と伝える', () => {
  assert.deepEqual(sizeChangeText(1000, 1200), {
    text: '1000B → 1.2KB（元のファイルより大きくなりました。保存する必要はありません）',
    grew: true,
  });
});
