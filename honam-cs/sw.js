// 포켓카드 오프라인 저장. 내용 수정 후 재배포할 때 VERSION을 올린다.
const VERSION = "honam-cs-v1";
const PAGES = ["./", "./index.html"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(PAGES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("honam-cs-") && k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 인터넷이 되면 최신 내용을 받아 저장하고, 안 되거나 3초 안에 응답이 없으면 저장본을 보여 준다.
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const cached = await cache.match(req, { ignoreSearch: true }) || (req.mode === "navigate" ? await cache.match("./index.html") : undefined);
    try {
      const net = await Promise.race([
        fetch(req),
        new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), cached ? 3000 : 15000)),
      ]);
      if (net && net.ok) cache.put(req, net.clone());
      return net;
    } catch (err) {
      if (cached) return cached;
      throw err;
    }
  })());
});
