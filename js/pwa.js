// PWA：Service Worker（オフライン用の保存役）を登録し、新しい版が届いたら［更新］を出す【ブラウザ専用】

// banner：「新しい版があります［更新］」の表示部分（中に button がある）
export function setupPwa(banner) {
  if (!('serviceWorker' in navigator)) return; // 対応していないブラウザでは普通の Web ページとして動く
  let updating = false;

  // ［更新］で新しい版に切り替わったら、ページを読み込み直して新しい版を表示する
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (updating) location.reload();
  });

  navigator.serviceWorker.register('sw.js').then((registration) => {
    // 新しい版が待機中なら表示する（初めて開いたときは古い版が無いので表示しない）
    const showIfWaiting = () => {
      if (registration.waiting && navigator.serviceWorker.controller) banner.hidden = false;
    };
    showIfWaiting();
    registration.addEventListener('updatefound', () => {
      registration.installing?.addEventListener('statechange', showIfWaiting);
    });
    banner.querySelector('button').addEventListener('click', () => {
      updating = true;
      registration.waiting?.postMessage('skipWaiting');
    });
  }).catch((err) => console.warn('オフライン機能を準備できませんでした', err));
}
