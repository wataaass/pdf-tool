import { ErrorCode } from './errors.js';

// エラーを画面に出す日本語の文にする
export function errorMessage(error, fileName) {
  const name = fileName ? `「${fileName}」` : 'ファイル';
  switch (error.code) {
    case ErrorCode.UNSUPPORTED_FILE:
      return `${name}はPDFではないため追加しませんでした。`;
    case ErrorCode.INVALID_PDF:
      return `${name}を読み込めませんでした。ファイルが壊れている可能性があります。`;
    case ErrorCode.PASSWORD_PROTECTED:
      return `${name}はパスワードや編集制限で保護されているため、対応していません。`;
    case ErrorCode.UNSUPPORTED_IMAGE:
      return `${name}は開けない画像形式です。JPEGやPNGで保存し直してください。`;
    case ErrorCode.INVALID_PAGE_RANGE:
      return pageRangeMessage(error.detail);
    case ErrorCode.TOO_LARGE:
      return 'ファイルが大きすぎてこの端末では処理できませんでした。ページ数を減らすか、PCでお試しください。';
    default:
      return '予期しないエラーが発生しました。';
  }
}

function pageRangeMessage(detail) {
  switch (detail.reason) {
    case 'empty':
      return 'ページを指定してください（例：1-3, 5）。';
    case 'syntax':
      return `「${detail.token}」の書き方が正しくありません（例：1-3, 5）。`;
    case 'zero':
      return 'ページ番号は1から数えます。';
    case 'over':
      return `${detail.page}ページはありません（全${detail.pageCount}ページ）。`;
    case 'reversed':
      return `「${detail.token}」は始まりのページが終わりより後になっています。`;
    default:
      return 'ページの指定が正しくありません。';
  }
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

// 圧縮前後のサイズの説明。grew が true なら元より大きくなった
export function sizeChangeText(before, after) {
  const sizes = `${formatBytes(before)} → ${formatBytes(after)}`;
  if (after > before) {
    return { text: `${sizes}（元のファイルより大きくなりました。保存する必要はありません）`, grew: true };
  }
  const percent = Math.round((1 - after / before) * 100);
  return { text: `${sizes}（${percent}%減）`, grew: false };
}

export const LARGE_TOTAL_BYTES = 50 * 1024 * 1024;
export const LARGE_WARNING = '大きいファイルのため、スマホでは時間がかかるか失敗する場合があります。';
