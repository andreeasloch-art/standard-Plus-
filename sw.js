/* ============================================================
   Standard Plus - Offline-Speicher der App (Service Worker)
   ------------------------------------------------------------
   Sorgt dafuer, dass die installierte App auch ohne Netz startet.

   Zwei Regeln, bewusst verschieden:
   - Seiten (HTML): zuerst das Netz, der Speicher nur als Ersatz.
     So sieht man immer den neuesten Stand, sobald Netz da ist -
     und nicht wochenlang eine alte Fassung aus dem Speicher.
   - Dateien (CSS, JS, Symbole): zuerst der Speicher. Sie tragen
     einen Versionsstempel (?v=...), eine neue Fassung hat also
     eine neue Adresse und wird deshalb frisch geladen.

   Was NICHT durchlaeuft: Anfragen an fremde Adressen und die
   Verbindung zum Dolmetscher (WebSocket). Die gehen nie ueber
   diesen Speicher und werden nie zwischengespeichert.

   Die Liste unten schreibt neu-stempeln.sh. Nicht von Hand pflegen.
   ============================================================ */

/* ANFANG automatisch */
const VERSION = '20260929153130';
const SEITEN = [
  'standardplus-agb.html',
  'standardplus-dashboard.html',
  'standardplus-datenschutz-center.html',
  'standardplus-datenschutz.html',
  'standardplus-dolmetscher.html',
  'standardplus-impressum.html',
  'standardplus-interview.html',
  'standardplus-login.html',
  'standardplus-main.html',
  'standardplus-musterprofile.html',
  'standardplus-preise.html',
  'standardplus-profil-ansicht.html',
  'standardplus-profil.html',
  'standardplus-sicherheit.html',
  'standardplus-suche.html',
  'standardplus-talente.html',
  'standardplus-transport.html',
  'standardplus-unternehmen.html',
  'en/standardplus-agb.html',
  'en/standardplus-dashboard.html',
  'en/standardplus-datenschutz-center.html',
  'en/standardplus-datenschutz.html',
  'en/standardplus-dolmetscher.html',
  'en/standardplus-impressum.html',
  'en/standardplus-interview.html',
  'en/standardplus-login.html',
  'en/standardplus-main.html',
  'en/standardplus-musterprofile.html',
  'en/standardplus-preise.html',
  'en/standardplus-profil-ansicht.html',
  'en/standardplus-profil.html',
  'en/standardplus-sicherheit.html',
  'en/standardplus-suche.html',
  'en/standardplus-talente.html',
  'en/standardplus-transport.html',
  'en/standardplus-unternehmen.html',
  'ro/standardplus-agb.html',
  'ro/standardplus-dashboard.html',
  'ro/standardplus-datenschutz-center.html',
  'ro/standardplus-datenschutz.html',
  'ro/standardplus-dolmetscher.html',
  'ro/standardplus-impressum.html',
  'ro/standardplus-interview.html',
  'ro/standardplus-login.html',
  'ro/standardplus-main.html',
  'ro/standardplus-musterprofile.html',
  'ro/standardplus-preise.html',
  'ro/standardplus-profil-ansicht.html',
  'ro/standardplus-profil.html',
  'ro/standardplus-sicherheit.html',
  'ro/standardplus-suche.html',
  'ro/standardplus-talente.html',
  'ro/standardplus-transport.html',
  'ro/standardplus-unternehmen.html'
];
const DATEIEN = [
  'assets/sp-ansicht.js?v=20260929153130',
  'assets/sp-app.js?v=20260929153130',
  'assets/sp-audio-worklet.js',
  'assets/sp-center.js?v=20260929153130',
  'assets/sp-dashboard.js?v=20260929153130',
  'assets/sp-db.js?v=20260929153130',
  'assets/sp-dolmetscher.js?v=20260929153130',
  'assets/sp-dolmetscherseite.js?v=20260929153130',
  'assets/sp-effekte.js?v=20260929153130',
  'assets/sp-empfehlung.js?v=20260929153130',
  'assets/sp-i18n-en.js?v=20260929153130',
  'assets/sp-i18n-ro.js?v=20260929153130',
  'assets/sp-icons.js?v=20260929153130',
  'assets/sp-interview.js?v=20260929153130',
  'assets/sp-konfig.js?v=20260929153130',
  'assets/sp-login.js?v=20260929153130',
  'assets/sp-profil.js?v=20260929153130',
  'assets/sp-reiseplan.js?v=20260929153130',
  'assets/sp-start.js?v=20260929153130',
  'assets/sp-suche.js?v=20260929153130',
  'assets/sp-suchseite.js?v=20260929153130',
  'assets/sp-talente.js?v=20260929153130',
  'assets/sp-transport.js?v=20260929153130',
  'assets/sp-unternehmen.js?v=20260929153130',
  'assets/sp-vokabular.js?v=20260929153130',
  'assets/sp-wischen.js?v=20260929153130',
  'assets/sp-theme.css?v=20260929153130',
  'assets/app/apple-touch-icon.png',
  'assets/app/icon-192.png',
  'assets/app/icon-512.png',
  'assets/app/icon-maskable-512.png',
  'assets/app/logo-marke-hell.png',
  'assets/app/logo-marke.png',
  'manifest.webmanifest',
  'en/manifest.webmanifest',
  'ro/manifest.webmanifest',
  'en/standardplus-offline.html',
  'ro/standardplus-offline.html'
];
/* ENDE automatisch */

const SPEICHER = 'standardplus-' + VERSION;
const OFFLINE = 'standardplus-offline.html';

/* Ersatzseite in der Sprache der angefragten Seite: /en/... und /ro/... */
function offlineSeite(adresse) {
  const treffer = adresse.pathname.match(/\/(en|ro)\/[^/]*$/);
  return treffer ? treffer[1] + '/' + OFFLINE : OFFLINE;
}

self.addEventListener('install', (ereignis) => {
  ereignis.waitUntil(
    caches.open(SPEICHER)
      .then((speicher) => speicher.addAll([...SEITEN, ...DATEIEN, OFFLINE]))
      .then(() => self.skipWaiting())
  );
});

/* Alte Fassungen wegraeumen, sobald die neue aktiv ist */
self.addEventListener('activate', (ereignis) => {
  ereignis.waitUntil(
    caches.keys()
      .then((namen) => Promise.all(namen
        .filter((n) => n.startsWith('standardplus-') && n !== SPEICHER)
        .map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (ereignis) => {
  const anfrage = ereignis.request;
  if (anfrage.method !== 'GET') return;

  const adresse = new URL(anfrage.url);
  /* Nur die eigene Herkunft. Alles andere geht unberuehrt durch. */
  if (adresse.origin !== self.location.origin) return;

  const istSeite = anfrage.mode === 'navigate' ||
    (anfrage.headers.get('accept') || '').includes('text/html');

  if (istSeite) {
    ereignis.respondWith(
      fetch(anfrage)
        .then((antwort) => {
          if (antwort.ok) {
            const kopie = antwort.clone();
            caches.open(SPEICHER).then((s) => s.put(anfrage, kopie));
          }
          return antwort;
        })
        .catch(() => caches.match(anfrage, { ignoreSearch: true })
          .then((gespeichert) => gespeichert || caches.match(offlineSeite(adresse))))
    );
    return;
  }

  ereignis.respondWith(
    caches.match(anfrage).then((gespeichert) => {
      if (gespeichert) return gespeichert;
      return fetch(anfrage)
        .then((antwort) => {
          if (antwort.ok && antwort.type === 'basic') {
            const kopie = antwort.clone();
            caches.open(SPEICHER).then((s) => s.put(anfrage, kopie));
          }
          return antwort;
        })
        /* Ohne Netz: notfalls eine aeltere Fassung derselben Datei */
        .catch(() => caches.match(anfrage, { ignoreSearch: true }));
    })
  );
});
