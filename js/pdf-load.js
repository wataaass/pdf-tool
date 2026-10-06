import { PDFDocument } from '../lib/pdf-lib.esm.min.js';
import { ErrorCode, PdfToolError } from './errors.js';

// PDFを読み込む。他の処理部品は必ずこれを通して読み込む
export async function loadPdf(bytes) {
  let doc;
  let pageCount = 0;
  try {
    // パスワード付きでも一度読み込み、isEncrypted で確実に見分ける
    doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    if (!doc.isEncrypted) pageCount = doc.getPageCount();
  } catch (err) {
    if (err instanceof RangeError) throw new PdfToolError(ErrorCode.TOO_LARGE, { cause: err });
    throw new PdfToolError(ErrorCode.INVALID_PDF, { cause: err });
  }
  if (doc.isEncrypted) throw new PdfToolError(ErrorCode.PASSWORD_PROTECTED);
  if (pageCount === 0) throw new PdfToolError(ErrorCode.INVALID_PDF);
  return doc;
}

export async function getPageCount(bytes) {
  return (await loadPdf(bytes)).getPageCount();
}
