// Service worker: lets the installed app open offline. Built by vite.config.js,
// which fills in the file list and a version.
// - Pages: network first (always fresh when online), but after 1.5 s the cached copy is shown and the
//   fresh one only saved (a slow network made the app sit on a black screen after Android had
//   unloaded it in the background); cache as fallback when offline.
// - Hashed assets (assets/*): cache first, their content never changes.
// - Fonts and piano sounds from CDNs: cache first.
const CACHE = 'ppt-43cb5dadc9';
const CORE = ["./","assets/drill-D55oSiML.js","assets/drill-log-BMjwQgbX.js","assets/index-BoyI91o8.js","assets/log-B09wBtrA.js","assets/metronome-BedWzQ9z.js","assets/midi-test-ik0rzIua.js","assets/piece-Bs9P98z3.js","assets/play-CPz0oW18.js","assets/practice-DwSg2exl.js","assets/records-HBpYBa3M.js","assets/settings-CszJtFFB.js","assets/theory-Dm45fcNR.js","assets/abcjs-BJDglxSQ.js","assets/activity-fNZjMrmc.js","assets/backup-DKke40VC.js","assets/calibrate-DH56OEUe.js","assets/charts-B7Q2jbNP.js","assets/common-BSD70CEJ.js","assets/data-DNx9vJwp.js","assets/shared-Dx8bM0WL.js","assets/sound-CRK1LQMa.js","assets/stats-B7KHaT2W.js","assets/stats-Db0Dhrk0.js","assets/common-XVbAMElX.css","assets/pdf.worker.min-yatZIOMy.mjs","assets/shared-CsO5x6Tc.css","icons/apple-touch-icon.png","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png","icons/icon.svg","manifest.webmanifest","samples/fur-elise.pdf","samples/minuet-g.pdf"];

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
