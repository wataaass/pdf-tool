// 「分割」画面
import { toToolError } from '../errors.js';
import { OUTPUT_NAMES } from '../filenames.js';
import { errorMessage } from '../messages.js';
import { formatPageRange, parsePageRange, toSortedUniquePages } from '../page-range.js';
import { getPageCount } from '../pdf-load.js';
import { closePreviewDoc, openPreviewDoc } from '../preview.js';
import { extractPages, splitByRanges, splitEach } from '../split.js';
import { downloadBytes, downloadZip } from '../download.js';
import { buildPageGrid } from './page-grid.js';
import {
  byRole, clearMessages, isPdfFile, notPdfError, readFileBytes, reportError, runTask, showMessage, warnIfLarge,
} from './common.js';

const PLACEHOLDERS = { extract: '例：1-3, 5', ranges: '例：1-3, 4-10' };
const HINTS = {
  extract: '取り出すページを入力するか、下のページをタップして選んでください。',
  each: '全ページを1ページずつ別々のPDFにして、ZIPファイルにまとめます。',
  ranges: 'カンマで区切った範囲ごとに別々のPDFを作り、ZIPファイルにまとめます。',
};

export function setupSplitScreen(section) {
  const input = byRole(section, 'input');
  const messages = byRole(section, 'messages');
  const info = byRole(section, 'info');
  const options = byRole(section, 'options');
  const hint = byRole(section, 'hint');
  const rangeInput = byRole(section, 'range');
  const rangeError = byRole(section, 'range-error');
  const run = byRole(section, 'run');
  const status = byRole(section, 'status');
  const grid = byRole(section, 'grid');
  let file = null; // { name, bytes, pageCount }
  let previewDoc = null;
  let tiles = [];

  const mode = () => section.querySelector('input[name="split-mode"]:checked').value;

  // 入力欄を読み取る。成功なら { groups }、失敗なら { message }（空欄のときは message が ''）
  function readRange() {
    if (rangeInput.value.trim() === '') return { message: '' };
    try {
      return { groups: parsePageRange(rangeInput.value, file.pageCount) };
    } catch (err) {
      return { message: errorMessage(toToolError(err)) };
    }
  }

  function refresh() {
    const current = mode();
    options.hidden = file === null;
    rangeInput.hidden = current === 'each';
    rangeInput.placeholder = PLACEHOLDERS[current] ?? '';
    hint.textContent = HINTS[current];
    const range = file !== null && current !== 'each' ? readRange() : {};
    rangeError.textContent = range.message ?? '';
    const selected = new Set(current === 'extract' && range.groups ? toSortedUniquePages(range.groups) : []);
    tiles.forEach((tile, i) => {
      tile.classList.toggle('selectable', current === 'extract');
      tile.classList.toggle('selected', selected.has(i + 1));
    });
    run.disabled = file === null || (current !== 'each' && !range.groups);
  }

  // 「取り出す」でページをタップしたら、選択を切り替えて入力欄に反映する
  function onTileTap(pageNumber) {
    if (mode() !== 'extract') return;
    const { groups } = readRange();
    const pages = new Set(groups ? toSortedUniquePages(groups) : []);
    if (pages.has(pageNumber)) pages.delete(pageNumber);
    else pages.add(pageNumber);
    rangeInput.value = formatPageRange([...pages]);
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
        return; // 前に選んだファイルはそのまま残す
      }
      await closePreviewDoc(previewDoc);
      previewDoc = null;
      tiles = [];
      grid.replaceChildren();
      file = { name: selected.name, bytes, pageCount };
      info.textContent = `${selected.name}（全${pageCount}ページ）`;
      rangeInput.value = '';
      warnIfLarge(messages, bytes.length);
      try {
        previewDoc = await openPreviewDoc(bytes);
        tiles = buildPageGrid(grid, previewDoc, pageCount, (tile, pageNumber) => {
          tile.addEventListener('click', () => onTileTap(pageNumber));
        });
      } catch (err) {
        console.warn(err);
        showMessage(messages, 'プレビューを表示できませんでした（分割はできます）。', 'info');
      }
    });
  });

  run.addEventListener('click', async () => {
    clearMessages(messages);
    const current = mode();
    const { groups } = current === 'each' ? {} : readRange();
    await runTask({ section, status, messages, after: refresh }, async (progress) => {
      if (current === 'extract') {
        const pdf = await extractPages(file.bytes, toSortedUniquePages(groups));
        downloadBytes(pdf, OUTPUT_NAMES.extract(file.name));
        return;
      }
      const results = current === 'each'
        ? await splitEach(file.bytes, progress)
        : await splitByRanges(file.bytes, groups, progress);
      const files = results.map((result) => ({
        name: current === 'each'
          ? OUTPUT_NAMES.eachPage(file.name, result.pages[0], file.pageCount)
          : OUTPUT_NAMES.range(file.name, result.pages),
        bytes: result.bytes,
      }));
      await downloadZip(files, OUTPUT_NAMES.splitZip(file.name));
    });
  });

  section.addEventListener('change', (event) => {
    if (event.target.name === 'split-mode') refresh();
  });
  rangeInput.addEventListener('input', refresh);
  refresh();
}
