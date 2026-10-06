// 「回転」画面
import { OUTPUT_NAMES } from '../filenames.js';
import { getPageCount } from '../pdf-load.js';
import { closePreviewDoc, openPreviewDoc } from '../preview.js';
import { normalizeAngle, rotatePages } from '../rotate.js';
import { downloadBytes } from '../download.js';
import { buildPageGrid } from './page-grid.js';
import {
  byRole, clearMessages, iconButton, isPdfFile, notPdfError, readFileBytes, reportError, runTask, showMessage, warnIfLarge,
} from './common.js';

export function setupRotateScreen(section) {
  const input = byRole(section, 'input');
  const messages = byRole(section, 'messages');
  const info = byRole(section, 'info');
  const controls = byRole(section, 'controls');
  const run = byRole(section, 'run');
  const status = byRole(section, 'status');
  const grid = byRole(section, 'grid');
  let file = null; // { name, bytes, pageCount }
  let previewDoc = null;
  let tiles = [];
  let turns = new Map(); // ページ番号 → 追加する角度（0 のページは入れない）

  function refresh() {
    controls.hidden = file === null;
    run.disabled = turns.size === 0;
  }

  // ページの追加角度を設定し、プレビューも回して見せる
  function setTurn(pageNumber, angle) {
    const normalized = normalizeAngle(angle);
    if (normalized === 0) turns.delete(pageNumber);
    else turns.set(pageNumber, normalized);
    tiles[pageNumber - 1]?.style.setProperty('--turn', `${normalized}deg`);
  }

  function turnAll(delta) {
    for (let pageNumber = 1; pageNumber <= file.pageCount; pageNumber++) {
      setTurn(pageNumber, (turns.get(pageNumber) ?? 0) + delta);
    }
    refresh();
  }

  input.addEventListener('change', async () => {
    const selected = input.files[0];
    input.value = '';
    if (!selected) return;
    clearMessages(messages);
    if (!isPdfFile(selected)) {
      reportError(messages, notPdfError(), selected.name);
      return;
    }
    await runTask({ section, status, messages, after: refresh }, async () => {
      let bytes;
      let pageCount;
      try {
        bytes = await readFileBytes(selected);
        pageCount = await getPageCount(bytes);
      } catch (err) {
        reportError(messages, err, selected.name);
        return;
      }
      await closePreviewDoc(previewDoc);
      previewDoc = null;
      tiles = [];
      turns = new Map();
      grid.replaceChildren();
      file = { name: selected.name, bytes, pageCount };
      info.textContent = `${selected.name}（全${pageCount}ページ）`;
      warnIfLarge(messages, bytes.length);
      try {
        previewDoc = await openPreviewDoc(bytes);
        tiles = buildPageGrid(grid, previewDoc, pageCount, (tile, pageNumber) => {
          tile.append(iconButton('⟳', `${pageNumber}ページ目を右に回す`, false, () => {
            setTurn(pageNumber, (turns.get(pageNumber) ?? 0) + 90);
            refresh();
          }));
        });
      } catch (err) {
        console.warn(err);
        showMessage(messages, 'プレビューを表示できませんでした。', 'info');
      }
    });
  });

  byRole(section, 'all-cw').addEventListener('click', () => turnAll(90));
  byRole(section, 'all-ccw').addEventListener('click', () => turnAll(-90));

  run.addEventListener('click', async () => {
    clearMessages(messages);
    await runTask({ section, status, messages, after: refresh }, async () => {
      const pdf = await rotatePages(file.bytes, Object.fromEntries(turns));
      downloadBytes(pdf, OUTPUT_NAMES.rotated(file.name));
    });
  });

  refresh();
}
