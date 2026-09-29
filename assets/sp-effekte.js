/* ============================================================
   Standard Plus - Bewegung
   ------------------------------------------------------------
   Drei Dinge: Inhalte blenden sich beim Scrollen ein, Zahlen
   zaehlen hoch, die Kopfleiste legt beim Scrollen einen Schatten
   an.

   Zwei Regeln, die den Rest erklaeren:

   1. Die Klasse "reveal" wird erst hier im Skript gesetzt, nicht
      im HTML. Ohne JavaScript ist damit alles sofort sichtbar -
      niemand steht vor einer leeren Seite.
   2. Es wird ausschliesslich mit Klassen gearbeitet, nie mit
      style-Attributen. Nur so haelt die strenge Sicherheits-
      richtlinie ohne unsafe-inline.

   Wer im Betriebssystem "Bewegung reduzieren" eingestellt hat,
   bekommt die Inhalte ohne jede Animation.
   ============================================================ */
(function (w, d) {
  'use strict';

  var ruhig = w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Was sich einblenden soll ---------- */
  var GRUPPEN = [
    '.sec > .wrap > .center',
    '.sec > .wrap > .g-1-2 > *',
    '.grid > *',
    '.preis-blick > *',
    '.preis-split > *',
    '.sec-tight > .wrap > *',
    '.cta > .wrap',
    '.schritte > li',
    '.trust > *',
    '.dsg-row'
  ];

  var zuBeobachten = [];

  /* Ergebnislisten werden vom Seitenskript gezeichnet und beim Filtern
     ein- und ausgeblendet. Dort waere ein Einblendeffekt nur stoerend -
     eine gefilterte Karte soll sofort da sein. */
  function istErgebnisliste(el) {
    return !!el.closest('#ergebnisse,#match-list,.ac-liste');
  }

  GRUPPEN.forEach(function (auswahl) {
    var treffer = d.querySelectorAll(auswahl);
    /* Geschwister kommen kurz nacheinander, nicht alle gleichzeitig */
    var letzterElter = null, lauf = 0;
    Array.prototype.forEach.call(treffer, function (el) {
      if (el.classList.contains('reveal') || istErgebnisliste(el)) return;
      el.classList.add('reveal');
      if (el.parentNode === letzterElter) { lauf++; } else { letzterElter = el.parentNode; lauf = 0; }
      if (lauf > 0 && lauf < 5) el.classList.add('reveal-s' + lauf);
      zuBeobachten.push(el);
    });
  });

  function zeigen(el) { el.classList.add('sichtbar'); }

  if (ruhig || !('IntersectionObserver' in w)) {
    zuBeobachten.forEach(zeigen);
  } else {
    var beobachter = new w.IntersectionObserver(function (eintraege) {
      eintraege.forEach(function (e) {
        if (!e.isIntersecting) return;
        zeigen(e.target);
        beobachter.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
    zuBeobachten.forEach(function (el) { beobachter.observe(el); });

    /* Sicherheitsnetz: Der Beobachter meldet sich nicht, solange der
       Tab im Hintergrund liegt. Wer die Seite in einem Hintergrundtab
       oeffnet und dann druckt, saehe sonst leere Flaechen. Nach
       2,5 Sekunden wird deshalb alles gezeigt, was noch aussteht. */
    w.setTimeout(function () {
      zuBeobachten.forEach(function (el) {
        if (!el.classList.contains('sichtbar')) zeigen(el);
      });
    }, 2500);
  }

  /* ---------- 2. Zahlen hochzaehlen ---------- */
  function zaehlen(el) {
    var ziel = parseInt(el.getAttribute('data-zahl'), 10);
    if (isNaN(ziel)) return;
    if (ruhig || ziel === 0) { el.textContent = String(ziel); return; }
    var dauer = 1100, start = null;
    function schritt(zeit) {
      if (start === null) start = zeit;
      var anteil = Math.min((zeit - start) / dauer, 1);
      /* weiches Ausklingen, damit die Zahl nicht abrupt stehen bleibt */
      var weich = 1 - Math.pow(1 - anteil, 3);
      el.textContent = String(Math.round(ziel * weich));
      if (anteil < 1) w.requestAnimationFrame(schritt);
    }
    el.textContent = '0';
    w.requestAnimationFrame(schritt);
  }

  var zahlen = d.querySelectorAll('[data-zahl]');
  if (zahlen.length) {
    if (ruhig || !('IntersectionObserver' in w)) {
      Array.prototype.forEach.call(zahlen, zaehlen);
    } else {
      var zaehlWache = new w.IntersectionObserver(function (eintraege) {
        eintraege.forEach(function (e) {
          if (!e.isIntersecting) return;
          zaehlen(e.target);
          zaehlWache.unobserve(e.target);
        });
      }, { threshold: 0.5 });
      Array.prototype.forEach.call(zahlen, function (el) { zaehlWache.observe(el); });
    }
  }

  /* ---------- 3. Lesefortschritt ----------
     Der Streifen laeuft ueber die CSS-Scroll-Zeitleiste. Kann der
     Browser das nicht, wird er gar nicht erst angelegt - lieber
     kein Streifen als ein Streifen, der immer leer bleibt. */
  if (!ruhig && w.CSS && w.CSS.supports && w.CSS.supports('animation-timeline', 'scroll()')) {
    var streifen = d.createElement('div');
    streifen.className = 'fortschritt';
    streifen.setAttribute('aria-hidden', 'true');
    d.body.appendChild(streifen);
  }

  /* ---------- 4. Kopfleiste beim Scrollen ---------- */
  var kopf = d.querySelector('.sp-header');
  if (kopf) {
    var laeuft = false;
    function pruefen() {
      kopf.classList.toggle('gescrollt', w.scrollY > 8);
      laeuft = false;
    }
    w.addEventListener('scroll', function () {
      if (laeuft) return;
      laeuft = true;
      w.requestAnimationFrame(pruefen);
    }, { passive: true });
    pruefen();
  }

})(window, document);
