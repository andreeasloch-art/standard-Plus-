/* ============================================================
   Standard Plus - Wischansicht fuer Suchergebnisse
   ------------------------------------------------------------
   Die Vorschlaege erscheinen als Kartenstapel:
   - nach rechts wischen oder Haken  = interessiert
   - nach links wischen oder Kreuz   = ausblenden, Karte verschwindet
   - Pfeiltasten links/rechts, Rueckgaengig fuer die letzte Karte

   Was "interessiert" bedeutet, haengt an der Rolle:
   - Arbeitgeber, der Fachkraefte sucht  -> Anfrage (wie bisher)
   - Fachkraft, die Unternehmen sucht    -> Interesse; das Unternehmen
     sieht das Kurzprofil im Dashboard
   - ohne Anmeldung                      -> nur vorgemerkt, bis zur Anmeldung

   Bewegung: Web Animations API statt style-Attribut. So bleibt die
   Content-Security-Policy ohne 'unsafe-inline' - und die Karte folgt
   trotzdem dem Finger.
   ============================================================ */
(function (w, d) {
  'use strict';
  var SP = w.SP;

  var RUHIG = w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DAUER = 1000;          /* Zeitachse der Wischbewegung: 0 = links raus, 500 = Mitte, 1000 = rechts raus */
  var SCHWELLE = 0.28;       /* Anteil der Kartenbreite, ab dem die Entscheidung faellt */

  function lage(p) {
    return 'translateX(' + (p * 140).toFixed(2) + '%) rotate(' + (p * 22).toFixed(2) + 'deg)';
  }

  /* ---------- Eine Karte ---------- */
  function karteBauen(e, istAG) {
    var p = e.profil;
    var name = SP.db.profile.anzeigename(p);
    var karte = SP.el('article', 'wisch-karte');
    karte.setAttribute('aria-label', name);

    var kopf = SP.el('div', 'wisch-kopf' + (istAG ? ' gold' : ''));
    var av = SP.el('span', 'ava ava-lg' + (istAG ? ' gold' : ''));
    av.appendChild(SP.el('span', null, SP.initials(name)));
    kopf.appendChild(av);
    var wert = SP.el('div', 'wisch-wert');
    wert.appendChild(SP.el('b', null, e.wert + ' %'));
    wert.appendChild(SP.el('span', null, SP.t('Übereinstimmung')));
    kopf.appendChild(wert);
    karte.appendChild(kopf);

    var leib = SP.el('div', 'wisch-leib');
    leib.appendChild(SP.el('h3', null, name));
    leib.appendChild(SP.el('p', 'rolle', istAG
      ? [SP.db.BRANCHEN[p.branche], SP.tInhalt(p.rechtsform)].filter(Boolean).join(' · ')
      : SP.tInhalt(p.beruf) || SP.t('Ohne Berufsangabe')));
    var ort = SP.el('p', 'ort');
    ort.appendChild(SP.icon('pin', 'ic-sm'));
    ort.appendChild(SP.el('span', null, [SP.tInhalt(p.ort), p.land].filter(Boolean).join(', ')));
    leib.appendChild(ort);

    /* Kurzinfos */
    var fakten = SP.el('div', 'wisch-fakten');
    function fakt(ikon, text) {
      if (!text) return;
      var f = SP.el('span', 'fakt');
      f.appendChild(SP.icon(ikon, 'ic-sm'));
      f.appendChild(SP.el('span', null, text));
      fakten.appendChild(f);
    }
    if (istAG) {
      fakt('users', p.groesse ? SP.t('{n} Mitarbeitende', { n: p.groesse }) : '');
      var offen = SP.db.stellen.vonArbeitgeber(p.kontoId).filter(function (s) { return s.offen; }).length;
      fakt('briefcase', offen ? SP.anzahl(offen, '{n} offene Stelle', '{n} offene Stellen') : '');
    } else {
      fakt('clock', p.erfahrung ? SP.anzahl(p.erfahrung, '{n} Jahr Erfahrung', '{n} Jahre Erfahrung') : '');
      fakt('translate', p.deutsch ? SP.t('Deutsch {stufe}', { stufe: p.deutsch }) : '');
      fakt('calendar', p.verfuegbar ? SP.t('Verfügbar: {wann}', { wann: SP.tInhalt(p.verfuegbar) }) : '');
    }
    var bw = SP.db.bewertungen.schnitt(p.kontoId);
    fakt('star', bw ? SP.zahl(bw.wert, 1) + ' ★' : '');
    leib.appendChild(fakten);

    /* Warum dieser Vorschlag */
    var gruende = SP.el('ul', 'wisch-gruende');
    e.gruende.slice(0, 3).forEach(function (g) {
      var li = SP.el('li');
      li.appendChild(SP.icon('check', 'ic-sm'));
      li.appendChild(SP.el('span', null, SP.tInhalt(g)));
      gruende.appendChild(li);
    });
    if (e.gegen.length) {
      var li = SP.el('li', 'gegen');
      li.appendChild(SP.icon('minus', 'ic-sm'));
      li.appendChild(SP.el('span', null, SP.tInhalt(e.gegen[0])));
      gruende.appendChild(li);
    }
    leib.appendChild(gruende);

    var link = SP.el('a', 'card-link wisch-profil', SP.t('Profil ansehen'));
    link.href = 'standardplus-profil-ansicht.html?id=' + encodeURIComponent(p.kontoId);
    link.appendChild(SP.icon('arrowright', 'ic-sm'));
    leib.appendChild(link);
    karte.appendChild(leib);

    /* Stempel, die beim Wischen sichtbar werden */
    karte.appendChild(SP.el('span', 'stempel stempel-ja', SP.t('Interessiert')));
    karte.appendChild(SP.el('span', 'stempel stempel-nein', SP.t('Nein')));
    return karte;
  }

  /* ============================================================
     SP.wischen(box, treffer, optionen)
     optionen: istAG (es werden Unternehmen gesucht), betrachterId,
               rolle, zurListe (Funktion)
     ============================================================ */
  SP.wischen = function (box, treffer, o) {
    var istAG = !!o.istAG;
    var ich = o.betrachterId || null;
    var rolle = o.rolle || null;

    /* Wie ein Haken wirkt */
    var art = !ich ? 'vormerken'
      : (!istAG && rolle === 'arbeitgeber') ? 'anfrage'
      : (istAG && rolle === 'arbeitnehmer') ? 'interesse'
      : 'vormerken';

    function schonEntschieden(e) {
      if (!ich) return false;
      var zid = e.profil.kontoId;
      if (art === 'anfrage' && SP.db.anfragen.zwischen(ich, zid)) return true;
      if (art === 'interesse' && SP.db.wischen.hatInteresse(ich, zid)) return true;
      return false;
    }

    var ausgeblendet = ich ? SP.db.wischen.ausgeblendete(ich) : [];
    var frueher = { ausgeblendet: [], entschieden: 0 };
    var stapel = treffer.filter(function (e) {
      if (ausgeblendet.indexOf(e.profil.kontoId) > -1) { frueher.ausgeblendet.push(e.profil.kontoId); return false; }
      if (schonEntschieden(e)) { frueher.entschieden++; return false; }
      return true;
    });

    var pos = 0;
    var verlauf = [];          /* fuer Rueckgaengig: { e, ja, rueck } */
    var ja = [], nein = [];
    var beschaeftigt = false;

    box.replaceChildren();
    var wurzel = SP.el('div', 'wisch');
    wurzel.tabIndex = 0;
    wurzel.setAttribute('role', 'region');
    wurzel.setAttribute('aria-label', SP.t('Vorschläge zum Wischen'));

    var zaehler = SP.el('p', 'wisch-zaehler');
    var balken = SP.el('div', 'wisch-fortschritt');
    var balkenFuellung = SP.el('span');
    balken.appendChild(balkenFuellung);
    var flaeche = SP.el('div', 'wisch-stapel');
    var knoepfe = SP.el('div', 'wisch-knoepfe');
    var status = SP.el('p', 'wisch-status');
    status.setAttribute('aria-live', 'polite');

    function knopf(klasse, ikon, label) {
      var b = SP.el('button', 'wisch-knopf ' + klasse);
      b.type = 'button';
      b.setAttribute('aria-label', label);
      b.setAttribute('title', label);
      b.appendChild(SP.icon(ikon));
      knoepfe.appendChild(b);
      return b;
    }
    var bNein = knopf('nein', 'x', SP.t('Nicht interessiert – ausblenden'));
    var bZurueck = knopf('zurueck', 'undo', SP.t('Rückgängig'));
    var bJa = knopf('ja', 'check', art === 'anfrage' ? SP.t('Interessiert – Anfrage senden')
      : art === 'interesse' ? SP.t('Interessiert – Interesse zeigen') : SP.t('Interessiert – vormerken'));

    wurzel.appendChild(zaehler);
    wurzel.appendChild(balken);
    wurzel.appendChild(flaeche);
    wurzel.appendChild(knoepfe);
    wurzel.appendChild(status);
    wurzel.appendChild(SP.el('p', 'wisch-hilfe',
      art === 'anfrage'
        ? SP.t('Nach rechts wischen oder Haken: Anfrage senden. Nach links oder Kreuz: ausblenden. Auf dem Computer gehen auch die Pfeiltasten.')
        : art === 'interesse'
          ? SP.t('Nach rechts wischen oder Haken: Das Unternehmen sieht Ihr Kurzprofil – Name und Kontaktdaten erst nach beidseitiger Freigabe. Nach links oder Kreuz: ausblenden.')
          : SP.t('Nach rechts wischen oder Haken: vormerken. Nach links oder Kreuz: ausblenden. Auf dem Computer gehen auch die Pfeiltasten.')));
    box.appendChild(wurzel);

    /* ---------- Stapel zeichnen: oberste Karte plus zwei dahinter ---------- */
    function zeichnen() {
      flaeche.replaceChildren();
      if (pos >= stapel.length) { ende(); return; }
      zaehler.textContent = SP.t('Vorschlag {nr} von {gesamt}', { nr: pos + 1, gesamt: stapel.length });
      balkenFuellung.className = 'pct-' + Math.round(pos / stapel.length * 100);
      for (var i = Math.min(pos + 2, stapel.length - 1); i >= pos; i--) {
        var k = karteBauen(stapel[i], istAG);
        k.classList.add(i === pos ? 'oben' : 'hinten-' + (i - pos));
        if (i !== pos) k.setAttribute('aria-hidden', 'true');
        flaeche.appendChild(k);
      }
      var oben = flaeche.lastChild;
      ziehenErlauben(oben);
      bZurueck.disabled = !verlauf.length;
      knoepfe.hidden = false;
    }

    /* ---------- Entscheidung ---------- */
    function entscheiden(nachRechts) {
      var e = stapel[pos];
      var zid = e.profil.kontoId;
      var name = SP.db.profile.anzeigename(e.profil);
      var eintrag = { e: e, ja: nachRechts, rueck: null };

      if (nachRechts) {
        if (art === 'anfrage') {
          var offene = SP.db.stellen.vonArbeitgeber(ich).filter(function (s) { return s.offen; });
          var a = SP.db.anfragen.anlegen(ich, zid, offene.length ? offene[0].id : null);
          if (!a) return false;
          eintrag.rueck = function () { SP.db.anfragen.zuruecknehmen(ich, zid); };
          status.textContent = SP.t('Anfrage an {name} gesendet. {name} entscheidet über die Freigabe.', { name: name });
        } else if (art === 'interesse') {
          if (!SP.db.wischen.interesse(ich, zid)) return false;
          eintrag.rueck = function () { SP.db.wischen.interesseZurueck(ich, zid); };
          status.textContent = SP.t('Interesse an {name} gezeigt.', { name: name });
        } else {
          status.textContent = SP.t('{name} vorgemerkt.', { name: name });
        }
        ja.push(e);
      } else {
        if (ich) {
          SP.db.wischen.ausblenden(ich, zid);
          eintrag.rueck = function () { SP.db.wischen.einblenden(ich, zid); };
        }
        status.textContent = SP.t('{name} ausgeblendet.', { name: name });
        nein.push(e);
      }
      verlauf.push(eintrag);
      pos++;
      return true;
    }

    function rueckgaengig() {
      if (beschaeftigt || !verlauf.length) return;
      var letzter = verlauf.pop();
      if (letzter.rueck) letzter.rueck();
      (letzter.ja ? ja : nein).pop();
      pos--;
      status.textContent = SP.t('{name} ist zurück.', { name: SP.db.profile.anzeigename(letzter.e.profil) });
      zeichnen();
      wurzel.focus();
    }

    /* ---------- Bewegung ---------- */
    function animationen(karte) {
      var wege = [karte.animate(
        [{ transform: lage(-1) }, { transform: 'none' }, { transform: lage(1) }],
        { duration: DAUER, fill: 'both' })];
      var sJa = karte.querySelector('.stempel-ja'), sNein = karte.querySelector('.stempel-nein');
      wege.push(sJa.animate([{ opacity: 0 }, { opacity: 0, offset: 0.5 }, { opacity: 1, offset: 0.72 }, { opacity: 1 }],
        { duration: DAUER, fill: 'both' }));
      wege.push(sNein.animate([{ opacity: 1 }, { opacity: 1, offset: 0.28 }, { opacity: 0, offset: 0.5 }, { opacity: 0 }],
        { duration: DAUER, fill: 'both' }));
      wege.forEach(function (a) { a.pause(); a.currentTime = DAUER / 2; });
      return wege;
    }

    function wegfliegen(karte, wege, nachRechts) {
      if (!entscheiden(nachRechts)) {
        zurueckschnappen(karte, wege);
        return;
      }
      if (RUHIG || !wege) { zeichnen(); return; }
      beschaeftigt = true;
      var fertig = false;
      function weiter() {
        if (fertig) return;
        fertig = true;
        beschaeftigt = false;
        zeichnen();
        wurzel.focus({ preventScroll: true });
      }
      wege.forEach(function (a) {
        a.playbackRate = nachRechts ? 3.2 : -3.2;
        a.play();
      });
      wege[0].onfinish = weiter;
      w.setTimeout(weiter, 600);   /* falls der Browser das Ende nicht meldet */
    }

    function zurueckschnappen(karte, wege) {
      if (!wege) return;
      var p = (wege[0].currentTime - DAUER / 2) / (DAUER / 2);
      var rueck = karte.animate([{ transform: lage(p) }, { transform: 'none' }],
        { duration: RUHIG ? 0 : 220, easing: 'cubic-bezier(.2,.9,.3,1.2)' });
      wege.forEach(function (a) { a.cancel(); });
      rueck.onfinish = function () { beschaeftigt = false; };
    }

    function perKnopf(nachRechts) {
      if (beschaeftigt || pos >= stapel.length) return;
      var karte = flaeche.lastChild;
      if (RUHIG) { wegfliegen(karte, null, nachRechts); return; }
      wegfliegen(karte, animationen(karte), nachRechts);
    }

    function ziehenErlauben(karte) {
      var start = null, wege = null, breite = 1, letzt = null;

      karte.addEventListener('pointerdown', function (ev) {
        if (beschaeftigt || ev.button > 0) return;
        if (ev.target.closest('a,button')) return;
        start = { x: ev.clientX, y: ev.clientY, t: Date.now() };
        letzt = start;
        breite = karte.getBoundingClientRect().width || 1;
        karte.setPointerCapture(ev.pointerId);
      });

      karte.addEventListener('pointermove', function (ev) {
        if (!start) return;
        var dx = ev.clientX - start.x, dy = ev.clientY - start.y;
        if (!wege) {
          /* Erst ab einer kleinen Bewegung - ein Tippen bleibt ein Tippen */
          if (Math.abs(dx) < 6 || Math.abs(dy) > Math.abs(dx) * 1.2) return;
          wege = animationen(karte);
          karte.classList.add('zieht');
        }
        var anteil = Math.max(-1, Math.min(1, dx / breite));
        wege.forEach(function (a) { a.currentTime = DAUER / 2 + anteil * DAUER / 2; });
        letzt = { x: ev.clientX, y: ev.clientY, t: Date.now() };
      });

      function loslassen(ev) {
        if (!start) return;
        var dx = ev.clientX - start.x;
        var tempo = (ev.clientX - letzt.x) / Math.max(1, Date.now() - letzt.t);
        start = null;
        karte.classList.remove('zieht');
        if (!wege) return;
        var aktuell = wege; wege = null;
        if (Math.abs(dx) > breite * SCHWELLE || (Math.abs(tempo) > 0.6 && Math.abs(dx) > 30)) {
          wegfliegen(karte, aktuell, dx > 0);
        } else {
          zurueckschnappen(karte, aktuell);
        }
      }
      karte.addEventListener('pointerup', loslassen);
      karte.addEventListener('pointercancel', loslassen);
    }

    /* ---------- Ende des Stapels ---------- */
    function ende() {
      knoepfe.hidden = true;
      zaehler.textContent = '';
      balkenFuellung.className = 'pct-100';
      var karte = SP.el('div', 'wisch-ende');
      var ikon = SP.el('span', 'wisch-ende-ikon');
      ikon.appendChild(SP.icon(stapel.length ? 'check' : 'info'));
      karte.appendChild(ikon);
      karte.appendChild(SP.el('h3', 'h3', stapel.length
        ? SP.t('Alle Vorschläge angesehen')
        : SP.t('Keine neuen Vorschläge für diese Suche')));

      var zahlen = SP.el('div', 'wisch-bilanz');
      function bilanz(klasse, ikon2, n, text) {
        var b = SP.el('span', 'bilanz ' + klasse);
        b.appendChild(SP.icon(ikon2, 'ic-sm'));
        b.appendChild(SP.el('b', null, String(n)));
        b.appendChild(SP.el('span', null, text));
        zahlen.appendChild(b);
      }
      bilanz('ja', 'check', ja.length, SP.t('interessiert'));
      bilanz('nein', 'x', nein.length, SP.t('ausgeblendet'));
      karte.appendChild(zahlen);

      if (ja.length) {
        var liste = SP.el('ul', 'wisch-auswahl');
        ja.forEach(function (e) {
          var li = SP.el('li');
          var a = SP.el('a', null, SP.db.profile.anzeigename(e.profil));
          a.href = 'standardplus-profil-ansicht.html?id=' + encodeURIComponent(e.profil.kontoId);
          li.appendChild(a);
          li.appendChild(SP.el('span', 'tiny muted', istAG
            ? SP.db.BRANCHEN[e.profil.branche] || ''
            : SP.tInhalt(e.profil.beruf) || ''));
          liste.appendChild(li);
        });
        karte.appendChild(liste);
      }

      karte.appendChild(SP.el('p', 'small muted', art === 'anfrage'
        ? SP.t('Die Fachkräfte entscheiden jetzt selbst über die Freigabe. Den Stand sehen Sie im Dashboard.')
        : art === 'interesse'
          ? SP.t('Die Unternehmen sehen Ihr Interesse im Dashboard und können Ihnen eine Anfrage senden.')
          : !ich
            ? SP.t('Melden Sie sich an, damit Ihr Interesse ankommt. Ohne Konto wird nichts gespeichert.')
            : SP.t('Vorgemerkt nur für diese Sitzung. Anfragen senden Arbeitgeber, Interesse zeigen Fachkräfte.')));

      if (frueher.entschieden) {
        karte.appendChild(SP.el('p', 'tiny muted', SP.anzahl(frueher.entschieden,
          '{n} Vorschlag haben Sie schon früher mit Haken beantwortet.',
          '{n} Vorschläge haben Sie schon früher mit Haken beantwortet.')));
      }

      var aktionen = SP.el('div', 'flex wrapf g8 jc-c mt16');
      var versteckt = frueher.ausgeblendet.concat(nein.map(function (e) { return e.profil.kontoId; }));
      if (ich && versteckt.length) {
        var wieder = SP.el('button', 'btn btn-outline btn-sm');
        wieder.type = 'button';
        wieder.appendChild(SP.icon('refresh', 'ic-sm'));
        wieder.appendChild(d.createTextNode(SP.anzahl(versteckt.length,
          '{n} ausgeblendeten Vorschlag wieder zeigen', '{n} ausgeblendete Vorschläge wieder zeigen')));
        wieder.addEventListener('click', function () {
          SP.db.wischen.einblenden(ich, versteckt);
          SP.wischen(box, treffer, o);
        });
        aktionen.appendChild(wieder);
      }
      if (!ich && ja.length) {
        var login = SP.el('a', 'btn btn-primary btn-sm', SP.t('Anmelden'));
        login.href = 'standardplus-login.html?ziel=standardplus-suche.html';
        aktionen.appendChild(login);
      }
      if (art === 'anfrage' || art === 'interesse') {
        var dash = SP.el('a', 'btn btn-primary btn-sm', SP.t('Zum Dashboard'));
        dash.href = 'standardplus-dashboard.html';
        aktionen.appendChild(dash);
      }
      if (o.zurListe) {
        var liste2 = SP.el('button', 'btn btn-ghost btn-sm');
        liste2.type = 'button';
        liste2.appendChild(SP.icon('list', 'ic-sm'));
        liste2.appendChild(d.createTextNode(SP.t('Als Liste anzeigen')));
        liste2.addEventListener('click', o.zurListe);
        aktionen.appendChild(liste2);
      }
      karte.appendChild(aktionen);
      flaeche.appendChild(karte);
      bZurueck.disabled = !verlauf.length;
      if (verlauf.length) {
        /* Auch am Ende noch die letzte Karte zurueckholen koennen */
        knoepfe.hidden = false;
        bJa.disabled = true; bNein.disabled = true;
      }
    }

    bJa.addEventListener('click', function () { perKnopf(true); });
    bNein.addEventListener('click', function () { perKnopf(false); });
    bZurueck.addEventListener('click', function () {
      bJa.disabled = false; bNein.disabled = false;
      rueckgaengig();
    });
    wurzel.addEventListener('keydown', function (ev) {
      if (ev.target !== wurzel) return;
      if (ev.key === 'ArrowRight') { ev.preventDefault(); perKnopf(true); }
      else if (ev.key === 'ArrowLeft') { ev.preventDefault(); perKnopf(false); }
      else if (ev.key === 'Backspace' || (ev.key === 'z' && (ev.metaKey || ev.ctrlKey))) {
        ev.preventDefault(); bJa.disabled = false; bNein.disabled = false; rueckgaengig();
      }
    });

    zeichnen();
    return wurzel;
  };

})(window, document);
