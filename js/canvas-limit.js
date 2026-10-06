// iPhone の Safari は canvas（ブラウザ上の描画領域）の面積に約1677万画素の上限があるため、少し余裕を持たせる
export const MAX_CANVAS_PIXELS = 16_000_000;

// 面積が上限を超える場合だけ、縦横比を保って縮める
export function limitSize(width, height, maxPixels = MAX_CANVAS_PIXELS) {
  const area = width * height;
  if (area <= maxPixels) return { widthPx: Math.round(width), heightPx: Math.round(height) };
  const scale = Math.sqrt(maxPixels / area);
  return { widthPx: Math.floor(width * scale), heightPx: Math.floor(height * scale) };
}
