// Service worker: lets the installed app open offline. Built by vite.config.js,
// which fills in the file list and a version.
// - Pages: network first (always fresh when online), but after 0.4 s the cached copy is shown and the
//   fresh one only saved (a slow network made the app sit on a black screen after Android had
//   unloaded it in the background); cache as fallback when offline.
// - Hashed assets (assets/*): cache first, their content never changes.
// - Fonts and piano sounds from CDNs: cache first.
const CACHE = 'ppt-4014c77889';
const CORE = ["./","assets/drill-BJlU1bA5.js","assets/drill-log-QjOSQ3Ei.js","assets/index-tEUfY0b_.js","assets/log-BpavSrEZ.js","assets/metronome-DruicFgG.js","assets/midi-test-CNW75-Zb.js","assets/piece-BoJxzjS9.js","assets/play-wv9QNkHV.js","assets/practice-BelOn1mF.js","assets/records-Mea-wIwo.js","assets/settings-CA7QLR7f.js","assets/theory-BIZ_8f_G.js","assets/timer-CUK9IS-_.js","assets/activity-BBWAVpED.js","assets/backup-BqARElEG.js","assets/calibrate-C_mq2Oy1.js","assets/charts-B20yvwaY.js","assets/common-CjKgJ0um.js","assets/data-Bfpascuv.js","assets/lesson-CgQCKRdv.js","assets/metro-DlDVz_mO.js","assets/mic-DPENKkrJ.js","assets/sound-B5FxSpfP.js","assets/stats-BFbQygor.js","assets/stats-Bk17ObXM.js","assets/swipe-Dm6hRykM.js","assets/tone-DezBH39a.js","assets/touch-Cku-SM18.js","assets/common-DCUILtte.css","assets/lesson-c3p6mhH1.css","assets/pdf.worker.min-yatZIOMy.mjs","assets/touch-CIepJdT0.css","icons/apple-touch-icon.png","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png","icons/icon.svg","manifest.webmanifest","samples/fur-elise.pdf","samples/minuet-g.pdf"];

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

function page(e, req) {
  // bypass the HTTP cache (GitHub Pages sends max-age=600) so updates show up right away
  const net = fetch(new Request(req.url, { cache: 'no-cache', credentials: 'same-origin' })).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  });
  e.waitUntil(net.catch(() => {}));
  const cached = () => caches.match(req, { ignoreSearch: true });
  return new Promise(resolve => {
    let done = false;
    const give = r => { if (r && !done) { done = true; resolve(r); } };
    const timer = setTimeout(() => cached().then(give), 400);
    net.then(res => { clearTimeout(timer); give(res); })
      .catch(() => { clearTimeout(timer); cached().then(r => give(r || caches.match('index.html'))); });
  });
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    if (url.pathname.includes('/assets/')) { e.respondWith(fromCacheFirst(req)); return; }
    e.respondWith(page(e, req));
  } else if (/fonts\.(googleapis|gstatic)\.com|paulrosen\.github\.io/.test(url.host)) {
    e.respondWith(fromCacheFirst(req));
  }
});
