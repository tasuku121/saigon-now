// Saigon Now の service worker。
// アプリの画面（このサイトのファイル）だけを手元にとっておき、電波が弱くても起動できるようにする。
// 天気・レーダー・カメラ・地図などはいつも最新が欲しいので、ここでは扱わない（毎回ネットから取る）。
const CACHE = "saigon-now-v2";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// このサイトのファイルは「まずネット、だめなら手元」：更新はすぐ反映され、圏外でも画面は出る
// （cache: "no-cache"＝ブラウザの一時保存を使わず、毎回サーバーに新しい版があるか確かめる。アップデートを開いた次の回から届ける）
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(url.href, { cache: "no-cache" })   // 画面を開く要求（navigate）にはオプションを付けられないので、URL で取り直す
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request).then((hit) => hit || caches.match("./index.html")))
  );
});
