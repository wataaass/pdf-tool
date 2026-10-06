import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatPageRange, parsePageRange, toSortedUniquePages } from '../js/page-range.js';

// 指定の理由（reason など）で INVALID_PAGE_RANGE になることを確かめる
function throwsRange(fn, expected) {
  assert.throws(fn, (err) => {
    assert.equal(err.code, 'INVALID_PAGE_RANGE');
    for (const [key, value] of Object.entries(expected)) assert.equal(err.detail[key], value);
    return true;
  });
}

test('単独ページと範囲を読み取る', () => {
  assert.deepEqual(parsePageRange('1-3, 5', 12), [[1, 2, 3], [5]]);
});

test('全角数字・全角ハイフン・読点・全角空白を受け付ける', () => {
  assert.deepEqual(parsePageRange('１－３、　５', 12), [[1, 2, 3], [5]]);
});

test('~ 〜 ～ も範囲の記号として使える', () => {
  assert.deepEqual(parsePageRange('1~2', 5), [[1, 2]]);
  assert.deepEqual(parsePageRange('1〜2', 5), [[1, 2]]);
  assert.deepEqual(parsePageRange('1～2', 5), [[1, 2]]);
});

test('「5-」は5ページから最後まで', () => {
  assert.deepEqual(parsePageRange('5-', 7), [[5, 6, 7]]);
});

test('末尾や連続のカンマは無視する', () => {
  assert.deepEqual(parsePageRange('1,,2,', 5), [[1], [2]]);
});

test('入力した順番と範囲の重なりを保つ（区切る用）', () => {
  assert.deepEqual(parsePageRange('4-5, 1-2, 2', 5), [[4, 5], [1, 2], [2]]);
});

test('空の入力は empty', () => {
  throwsRange(() => parsePageRange('  ', 5), { reason: 'empty' });
  throwsRange(() => parsePageRange(',', 5), { reason: 'empty' });
});

test('数字以外や形の崩れた入力は syntax', () => {
  throwsRange(() => parsePageRange('1-3, abc', 5), { reason: 'syntax', token: 'abc' });
  throwsRange(() => parsePageRange('-3', 5), { reason: 'syntax', token: '-3' });
  throwsRange(() => parsePageRange('1-2-3', 5), { reason: 'syntax', token: '1-2-3' });
});

test('0ページは zero', () => {
  throwsRange(() => parsePageRange('0-2', 5), { reason: 'zero', token: '0-2' });
});

test('全ページ数を超えると over', () => {
  throwsRange(() => parsePageRange('10-15', 12), { reason: 'over', page: 15, pageCount: 12 });
  throwsRange(() => parsePageRange('13-', 12), { reason: 'over', page: 13, pageCount: 12 });
});

test('開始 > 終了 は reversed', () => {
  throwsRange(() => parsePageRange('5-3', 12), { reason: 'reversed', token: '5-3' });
});

test('toSortedUniquePages は昇順・重複なし', () => {
  assert.deepEqual(toSortedUniquePages([[5], [1, 2, 3], [2]]), [1, 2, 3, 5]);
});

test('formatPageRange は連続するページを範囲にまとめる', () => {
  assert.equal(formatPageRange([5, 1, 2, 3]), '1-3, 5');
  assert.equal(formatPageRange([2, 2, 4]), '2, 4');
  assert.equal(formatPageRange([]), '');
});

test('formatPageRange の結果は parsePageRange で読み戻せる', () => {
  const pages = [1, 2, 3, 7, 9, 10];
  assert.deepEqual(toSortedUniquePages(parsePageRange(formatPageRange(pages), 10)), pages);
});
