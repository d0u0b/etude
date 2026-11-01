// Service worker: lets the installed app open offline. Built by vite.config.js,
// which fills in the file list and a version.
// - Pages: network first (always fresh when online), but after 0.4 s the cached copy is shown and the
//   fresh one only saved (a slow network made the app sit on a black screen after Android had
//   unloaded it in the background); cache as fallback when offline.
// - Hashed assets (assets/*): cache first, their content never changes.
// - Fonts and piano sounds from CDNs: cache first.
const CACHE = 'ppt-88831d9739';
const CORE = ["./","assets/drill-B_-DkFxL.js","assets/drill-log-DU-VeByh.js","assets/index-BXXZgmzI.js","assets/log-CP3O21-q.js","assets/metronome-DidIT2Fe.js","assets/midi-test-CCkorlAD.js","assets/piece-BTu6ZlBk.js","assets/play-Cuk_gY1K.js","assets/practice-CCH_E-ak.js","assets/records-DiDckBvP.js","assets/settings-BPSypFfp.js","assets/theory-B7Ji2Z0H.js","assets/timer-0LEz5KHR.js","assets/activity-D7OgKD6y.js","assets/backup-B_wJfISi.js","assets/charts-BX2leRW7.js","assets/common-BqlI_rL7.js","assets/data-DFDpg8TF.js","assets/lesson-AtQr-Iua.js","assets/metro-De3r3bC7.js","assets/mic-DPENKkrJ.js","assets/sound-B5FxSpfP.js","assets/stats-Bk17ObXM.js","assets/swipe-Dm6hRykM.js","assets/tone-CgTGWbo5.js","assets/touch-CPtZ16Jj.js","assets/yearview-BDWIC5Ea.js","assets/common-BA94rND6.css","assets/lesson-B6e2JFO_.css","assets/pdf.worker.min-yatZIOMy.mjs","assets/touch-CiiSCDel.css","assets/yearview-NFZVhclq.css","icons/apple-touch-icon.png","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png","icons/icon.svg","manifest.webmanifest","samples/fur-elise.pdf","samples/minuet-g.pdf"];

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
