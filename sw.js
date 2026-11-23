// Service worker: lets the installed app open offline. Built by vite.config.js,
// which fills in the file list and a version.
// - Pages: network first (always fresh when online), but after 0.4 s the cached copy is shown and the
//   fresh one only saved (a slow network made the app sit on a black screen after Android had
//   unloaded it in the background); cache as fallback when offline.
// - Hashed assets (assets/*): cache first, their content never changes.
// - Fonts and piano sounds from CDNs: cache first.
const CACHE = 'ppt-b8410b5fd2';
const CORE = ["./","index.html","play.html","practice.html","midi-test.html","piece.html","log.html","settings.html","drill.html","theory.html","records.html","drill-log.html","metronome.html","timer.html","classes.html","assets/classes-DkLRvDyh.js","assets/drill-BC24rXAL.js","assets/drill-log-DJ-Knt2x.js","assets/index-DktG-Dur.js","assets/log-D5WjSS3G.js","assets/metronome-DLQE27AX.js","assets/midi-test-BCK4DpWg.js","assets/piece-BX1zY_dt.js","assets/play-vB8MSekh.js","assets/practice-Bsh8S3ou.js","assets/records-C_ni0fzf.js","assets/settings-B2nzlzIb.js","assets/theory-CDKWJC89.js","assets/timer-UfYdiqaI.js","assets/activity-C-JaMK7K.js","assets/backup-Cui-nZt1.js","assets/charts-COXKm5za.js","assets/classes-CN6yoEjb.js","assets/common-BlDgMs-i.js","assets/data-IBTm8SHX.js","assets/lesson-UHMjsJ2e.js","assets/metro-De3r3bC7.js","assets/mic-DPENKkrJ.js","assets/sound-B5FxSpfP.js","assets/stats-Bk17ObXM.js","assets/swipe-Dm6hRykM.js","assets/today-sight-CsGOA9jr.js","assets/today-sight-card-DshUqHN4.js","assets/tone-CgTGWbo5.js","assets/touch-BOwYt-DQ.js","assets/yearview-BPzvARln.js","assets/common-CfG_BCFi.css","assets/lesson-CWir0SCy.css","assets/pdf.worker.min-yatZIOMy.mjs","assets/touch-CiiSCDel.css","assets/yearview-D9GqUTcf.css","icons/apple-touch-icon.png","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png","icons/icon.svg","manifest.webmanifest","room/room-1.webp","room/room-2.webp","room/room-3.webp","room/room-4.webp","room/room-5.webp","room/room-6.webp","room/room-7.webp","samples/fur-elise.pdf","samples/minuet-g.pdf"];

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
