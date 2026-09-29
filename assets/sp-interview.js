/* Standard Plus - Videointerview mit Live-Uebersetzung
   Sicherheitsrelevant:
   - Kein innerHTML. Jede Nachricht wird ueber textContent erzeugt,
     damit eingegebener Text niemals als Markup ausgefuehrt werden kann.
   - Aufzeichnung und Protokoll nur nach ausdruecklicher Einwilligung.
   - Rollenwahl und Einwilligung werden im Sitzungsprotokoll vermerkt. */
(function (w, d) {
  'use strict';
  var SP = w.SP;
  var $ = function (id) { return d.getElementById(id); };

  var rolle = null;
  var einwilligung = { uebersetzung: false, aufzeichnung: false, protokoll: false };
  var laeuft = false;
  var sekunden = 0;
  var timerId = null;

  /* ---------- Rollenwahl ---------- */
  function pruefeStart() {
    var ok = !!rolle && $('ok-uebersetzung').checked;
    var btn = $('start');
    btn.disabled = !ok;
    btn.textContent = ok
      ? SP.t('Interview als {name} starten', { name: rolle === 'arbeitgeber' ? 'Thomas Becker' : 'Ion Tudose' })
      : (rolle ? SP.t('Bitte in die Übersetzung einwilligen') : SP.t('Bitte Rolle wählen und einwilligen'));
  }

  [$('rolle-ag'), $('rolle-bw')].forEach(function (b) {
    b.addEventListener('click', function () {
      d.querySelectorAll('.cpc').forEach(function (c) { c.classList.remove('sel'); });
      b.classList.add('sel');
      rolle = b.getAttribute('data-wahl');
      pruefeStart();
    });
  });
  ['ok-uebersetzung', 'ok-aufzeichnung', 'ok-protokoll'].forEach(function (id) {
    $(id).addEventListener('change', pruefeStart);
  });

  /* Kommt der Aufruf aus einem Profil, ist die Rolle schon bekannt und
     wird vorausgewaehlt. Die Einwilligung bleibt bewusst offen - die
     muss in jedem Fall ausdruecklich erteilt werden. */
  var mitgegeben = new URLSearchParams(w.location.search).get('rolle');
  if (mitgegeben === 'arbeitgeber' || mitgegeben === 'arbeitnehmer') {
    var karte = mitgegeben === 'arbeitgeber' ? $('rolle-ag') : $('rolle-bw');
    if (karte) karte.click();
  }

  $('start').addEventListener('click', function () {
    einwilligung.uebersetzung = $('ok-uebersetzung').checked;
    einwilligung.aufzeichnung = $('ok-aufzeichnung').checked;
    einwilligung.protokoll = $('ok-protokoll').checked;

    SP.audit('Interview gestartet',
      'Rolle: ' + rolle +
      ' - Übersetzung: ja' +
      ' - Aufzeichnung: ' + (einwilligung.aufzeichnung ? 'ja' : 'nein') +
      ' - Protokoll: ' + (einwilligung.protokoll ? 'ja' : 'nein'));

    $('chooser').hidden = true;
    $('app').hidden = false;
    starteTimer();

    if (einwilligung.aufzeichnung) {
      $('rec-status').textContent = SP.t('Aufzeichnung freigegeben');
      $('rec-status').className = 'tag tag-warn';
    }
    if (!einwilligung.protokoll) {
      $('notizen').replaceChildren(
        SP.el('p', 'small t-w60', SP.t('Kein automatisches Protokoll - Sie haben dem nicht zugestimmt.')));
    }

    setTimeout(function () {
      $('score').textContent = '91 %';
      $('score-bar').className = 'bar-f gold pct-91';
      SP.toast('ok', SP.t('Verbindung steht'), SP.t('Ende-zu-Ende verschlüsselt, Übersetzung Deutsch und Rumänisch.'));
    }, 700);
  });

  /* ---------- Zeitmessung ---------- */
  function starteTimer() {
    timerId = setInterval(function () {
      sekunden++;
      var m = String(Math.floor(sekunden / 60)).padStart(2, '0');
      var s = String(sekunden % 60).padStart(2, '0');
      $('timer').textContent = m + ':' + s;
    }, 1000);
  }

  /* ---------- Reiter ---------- */
  d.querySelectorAll('[data-tab]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      d.querySelectorAll('[data-tab]').forEach(function (b) {
        b.setAttribute('aria-selected', String(b === btn));
        $(b.getAttribute('data-tab')).hidden = b !== btn;
      });
    });
  });

  /* ---------- Nachrichten (ohne innerHTML) ---------- */
  var msgs = $('msgs');
  var ersteNachricht = true;

  function zeigeNachricht(seite, original, uebersetzt, sprachePaar) {
    if (ersteNachricht) { msgs.replaceChildren(); ersteNachricht = false; }

    var wrap = SP.el('div', 'bubble ' + (seite === 'arbeitgeber' ? 'a' : 'b'));

    var kopf = SP.el('p', 'tiny t-w50 mb4',
      seite === 'arbeitgeber' ? SP.t('Thomas Becker (Unternehmen)') : SP.t('Ion Tudose (Bewerber)'));
    wrap.appendChild(kopf);

    var orig = SP.el('p', 'orig');
    orig.appendChild(SP.el('span', null, sprachePaar[0] + ': '));
    orig.appendChild(d.createTextNode(original));
    wrap.appendChild(orig);

    var trans = SP.el('p', 'trans');
    trans.appendChild(SP.el('span', null, sprachePaar[1] + ': '));
    trans.appendChild(d.createTextNode(uebersetzt));
    wrap.appendChild(trans);

    var meta = SP.el('div', 'meta');
    meta.appendChild(SP.el('span', null, new Date().toLocaleTimeString(SP.gebiet,
      { hour: '2-digit', minute: '2-digit' })));
    meta.appendChild(SP.icon('lock', 'ic-sm'));
    meta.appendChild(SP.el('span', null, SP.t('verschlüsselt übertragen')));
    wrap.appendChild(meta);

    msgs.appendChild(wrap);
    msgs.scrollTop = msgs.scrollHeight;

    var feed = seite === 'arbeitgeber' ? $('feed-ag') : $('feed-bw');
    feed.classList.add('speaking');
    setTimeout(function () { feed.classList.remove('speaking'); }, 1400);
  }

  /* ============================================================
     Live-Dolmetscher
     ------------------------------------------------------------
     Nur sichtbar, wenn in sp-konfig.js ein eigener Server steht.
     Ohne Server bleibt es beim vorbereiteten Beispielgespraech -
     lieber ein ehrlicher Hinweis als ein Knopf, der nichts tut.
     ============================================================ */
  var dolm = null;
  var dolmLaeuft = false;

  function dolmStatus(text, art) {
    var zeile = $('dolm-status');
    if (!zeile) return;
    zeile.hidden = false;
    zeile.className = 'dolm-status' + (art ? ' ' + art : '');
    $('dolm-text').textContent = text;
  }

  /* Ein erkannter Satz landet in derselben Blase wie das Beispielgespraech,
     damit Original und Uebersetzung immer nebeneinander stehen. */
  function dolmErgebnis(e) {
    var paar = [e.quelle.toUpperCase(), e.ziel.toUpperCase()];
    zeigeNachricht(rolle === 'arbeitgeber' ? 'arbeitgeber' : 'bewerber',
      e.original, e.uebersetzt, paar);
    if (e.sicherheit !== null && e.sicherheit < 0.6) {
      dolmStatus(SP.t('Zuletzt schlecht verstanden ({wert} %). Bitte wiederholen oder näher ans Mikrofon.',
        { wert: Math.round(e.sicherheit * 100) }), 'warn');
    } else {
      dolmStatus(SP.t('Mikrofon offen. Sprechen Sie einfach.'), 'an');
    }
  }

  function dolmStarten() {
    /* Rolle bestimmt die eigene Sprache. Die Zielsprache muss niemand
       einstellen - der Server nimmt die Sprache der Gegenseite. */
    var eigen = rolle === 'arbeitgeber' ? 'de' : 'ro';
    var wer = rolle === 'arbeitgeber' ? 'Thomas Becker' : 'Ion Tudose';

    dolm = SP.dolmetscher.neu({
      sprache: eigen,
      raum: 'interview-demo',
      name: wer,
      aufStatus: function (zustand, text) {
        var art = '';
        if (zustand === 'fehler') art = 'err';
        else if (zustand === 'spricht') art = 'warn';
        else if (zustand === 'hoert') art = 'an';
        dolmStatus(text, art);
      },
      /* Was der Server bei mir verstanden hat - nur zur Kontrolle */
      aufEigen: function (e) {
        if (e.sicherheit !== null && e.sicherheit < 0.6) {
          dolmStatus(SP.t('Schlecht verstanden ({wert} %): „{text}“ – bitte wiederholen.',
            { wert: Math.round(e.sicherheit * 100), text: e.text }), 'warn');
        } else {
          dolmStatus(SP.t('Verstanden: „{text}“', { text: e.text }), 'an');
        }
      },
      /* Was die Gegenseite gesagt hat, in meiner Sprache */
      aufGegenseite: function (e) {
        zeigeNachricht(rolle === 'arbeitgeber' ? 'bewerber' : 'arbeitgeber',
          e.original, e.uebersetzt,
          [String(e.quelle).toUpperCase(), String(e.ziel).toUpperCase()]);
      }
    });

    dolm.starten().then(function () {
      dolmLaeuft = true;
      $('btn-live').classList.add('an');
      $('btn-live').lastChild.textContent = SP.t('Dolmetscher beenden');
      SP.toast('ok', SP.t('Dolmetscher läuft'),
        SP.t('Sprechen Sie abwechselnd. Während die Übersetzung vorgelesen wird, pausiert Ihr Mikrofon kurz — sonst hörte es die eigene Ausgabe.'));
    }).catch(function () {
      dolmLaeuft = false;
      $('btn-live').classList.remove('an');
    });
  }

  function dolmStoppen() {
    if (dolm) dolm.stoppen();
    dolm = null;
    dolmLaeuft = false;
    var b = $('btn-live');
    if (b) { b.classList.remove('an'); b.lastChild.textContent = SP.t('Live-Dolmetscher'); }
  }

  if (SP.dolmetscher && SP.dolmetscher.eingerichtet()) {
    var hinweis = $('dolm-hinweis');
    if (hinweis) {
      hinweis.className = 'notice notice-ok mb20';
      $('dolm-hinweis-text').textContent =
        SP.t('Live-Dolmetscher eingerichtet: {adresse}. Nach dem Start können Sie frei sprechen – Ihre Sprache wird auf Ihrem eigenen Server übersetzt, ohne dass Ton die EU verlässt.',
        { adresse: SP.dolmetscher.adresse() });
    }
    var knopf = $('btn-live');
    if (knopf) {
      knopf.hidden = false;
      knopf.addEventListener('click', function () {
        if (dolmLaeuft) dolmStoppen(); else dolmStarten();
      });
    }
  }

  /* Beim Beenden des Interviews auch das Mikrofon schliessen */
  if ($('btn-end')) $('btn-end').addEventListener('click', dolmStoppen);
  w.addEventListener('pagehide', dolmStoppen);

  /* ---------- Beispielgespraech ---------- */
  var gespraech = [
    { seite: 'arbeitgeber',
      de: SP.t('Guten Tag, Herr Tudose. Ich bin Thomas Becker von der Musterbau AG. Schön, dass wir uns heute kennenlernen.'),
      ro: SP.t('Buna ziua, domnule Tudose. Sunt Thomas Becker de la Musterbau AG. Ma bucur ca ne cunoastem astazi.') },
    { seite: 'bewerber',
      ro: SP.t('Buna ziua, domnule Becker. Si eu ma bucur. Am auzit multe lucruri bune despre Musterbau AG.'),
      de: SP.t('Guten Tag, Herr Becker. Ich freue mich ebenfalls. Ich habe viel Gutes über die Musterbau AG gehört.') },
    { seite: 'arbeitgeber',
      de: SP.t('Sie haben acht Jahre Erfahrung als Polier. Erzählen Sie mir von einem Projekt, auf das Sie besonders stolz sind.'),
      ro: SP.t('Aveti opt ani de experienta ca maistru. Povestiti-mi despre un proiect de care sunteti deosebit de mandru.') },
    { seite: 'bewerber',
      ro: SP.t('Cel mai mare proiect a fost un complex rezidential de 18 etaje in Cluj-Napoca. Am coordonat 45 de muncitori si am terminat cu trei saptamani mai devreme.'),
      de: SP.t('Mein größtes Projekt war ein 18-stöckiger Wohnkomplex in Cluj-Napoca. Ich habe 45 Mitarbeitende geführt und drei Wochen früher fertiggestellt.') },
    { seite: 'arbeitgeber',
      de: SP.t('Beeindruckend. Wie gehen Sie mit Arbeitssicherheit auf der Baustelle um? Das hat bei uns höchste Priorität.'),
      ro: SP.t('Impresionant. Cum abordati siguranta pe santier? Pentru noi aceasta are prioritate absoluta.') },
    { seite: 'bewerber',
      ro: SP.t('Siguranta este pe primul loc. Am introdus protocoale stricte pe toate santierele mele: zero accidente in opt ani. Detin si certificarea IOSH.'),
      de: SP.t('Sicherheit steht an erster Stelle. Ich habe auf allen Baustellen strenge Vorgaben eingeführt: null Unfälle in acht Jahren. Ich habe zudem die IOSH-Zertifizierung.') },
    { seite: 'arbeitgeber',
      de: SP.t('Sehr gut. Abschließend: Welche Gehaltsvorstellung haben Sie für diese Position in München?'),
      ro: SP.t('Foarte bine. In final: ce asteptari salariale aveti pentru aceasta pozitie in München?') },
    { seite: 'bewerber',
      ro: SP.t('Pe baza experientei mele si a pietei germane, ma astept la 3.200 pana la 3.500 euro net pe luna.'),
      de: SP.t('Auf Basis meiner Erfahrung und des deutschen Marktes erwarte ich 3.200 bis 3.500 Euro netto monatlich.') }
  ];

  var protokoll = [
    SP.t('Begrüßung: sachlicher, professioneller Ton auf beiden Seiten.'),
    SP.t('Referenz bestätigt: Wohnkomplex mit 18 Geschossen, 45 Mitarbeitende, drei Wochen vor Termin.'),
    SP.t('Arbeitssicherheit: IOSH-Zertifikat, acht Jahre ohne meldepflichtigen Unfall.'),
    SP.t('Gehalt: Vorstellung 3.200 bis 3.500 Euro netto, liegt im Rahmen der Stelle.'),
    SP.t('Empfehlung: Zweitgespräch mit der Bauleitung vereinbaren.')
  ];
  var bewertung = [
    { komm: SP.t('gut') },
    { fach: SP.t('sehr gut') },
    { sich: SP.t('sehr gut') },
    { ges: SP.t('Empfehlung für Zweitgespräch') }
  ];

  var idx = 0, demoLaeuft = false;
  $('btn-demo').addEventListener('click', function () {
    if (demoLaeuft) return;
    demoLaeuft = true;
    idx = 0;
    naechste();
  });

  function naechste() {
    if (idx >= gespraech.length) {
      demoLaeuft = false;
      SP.toast('ok', SP.t('Gespräch beendet'), SP.t('Protokoll und Einschätzung stehen in der Seitenleiste.'));
      return;
    }
    var e = gespraech[idx];
    var ag = e.seite === 'arbeitgeber';
    zeigeNachricht(e.seite, ag ? e.de : e.ro, ag ? e.ro : e.de,
      ag ? [SP.t('Deutsch (Original)'), SP.t('Rumänisch')] : [SP.t('Rumänisch (Original)'), SP.t('Deutsch')]);

    if (einwilligung.protokoll) {
      var stufe = Math.floor(idx / 2);
      if (protokoll[stufe]) ergaenzeProtokoll(stufe);
      if (bewertung[stufe]) setzeBewertung(bewertung[stufe]);
    }
    idx++;
    setTimeout(naechste, 3200);
  }

  var gezeigt = {};
  function ergaenzeProtokoll(i) {
    if (gezeigt[i]) return;
    gezeigt[i] = true;
    var box = $('notizen');
    if (!box.getAttribute('data-bereit')) { box.replaceChildren(); box.setAttribute('data-bereit', '1'); }
    var p = SP.el('p', 'small t-w80 mb8');
    p.appendChild(SP.icon('check', 'ic-sm'));
    p.appendChild(d.createTextNode(' ' + protokoll[i]));
    box.appendChild(p);
  }
  function setzeBewertung(b) {
    if (b.komm) $('ev-komm').textContent = b.komm;
    if (b.fach) $('ev-fach').textContent = b.fach;
    if (b.sich) $('ev-sich').textContent = b.sich;
    if (b.ges) $('ev-ges').textContent = b.ges;
  }

  /* ---------- Eigene Nachricht ---------- */
  $('form-msg').addEventListener('submit', function (e) {
    e.preventDefault();
    var feld = $('msg');
    var text = SP.clean(feld.value, 500);
    if (!text) return;
    feld.value = '';
    var seite = rolle === 'arbeitgeber' ? 'arbeitgeber' : 'bewerber';
    var ag = seite === 'arbeitgeber';
    zeigeNachricht(seite, text, SP.t('[Übersetzung] {text}', { text: text }),
      ag ? [SP.t('Deutsch (Original)'), SP.t('Rumänisch')] : [SP.t('Rumänisch (Original)'), SP.t('Deutsch')]);
  });

  /* ---------- Bedienelemente ---------- */
  function schalte(btn, anIcon, ausIcon, anText, ausText) {
    var an = btn.getAttribute('aria-pressed') === 'true';
    an = !an;
    btn.setAttribute('aria-pressed', String(an));
    btn.classList.toggle('on', an);
    btn.classList.toggle('off', !an);
    btn.replaceChildren(SP.icon(an ? anIcon : ausIcon));
    SP.toast('info', an ? anText : ausText, '');
  }
  $('btn-cam').addEventListener('click', function () {
    schalte(this, 'camera', 'cameraoff', SP.t('Kamera aktiv'), SP.t('Kamera aus'));
  });
  $('btn-mic').addEventListener('click', function () {
    schalte(this, 'mic', 'micoff', SP.t('Mikrofon aktiv'), SP.t('Mikrofon stumm'));
  });
  $('btn-screen').addEventListener('click', function () {
    SP.toast('info', SP.t('Bildschirm teilen'),
      SP.t('Freigegeben wird immer nur ein einzelnes Fenster, niemals der gesamte Bildschirm.'));
  });
  $('btn-users').addEventListener('click', function () {
    SP.toast('info', SP.t('Zwei Teilnehmende'), SP.t('Weitere Personen können nur mit Zustimmung beider Seiten beitreten.'));
  });
  $('btn-info').addEventListener('click', function () {
    SP.toast('info', SP.t('Sicherheit dieses Gesprächs'),
      SP.t('Medienströme sind Ende-zu-Ende verschlüsselt. Die Übersetzung läuft auf EU-Servern und wird nicht dauerhaft gespeichert.'));
  });
  $('btn-rec').addEventListener('click', function () {
    if (!einwilligung.aufzeichnung) {
      SP.toast('err', SP.t('Aufzeichnung nicht möglich'),
        SP.t('Beide Seiten müssen vor Beginn zustimmen. Die Zustimmung liegt nicht vor.'));
      SP.audit('Aufzeichnung abgelehnt', 'keine Einwilligung');
      return;
    }
    var an = this.getAttribute('aria-pressed') !== 'true';
    this.setAttribute('aria-pressed', String(an));
    this.classList.toggle('off', an);
    $('rec-status').textContent = an ? SP.t('Aufzeichnung läuft') : SP.t('Aufzeichnung angehalten');
    $('rec-status').className = an ? 'tag tag-err' : 'tag tag-warn';
    SP.audit(an ? 'Aufzeichnung gestartet' : 'Aufzeichnung angehalten', 'mit Einwilligung');
  });
  $('clear').addEventListener('click', function () {
    msgs.replaceChildren(SP.el('p', 'small t-w50 t-c', SP.t('Verlauf gelöscht.')));
    ersteNachricht = true;
    SP.audit('Übersetzungsverlauf gelöscht', 'durch Nutzeraktion');
  });
  $('btn-end').addEventListener('click', function () {
    clearInterval(timerId);
    SP.audit('Interview beendet', 'Dauer: ' + sekunden + ' Sekunden');
    w.location.href = 'standardplus-dashboard.html';
  });

})(window, document);
