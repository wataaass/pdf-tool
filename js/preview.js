import * as pdfjsLib from '../lib/pdf.min.js';
import { limitSize } from './canvas-limit.js';
import { ErrorCode, PdfToolError } from './errors.js';
import { canvasToBlob } from './image-decode.js';

// 重い解析は Worker（画面とは別の裏側の処理）に任せる
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('../lib/pdf.worker.min.js', import.meta.url).href;

// 必要になったときだけ読み込まれる補助ファイルの場所。
// 白黒スキャンなどの画像の読み取り部品（wasm）、埋め込みのない日本語フォント用の文字対応表（cmaps）、
// 標準フォント（standard_fonts）、色の変換表（iccs）。無いと画像や文字が黙って消える
const RESOURCES = new URL('../lib/pdfjs/', import.meta.url).href;
export const RESOURCE_OPTIONS = {
  wasmUrl: `${RESOURCES}wasm/`,
  cMapUrl: `${RESOURCES}cmaps/`,
  cMapPacked: true,
  standardFontDataUrl: `${RESOURCES}standard_fonts/`,
  iccUrl: `${RESOURCES}iccs/`,
};

// プレビュー用にPDFを開く。
// pdf.js は渡したデータを Worker へ引き渡して空にしてしまうため、必ずコピー（slice）を渡す
export async function openPreviewDoc(bytes) {
  try {
    return await pdfjsLib.getDocument({ data: bytes.slice(), ...RESOURCE_OPTIONS }).promise;
  } catch (err) {
    if (err?.name === 'PasswordException') throw new PdfToolError(ErrorCode.PASSWORD_PROTECTED, { cause: err });
    throw new PdfToolError(ErrorCode.INVALID_PDF, { cause: err });
  }
}

// 開いたPDFの後片付け（メモリの解放）
export async function closePreviewDoc(doc) {
  if (doc) await doc.loadingTask.destroy();
}

// ページを canvas に描く【ブラウザ専用】。端末の canvas の上限を超えないよう倍率を下げる
export async function renderPage(doc, pageNumber, scale) {
  const page = await doc.getPage(pageNumber);
  const wanted = page.getViewport({ scale });
  const limited = limitSize(wanted.width, wanted.height);
  const viewport = page.getViewport({ scale: scale * (limited.widthPx / wanted.width) });
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.floor(viewport.width));
  canvas.height = Math.max(1, Math.floor(viewport.height));
  await page.render({ canvas, viewport }).promise;
  page.cleanup();
  return canvas;
}

// 画面上で幅 cssWidth ピクセルになる小さな画像を描く【ブラウザ専用】
export async function renderThumbnail(doc, pageNumber, cssWidth) {
  const page = await doc.getPage(pageNumber);
  const width = page.getViewport({ scale: 1 }).width;
  return renderPage(doc, pageNumber, (cssWidth * (window.devicePixelRatio || 1)) / width);
}

// 「強く圧縮」用：ページを JPEG にする関数を作り、compressStrong に渡す【ブラウザ専用】
export function makeJpegRenderer(doc) {
  return async (pageNumber, { dpi, quality }) => {
    const canvas = await renderPage(doc, pageNumber, dpi / 72); // 倍率1 = 72dpi
    const blob = await canvasToBlob(canvas, 'image/jpeg', quality);
    canvas.width = 0;
    canvas.height = 0;
    return new Uint8Array(await blob.arrayBuffer());
  };
}
