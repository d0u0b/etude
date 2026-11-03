// Service worker: lets the installed app open offline. Built by vite.config.js,
// which fills in the file list and a version.
// - Pages: network first (always fresh when online), but after 0.4 s the cached copy is shown and the
//   fresh one only saved (a slow network made the app sit on a black screen after Android had
//   unloaded it in the background); cache as fallback when offline.
// - Hashed assets (assets/*): cache first, their content never changes.
// - Fonts and piano sounds from CDNs: cache first.
const CACHE = 'ppt-815ceee0fe';
const CORE = ["./","index.html","play.html","practice.html","midi-test.html","piece.html","log.html","settings.html","drill.html","theory.html","records.html","drill-log.html","metronome.html","timer.html","classes.html","assets/classes-payIPe9Y.js","assets/drill-B_KPBawR.js","assets/drill-log-BQWZY_95.js","assets/index--04sF8O7.js","assets/log-CNqxg2T-.js","assets/metronome-CJUPhyKS.js","assets/midi-test-BqLbHNzn.js","assets/piece-KPbNgiqO.js","assets/play-0JuG_KFb.js","assets/practice-Zi8mh8ia.js","assets/records-PK0_e3Dj.js","assets/settings-BHZhX-dQ.js","assets/theory-D6NQBQKT.js","assets/timer-DBVfiKv8.js","assets/activity-BNIwrlml.js","assets/backup-BdqnUE3c.js","assets/charts-COXKm5za.js","assets/classes-DYxZVAj1.js","assets/common-6cvA5wnz.js","assets/data-LSWqj1n6.js","assets/lesson-BdrnMkRK.js","assets/metro-De3r3bC7.js","assets/mic-DPENKkrJ.js","assets/sound-B5FxSpfP.js","assets/stats-Bk17ObXM.js","assets/swipe-Dm6hRykM.js","assets/tone-CgTGWbo5.js","assets/touch-Bmaa9zOy.js","assets/yearview-Bvei-vJo.js","assets/common-BAHqWdsx.css","assets/lesson-v8-mBR4_.css","assets/pdf.worker.min-yatZIOMy.mjs","assets/touch-CiiSCDel.css","assets/yearview-D9GqUTcf.css","icons/apple-touch-icon.png","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png","icons/icon.svg","manifest.webmanifest","samples/fur-elise.pdf","samples/minuet-g.pdf"];

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
