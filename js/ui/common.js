// 各画面で共通に使う部品【ブラウザ専用】
import { ErrorCode, PdfToolError, toToolError } from '../errors.js';
import { errorMessage, LARGE_TOTAL_BYTES, LARGE_WARNING } from '../messages.js';

// data-role 属性で画面内の部品を探す
export function byRole(section, role) {
  return section.querySelector(`[data-role="${role}"]`);
}

export function showMessage(container, text, kind = 'error') {
  const p = document.createElement('p');
  p.className = `message message-${kind}`;
  p.textContent = text;
  container.append(p);
}

export function clearMessages(container) {
  container.replaceChildren();
}

// エラーを日本語の文にして表示する。想定外・大きすぎのときは詳細を開発者向けにコンソールへ残す
export function reportError(container, err, fileName) {
  const toolError = toToolError(err);
  if (toolError.code === ErrorCode.UNKNOWN || toolError.code === ErrorCode.TOO_LARGE) {
    console.error(toolError.detail.cause ?? toolError);
  }
  showMessage(container, errorMessage(toolError, fileName));
}

export function warnIfLarge(container, totalBytes) {
  if (totalBytes > LARGE_TOTAL_BYTES) showMessage(container, LARGE_WARNING, 'warning');
}

export function isPdfFile(file) {
  return file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
}

export function notPdfError() {
  return new PdfToolError(ErrorCode.UNSUPPORTED_FILE);
}

export async function readFileBytes(file) {
  return new Uint8Array(await file.arrayBuffer());
}

// 配列の index 番目を delta（-1 = 上へ、+1 = 下へ）だけ動かした新しい配列を返す
export function moveItem(items, index, delta) {
  const target = index + delta;
  if (target < 0 || target >= items.length) return items;
  const copy = [...items];
  [copy[index], copy[target]] = [copy[target], copy[index]];
  return copy;
}

// 画面の書き換えを反映させるため、ほんの少しだけ処理を休む
const nextPaint = () => new Promise((resolve) => setTimeout(resolve, 0));

// 時間のかかる処理 task を実行する。
// 実行中は画面内のボタンと入力を押せなくし、「処理中… 3/12」のように進み具合を出す。
// 失敗したらエラーを表示して undefined を返す。最後に after() で画面の状態を整え直す。
export async function runTask({ section, status, messages, after }, task) {
  const controls = [...section.querySelectorAll('button, input')];
  controls.forEach((control) => { control.disabled = true; });
  status.textContent = '処理中…';
  await nextPaint();
  try {
    return await task(async (done, total) => {
      status.textContent = `処理中… ${done}/${total}`;
      await nextPaint();
    });
  } catch (err) {
    reportError(messages, err);
    return undefined;
  } finally {
    status.textContent = '';
    controls.forEach((control) => { control.disabled = false; });
    after();
  }
}

export function iconButton(label, ariaLabel, disabled, onClick) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'icon-button';
  button.textContent = label;
  button.setAttribute('aria-label', ariaLabel);
  button.disabled = disabled;
  button.addEventListener('click', onClick);
  return button;
}

function textSpan(className, text) {
  const span = document.createElement('span');
  span.className = className;
  span.textContent = text;
  return span;
}

// 選んだファイルの一覧を表示する。items: [{ name, detail, thumb }]（thumb は小さな画像の要素）
export function renderFileList(list, items, { onMove, onRemove }) {
  list.replaceChildren(...items.map((item, index) => {
    const li = document.createElement('li');
    li.className = 'file-item';
    const thumb = document.createElement('div');
    thumb.className = 'file-thumb';
    if (item.thumb) thumb.append(item.thumb);
    const text = document.createElement('div');
    text.className = 'file-text';
    text.append(textSpan('file-name', item.name), textSpan('file-detail', item.detail));
    li.append(
      thumb,
      text,
      iconButton('↑', `${item.name} を上へ`, index === 0, () => onMove(index, -1)),
      iconButton('↓', `${item.name} を下へ`, index === items.length - 1, () => onMove(index, 1)),
      iconButton('×', `${item.name} を削除`, false, () => onRemove(index)),
    );
    return li;
  }));
}
