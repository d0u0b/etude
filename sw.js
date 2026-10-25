// Service worker: lets the installed app open offline. Built by vite.config.js,
// which fills in the file list and a version.
// - Pages: network first (always fresh when online), but after 0.4 s the cached copy is shown and the
//   fresh one only saved (a slow network made the app sit on a black screen after Android had
//   unloaded it in the background); cache as fallback when offline.
// - Hashed assets (assets/*): cache first, their content never changes.
// - Fonts and piano sounds from CDNs: cache first.
const CACHE = 'ppt-e65e79d3e9';
const CORE = ["./","assets/drill-CwaqWJdE.js","assets/drill-log-DwLjBSUk.js","assets/index-DG2c7Kas.js","assets/log-lTb3MEm-.js","assets/metronome-DVZCVGuh.js","assets/midi-test-BEnRkYGz.js","assets/piece-C66eSax6.js","assets/play-e-Z3Qrtr.js","assets/practice-aQh_V0Sr.js","assets/records-B_f1ZjvG.js","assets/settings-UQ8s3Hjc.js","assets/theory-B7WWVk7P.js","assets/timer-CPHThKee.js","assets/activity-Bmx-FUzH.js","assets/backup-DUzVehqN.js","assets/calibrate-C_mq2Oy1.js","assets/charts-Dzllvh6Q.js","assets/common-KRvLjNaR.js","assets/data-Z2pw7b8-.js","assets/lesson-CQNrnkSt.js","assets/metro-DlDVz_mO.js","assets/mic-DPENKkrJ.js","assets/sound-B5FxSpfP.js","assets/stats-Bk17ObXM.js","assets/stats-Db0Dhrk0.js","assets/tone-DezBH39a.js","assets/touch-Dkv3d5L6.js","assets/common-BzvutYBU.css","assets/lesson-BWYXsSRq.css","assets/pdf.worker.min-yatZIOMy.mjs","assets/touch-CIepJdT0.css","icons/apple-touch-icon.png","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png","icons/icon.svg","manifest.webmanifest","samples/fur-elise.pdf","samples/minuet-g.pdf"];

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
