// Service worker: lets the installed app open offline. Built by vite.config.js,
// which fills in the file list and a version.
// - Pages: network first (always fresh when online), but after 0.4 s the cached copy is shown and the
//   fresh one only saved (a slow network made the app sit on a black screen after Android had
//   unloaded it in the background); cache as fallback when offline.
// - Hashed assets (assets/*): cache first, their content never changes.
// - Fonts and piano sounds from CDNs: cache first.
const CACHE = 'ppt-40c2e1b641';
const CORE = ["./","index.html","play.html","practice.html","midi-test.html","piece.html","log.html","settings.html","drill.html","theory.html","records.html","drill-log.html","metronome.html","timer.html","classes.html","assets/classes-DP0dpehR.js","assets/drill-5cKrHz4k.js","assets/drill-log-ZP4oQhmL.js","assets/index-Bf8TaFTp.js","assets/log-DqdjQ76Z.js","assets/metronome-DGoOSaJs.js","assets/midi-test-BJ6386v3.js","assets/piece-D2wIGNfn.js","assets/play-CiFwMXd5.js","assets/practice-Dmv0pygX.js","assets/records-yYaNnuwM.js","assets/settings-Bupk3B8v.js","assets/theory-e3nMkQRq.js","assets/timer-DbbFRuJ_.js","assets/activity-D5ZYURvh.js","assets/backup-6Ohp59CH.js","assets/charts-CyGQePya.js","assets/classes-B2KJRuVF.js","assets/common-B1wzDN1y.js","assets/data-fykbVhOo.js","assets/lesson-CqUIjJGK.js","assets/metro-De3r3bC7.js","assets/mic-DPENKkrJ.js","assets/sound-B5FxSpfP.js","assets/stats-Bk17ObXM.js","assets/swipe-Dm6hRykM.js","assets/tone-CgTGWbo5.js","assets/touch-Cd6ucWDT.js","assets/yearview-pkmuxVwp.js","assets/common-D24BLVMw.css","assets/lesson-xonVG8iP.css","assets/pdf.worker.min-yatZIOMy.mjs","assets/touch-CiiSCDel.css","assets/yearview-B_xQSyvH.css","icons/apple-touch-icon.png","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png","icons/icon.svg","manifest.webmanifest","samples/fur-elise.pdf","samples/minuet-g.pdf"];

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
