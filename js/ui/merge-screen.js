// 「結合」画面
import { OUTPUT_NAMES } from '../filenames.js';
import { mergePdfs } from '../merge.js';
import { getPageCount } from '../pdf-load.js';
import { closePreviewDoc, openPreviewDoc, renderThumbnail } from '../preview.js';
import { downloadBytes } from '../download.js';
import {
  byRole, clearMessages, isPdfFile, moveItem, notPdfError, readFileBytes, renderFileList, reportError, runTask, warnIfLarge,
} from './common.js';

// 1ページ目の小さなプレビューを holder の中に描く。失敗しても結合はできるので、記録だけ残す
async function showFirstPage(bytes, holder) {
  let doc = null;
  try {
    doc = await openPreviewDoc(bytes);
    holder.replaceChildren(await renderThumbnail(doc, 1, 56));
  } catch (err) {
    console.warn('プレビューを表示できませんでした', err);
  } finally {
    await closePreviewDoc(doc);
  }
}

export function setupMergeScreen(section) {
  const input = byRole(section, 'input');
  const list = byRole(section, 'list');
  const messages = byRole(section, 'messages');
  const status = byRole(section, 'status');
  const run = byRole(section, 'run');
  let items = []; // [{ name, detail, bytes, thumb }]

  function refresh() {
    renderFileList(list, items, {
      onMove: (index, delta) => {
        items = moveItem(items, index, delta);
        refresh();
      },
      onRemove: (index) => {
        items = items.filter((_, i) => i !== index);
        refresh();
      },
    });
    run.disabled = items.length < 2;
  }

  input.addEventListener('change', async () => {
    const files = [...input.files];
    input.value = '';
    if (files.length === 0) return;
    clearMessages(messages);
    await runTask({ section, status, messages, after: refresh }, async (progress) => {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!isPdfFile(file)) {
          reportError(messages, notPdfError(), file.name);
        } else {
          try {
            const bytes = await readFileBytes(file);
            const pageCount = await getPageCount(bytes);
            const thumb = document.createElement('div');
            items.push({ name: file.name, detail: `${pageCount}ページ`, bytes, thumb });
            showFirstPage(bytes, thumb); // 待たずに裏で描く
          } catch (err) {
            reportError(messages, err, file.name);
          }
        }
        await progress(i + 1, files.length);
      }
      warnIfLarge(messages, items.reduce((sum, item) => sum + item.bytes.length, 0));
    });
  });

  run.addEventListener('click', async () => {
    clearMessages(messages);
    await runTask({ section, status, messages, after: refresh }, async (progress) => {
      const merged = await mergePdfs(items.map((item) => item.bytes), progress);
      downloadBytes(merged, OUTPUT_NAMES.merged);
    });
  });

  refresh();
}
