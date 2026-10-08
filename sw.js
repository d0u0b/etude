// Service worker: lets the installed app open offline. Built by vite.config.js,
// which fills in the file list and a version.
// - Pages: network first (always fresh when online), cache as fallback.
// - Hashed assets (assets/*): cache first, their content never changes.
// - Fonts and piano sounds from CDNs: cache first.
const CACHE = 'ppt-7f59cd911e';
const CORE = ["./","assets/drill-DZYjXLZX.js","assets/drill-log-BNOAyntL.js","assets/index-BNVqFI93.js","assets/log-uRSpinj-.js","assets/metronome-Cd-8KYLI.js","assets/midi-test-DmMNWAOb.js","assets/piece-BtEhPOUd.js","assets/play-pMuqXBRJ.js","assets/practice-BahlhNZs.js","assets/records-v-l-GDrV.js","assets/settings-B0_SS8Fu.js","assets/theory-C0esfjN0.js","assets/abcjs-BJDglxSQ.js","assets/activity-BE7DeNln.js","assets/backup-BOHBzLAi.js","assets/calibrate-8M8bMQkl.js","assets/charts-B7Q2jbNP.js","assets/common-DKc23CwL.js","assets/data-M-RBOOc_.js","assets/sound-CRK1LQMa.js","assets/stats-Db0Dhrk0.js","assets/stats-Ud_GRJ6s.js","assets/tone-OxXIbQEE.js","assets/common-BEqrzrff.css","assets/pdf.worker.min-yatZIOMy.mjs","assets/tone-COkaR9CQ.css","icons/apple-touch-icon.png","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png","icons/icon.svg","manifest.webmanifest","samples/fur-elise.pdf","samples/minuet-g.pdf"];

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
