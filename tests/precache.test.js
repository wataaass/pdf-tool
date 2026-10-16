import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { buildPrecacheManifest, listPrecacheFiles, precacheVersion } from '../tools/precache.js';

const root = new URL('../', import.meta.url);

test('precache-manifest.js が最新（ファイルを変えたら npm run precache で作り直す）', async () => {
  const current = await readFile(new URL('precache-manifest.js', root), 'utf8');
  assert.equal(current.replace(/\r\n/g, '\n'), await buildPrecacheManifest(root));
});

test('オフラインで使うのに必要なファイルが保存一覧に入っている', async () => {
  const files = await listPrecacheFiles(root);
  for (const required of [
    './', 'index.html', 'manifest.webmanifest', 'css/style.css', 'js/main.js', 'js/pwa.js', 'js/ui/split-screen.js',
    'lib/pdf.min.js', 'lib/pdf.worker.min.js', 'lib/jszip.min.js', 'lib/pdf-lib.esm.min.js',
    'lib/pdfjs/cmaps/UniJIS-UCS2-H.bcmap', 'lib/pdfjs/wasm/openjpeg.wasm', 'lib/pdfjs/standard_fonts/FoxitSerif.pfb',
    'icons/icon-192.png', 'icons/apple-touch-icon.png',
  ]) {
    assert.ok(files.includes(required), `${required} が入っていない`);
  }
});

test('公開しない作業用ファイルや Service Worker 自身は保存一覧に入らない', async () => {
  const files = await listPrecacheFiles(root);
  const unwanted = files.filter((file) => /^(tests|tools|docs|samples)\//.test(file) || /^\.[^/]/.test(file)
    || ['sw.js', 'precache-manifest.js', 'package.json'].includes(file));
  assert.deepEqual(unwanted, []);
});

// 一時フォルダに小さなアプリの形を作る
async function makeTinyApp(files) {
  const dir = await mkdtemp(join(tmpdir(), 'precache-'));
  for (const [path, content] of Object.entries(files)) {
    await mkdir(join(dir, path, '..'), { recursive: true });
    await writeFile(join(dir, path), content);
  }
  return pathToFileURL(`${dir}/`);
}

test('ファイルの中身が変わると版の目印が変わる', async () => {
  const before = await makeTinyApp({ 'index.html': '<p>1</p>', 'js/main.js': 'a();' });
  const after = await makeTinyApp({ 'index.html': '<p>1</p>', 'js/main.js': 'b();' });
  assert.notEqual(await precacheVersion(before), await precacheVersion(after));
});

test('改行コードの違い（Windows の CRLF と LF）だけでは版の目印は変わらない', async () => {
  const lf = await makeTinyApp({ 'index.html': '<p>\n1\n</p>', 'js/main.js': 'a();\n' });
  const crlf = await makeTinyApp({ 'index.html': '<p>\r\n1\r\n</p>', 'js/main.js': 'a();\r\n' });
  assert.equal(await precacheVersion(lf), await precacheVersion(crlf));
});

test('画像などのバイナリは改行コードの置き換えをしない（中身が違えば版が変わる）', async () => {
  const a = await makeTinyApp({ 'index.html': 'x', 'icons/a.png': Buffer.from([0x0d, 0x0a]) });
  const b = await makeTinyApp({ 'index.html': 'x', 'icons/a.png': Buffer.from([0x0a]) });
  assert.notEqual(await precacheVersion(a), await precacheVersion(b));
});
