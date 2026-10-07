/* ============================================================
   Standard Plus - Bedienung der Dolmetscherseite
   ------------------------------------------------------------
   Zwei Geraete, ein Kennwort. Jede Seite waehlt nur die eigene
   Sprache - die Zielsprache ergibt sich aus der Gegenseite.
   Ausgabe ausschliesslich ueber die DOM-API, kein innerHTML.
   ============================================================ */
(function (w, d) {
  'use strict';
  var SP = w.SP;
  var $ = function (id) { return d.getElementById(id); };

  var dolm = null;
  var eigenLeer = true;
  var gegenLeer = true;

  /* ---------- Kennwort ---------- */
  function neuesKennwort() {
    $('d-raum').value = SP.dolmetscher.raumVorschlag();
  }
  neuesKennwort();
  $('d-neu').addEventListener('click', neuesKennwort);

  /* Kennwort aus der Adresszeile uebernehmen, damit ein Link genuegt */
  var mitgegeben = new URLSearchParams(w.location.search).get('raum');
  if (mitgegeben) $('d-raum').value = SP.clean(mitgegeben, 12).toUpperCase();

  /* Kennwort immer gross schreiben - es wird vorgelesen, nicht getippt */
  $('d-raum').addEventListener('input', function () {
    var feld = $('d-raum');
    var stelle = feld.selectionStart;
    feld.value = feld.value.toUpperCase();
    feld.setSelectionRange(stelle, stelle);
  });

  /* ---------- Ist ein Server hinterlegt? ---------- */
  var bereit = SP.dolmetscher && SP.dolmetscher.eingerichtet();
  if (bereit) {
    $('d-hinweis').className = 'notice notice-ok mt16';
    $('d-hinweis-text').textContent =
      SP.t('Dolmetscher-Server: {adresse} — Ihre Stimme geht ausschliesslich dorthin.',
        { adresse: SP.dolmetscher.adresse() });
  } else {
    /* Ohne Server keinen toten Knopf stehen lassen: Der Weg fuehrt zum
       vorbereiteten Beispielgespraech im Videointerview. */
    $('d-start').hidden = true;
    $('d-hinweis').className = 'notice notice-info mt16';
    $('d-hinweis-text').textContent =
      SP.t('Der Live-Dolmetscher wird freigeschaltet, sobald Ihr eigener Server eingerichtet ist. So lange können Sie das vorbereitete Beispielgespräch im Videointerview ansehen.');
    var ersatz = SP.el('a', 'btn btn-white btn-lg', SP.t('Beispielgespräch ansehen'));
    ersatz.href = 'standardplus-interview.html';
    ersatz.appendChild(SP.icon('arrowright', 'ic-sm'));
    $('d-start').parentNode.appendChild(ersatz);
  }

  /* ---------- Statuszeile ---------- */
  function status(text, art) {
    $('d-status').className = 'dolm-status ' + (art || 'an');
    $('d-status-text').textContent = text;
  }

  /* ---------- Zeilen in den Spuren ---------- */
  function zeile(spurId, aufbau) {
    var spur = $(spurId);
    if (spurId === 'd-eigen' && eigenLeer) { spur.replaceChildren(); eigenLeer = false; }
    if (spurId === 'd-gegen' && gegenLeer) { spur.replaceChildren(); gegenLeer = false; }

    spur.appendChild(aufbau);
    spur.scrollTop = spur.scrollHeight;

    /* Nicht endlos wachsen lassen - lange Gespraeche wuerden die
       Seite sonst zunehmend traege machen. */
    while (spur.children.length > 40) spur.removeChild(spur.firstChild);
  }

  function zeit() {
    return new Date().toLocaleTimeString(SP.gebiet, { hour: '2-digit', minute: '2-digit' });
  }

  /* ---------- Starten ---------- */
  $('d-start').addEventListener('click', function () {
    var sprache = $('d-sprache').value;
    var raum = SP.clean($('d-raum').value, 12).trim();
    var name = SP.clean($('d-name').value, 60).trim() || SP.t('Teilnehmer');

    if (!raum) {
      SP.toast('warn', SP.t('Kennwort fehlt'), SP.t('Ohne Kennwort finden sich die beiden Seiten nicht.'));
      return;
    }

    dolm = SP.dolmetscher.neu({
      sprache: sprache,
      raum: raum,
      name: name,
      /* Ohne Kopfhoerer laeuft der Lautsprecherbetrieb mit Mikrofonpause */
      lautsprecher: !$('d-kopfhoerer-an').checked,

      aufStatus: function (zustand, text) {
        var art = 'an';
        if (zustand === 'fehler') art = 'err';
        else if (zustand === 'wartet') art = 'warn';
        else if (zustand === 'spricht') art = 'spricht';
        status(text, art);
      },

      /* Was der Server bei mir verstanden hat */
      aufEigen: function (e) {
        var reihe = SP.el('div', 'dolm-zeile eigen');
        reihe.appendChild(SP.el('span', 'dolm-zeit', zeit()));
        reihe.appendChild(SP.el('p', 'dolm-text', e.text));
        if (e.sicherheit !== null && e.sicherheit < 0.6) {
          reihe.classList.add('unsicher');
          reihe.appendChild(SP.el('span', 'dolm-warnung',
            SP.t('Schlecht verstanden ({prozent} %)', { prozent: Math.round(e.sicherheit * 100) })));
        }
        zeile('d-eigen', reihe);
      },

      /* Was die Gegenseite gesagt hat, in meiner Sprache.
         Das Original steht bewusst darunter - wer beide Sprachen
         etwas kann, merkt so sofort, wenn die Uebersetzung danebenliegt. */
      aufGegenseite: function (e) {
        var reihe = SP.el('div', 'dolm-zeile gegen');
        var kopf = SP.el('span', 'dolm-zeit');
        kopf.textContent = (e.probe ? SP.t('Probe') : e.von) + ' · ' + zeit();
        reihe.appendChild(kopf);
        reihe.appendChild(SP.el('p', 'dolm-text', e.uebersetzt || '…'));
        var orig = SP.el('p', 'dolm-original');
        orig.appendChild(SP.el('span', 'dolm-sprachkuerzel', String(e.quelle).toUpperCase()));
        orig.appendChild(d.createTextNode(e.original));
        reihe.appendChild(orig);
        zeile('d-gegen', reihe);
      },

      aufLage: function (liste) {
        if (!liste.length) return;
        SP.toast('ok', SP.t('Gegenseite ist da'),
          SP.t('{namen} ist dem Raum beigetreten.', { namen: liste.map(function (g) { return g.name; }).join(', ') }));
      }
    });

    dolm.starten().then(function () {
      $('einrichten').hidden = true;
      $('gespraech').hidden = false;
      $('gespraech').scrollIntoView({ block: 'start' });
      SP.toast('ok', SP.t('Dolmetscher läuft'), $('d-kopfhoerer-an').checked
        ? SP.t('Sie können jederzeit sprechen, auch während der Ausgabe.')
        : SP.t('Sprechen Sie abwechselnd. Während vorgelesen wird, pausiert Ihr Mikrofon kurz.'));
    }).catch(function (fehler) {
      SP.toast('err', SP.t('Start nicht möglich'),
        fehler && fehler.message ? fehler.message : SP.t('Bitte Einstellungen prüfen.'));
    });
  });

  /* ---------- Beenden ---------- */
  function beenden() {
    if (dolm) dolm.stoppen();
    dolm = null;
    $('gespraech').hidden = true;
    $('einrichten').hidden = false;
  }
  $('d-stop').addEventListener('click', beenden);
  w.addEventListener('pagehide', function () { if (dolm) dolm.stoppen(); });

})(window, document);
