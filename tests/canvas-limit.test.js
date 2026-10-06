import { test } from 'node:test';
import assert from 'node:assert/strict';
import { limitSize, MAX_CANVAS_PIXELS } from '../js/canvas-limit.js';

test('上限以内ならそのまま（12メガピクセルの写真）', () => {
  assert.deepEqual(limitSize(4032, 3024), { widthPx: 4032, heightPx: 3024 });
});

test('上限を超える48メガピクセルの写真は、縦横比を保って上限内に縮める', () => {
  const { widthPx, heightPx } = limitSize(8064, 6048);
  assert.ok(widthPx * heightPx <= MAX_CANVAS_PIXELS);
  assert.ok(widthPx * heightPx > MAX_CANVAS_PIXELS * 0.99);
  assert.ok(Math.abs(widthPx / heightPx - 8064 / 6048) < 0.01);
});

test('小数の大きさは四捨五入する', () => {
  assert.deepEqual(limitSize(100.4, 50.6), { widthPx: 100, heightPx: 51 });
});
