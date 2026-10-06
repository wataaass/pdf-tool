import assert from 'node:assert/strict';
import { PDFDocument, degrees } from '../lib/pdf-lib.esm.min.js';

// テスト用PDFを作る。各ページの幅を「目印」にする（1ページ目=101pt、2ページ目=102pt …）
export async function makePdf(pageCount, { rotations = {} } = {}) {
  const doc = await PDFDocument.create();
  for (let i = 1; i <= pageCount; i++) {
    const page = doc.addPage([100 + i, 200]);
    if (rotations[i]) page.setRotation(degrees(rotations[i]));
  }
  return doc.save();
}

// 各ページの目印（幅）を返す。例：[101, 103] なら元の1ページ目と3ページ目
export async function pageMarks(bytes) {
  const doc = await PDFDocument.load(bytes);
  return doc.getPages().map((page) => page.getWidth());
}

export async function pageRotations(bytes) {
  const doc = await PDFDocument.load(bytes);
  return doc.getPages().map((page) => page.getRotation().angle);
}

// 各ページの [幅, 高さ]（小数第2位まで）
export async function pageSizes(bytes) {
  const doc = await PDFDocument.load(bytes);
  return doc.getPages().map((page) => [round2(page.getWidth()), round2(page.getHeight())]);
}

export const round2 = (n) => Math.round(n * 100) / 100;

// 暗号化（パスワード付き）の印だけを付けたPDF
export async function makeEncryptedPdf() {
  const doc = await PDFDocument.create();
  doc.addPage([100, 100]);
  doc.context.trailerInfo.Encrypt = doc.context.obj({ Filter: 'Standard' });
  return doc.save({ useObjectStreams: false });
}

// 0ページのPDF（addDefaultPage: false にしないと pdf-lib が白紙を1枚足してしまう）
export async function makeEmptyPdf() {
  return (await PDFDocument.create()).save({ addDefaultPage: false });
}

// promise が指定のエラーコードで失敗することを確かめる
export async function rejectsWithCode(promise, code) {
  await assert.rejects(promise, (err) => {
    assert.equal(err.code, code);
    return true;
  });
}

const fromBase64 = (text) => new Uint8Array(Buffer.from(text, 'base64'));

// 横2×縦1ピクセルの極小画像
export const TINY_JPEG = fromBase64('/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAABAAIDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD4H8Q/8h/Uv+vmX/0M0UUV/ptkP/Ipwn/XuH/pKPAzr/kZ4r/r5P8A9KZ//9k=');
export const TINY_PNG = fromBase64('iVBORw0KGgoAAAANSUhEUgAAAAIAAAABCAYAAAD0In+KAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAOSURBVBhXY/jPwABC/wEP+QP98+IdQAAAAABJRU5ErkJggg==');
