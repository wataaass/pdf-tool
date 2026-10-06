// 「画像→PDF」画面
import { OUTPUT_NAMES } from '../filenames.js';
import { decodeImage } from '../image-decode.js';
import { imagesToPdf } from '../image-to-pdf.js';
import { downloadBytes } from '../download.js';
import { byRole, clearMessages, moveItem, renderFileList, reportError, runTask, warnIfLarge } from './common.js';

export function setupImagesScreen(section) {
  const input = byRole(section, 'input');
  const list = byRole(section, 'list');
  const messages = byRole(section, 'messages');
  const status = byRole(section, 'status');
  const run = byRole(section, 'run');
  let items = []; // [{ name, detail, image, url, thumb }]

  function refresh() {
    renderFileList(list, items, {
      onMove: (index, delta) => {
        items = moveItem(items, index, delta);
        refresh();
      },
      onRemove: (index) => {
        URL.revokeObjectURL(items[index].url);
        items = items.filter((_, i) => i !== index);
        refresh();
      },
    });
    run.disabled = items.length === 0;
  }

  input.addEventListener('change', async () => {
    const files = [...input.files];
    input.value = ''; // 同じファイルをもう一度選んでも反応するように空にする
    if (files.length === 0) return;
    clearMessages(messages);
    await runTask({ section, status, messages, after: refresh }, async (progress) => {
      for (let i = 0; i < files.length; i++) {
        try {
          const image = await decodeImage(files[i]);
          const url = URL.createObjectURL(new Blob([image.bytes], { type: `image/${image.type}` }));
          const thumb = document.createElement('img');
          thumb.src = url;
          thumb.alt = '';
          items.push({ name: files[i].name, detail: `${image.widthPx}×${image.heightPx}`, image, url, thumb });
        } catch (err) {
          reportError(messages, err, files[i].name);
        }
        await progress(i + 1, files.length);
      }
      warnIfLarge(messages, items.reduce((sum, item) => sum + item.image.bytes.length, 0));
    });
  });

  run.addEventListener('click', async () => {
    clearMessages(messages);
    const mode = section.querySelector('input[name="image-page-size"]:checked').value;
    await runTask({ section, status, messages, after: refresh }, async (progress) => {
      const pdf = await imagesToPdf(items.map((item) => item.image), mode, progress);
      downloadBytes(pdf, OUTPUT_NAMES.images);
    });
  });

  refresh();
}
