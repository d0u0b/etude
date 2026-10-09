// Service worker: lets the installed app open offline. Built by vite.config.js,
// which fills in the file list and a version.
// - Pages: network first (always fresh when online), but after 1.5 s the cached copy is shown and the
//   fresh one only saved (a slow network made the app sit on a black screen after Android had
//   unloaded it in the background); cache as fallback when offline.
// - Hashed assets (assets/*): cache first, their content never changes.
// - Fonts and piano sounds from CDNs: cache first.
const CACHE = 'ppt-1f87921c8e';
const CORE = ["./","assets/drill-DMJQOuhB.js","assets/drill-log-CMOOV3ms.js","assets/index-Bo9qxnj0.js","assets/log-CBRRrwgA.js","assets/metronome-BEYMsn0H.js","assets/midi-test-Dh--oB7T.js","assets/piece-dAtUh_Ik.js","assets/play-Byk3dLly.js","assets/practice-D9h82-6s.js","assets/records-CDVCkuIp.js","assets/settings-DOHVi-1t.js","assets/theory-Dzb9ZSlU.js","assets/abcjs-BJDglxSQ.js","assets/activity-CO-s9fFP.js","assets/backup-xolgnaw4.js","assets/calibrate-Cjb0E-mS.js","assets/charts-B7Q2jbNP.js","assets/common-JHoU27tE.js","assets/data-DPzyUHZe.js","assets/shared-C-en4DiF.js","assets/sound-Bk7RDd25.js","assets/stats-COMSao4_.js","assets/stats-Db0Dhrk0.js","assets/common-XVbAMElX.css","assets/pdf.worker.min-yatZIOMy.mjs","assets/shared-DdIRjBij.css","icons/apple-touch-icon.png","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png","icons/icon.svg","manifest.webmanifest","samples/fur-elise.pdf","samples/minuet-g.pdf"];

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
