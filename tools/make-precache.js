// precache-manifest.js（オフライン用の保存一覧）を作り直す
// 使い方：npm run precache（アプリのファイルを変えたら、コミット前に必ず実行する）
import { writeFile } from 'node:fs/promises';
import { buildPrecacheManifest, listPrecacheFiles } from './precache.js';

const root = new URL('../', import.meta.url);
await writeFile(new URL('precache-manifest.js', root), await buildPrecacheManifest(root));
console.log(`作成: precache-manifest.js（${(await listPrecacheFiles(root)).length}件）`);
