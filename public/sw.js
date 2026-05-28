const CACHE_NAME = "critter-v1";
const STATIC_ASSETS = [
  "/",
  "/logo.png",
  "/default.png",
  "/icon-home.png",
  "/icon-search.png",
  "/icon-notification.png",
  "/icon-profile.png",
  "/icon-bookmarks.png",
  "/icon-settings.png",
  "/verified-blue.png",
  "/verified-gold.png",
];

// インストール
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// アクティベート
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// フェッチ（Network First）
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// プッシュ通知
self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options = {
      body: data.body || "Critterからの通知です",
      icon: "/logo.png",
      badge: "/logo.png",
      tag: data.tag || "critter-notification",
      requireInteraction: false,
      actions: [
        { action: "open", title: "開く" },
        { action: "close", title: "閉じる" },
      ],
    };

    event.waitUntil(
      self.registration.showNotification(data.title || "Critter", options)
    );
  } catch (e) {
    console.error("Push notification error:", e);
  }
});

// 通知クリック
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "close") return;

  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === "/" && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow("/");
      }
    })
  );
});