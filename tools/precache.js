// オフライン用に端末へ保存するファイルの一覧（precache-manifest.js）を作る部品
import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';

// 保存する対象（アプリとして配信するものだけ。tests/ tools/ docs/ などは入れない）
const PRECACHE_ROOTS = ['index.html', 'manifest.webmanifest', 'css', 'js', 'icons', 'lib'];

// 改行コードをそろえて版の目印を計算する文字ファイルの種類（Windows の CRLF でも同じ版になるように）
const TEXT_EXTENSIONS = /\.(html|css|js|mjs|json|webmanifest|txt|md|markdown)$/i;

async function walk(rootUrl, path) {
  let entries;
  try {
    entries = await readdir(new URL(path, rootUrl), { withFileTypes: true });
  } catch (err) {
    if (err.code === 'ENOTDIR') return [path];
    if (err.code === 'ENOENT') return [];
    throw err;
  }
  const files = [];
  for (const entry of entries) {
    const child = `${path}/${entry.name}`;
    files.push(...(entry.isDirectory() ? await walk(rootUrl, child) : [child]));
  }
  return files;
}

// rootUrl（末尾が / のフォルダの URL）から、保存するファイルの相対パスを並べて返す。先頭の './' は起動時のページ
export async function listPrecacheFiles(rootUrl) {
  const files = [];
  for (const path of PRECACHE_ROOTS) files.push(...(await walk(rootUrl, path)));
  return ['./', ...files.sort()];
}

// 全ファイルの中身から版の目印（12文字）を計算する。1文字でも変われば別の値になる
export async function precacheVersion(rootUrl) {
  const hash = createHash('sha256');
  for (const path of await listPrecacheFiles(rootUrl)) {
    if (path === './') continue;
    let bytes = await readFile(new URL(path, rootUrl));
    if (TEXT_EXTENSIONS.test(path)) bytes = Buffer.from(bytes.toString('utf8').replace(/\r\n/g, '\n'), 'utf8');
    hash.update(`${path}\0`).update(bytes).update('\0');
  }
  return hash.digest('hex').slice(0, 12);
}

// precache-manifest.js の中身（Service Worker が importScripts で読み込む）
export async function buildPrecacheManifest(rootUrl) {
  const files = await listPrecacheFiles(rootUrl);
  return [
    '// 自動生成ファイル。手で書き換えず、npm run precache で作り直す',
    `self.PRECACHE_VERSION = '${await precacheVersion(rootUrl)}';`,
    'self.PRECACHE_FILES = [',
    ...files.map((file) => `  '${file}',`),
    '];',
    '',
  ].join('\n');
}
