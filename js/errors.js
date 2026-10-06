// エラーの種類。処理部品はこのコードだけを出し、日本語の文は messages.js が作る
export const ErrorCode = Object.freeze({
  UNSUPPORTED_FILE: 'UNSUPPORTED_FILE',
  INVALID_PDF: 'INVALID_PDF',
  PASSWORD_PROTECTED: 'PASSWORD_PROTECTED',
  UNSUPPORTED_IMAGE: 'UNSUPPORTED_IMAGE',
  INVALID_PAGE_RANGE: 'INVALID_PAGE_RANGE',
  TOO_LARGE: 'TOO_LARGE',
  UNKNOWN: 'UNKNOWN',
});

export class PdfToolError extends Error {
  constructor(code, detail = {}) {
    super(code);
    this.name = 'PdfToolError';
    this.code = code;
    this.detail = detail;
  }
}

// どんなエラーも PdfToolError にそろえる。メモリ不足らしいものは TOO_LARGE にする
export function toToolError(err) {
  if (err instanceof PdfToolError) return err;
  if (err instanceof RangeError || /out of memory|allocation failed/i.test(String(err?.message))) {
    return new PdfToolError(ErrorCode.TOO_LARGE, { cause: err });
  }
  return new PdfToolError(ErrorCode.UNKNOWN, { cause: err });
}
