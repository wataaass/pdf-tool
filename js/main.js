// アプリの入り口：各画面を準備し、URL の # に合わせて表示する画面を切り替える
import { setupImagesScreen } from './ui/images-screen.js';

// 画面のID → その画面を準備する関数。機能を足すときはここに追加する
const SETUPS = {
  images: setupImagesScreen,
};

for (const [id, setup] of Object.entries(SETUPS)) setup(document.getElementById(id));

// URL の # の部分（例：#merge）で画面を切り替える。スマホの「戻る」操作でもホームに戻れる
function showScreen() {
  const screens = [...document.querySelectorAll('.screen')];
  const id = location.hash.slice(1);
  const target = screens.find((screen) => screen.id === id) ?? document.getElementById('home');
  screens.forEach((screen) => { screen.hidden = screen !== target; });
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', showScreen);
showScreen();
