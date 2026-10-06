// 「資料.pdf」→「資料」
export function baseName(fileName) {
  const dot = fileName.lastIndexOf('.');
  return dot > 0 ? fileName.slice(0, dot) : fileName;
}

// 全ページ数の桁数に合わせてゼロ埋めする（12ページなら 3 → "03"）
function padPage(page, pageCount) {
  return String(page).padStart(String(pageCount).length, '0');
}

// [1, 2, 3] → "1-3"、[5] → "5"
function rangeLabel(pages) {
  return pages.length === 1 ? `${pages[0]}` : `${pages[0]}-${pages[pages.length - 1]}`;
}

// 保存するファイルの名前
export const OUTPUT_NAMES = Object.freeze({
  images: 'images.pdf',
  merged: 'merged.pdf',
  extract: (source) => `${baseName(source)}_抽出.pdf`,
  splitZip: (source) => `${baseName(source)}_分割.zip`,
  eachPage: (source, page, pageCount) => `${baseName(source)}_p${padPage(page, pageCount)}.pdf`,
  range: (source, pages) => `${baseName(source)}_p${rangeLabel(pages)}.pdf`,
  rotated: (source) => `${baseName(source)}_回転.pdf`,
  compressed: (source) => `${baseName(source)}_圧縮.pdf`,
});

// ZIPの中で名前がぶつからないよう、2つ目以降に (2) (3) … を付ける
export function makeUnique(names) {
  const seen = new Map();
  return names.map((name) => {
    const count = (seen.get(name) ?? 0) + 1;
    seen.set(name, count);
    if (count === 1) return name;
    const dot = name.lastIndexOf('.');
    return dot > 0 ? `${name.slice(0, dot)}(${count})${name.slice(dot)}` : `${name}(${count})`;
  });
}
