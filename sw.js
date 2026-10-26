// Service worker: lets the installed app open offline. Built by vite.config.js,
// which fills in the file list and a version.
// - Pages: network first (always fresh when online), but after 0.4 s the cached copy is shown and the
//   fresh one only saved (a slow network made the app sit on a black screen after Android had
//   unloaded it in the background); cache as fallback when offline.
// - Hashed assets (assets/*): cache first, their content never changes.
// - Fonts and piano sounds from CDNs: cache first.
const CACHE = 'ppt-1f8831ac97';
const CORE = ["./","assets/drill-CBb56C4x.js","assets/drill-log-BPVo5z0Y.js","assets/index-A0sxfPIb.js","assets/log-Chd8xrqW.js","assets/metronome-DM2vR4Mm.js","assets/midi-test-CM9Nfm2j.js","assets/piece-evaB84TZ.js","assets/play-CzX-Bu4f.js","assets/practice-CethGLpn.js","assets/records-Cv24JSMW.js","assets/settings-Cy1jYPLI.js","assets/theory-BDJzzHbU.js","assets/timer-D47cpNwX.js","assets/activity-DoRAUIG6.js","assets/backup-BYJu8xBU.js","assets/charts-CeSpNBuf.js","assets/common-Dq0fxGqX.js","assets/data-Qh5yokCj.js","assets/lesson-DGbQ_PH8.js","assets/metro-DlDVz_mO.js","assets/mic-DPENKkrJ.js","assets/sound-B5FxSpfP.js","assets/stats-Bk17ObXM.js","assets/stats-CZyhfkyS.js","assets/swipe-Dm6hRykM.js","assets/tone-CgTGWbo5.js","assets/touch-VqDdc3hC.js","assets/common-BsJSatRU.css","assets/lesson-CMiJotk9.css","assets/pdf.worker.min-yatZIOMy.mjs","assets/touch-De80AjhI.css","icons/apple-touch-icon.png","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png","icons/icon.svg","manifest.webmanifest","samples/fur-elise.pdf","samples/minuet-g.pdf"];

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
