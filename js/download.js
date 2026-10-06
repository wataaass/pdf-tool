import { makeUnique } from './filenames.js';

// できたファイルを端末に保存させる【ブラウザ専用】
export function downloadBytes(bytes, fileName, mimeType = 'application/pdf') {
  const url = URL.createObjectURL(new Blob([bytes], { type: mimeType }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000); // 保存が始まるまで少し待ってから解放する
}

// files: [{ name, bytes }] を1つのZIPにして保存させる【ブラウザ専用】
// JSZip は index.html の <script> で読み込まれ、globalThis.JSZip として使える
export async function downloadZip(files, zipName) {
  const zip = new globalThis.JSZip();
  const names = makeUnique(files.map((file) => file.name));
  files.forEach((file, i) => zip.file(names[i], file.bytes));
  downloadBytes(await zip.generateAsync({ type: 'uint8array' }), zipName, 'application/zip');
}
