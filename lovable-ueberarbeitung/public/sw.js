/* ============================================================
   Standard Plus – Service Worker der App
   ------------------------------------------------------------
   Bewusst sparsam, damit keine persönlichen Daten im Gerät landen:
   - Seiten (HTML) kommen immer aus dem Netz. Ohne Netz erscheint
     die Offline-Seite. Seiten werden NICHT zwischengespeichert.
   - Nur eigene statische Dateien (JS, CSS, Schriften, Symbole)
     werden gespeichert – sie tragen einen Versionsstempel im Namen.
   - Anfragen an fremde Adressen (Datenbank, Anmeldung, Fotos)
     laufen unberührt durch und werden nie gespeichert.
   ============================================================ */

const VERSION = "2026-10-01-1";
const SPEICHER = "standardplus-" + VERSION;
const OFFLINE = "/offline.html";
const VORAB = [OFFLINE, "/app/icon-192.png", "/app/icon-512.png", "/manifest.webmanifest"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(SPEICHER).then((s) => s.addAll(VORAB)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((namen) => Promise.all(namen.filter((n) => n.startsWith("standardplus-") && n !== SPEICHER).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

function istStatisch(url) {
  return /\.(?:js|css|woff2?|png|jpg|jpeg|svg|webp|ico)$/i.test(url.pathname) && !url.pathname.startsWith("/api/");
}

self.addEventListener("fetch", (e) => {
  const anfrage = e.request;
  if (anfrage.method !== "GET") return;
  const url = new URL(anfrage.url);
  if (url.origin !== self.location.origin) return; // fremde Adressen nie anfassen

  if (anfrage.mode === "navigate") {
    e.respondWith(fetch(anfrage).catch(() => caches.match(OFFLINE)));
    return;
  }

  if (istStatisch(url)) {
    e.respondWith(
      caches.match(anfrage).then((gespeichert) =>
        gespeichert ||
        fetch(anfrage).then((antwort) => {
          if (antwort.ok && antwort.type === "basic") {
            const kopie = antwort.clone();
            caches.open(SPEICHER).then((s) => s.put(anfrage, kopie));
          }
          return antwort;
        }),
      ),
    );
  }
});
