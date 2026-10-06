// 「圧縮」画面
import { compressLight, compressStrong } from '../compress.js';
import { OUTPUT_NAMES } from '../filenames.js';
import { formatBytes, sizeChangeText } from '../messages.js';
import { getPageCount } from '../pdf-load.js';
import { closePreviewDoc, makeJpegRenderer, openPreviewDoc, renderThumbnail } from '../preview.js';
import { downloadBytes } from '../download.js';
import { byRole, clearMessages, isPdfFile, notPdfError, readFileBytes, reportError, runTask, warnIfLarge } from './common.js';

const RESULT_PREVIEW_WIDTH = 300;

export function setupCompressScreen(section) {
  const input = byRole(section, 'input');
  const messages = byRole(section, 'messages');
  const info = byRole(section, 'info');
  const options = byRole(section, 'options');
  const levels = byRole(section, 'levels');
  const run = byRole(section, 'run');
  const status = byRole(section, 'status');
  const result = byRole(section, 'result');
  const resultText = byRole(section, 'result-text');
  const resultPreview = byRole(section, 'result-preview');
  const save = byRole(section, 'save');
  let file = null; // { name, bytes }
  let output = null; // 圧縮後のPDF

  const mode = () => section.querySelector('input[name="compress-mode"]:checked').value;
  const level = () => section.querySelector('input[name="compress-level"]:checked').value;

  function clearResult() {
    output = null;
    result.hidden = true;
    resultPreview.replaceChildren();
  }

  function refresh() {
    options.hidden = file === null;
    levels.hidden = mode() !== 'strong';
    run.disabled = file === null;
    save.disabled = output === null;
  }

  // 圧縮後の1ページ目を表示して、画質を確かめられるようにする
  async function showResultPreview(bytes) {
    let doc = null;
    try {
      doc = await openPreviewDoc(bytes);
      resultPreview.replaceChildren(await renderThumbnail(doc, 1, RESULT_PREVIEW_WIDTH));
    } catch (err) {
      console.warn('プレビューを表示できませんでした', err);
    } finally {
      await closePreviewDoc(doc);
    }
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
      try {
        const bytes = await readFileBytes(selected);
        const pageCount = await getPageCount(bytes);
        file = { name: selected.name, bytes };
        info.textContent = `${selected.name}（${formatBytes(bytes.length)}、${pageCount}ページ）`;
        clearResult();
        warnIfLarge(messages, bytes.length);
      } catch (err) {
        reportError(messages, err, selected.name);
      }
    });
  });

  section.addEventListener('change', (event) => {
    if (event.target.name === 'compress-mode' || event.target.name === 'compress-level') {
      clearResult();
      refresh();
    }
  });

  run.addEventListener('click', async () => {
    clearMessages(messages);
    clearResult();
    await runTask({ section, status, messages, after: refresh }, async (progress) => {
      if (mode() === 'light') {
        output = await compressLight(file.bytes);
      } else {
        const doc = await openPreviewDoc(file.bytes);
        try {
          output = await compressStrong(file.bytes, level(), makeJpegRenderer(doc), progress);
        } finally {
          await closePreviewDoc(doc);
        }
      }
      const change = sizeChangeText(file.bytes.length, output.length);
      resultText.textContent = change.text;
      resultText.classList.toggle('grew', change.grew);
      result.hidden = false;
      await showResultPreview(output);
    });
  });

  save.addEventListener('click', () => downloadBytes(output, OUTPUT_NAMES.compressed(file.name)));

  refresh();
}
