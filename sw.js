// Service worker: lets the installed app open offline. Built by vite.config.js,
// which fills in the file list and a version.
// - Pages: network first (always fresh when online), cache as fallback.
// - Hashed assets (assets/*): cache first, their content never changes.
// - Fonts and piano sounds from CDNs: cache first.
const CACHE = 'ppt-3686871ff2';
const CORE = ["./","assets/drill-C5Wq73Hi.js","assets/drill-log-Dq0xcpCH.js","assets/index-4OX7fV-q.js","assets/log-DHHtbsf9.js","assets/metronome-BhwWOUaE.js","assets/midi-test-CuS6eIdF.js","assets/piece-B8Ja5WN_.js","assets/play-Dj_WZ-oO.js","assets/practice-Cal3nqX2.js","assets/records-DNF0JD9W.js","assets/settings-CB8cDnB8.js","assets/theory-BymgWJZE.js","assets/abcjs-BJDglxSQ.js","assets/activity-Bm7dSBYW.js","assets/backup-owXgzWxn.js","assets/calibrate-DH56OEUe.js","assets/charts-B7Q2jbNP.js","assets/common-CYGMkouI.js","assets/data-DFpD7iVb.js","assets/shared-BoxfaE3W.js","assets/sound-CRK1LQMa.js","assets/stats-CiC12COy.js","assets/stats-Db0Dhrk0.js","assets/common-XVbAMElX.css","assets/pdf.worker.min-yatZIOMy.mjs","assets/shared-DRLDC0Ih.css","icons/apple-touch-icon.png","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png","icons/icon.svg","manifest.webmanifest","samples/fur-elise.pdf","samples/minuet-g.pdf"];

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

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    if (url.pathname.includes('/assets/')) { e.respondWith(fromCacheFirst(req)); return; }
    e.respondWith(
      // bypass the HTTP cache (GitHub Pages sends max-age=600) so updates show up right away
      fetch(new Request(req.url, { cache: 'no-cache', credentials: 'same-origin' })).then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('index.html')))
    );
  } else if (/fonts\.(googleapis|gstatic)\.com|paulrosen\.github\.io/.test(url.host)) {
    e.respondWith(fromCacheFirst(req));
  }
});
