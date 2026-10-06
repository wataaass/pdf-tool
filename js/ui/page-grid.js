// ページのプレビュー一覧（分割・回転の画面で使う）【ブラウザ専用】
import { renderThumbnail } from '../preview.js';

const THUMB_CSS_WIDTH = 150;

// 要素が画面に近づいたら一度だけ onVisible を呼ぶ（遅延読み込み）
function whenVisible(element, onVisible) {
  const observer = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      observer.disconnect();
      onVisible();
    }
  }, { rootMargin: '300px' });
  observer.observe(element);
}

// PDFの全ページを小さな画像の一覧として grid に並べる。画面に見えたページから順に描く。
// decorate(tile, ページ番号) でボタンなどを付け足せる。戻り値は各ページの要素の配列（[0] が1ページ目）
export function buildPageGrid(grid, doc, pageCount, decorate = () => {}) {
  const tiles = [];
  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber++) {
    const tile = document.createElement('div');
    tile.className = 'page-tile';
    const thumb = document.createElement('div');
    thumb.className = 'page-thumb';
    const label = document.createElement('span');
    label.className = 'page-label';
    label.textContent = `${pageNumber}`;
    tile.append(thumb, label);
    decorate(tile, pageNumber);
    whenVisible(tile, async () => {
      try {
        thumb.replaceChildren(await renderThumbnail(doc, pageNumber, THUMB_CSS_WIDTH));
      } catch (err) {
        console.warn(`${pageNumber}ページ目のプレビューを表示できませんでした`, err);
      }
    });
    tiles.push(tile);
  }
  grid.replaceChildren(...tiles);
  return tiles;
}
