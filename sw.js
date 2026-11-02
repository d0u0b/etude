// Service worker: lets the installed app open offline. Built by vite.config.js,
// which fills in the file list and a version.
// - Pages: network first (always fresh when online), but after 0.4 s the cached copy is shown and the
//   fresh one only saved (a slow network made the app sit on a black screen after Android had
//   unloaded it in the background); cache as fallback when offline.
// - Hashed assets (assets/*): cache first, their content never changes.
// - Fonts and piano sounds from CDNs: cache first.
const CACHE = 'ppt-dd9c92d84c';
const CORE = ["./","index.html","play.html","practice.html","midi-test.html","piece.html","log.html","settings.html","drill.html","theory.html","records.html","drill-log.html","metronome.html","timer.html","classes.html","assets/classes-BlhNIGbg.js","assets/drill-B1E2Z-nZ.js","assets/drill-log-CV3DLQiO.js","assets/index-C6sGICre.js","assets/log-Bijsqex_.js","assets/metronome-RX7z8BGJ.js","assets/midi-test-BgYv3352.js","assets/piece-BDrMBLjv.js","assets/play-0osT3ez8.js","assets/practice-BNRAQVCe.js","assets/records-ChoASzBb.js","assets/settings-DepvcPGE.js","assets/theory-BDb6qoZt.js","assets/timer-Cjoh22GP.js","assets/activity-CB6Rgx9K.js","assets/backup-D_q2jmyV.js","assets/charts-Bo9nPCgj.js","assets/classes-Czvq9tJc.js","assets/common-iNl4KGXQ.js","assets/data-CT0ks6R2.js","assets/lesson-DE4THTIK.js","assets/metro-De3r3bC7.js","assets/mic-DPENKkrJ.js","assets/sound-B5FxSpfP.js","assets/stats-Bk17ObXM.js","assets/swipe-Dm6hRykM.js","assets/tone-CgTGWbo5.js","assets/touch-CmoChDrk.js","assets/yearview-D972k0b1.js","assets/common-H3wa15FO.css","assets/lesson-xonVG8iP.css","assets/pdf.worker.min-yatZIOMy.mjs","assets/touch-CiiSCDel.css","assets/yearview-B_xQSyvH.css","icons/apple-touch-icon.png","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png","icons/icon.svg","manifest.webmanifest","samples/fur-elise.pdf","samples/minuet-g.pdf"];

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
