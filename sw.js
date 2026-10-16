// Service Worker：アプリのファイルを端末に保存し、電波がなくても使えるようにする
// 保存するファイルの一覧と版の目印は precache-manifest.js（npm run precache で自動生成）にある
importScripts('precache-manifest.js');

const CACHE_PREFIX = 'pdf-tool-';
const CACHE = `${CACHE_PREFIX}${self.PRECACHE_VERSION}`;

// 新しい版を受け取ったら、全ファイルを保存する（1つでも失敗したら、古い版のまま使い続ける）
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(self.PRECACHE_FILES)));
});

// 新しい版は、画面の［更新］が押されるまで待つ（変換の途中で版が入れ替わらないように）
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});

// 新しい版に切り替わったら、古い版の保存分を消す
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE).map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

// ページやファイルの読み込みは、保存分があればそれを使う（電波がなくても開ける）
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = request.mode === 'navigate'
      ? await cache.match('index.html')
      : await cache.match(request, { ignoreSearch: true });
    return cached ?? fetch(request);
  })());
});
