// Service worker: lets the installed app open offline. Built by vite.config.js,
// which fills in the file list and a version.
// - Pages: network first (always fresh when online), but after 1.5 s the cached copy is shown and the
//   fresh one only saved (a slow network made the app sit on a black screen after Android had
//   unloaded it in the background); cache as fallback when offline.
// - Hashed assets (assets/*): cache first, their content never changes.
// - Fonts and piano sounds from CDNs: cache first.
const CACHE = 'ppt-149b7d98fc';
const CORE = ["./","assets/drill-DtBTJ5DO.js","assets/drill-log-CR5iJDRC.js","assets/index-DBKAX3tP.js","assets/log-B-QvImvI.js","assets/metronome-BZwTEoot.js","assets/midi-test-B1rU7Ag0.js","assets/piece-BlE6Wf0f.js","assets/play-CXge35wI.js","assets/practice-9oSuEk04.js","assets/records-CT5v7_jU.js","assets/settings-CzvEXwDM.js","assets/theory-C0xxup3Q.js","assets/activity-Ckgauu0_.js","assets/backup-1JwmB1I5.js","assets/charts-Dzllvh6Q.js","assets/common-RKjuQg0t.js","assets/data-ZXU_g9n8.js","assets/lesson-lmvNmy0A.js","assets/mic-DPENKkrJ.js","assets/sound-B5FxSpfP.js","assets/stats-Db0Dhrk0.js","assets/stats-sXWs8iKY.js","assets/tone-BqrRrPma.js","assets/touch-DyHnCwNb.js","assets/common-XVbAMElX.css","assets/lesson-qlwsZR-L.css","assets/pdf.worker.min-yatZIOMy.mjs","assets/touch-B3C_SgXV.css","icons/apple-touch-icon.png","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png","icons/icon.svg","manifest.webmanifest","samples/fur-elise.pdf","samples/minuet-g.pdf"];

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
