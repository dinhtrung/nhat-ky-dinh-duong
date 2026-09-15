const CACHE = 'nhat-ky-dinh-duong-v8';
/* Bucket riêng cho tài nguyên OCR (lõi wasm ~3,5MB + dữ liệu tiếng Việt ~4MB):
   tải ở lần dùng đầu rồi giữ trên máy để các lần sau chạy offline */
const OCR_CACHE = 'nhat-ky-dinh-duong-ocr-v1';
const OCR_HOSTS = ['cdn.jsdelivr.net', 'tessdata.projectnaptha.com'];
const ASSETS = [
  'index.html',
  'styles.css',
  'app.js',
  'manifest.json',
  'data/foods.json',
  'data/tt30.json',
  'vendor/tesseract/tesseract.min.js',
  'vendor/tesseract/worker.min.js',
  'icon-192.png',
  'icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE && k !== OCR_CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

/* Cache-first: mở app tức thì kể cả khi mất mạng (bữa sáng ở ngoài đường) */
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  let url = null;
  try { url = new URL(e.request.url); } catch (err) { url = null; }
  if (url && OCR_HOSTS.indexOf(url.hostname) >= 0) {
    e.respondWith(
      caches.open(OCR_CACHE).then((cache) =>
        cache.match(e.request).then((hit) =>
          hit || fetch(e.request).then((res) => {
            if (res && res.ok) cache.put(e.request, res.clone());
            return res;
          })
        )
      )
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});
