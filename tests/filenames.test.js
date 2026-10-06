import { test } from 'node:test';
import assert from 'node:assert/strict';
import { baseName, makeUnique, OUTPUT_NAMES } from '../js/filenames.js';

test('baseName は最後の拡張子だけを外す', () => {
  assert.equal(baseName('report.pdf'), 'report');
  assert.equal(baseName('a.b.pdf'), 'a.b');
  assert.equal(baseName('scan'), 'scan');
  assert.equal(baseName('.pdf'), '.pdf');
});

test('保存するファイルの名前', () => {
  assert.equal(OUTPUT_NAMES.images, 'images.pdf');
  assert.equal(OUTPUT_NAMES.merged, 'merged.pdf');
  assert.equal(OUTPUT_NAMES.extract('資料.pdf'), '資料_抽出.pdf');
  assert.equal(OUTPUT_NAMES.splitZip('資料.pdf'), '資料_分割.zip');
  assert.equal(OUTPUT_NAMES.eachPage('資料.pdf', 3, 12), '資料_p03.pdf');
  assert.equal(OUTPUT_NAMES.eachPage('資料.pdf', 3, 9), '資料_p3.pdf');
  assert.equal(OUTPUT_NAMES.range('資料.pdf', [1, 2, 3]), '資料_p1-3.pdf');
  assert.equal(OUTPUT_NAMES.range('資料.pdf', [5]), '資料_p5.pdf');
  assert.equal(OUTPUT_NAMES.rotated('資料.pdf'), '資料_回転.pdf');
  assert.equal(OUTPUT_NAMES.compressed('資料.pdf'), '資料_圧縮.pdf');
});

test('makeUnique は重なった名前に (2) (3) を付ける', () => {
  assert.deepEqual(
    makeUnique(['a_p1-3.pdf', 'b.pdf', 'a_p1-3.pdf', 'a_p1-3.pdf', 'noext', 'noext']),
    ['a_p1-3.pdf', 'b.pdf', 'a_p1-3(2).pdf', 'a_p1-3(3).pdf', 'noext', 'noext(2)'],
  );
});
