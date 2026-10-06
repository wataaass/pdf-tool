import { test } from 'node:test';
import assert from 'node:assert/strict';
import { A4, A4_MARGIN, computePlacement, imagesToPdf } from '../js/image-to-pdf.js';
import { pageSizes, round2, TINY_JPEG, TINY_PNG } from './helpers.js';

const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 0.01, `${actual} ≒ ${expected}`);

test('A4：縦長の大きな写真はA4縦の余白内に縮めて中央に置く', () => {
  const p = computePlacement(3024, 4032, 'a4');
  assert.equal(p.pageWidth, A4.width);
  assert.equal(p.pageHeight, A4.height);
  near(p.width, A4.width - 2 * A4_MARGIN); // 幅いっぱい（余白を除く）
  near(p.x, A4_MARGIN);
  near(p.y * 2 + p.height, A4.height); // 上下中央
  near(p.width / p.height, 3024 / 4032); // 縦横比を保つ
});

test('A4：横長の写真ならA4を横向きにする', () => {
  const p = computePlacement(4032, 3024, 'a4');
  assert.equal(p.pageWidth, A4.height);
  assert.equal(p.pageHeight, A4.width);
  near(p.x * 2 + p.width, A4.height);
  near(p.y * 2 + p.height, A4.width);
});

test('A4：正方形の画像は縦向き', () => {
  assert.equal(computePlacement(1000, 1000, 'a4').pageWidth, A4.width);
});

test('A4：小さい画像は拡大せず中央に置く', () => {
  const p = computePlacement(200, 100, 'a4');
  near(p.width, 150);
  near(p.height, 75);
  near(p.x, (A4.height - 150) / 2);
  near(p.y, (A4.width - 75) / 2);
});

test('画像と同じ大きさ：ページ＝画像、余白なし', () => {
  assert.deepEqual(computePlacement(800, 600, 'fit'), { pageWidth: 600, pageHeight: 450, x: 0, y: 0, width: 600, height: 450 });
});

test('imagesToPdf：画像の数だけページができ、向きとサイズが反映される', async () => {
  const images = [
    { bytes: TINY_JPEG, type: 'jpeg', widthPx: 800, heightPx: 600 },
    { bytes: TINY_PNG, type: 'png', widthPx: 600, heightPx: 800 },
  ];
  assert.deepEqual(await pageSizes(await imagesToPdf(images, 'a4')), [
    [round2(A4.height), round2(A4.width)],
    [round2(A4.width), round2(A4.height)],
  ]);
  assert.deepEqual(await pageSizes(await imagesToPdf(images, 'fit')), [[600, 450], [450, 600]]);
});

test('imagesToPdf：1枚ごとに進み具合を知らせる', async () => {
  const calls = [];
  const image = { bytes: TINY_PNG, type: 'png', widthPx: 2, heightPx: 1 };
  await imagesToPdf([image, image], 'fit', async (done, total) => calls.push([done, total]));
  assert.deepEqual(calls, [[1, 2], [2, 2]]);
});
