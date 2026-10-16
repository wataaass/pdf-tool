import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root));

// PNG 画像の大きさ（幅・高さ）を、ファイル先頭の決まった位置から読む
function pngSize(path) {
  const bytes = read(path);
  assert.equal(bytes.toString('latin1', 1, 4), 'PNG', `${path} は PNG ではありません`);
  return `${bytes.readUInt32BE(16)}x${bytes.readUInt32BE(20)}`;
}

const manifest = JSON.parse(read('manifest.webmanifest').toString('utf8'));

test('アプリ情報：ホーム画面からアプリのように全画面で開く設定', () => {
  assert.equal(manifest.name, 'PDF変換ツール');
  assert.equal(manifest.short_name, 'PDFツール');
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.start_url, './');
  assert.equal(manifest.scope, './');
  assert.equal(manifest.lang, 'ja');
});

test('アプリ情報：192px・512px・マスク用（Android の丸や角丸の切り抜き用）のアイコンがある', () => {
  const kinds = manifest.icons.map((icon) => `${icon.sizes}:${icon.purpose ?? 'any'}`);
  assert.deepEqual(kinds.sort(), ['192x192:any', '512x512:any', '512x512:maskable']);
});

test('アプリ情報のアイコンは実在し、書かれた大きさと一致する', () => {
  for (const icon of manifest.icons) {
    assert.equal(icon.type, 'image/png');
    assert.equal(pngSize(icon.src), icon.sizes, icon.src);
  }
});

test('index.html がアプリ情報・iPhone 用アイコン・テーマ色を指している', () => {
  const html = read('index.html').toString('utf8');
  assert.match(html, /<link rel="manifest" href="manifest\.webmanifest">/);
  assert.match(html, /<link rel="apple-touch-icon" href="icons\/apple-touch-icon\.png">/);
  assert.match(html, /<meta name="theme-color" content="#2357c6">/);
  assert.equal(pngSize('icons/apple-touch-icon.png'), '180x180');
});
