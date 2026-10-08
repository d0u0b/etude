// Service worker: lets the installed app open offline. Built by vite.config.js,
// which fills in the file list and a version.
// - Pages: network first (always fresh when online), cache as fallback.
// - Hashed assets (assets/*): cache first, their content never changes.
// - Fonts and piano sounds from CDNs: cache first.
const CACHE = 'ppt-07ccff39b7';
const CORE = ["./","assets/drill-DfHH4XMM.js","assets/drill-log-Bo8vGN5S.js","assets/index-CuI5gezk.js","assets/log-DqPNRBTa.js","assets/metronome-hjGzRntX.js","assets/midi-test-BACH9Vov.js","assets/piece-DHET5I04.js","assets/play-Bk2rYYFu.js","assets/practice-DuDJSNXL.js","assets/records-CfPyBI6d.js","assets/settings-D4Xhi8nx.js","assets/theory-DCK_qy1Q.js","assets/abcjs-BJDglxSQ.js","assets/activity-qj4kfKNv.js","assets/backup-BLsUypHt.js","assets/calibrate-DH56OEUe.js","assets/charts-B7Q2jbNP.js","assets/common-DfGH9JAR.js","assets/data-Cmdy1spi.js","assets/shared-CGDcSxrA.js","assets/sound-CRK1LQMa.js","assets/stats-Db0Dhrk0.js","assets/stats-f7LpTg8-.js","assets/common-XVbAMElX.css","assets/pdf.worker.min-yatZIOMy.mjs","assets/shared-Cd67habG.css","icons/apple-touch-icon.png","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png","icons/icon.svg","manifest.webmanifest","samples/fur-elise.pdf","samples/minuet-g.pdf"];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

const fromCacheFirst = req => caches.match(req).then(hit => hit || fetch(req).then(res => {
  if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
  return res;
}));

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    if (url.pathname.includes('/assets/')) { e.respondWith(fromCacheFirst(req)); return; }
    e.respondWith(
      // bypass the HTTP cache (GitHub Pages sends max-age=600) so updates show up right away
      fetch(new Request(req.url, { cache: 'no-cache', credentials: 'same-origin' })).then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('index.html')))
    );
  } else if (/fonts\.(googleapis|gstatic)\.com|paulrosen\.github\.io/.test(url.host)) {
    e.respondWith(fromCacheFirst(req));
  }
});
