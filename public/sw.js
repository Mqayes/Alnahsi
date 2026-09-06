const CACHE = "alnahsi-v1";
const SHELL = ["/", "/manifest.webmanifest", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const { request } = e;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== location.origin) return;            // لا نتدخل في Supabase
  if (url.pathname.startsWith("/api")) return;

  if (request.mode === "navigate") {                      // الصفحات: الشبكة أولاً
    e.respondWith(fetch(request).catch(() => caches.match("/")));
    return;
  }
  e.respondWith(                                          // الأصول: الكاش أولاً
    caches.match(request).then((hit) =>
      hit ||
      fetch(request).then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(request, copy)); }
        return res;
      }).catch(() => hit)
    )
  );
});
