import { ErrorCode, PdfToolError } from './errors.js';

// スマホの日本語入力でも打てるよう、全角数字・全角記号・空白をそろえる
function normalize(text) {
  return text
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[，、]/g, ',')
    .replace(/[－~〜～−‐ー―–—]/g, '-')
    .replace(/\s/g, '');
}

function fail(reason, extra = {}) {
  throw new PdfToolError(ErrorCode.INVALID_PAGE_RANGE, { reason, ...extra });
}

// 「1-3, 5」→ [[1, 2, 3], [5]]。カンマで区切った項目ごとに配列を作り、入力した順に返す
export function parsePageRange(text, pageCount) {
  const normalized = normalize(String(text ?? ''));
  const groups = [];
  for (const token of normalized.split(',')) {
    if (token === '') continue;
    const match = /^(\d+)(?:-(\d*))?$/.exec(token);
    if (!match) fail('syntax', { token });
    const start = Number(match[1]);
    let end = start;
    if (match[2] !== undefined) end = match[2] === '' ? pageCount : Number(match[2]);
    for (const page of [start, end]) {
      if (page < 1) fail('zero', { token });
      if (page > pageCount) fail('over', { page, pageCount });
    }
    if (start > end) fail('reversed', { token });
    const group = [];
    for (let page = start; page <= end; page++) group.push(page);
    groups.push(group);
  }
  if (groups.length === 0) fail('empty');
  return groups;
}

// 「取り出す」用：昇順に並べ、重複を除く
export function toSortedUniquePages(groups) {
  return [...new Set(groups.flat())].sort((a, b) => a - b);
}

// [1, 2, 3, 5] → 「1-3, 5」
export function formatPageRange(pages) {
  const sorted = [...new Set(pages)].sort((a, b) => a - b);
  const parts = [];
  let i = 0;
  while (i < sorted.length) {
    let j = i;
    while (j + 1 < sorted.length && sorted[j + 1] === sorted[j] + 1) j++;
    parts.push(i === j ? `${sorted[i]}` : `${sorted[i]}-${sorted[j]}`);
    i = j + 1;
  }
  return parts.join(', ');
}
