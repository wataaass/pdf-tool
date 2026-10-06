import { limitSize } from './canvas-limit.js';
import { ErrorCode, PdfToolError } from './errors.js';

const JPEG_QUALITY = 0.92;

// canvas の内容を画像ファイルのデータ（Blob）にする。作れなかったら大きすぎと判断する
export function canvasToBlob(canvas, mimeType, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new PdfToolError(ErrorCode.TOO_LARGE))), mimeType, quality);
  });
}

// 画像ファイルを正しい向きで描き直し、PDFに入れられる形（JPEG か PNG）にする【ブラウザ専用】
export async function decodeImage(file) {
  let bitmap;
  try {
    // imageOrientation: 'from-image' = スマホ写真の向き情報（EXIF）に従って正しい向きにする
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch (err) {
    throw new PdfToolError(ErrorCode.UNSUPPORTED_IMAGE, { cause: err });
  }
  const { widthPx, heightPx } = limitSize(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = widthPx;
  canvas.height = heightPx;
  const context = canvas.getContext('2d');
  const isPng = file.type === 'image/png';
  if (!isPng) {
    // JPEG は透明を扱えないため、先に白で塗っておく
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, widthPx, heightPx);
  }
  context.drawImage(bitmap, 0, 0, widthPx, heightPx);
  bitmap.close();
  const blob = await canvasToBlob(canvas, isPng ? 'image/png' : 'image/jpeg', JPEG_QUALITY);
  canvas.width = 0; // iPhone のメモリを早めに解放する
  canvas.height = 0;
  return { bytes: new Uint8Array(await blob.arrayBuffer()), type: isPng ? 'png' : 'jpeg', widthPx, heightPx };
}
