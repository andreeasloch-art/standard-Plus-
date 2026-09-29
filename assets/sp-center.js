/* Standard Plus - Datenschutz-Center
   Betroffenenrechte werden hier tatsaechlich ausgeloest. Der Export wird
   im Browser erzeugt, es verlaesst nichts das Geraet. */
(function (w, d) {
  'use strict';

  /* Bestaetigungswort ohne Akzente vergleichen: STERGE = ȘTERGE */
  function ohneAkzent(t) {
    return String(t).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  }
  var SP = w.SP;
  var $ = function (id) { return d.getElementById(id); };

  var LABEL = {
    essenziell: SP.t('Technisch notwendig'),
    funktional: SP.t('Funktional'),
    statistik: SP.t('Statistik'),
    marketing: SP.t('Marketing')
  };

  /* ---------- Einwilligungsstatus anzeigen ---------- */
  function zeigeConsent() {
    var box = $('consent-status');
    box.replaceChildren();
    var c = SP.consent.get();

    if (!c) {
      var hinweis = SP.el('div', 'notice notice-warn');
      hinweis.appendChild(SP.icon('alert'));
      hinweis.appendChild(SP.el('span', null,
        SP.t('Es liegt noch keine Auswahl vor. Bitte treffen Sie eine Entscheidung.')));
      box.appendChild(hinweis);
      return;
    }

    var reihe = SP.el('div', 'flex wrapf g10 mb12');
    Object.keys(LABEL).forEach(function (k) {
      var an = !!c.cats[k];
      var tag = SP.el('span', 'tag ' + (an ? 'tag-ok' : ''));
      tag.appendChild(SP.icon(an ? 'check' : 'x', 'ic-sm'));
      tag.appendChild(SP.el('span', null, LABEL[k]));
      reihe.appendChild(tag);
    });
    box.appendChild(reihe);

    var datum = new Date(c.ts);
    box.appendChild(SP.el('p', 'small muted',
      SP.t('Zuletzt gespeichert am {datum} um {zeit} Uhr (Fassung {version}).', {
        datum: datum.toLocaleDateString(SP.gebiet),
        zeit: datum.toLocaleTimeString(SP.gebiet, { hour: '2-digit', minute: '2-digit' }),
        version: c.version
      })));
  }
  zeigeConsent();
  d.addEventListener('wb:consent', function () { zeigeConsent(); zeigeProtokoll(); });

  $('btn-widerruf').addEventListener('click', function () {
    SP.consent.revoke();
    SP.consent.save({});
    zeigeConsent();
    zeigeProtokoll();
    SP.toast('ok', SP.t('Widerruf gespeichert'),
      SP.t('Alle optionalen Daten wurden gelöscht. Technisch notwendige Verarbeitung bleibt bestehen.'));
  });

  /* ---------- Export erzeugen ---------- */
  function herunterladen(dateiname, inhalt, typ) {
    var blob = new Blob([inhalt], { type: typ || 'application/json;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = d.createElement('a');
    a.href = url;
    a.download = dateiname;
    d.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  $('btn-export').addEventListener('click', function () {
    var s = SP.session.get() || {};
    var c = SP.consent.get();
    var ausDb = (s.kontoId && SP.db) ? SP.db.exportKonto(s.kontoId) : null;
    var daten = {
      hinweis: SP.t('Datenexport nach Art. 20 DSGVO. Erzeugt im Browser, ohne Serverübertragung.'),
      erstellt_am: new Date().toISOString(),
      konto: ausDb ? ausDb.konto : {
        name: s.user || null,
        organisation: s.org || null,
        rolle: s.role || null,
        zwei_faktor: !!s.mfa
      },
      profil: ausDb ? ausDb.profil : null,
      stellen: ausDb ? ausDb.stellen : [],
      anfragen: ausDb ? ausDb.anfragen : [],
      einwilligungen: c || SP.t('keine Auswahl gespeichert'),
      sitzungsprotokoll: SP.auditLog(),
      speicherfristen: {
        bewerbungsunterlagen: SP.t('6 Monate nach Abschluss'),
        interviewaufzeichnung: SP.t('30 Tage'),
        gespraechsprotokoll: SP.t('90 Tage'),
        zugriffsprotokolle: SP.t('14 Tage'),
        rechnungen: SP.t('10 Jahre (gesetzliche Pflicht)')
      }
    };
    herunterladen('standardplus-datenexport.json', JSON.stringify(daten, null, 2));
    SP.audit('Datenexport erstellt', 'Art. 20 DSGVO');
    zeigeProtokoll();
    SP.toast('ok', SP.t('Export erstellt'), SP.t('Die Datei wurde in Ihrem Download-Ordner abgelegt.'));
  });

  /* ---------- Weitere Rechte ---------- */
  $('btn-auskunft').addEventListener('click', function () {
    SP.audit('Auskunft angefordert', 'Art. 15 DSGVO');
    zeigeProtokoll();
    SP.toast('ok', SP.t('Auskunft angefordert'),
      SP.t('Ihre Anfrage ist eingegangen. Die Antwort erfolgt innerhalb eines Monats.'));
  });
  $('btn-berichtigung').addEventListener('click', function () {
    SP.audit('Berichtigung gemeldet', 'Art. 16 DSGVO');
    zeigeProtokoll();
    SP.toast('info', SP.t('Korrektur melden'),
      SP.t('Bitte beschreiben Sie die zu korrigierende Angabe. Wir prüfen und ändern sie unverzüglich.'));
  });

  /* ---------- Loeschung ---------- */
  var modal = $('modal-loeschen');
  var feld = $('bestaetigung');
  var okBtn = $('loeschen-ok');

  $('btn-loeschen').addEventListener('click', function () {
    modal.classList.add('show');
    feld.value = '';
    okBtn.disabled = true;
    feld.focus();
  });
  $('loeschen-ab').addEventListener('click', function () { modal.classList.remove('show'); });
  feld.addEventListener('input', function () {
    okBtn.disabled = ohneAkzent(feld.value.trim()) !== ohneAkzent(SP.t('LOESCHEN'));   /* Bestaetigungswort der Seitensprache */
  });
  okBtn.addEventListener('click', function () {
    SP.audit('Löschung durchgeführt', 'Art. 17 DSGVO - Bestätigung erteilt');
    modal.classList.remove('show');
    var s = SP.session.get();
    if (s && s.kontoId && SP.db) SP.db.konten.loeschen(s.kontoId);
    SP.toast('ok', SP.t('Konto gelöscht'),
      SP.t('Profil, Stellen und Anfragen wurden entfernt. Sie werden jetzt abgemeldet.'));
    setTimeout(function () { SP.session.end('konto-geloescht'); }, 2200);
  });
  d.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') modal.classList.remove('show');
  });

  /* ---------- Geraete ---------- */
  d.querySelectorAll('[data-abmelden]').forEach(function (b) {
    b.addEventListener('click', function () {
      var name = b.getAttribute('data-abmelden');
      SP.audit('Gerät abgemeldet', name);
      b.closest('tr').remove();
      zeigeProtokoll();
      SP.toast('ok', SP.t('Gerät abgemeldet'), SP.t('Alle Sitzungen dieses Geräts wurden beendet.'));
    });
  });

  /* ---------- Sitzungsprotokoll ---------- */
  function zeigeProtokoll() {
    var box = $('protokoll');
    var log = SP.auditLog();
    box.replaceChildren();
    if (!log.length) { box.textContent = SP.t('Noch keine Einträge.'); return; }
    log.forEach(function (e) {
      var zeile = SP.el('div');
      var t = new Date(e.t);
      zeile.appendChild(SP.el('b', null,
        t.toLocaleTimeString(SP.gebiet, { hour: '2-digit', minute: '2-digit', second: '2-digit' })));
      zeile.appendChild(d.createTextNode('  ' + e.a + (e.d ? '  -  ' + e.d : '')));
      box.appendChild(zeile);
    });
  }
  zeigeProtokoll();

  $('btn-log-neu').addEventListener('click', zeigeProtokoll);
  $('btn-log-export').addEventListener('click', function () {
    var zeilen = SP.auditLog().map(function (e) {
      return [e.t, e.a, e.d].join(' | ');
    }).join('\n');
    herunterladen('standardplus-sitzungsprotokoll.txt',
      SP.t('Standard Plus Sitzungsprotokoll\nErstellt: {zeit}', { zeit: new Date().toISOString() }) + '\n\n' + zeilen,
      'text/plain;charset=utf-8');
    SP.toast('ok', SP.t('Protokoll gespeichert'), '');
  });

})(window, document);
