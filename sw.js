// Service worker: lets the installed app open offline. Built by vite.config.js,
// which fills in the file list and a version.
// - Pages: network first (always fresh when online), but after 1.5 s the cached copy is shown and the
//   fresh one only saved (a slow network made the app sit on a black screen after Android had
//   unloaded it in the background); cache as fallback when offline.
// - Hashed assets (assets/*): cache first, their content never changes.
// - Fonts and piano sounds from CDNs: cache first.
const CACHE = 'ppt-d258408fb3';
const CORE = ["./","assets/drill-BA_aPIqs.js","assets/drill-log-BhlVXxhW.js","assets/index-CDzNswtn.js","assets/log-0KfWoLSj.js","assets/metronome-BQy00N0F.js","assets/midi-test-B-CIN9SI.js","assets/piece-DDE4r_ml.js","assets/play-k9Cxs7tJ.js","assets/practice-ryBb5Ddf.js","assets/records-BALAT5Di.js","assets/settings-LwbC4MRz.js","assets/theory-DQLSuvmS.js","assets/abcjs-BJDglxSQ.js","assets/activity-C2t2Pn39.js","assets/backup-eJUSouon.js","assets/calibrate-B58KHc7f.js","assets/charts-Dzllvh6Q.js","assets/common-zDPW168Y.js","assets/data-DD0U2GeH.js","assets/lesson-BIxLj1Ju.js","assets/mic-Dfsipog1.js","assets/sound-B5FxSpfP.js","assets/stats-1P6aJhv4.js","assets/stats-Db0Dhrk0.js","assets/common-XVbAMElX.css","assets/lesson-BbSj7WYC.css","assets/pdf.worker.min-yatZIOMy.mjs","icons/apple-touch-icon.png","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png","icons/icon.svg","manifest.webmanifest","samples/fur-elise.pdf","samples/minuet-g.pdf"];

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
    const timer = setTimeout(() => cached().then(give), 1500);
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
