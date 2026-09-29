/* Standard Plus - Profilbearbeitung
   Verbindet das Konto mit Profil, Werdegang, Sprachen, Nachweisen,
   Bildern, Bewertungen, Anfragen und Sperrliste.
   Ausgabe ausschliesslich ueber die DOM-API, kein innerHTML. */
(function (w, d) {
  'use strict';
  var SP = w.SP;
  var $ = function (id) { return d.getElementById(id); };

  var sitzung = SP.session.get();
  if (!sitzung) return;
  var kontoId = sitzung.kontoId;
  var konto = SP.db.konten.byId(kontoId);
  var profil = SP.db.profile.holen(kontoId);

  if (!konto || !profil) {
    SP.toast('err', SP.t('Konto nicht gefunden'),
      SP.t('Bitte melden Sie sich erneut an. Der lokale Datenbestand wurde vermutlich geleert.'));
    setTimeout(function () { SP.session.end('konto-fehlt'); }, 2500);
    return;
  }
  var istAG = konto.rolle === 'arbeitgeber';
  var istTR = konto.rolle === 'transport';

  if (new URLSearchParams(w.location.search).get('neu')) $('willkommen').classList.remove('hidden');
  $('oeffentlich').href = 'standardplus-profil-ansicht.html?id=' + encodeURIComponent(kontoId);

  /* ---------- Kopfkarte ---------- */
  function kopf() {
    profil = SP.db.profile.holen(kontoId);
    $('anzeigename').textContent = SP.db.profile.vollerName(profil) || konto.name;
    $('rollentext').textContent = istAG ? SP.t('Arbeitgeberkonto') : SP.t('Arbeitnehmerkonto');
    $('angelegt').textContent = new Date(konto.angelegt).toLocaleDateString(SP.gebiet);
    d.querySelectorAll('[data-initials]').forEach(function (x) {
      x.textContent = SP.initials(SP.db.profile.anzeigename(profil) || konto.name);
    });
    $('ava').className = 'ava ava-lg' + (istAG ? ' gold' : '');
    var q = SP.db.profile.vollstaendig(profil);
    $('quote').textContent = q + ' %';
    $('quote-bar').className = 'bar-f pct-' + q + (istAG ? ' gold' : '');

    var marken = $('kopf-marken');
    marken.replaceChildren();
    var schnitt = SP.db.bewertungen.schnitt(kontoId);
    if (schnitt) {
      var s = SP.el('span', 'sterne');
      for (var i = 1; i <= 5; i++) s.appendChild(SP.icon('star', i <= Math.round(schnitt.wert) ? 'voll' : ''));
      s.appendChild(SP.el('span', 'sterne-wert', schnitt.wert.toFixed(1).replace('.', ',')));
      s.appendChild(SP.el('span', 'sterne-anzahl', '(' + schnitt.anzahl + ')'));
      marken.appendChild(s);
    }
    var gepr = (profil.nachweise || []).filter(function (n) { return n.geprueft; }).length;
    if (gepr) marken.appendChild(SP.el('span', 'tag tag-ok', SP.anzahl(gepr, '{n} geprüfter Nachweis', '{n} geprüfte Nachweise')));
    if (!istAG) {
      marken.appendChild(SP.el('span', profil.sichtbar ? 'tag tag-teal' : 'tag tag-warn',
        profil.sichtbar ? SP.t('in der Suche sichtbar') : SP.t('nicht auffindbar')));
    }
  }

  /* ---------- Formular Arbeitnehmer ---------- */
  if (!istAG) {
    var anF = ['vorname', 'nachname', 'geburtsjahr', 'staat', 'ort', 'beruf', 'branche',
               'land', 'zielland', 'erfahrung', 'deutsch', 'gehalt', 'verfuegbar',
               'fuehrerschein', 'telefon', 'uebermich'];
    var anMap = { staat: 'staatsangehoerigkeit', uebermich: 'ueberMich' };
    anF.forEach(function (f) {
      var el = $('an-' + f);
      if (el) el.value = profil[anMap[f] || f] || '';
    });
    $('an-faehigkeiten').value = (profil.faehigkeiten || []).join(', ');
    $('an-sichtbar').checked = profil.sichtbar !== false;
    $('an-umzug').checked = profil.umzugsbereit !== false;

    $('form-an').addEventListener('submit', function (e) {
      e.preventDefault();
      var daten = {};
      anF.forEach(function (f) { daten[anMap[f] || f] = SP.clean($('an-' + f).value, 800); });
      daten.faehigkeiten = SP.clean($('an-faehigkeiten').value, 200)
        .split(',').map(function (s) { return s.trim(); }).filter(Boolean).slice(0, 12);
      daten.sichtbar = $('an-sichtbar').checked;
      daten.umzugsbereit = $('an-umzug').checked;
      if (!daten.vorname || !daten.beruf) {
        SP.toast('warn', SP.t('Angaben unvollständig'), SP.t('Vorname und Beruf werden benötigt.'));
        return;
      }
      SP.db.profile.speichern(kontoId, daten);
      kopf();
      SP.toast('ok', SP.t('Gespeichert'), daten.sichtbar
        ? SP.t('Sie erscheinen pseudonymisiert in der Suche.')
        : SP.t('Ihr Profil ist für Unternehmen ausgeblendet.'));
    });

    /* Werdegang */
    $('form-station').addEventListener('submit', function (e) {
      e.preventDefault();
      var ag = SP.clean($('st-arbeitgeber').value, 100);
      var pos = SP.clean($('st-position').value, 100);
      if (!ag || !pos) {
        SP.toast('warn', SP.t('Angaben fehlen'), SP.t('Arbeitgeber und Position werden benötigt.'));
        return;
      }
      SP.db.stationen.hinzufuegen(kontoId, {
        arbeitgeber: ag, position: pos, ort: $('st-ort').value, land: $('st-land').value,
        von: $('st-von').value, bis: $('st-bis').value, taetigkeit: $('st-taetigkeit').value
      });
      $('form-station').reset();
      stationenZeichnen(); kopf();
      SP.toast('ok', SP.t('Station gespeichert'), SP.t('Sie erscheint jetzt im Werdegang.'));
    });
  }

  function stationenZeichnen() {
    var box = $('stationen-liste');
    if (!box) return;
    profil = SP.db.profile.holen(kontoId);
    var liste = profil.stationen || [];
    box.replaceChildren();
    if (!liste.length) {
      box.appendChild(SP.el('p', 'leerhinweis', SP.t('Noch keine Station hinterlegt.')));
      return;
    }
    var ul = SP.el('ul', 'werdegang');
    liste.forEach(function (st) {
      var li = SP.el('li');
      li.appendChild(SP.el('span', 'zeit', [st.von, SP.tInhalt(st.bis)].filter(Boolean).join(' ' + SP.t('bis') + ' ')));
      li.appendChild(SP.el('h4', null, SP.tInhalt(st.position)));
      li.appendChild(SP.el('p', 'firma',
        [st.arbeitgeber, SP.tInhalt(st.ort), st.land].filter(Boolean).join(' · ')));
      if (st.taetigkeit) li.appendChild(SP.el('p', null, SP.tInhalt(st.taetigkeit)));
      var weg = SP.el('button', 'card-link mt8', SP.t('Entfernen'));
      weg.type = 'button';
      weg.addEventListener('click', function () {
        SP.db.stationen.entfernen(kontoId, st.id);
        stationenZeichnen(); kopf();
      });
      li.appendChild(weg);
      ul.appendChild(li);
    });
    box.appendChild(ul);
  }

  /* ---------- Formular Arbeitgeber ---------- */
  if (istAG) {
    var agF = ['firma', 'rechtsform', 'branche', 'ort', 'gegruendet', 'groesse',
               'ansprech', 'position', 'telefon', 'beschreibung'];
    var agMap = { ansprech: 'ansprechperson' };
    agF.forEach(function (f) {
      var el = $('ag-' + f);
      if (el) el.value = profil[agMap[f] || f] || '';
    });
    $('ag-leistungen').value = (profil.leistungen || []).join('\n');
    $('ag-standorte').value = (profil.standorte || []).map(function (o) { return o.ort; }).join(', ');

    $('form-ag').addEventListener('submit', function (e) {
      e.preventDefault();
      var daten = {};
      agF.forEach(function (f) { daten[agMap[f] || f] = SP.clean($('ag-' + f).value, 800); });
      daten.leistungen = SP.clean($('ag-leistungen').value, 600)
        .split('\n').map(function (s) { return s.trim(); }).filter(Boolean).slice(0, 10);
      daten.standorte = SP.clean($('ag-standorte').value, 200)
        .split(',').map(function (s) { return s.trim(); }).filter(Boolean)
        .slice(0, 8).map(function (o) { return { ort: o, land: profil.land || 'DE' }; });
      if (!daten.firma) {
        SP.toast('warn', SP.t('Angaben unvollständig'), SP.t('Der Firmenname wird benötigt.'));
        return;
      }
      SP.db.profile.speichern(kontoId, daten);
      kopf();
      SP.toast('ok', SP.t('Gespeichert'), SP.t('Ihre Unternehmensangaben sind aktualisiert.'));
    });

    $('form-stelle').addEventListener('submit', function (e) {
      e.preventDefault();
      var titel = SP.clean($('stx-titel').value, 120);
      if (!titel) { SP.toast('warn', SP.t('Titel fehlt'), SP.t('Bitte geben Sie eine Stellenbezeichnung an.')); return; }
      SP.db.stellen.anlegen(kontoId, {
        titel: titel, branche: $('stx-branche').value, ort: $('stx-ort').value,
        verguetung: $('stx-verguetung').value, beschreibung: $('stx-text').value
      });
      $('form-stelle').reset();
      stellenZeichnen();
      SP.toast('ok', SP.t('Stelle veröffentlicht'), SP.t('Sie erscheint jetzt in Ihrem Profil.'));
    });

    $('bilder-titel').textContent = SP.t('Bilder vom Arbeitsplatz');
    $('bilder-text').textContent = SP.t('Zeigen Sie, wie es bei Ihnen aussieht. Bitte keine Personen ohne deren Einverständnis abbilden.');
  }

  function stellenZeichnen() {
    var box = $('stellen-liste');
    if (!box) return;
    var liste = SP.db.stellen.vonArbeitgeber(kontoId);
    box.replaceChildren();
    if (!liste.length) {
      box.appendChild(SP.el('p', 'leerhinweis', SP.t('Noch keine Stelle ausgeschrieben.')));
      return;
    }
    liste.forEach(function (s) {
      var reihe = SP.el('div', 'lrow');
      var ic = SP.el('span', 'act-ic gold');
      ic.appendChild(SP.icon('briefcase', 'ic-sm'));
      reihe.appendChild(ic);
      var mitte = SP.el('span', 'lrow-main');
      mitte.appendChild(SP.el('strong', null, SP.tInhalt(s.titel)));
      mitte.appendChild(SP.el('span', null,
        [SP.db.BRANCHEN[s.branche] || s.branche, SP.tInhalt(s.ort), SP.tInhalt(s.verguetung)].filter(Boolean).join(' · ')));
      reihe.appendChild(mitte);
      var ende = SP.el('span', 'lrow-end');
      ende.appendChild(SP.el('span', 'tag ' + (s.offen ? 'tag-ok' : ''), s.offen ? SP.t('offen') : SP.t('geschlossen')));
      if (s.offen) {
        var zu = SP.el('button', 'btn btn-outline btn-sm', SP.t('Schließen'));
        zu.type = 'button';
        zu.addEventListener('click', function () {
          SP.db.stellen.schliessen(s.id); stellenZeichnen();
          SP.toast('ok', SP.t('Stelle geschlossen'), '');
        });
        ende.appendChild(zu);
      }
      reihe.appendChild(ende);
      box.appendChild(reihe);
    });
  }

  /* ---------- Sprachen ---------- */
  function sprachenZeichnen() {
    var box = $('sprachen-liste');
    profil = SP.db.profile.holen(kontoId);
    var liste = profil.sprachen || [];
    box.replaceChildren();
    if (!liste.length) {
      box.appendChild(SP.el('p', 'leerhinweis', SP.t('Noch keine Sprache hinterlegt.')));
      return;
    }
    liste.forEach(function (sp, i) {
      var reihe = SP.el('div', 'lrow');
      var ic = SP.el('span', 'act-ic');
      ic.appendChild(SP.icon('translate', 'ic-sm'));
      reihe.appendChild(ic);
      var mitte = SP.el('span', 'lrow-main');
      mitte.appendChild(SP.el('strong', null, SP.tInhalt(sp.sprache)));
      mitte.appendChild(SP.el('span', null, SP.t('Niveau {stufe}', { stufe: SP.tInhalt(sp.niveau) })));
      reihe.appendChild(mitte);
      var ende = SP.el('span', 'lrow-end');
      var weg = SP.el('button', 'btn btn-outline btn-sm', SP.t('Entfernen'));
      weg.type = 'button';
      weg.addEventListener('click', function () {
        var neu = liste.slice(); neu.splice(i, 1);
        SP.db.sprachen.setzen(kontoId, neu);
        sprachenZeichnen(); kopf();
      });
      ende.appendChild(weg);
      reihe.appendChild(ende);
      box.appendChild(reihe);
    });
  }
  $('form-sprache').addEventListener('submit', function (e) {
    e.preventDefault();
    var name = SP.clean($('spr-name').value, 40);
    if (!name) { SP.toast('warn', SP.t('Sprache fehlt'), SP.t('Bitte geben Sie eine Sprache an.')); return; }
    profil = SP.db.profile.holen(kontoId);
    var liste = (profil.sprachen || []).slice();
    liste.push({ sprache: name, niveau: $('spr-niveau').value });
    SP.db.sprachen.setzen(kontoId, liste);
    $('spr-name').value = '';
    sprachenZeichnen(); kopf();
    SP.toast('ok', SP.t('Sprache hinzugefügt'), name + ' · ' + $('spr-niveau').value);
  });

  /* ---------- Dateien lesen ---------- */
  function alsDatenUrl(datei) {
    return new Promise(function (fertig, fehler) {
      var leser = new FileReader();
      leser.onload = function () { fertig(leser.result); };
      leser.onerror = function () { fehler(new Error(SP.t('Datei konnte nicht gelesen werden.'))); };
      leser.readAsDataURL(datei);
    });
  }
  /* Bilder werden verkleinert, damit der lokale Speicher reicht.
     Bewusst ueber eine Data-URL statt ueber URL.createObjectURL: die
     Content-Security-Policy erlaubt bei img-src nur 'self' und data:,
     blob: waere blockiert. */
  function bildVerkleinern(datei, maxKante) {
    return alsDatenUrl(datei).then(function (quelle) {
      return new Promise(function (fertig, fehler) {
        var bild = new Image();
        bild.onload = function () {
          var faktor = Math.min(1, maxKante / Math.max(bild.width, bild.height));
          var c = d.createElement('canvas');
          c.width = Math.round(bild.width * faktor);
          c.height = Math.round(bild.height * faktor);
          c.getContext('2d').drawImage(bild, 0, 0, c.width, c.height);
          fertig(c.toDataURL('image/jpeg', 0.72));
        };
        bild.onerror = function () { fehler(new Error(SP.t('Kein gültiges Bild.'))); };
        bild.src = quelle;
      });
    });
  }

  /* ---------- Nachweise ---------- */
  function nachweiseZeichnen() {
    var box = $('nachweise-liste');
    profil = SP.db.profile.holen(kontoId);
    var liste = profil.nachweise || [];
    box.replaceChildren();
    if (!liste.length) {
      box.appendChild(SP.el('p', 'leerhinweis', SP.t('Noch keine Nachweise hinterlegt.')));
      return;
    }
    liste.forEach(function (n) {
      var reihe = SP.el('div', 'dok');
      reihe.appendChild(SP.icon('doc', 'ic-lg'));
      var info = SP.el('div', 'dok-info');
      info.appendChild(SP.el('strong', null, SP.tInhalt(n.titel)));
      var groesse = n.groesse ? (n.groesse > 1048576
        ? SP.zahl(n.groesse / 1048576, 1) + ' MB' : Math.round(n.groesse / 1024) + ' KB') : '';
      info.appendChild(SP.el('span', null,
        [SP.db.ARTEN[n.art] || SP.t('Nachweis'), n.dateiname, groesse].filter(Boolean).join(' · ')));
      reihe.appendChild(info);
      var ende = SP.el('span', 'dok-aktion flex g8 ai-c');
      ende.appendChild(SP.el('span', n.geprueft ? 'tag tag-ok' : 'tag tag-warn',
        n.geprueft ? SP.t('geprüft') : SP.t('wird geprüft')));
      var weg = SP.el('button', 'btn btn-outline btn-sm', SP.t('Entfernen'));
      weg.type = 'button';
      weg.addEventListener('click', function () {
        SP.db.dateien.entfernenNachweis(kontoId, n.id);
        nachweiseZeichnen(); kopf();
        SP.toast('ok', SP.t('Nachweis entfernt'), '');
      });
      ende.appendChild(weg);
      reihe.appendChild(ende);
      box.appendChild(reihe);
    });
  }

  $('form-nachweis').addEventListener('submit', function (e) {
    e.preventDefault();
    var titel = SP.clean($('nw-titel').value, 120);
    var datei = $('nw-datei').files[0];
    if (!titel) { SP.toast('warn', SP.t('Bezeichnung fehlt'), SP.t('Bitte benennen Sie den Nachweis.')); return; }
    if (!datei) { SP.toast('warn', SP.t('Keine Datei'), SP.t('Bitte wählen Sie eine Datei aus.')); return; }
    /* Nur PDF und Bilder - die Endung allein reicht nicht, der Typ wird mitgeprueft */
    if (!/^(application\/pdf|image\/(png|jpeg|webp))$/.test(datei.type) ||
        !/\.(pdf|png|jpe?g|webp)$/i.test(datei.name)) {
      SP.toast('warn', SP.t('Dateityp nicht erlaubt'), SP.t('Erlaubt sind PDF, JPG, PNG und WebP.'));
      return;
    }

    var eintrag = {
      titel: titel, art: $('nw-art').value, dateiname: SP.clean(datei.name, 120),
      typ: datei.type, groesse: datei.size, inhalt: null
    };

    var weiter = datei.size <= SP.db.dateien.MAX_DOK
      ? alsDatenUrl(datei).then(function (url) { eintrag.inhalt = url; })
      : Promise.resolve();

    weiter.then(function () {
      SP.db.dateien.hinzufuegenNachweis(kontoId, eintrag);
      $('form-nachweis').reset();
      nachweiseZeichnen(); kopf();
      SP.toast('ok', SP.t('Nachweis hinzugefügt'), eintrag.inhalt
        ? SP.t('Die Datei wurde lokal gespeichert.')
        : SP.t('Die Datei ist größer als 500 KB. Im Prototyp wurde nur der Eintrag angelegt.'));
    }).catch(function (f) {
      SP.toast('err', SP.t('Fehler beim Lesen'), f.message);
    });
  });

  /* ---------- Bilder ---------- */
  function bilderZeichnen() {
    var box = $('bilder-liste');
    profil = SP.db.profile.holen(kontoId);
    var liste = profil.bilder || [];
    box.replaceChildren();
    if (!liste.length) {
      box.appendChild(SP.el('p', 'leerhinweis', SP.t('Noch keine Bilder hinterlegt.')));
      return;
    }
    var g = SP.el('div', 'galerie');
    liste.forEach(function (b) {
      var fig = SP.el('figure');
      var img = d.createElement('img');
      img.src = b.inhalt;
      img.alt = b.titel || SP.t('Bild');
      fig.appendChild(img);
      if (b.titel) fig.appendChild(SP.el('figcaption', null, SP.tInhalt(b.titel)));
      var weg = SP.el('button', 'weg');
      weg.type = 'button';
      weg.setAttribute('aria-label', SP.t('Bild entfernen'));
      weg.appendChild(SP.icon('trash', 'ic-sm'));
      weg.addEventListener('click', function () {
        SP.db.dateien.entfernenBild(kontoId, b.id);
        bilderZeichnen();
        SP.toast('ok', SP.t('Bild entfernt'), '');
      });
      fig.appendChild(weg);
      g.appendChild(fig);
    });
    box.appendChild(g);
  }

  $('form-bild').addEventListener('submit', function (e) {
    e.preventDefault();
    var datei = $('bi-datei').files[0];
    if (!datei) { SP.toast('warn', SP.t('Kein Bild'), SP.t('Bitte wählen Sie ein Bild aus.')); return; }
    bildVerkleinern(datei, 900).then(function (url) {
      SP.db.dateien.hinzufuegenBild(kontoId, { titel: $('bi-titel').value, inhalt: url });
      $('form-bild').reset();
      bilderZeichnen();
      SP.toast('ok', SP.t('Bild hinzugefügt'), SP.t('Es wurde verkleinert gespeichert.'));
    }).catch(function (f) {
      SP.toast('err', SP.t('Fehler'), f.message);
    });
  });

  /* ---------- Erhaltene Bewertungen ---------- */
  function bewertungenZeichnen() {
    var box = $('bewertungen-liste');
    var liste = SP.db.bewertungen.fuerKonto(kontoId);
    box.replaceChildren();
    if (!liste.length) {
      box.appendChild(SP.el('p', 'leerhinweis', SP.t('Noch keine Bewertungen erhalten.')));
      return;
    }
    liste.forEach(function (b) {
      var karte = SP.el('div', 'bewertung');
      var k = SP.el('div', 'bewertung-kopf');
      var s = SP.el('span', 'sterne');
      for (var i = 1; i <= 5; i++) s.appendChild(SP.icon('star', i <= b.sterne ? 'voll' : ''));
      k.appendChild(s);
      if (b.taetigkeit) k.appendChild(SP.el('span', 'tag', SP.tInhalt(b.taetigkeit)));
      if (b.zeitraum) k.appendChild(SP.el('span', 'tiny muted', SP.tInhalt(b.zeitraum)));
      karte.appendChild(k);
      if (b.text) karte.appendChild(SP.el('p', null, SP.tInhalt(b.text)));
      karte.appendChild(SP.el('p', 'quelle mt8',
        SP.t('Von {name}', { name: SP.db.profile.anzeigename(SP.db.profile.holen(b.vonId)) || SP.t('einem Konto') }) +
        ' · ' + new Date(b.datum).toLocaleDateString(SP.gebiet)));
      box.appendChild(karte);
    });
  }

  /* ---------- Anfragen ---------- */
  function anfragenZeichnen() {
    var box = $('anfragen');
    var liste = SP.db.anfragen.fuerKonto(kontoId);
    box.replaceChildren();

    if (!liste.length) {
      var leer = SP.el('div', 'notice notice-info');
      leer.appendChild(SP.icon('info'));
      leer.appendChild(SP.el('span', null, istAG
        ? SP.t('Noch keine Anfragen. Stellen Sie eine Anfrage über die Talentübersicht.')
        : SP.t('Noch keine Anfragen. Unternehmen melden sich, sobald Ihr Profil passt.')));
      box.appendChild(leer);
      return;
    }

    liste.sort(function (a, b) { return b.angelegt.localeCompare(a.angelegt); });

    liste.forEach(function (a) {
      var status = SP.db.anfragen.status(a);
      var gegenId = a.arbeitgeberId === kontoId ? a.arbeitnehmerId : a.arbeitgeberId;
      var gegen = SP.db.profile.holen(gegenId);
      var stelle = a.stelleId ? SP.db.stellen.byId(a.stelleId) : null;

      var karte = SP.el('div', 'card card-pad mb12');
      var kopfz = SP.el('div', 'flex ai-c g12 wrapf mb12');
      var av = SP.el('span', 'ava' + (gegen && gegen.rolle === 'arbeitgeber' ? ' gold' : ''));
      av.appendChild(SP.el('span', null, SP.initials(SP.db.profile.anzeigename(gegen))));
      kopfz.appendChild(av);

      var txt = SP.el('div', 'grow');
      var link = SP.el('a', 'fw7 t-teal', SP.db.profile.anzeigename(gegen) || SP.t('Unbekannt'));
      link.href = 'standardplus-profil-ansicht.html?id=' + encodeURIComponent(gegenId);
      txt.appendChild(link);
      txt.appendChild(SP.el('p', 'small muted', gegen && gegen.rolle === 'arbeitgeber'
        ? [SP.db.BRANCHEN[gegen.branche] || '', SP.tInhalt(gegen.ort)].filter(Boolean).join(' · ')
        : [gegen && gegen.beruf, gegen && gegen.land].filter(Boolean).join(' · ')));
      if (stelle) txt.appendChild(SP.el('p', 'tiny muted', SP.t('Stelle: {titel}', { titel: SP.tInhalt(stelle.titel) })));
      kopfz.appendChild(txt);

      var marke = { offen: ['tag tag-warn', SP.t('wartet auf Freigabe')],
                    beidseitig: ['tag tag-ok', SP.t('beidseitig freigegeben')],
                    abgelehnt: ['tag tag-err', SP.t('abgelehnt')] }[status];
      kopfz.appendChild(SP.el('span', marke[0], marke[1]));
      karte.appendChild(kopfz);

      if (status === 'offen' && !istAG) {
        karte.appendChild(SP.el('p', 'small muted mb12',
          SP.t('Dieses Unternehmen möchte Ihre Kontaktdaten erhalten. Prüfen Sie zuerst das Unternehmensprofil. Erst mit Ihrer Freigabe werden Name, E-Mail-Adresse und Telefonnummer übermittelt.')));
        var reihe = SP.el('div', 'flex g8 wrapf');
        var ja = SP.el('button', 'btn btn-primary btn-sm', SP.t('Freigeben'));
        ja.type = 'button';
        ja.addEventListener('click', function () {
          SP.db.anfragen.entscheiden(a.id, true);
          anfragenZeichnen();
          SP.toast('ok', SP.t('Freigabe erteilt'), SP.t('Die Kontaktdaten wurden ausgetauscht.'));
        });
        var nein = SP.el('button', 'btn btn-outline btn-sm', SP.t('Ablehnen'));
        nein.type = 'button';
        nein.addEventListener('click', function () {
          SP.db.anfragen.entscheiden(a.id, false);
          anfragenZeichnen();
          SP.toast('info', SP.t('Anfrage abgelehnt'), SP.t('Es werden keine Daten übermittelt.'));
        });
        var pruefen = SP.el('a', 'btn btn-outline btn-sm', SP.t('Unternehmen prüfen'));
        pruefen.href = 'standardplus-profil-ansicht.html?id=' + encodeURIComponent(gegenId);
        reihe.appendChild(ja); reihe.appendChild(nein); reihe.appendChild(pruefen);
        karte.appendChild(reihe);
      }

      if (status === 'offen' && istAG) {
        karte.appendChild(SP.el('p', 'small muted',
          SP.t('Ihre Anfrage liegt zur Entscheidung vor. Kontaktdaten erhalten Sie erst nach der Freigabe.')));
      }

      if (status === 'beidseitig') {
        var k = SP.db.anfragen.kontakt(a, kontoId);
        if (k) {
          var kbox = SP.el('div', 'notice notice-ok');
          kbox.appendChild(SP.icon('check'));
          var inhalt = SP.el('span');
          inhalt.appendChild(SP.el('b', null, SP.t('Kontaktdaten freigegeben:') + ' '));
          inhalt.appendChild(d.createTextNode(k.name + ' · ' + k.mail + ' · ' + k.telefon));
          kbox.appendChild(inhalt);
          karte.appendChild(kbox);

          var zeile = SP.el('div', 'flex g8 wrapf mt12');
          var iv = SP.el('a', 'btn btn-gold btn-sm', SP.t('Videointerview starten'));
          iv.href = 'standardplus-interview.html';
          zeile.appendChild(iv);
          if (SP.db.bewertungen.darfBewerten(kontoId, gegenId)) {
            var bw = SP.el('a', 'btn btn-outline btn-sm', SP.t('Bewertung abgeben'));
            bw.href = 'standardplus-profil-ansicht.html?id=' + encodeURIComponent(gegenId);
            zeile.appendChild(bw);
          }
          karte.appendChild(zeile);
        }
      }
      box.appendChild(karte);
    });
  }

  /* ---------- Sperrliste ---------- */
  function sperrlisteZeichnen() {
    var box = $('sperrliste');
    var liste = SP.db.sperren.meine(kontoId);
    box.replaceChildren();
    if (!liste.length) {
      box.appendChild(SP.el('p', 'leerhinweis', SP.t('Ihre Sperrliste ist leer.')));
      return;
    }
    liste.forEach(function (s) {
      var gegen = SP.db.profile.holen(s.zuId);
      var reihe = SP.el('div', 'lrow gesperrt-karte');
      var ic = SP.el('span', 'act-ic');
      ic.appendChild(SP.icon('shield', 'ic-sm'));
      reihe.appendChild(ic);
      var mitte = SP.el('span', 'lrow-main');
      mitte.appendChild(SP.el('strong', null, SP.db.profile.anzeigename(gegen) || SP.t('Gelöschtes Konto')));
      mitte.appendChild(SP.el('span', null,
        (s.grund ? s.grund + ' · ' : '') + SP.t('gesperrt am {datum}', { datum: new Date(s.datum).toLocaleDateString(SP.gebiet) })));
      reihe.appendChild(mitte);
      var ende = SP.el('span', 'lrow-end');
      var auf = SP.el('button', 'btn btn-outline btn-sm', SP.t('Sperre aufheben'));
      auf.type = 'button';
      auf.addEventListener('click', function () {
        SP.db.sperren.aufheben(kontoId, s.zuId);
        sperrlisteZeichnen();
        SP.toast('ok', SP.t('Sperre aufgehoben'), SP.t('Das Profil ist wieder sichtbar.'));
      });
      ende.appendChild(auf);
      reihe.appendChild(ende);
      box.appendChild(reihe);
    });
  }

  /* ============================================================
     Befoerderungsunternehmen: Stammdaten, Linien, Buchungen
     ============================================================ */
  if (istTR) {
    var trF = ['firma', 'rechtsform', 'ort', 'gegruendet', 'lizenz', 'versicherung',
               'ansprech', 'telefon', 'flotte', 'beschreibung'];
    var trMap = { ansprech: 'ansprechperson' };
    trF.forEach(function (f) {
      var el = $('tr-' + f);
      if (el) el.value = profil[trMap[f] || f] || '';
    });
    $('tr-leistungen').value = (profil.leistungen || []).join('\n');

    $('form-tr').addEventListener('submit', function (e) {
      e.preventDefault();
      var daten = {};
      trF.forEach(function (f) { daten[trMap[f] || f] = SP.clean($('tr-' + f).value, 800); });
      daten.leistungen = SP.clean($('tr-leistungen').value, 600)
        .split('\n').map(function (x) { return x.trim(); }).filter(Boolean).slice(0, 10);
      if (!daten.firma) {
        SP.toast('warn', SP.t('Angaben unvollständig'), SP.t('Der Firmenname wird benötigt.'));
        return;
      }
      if (!daten.lizenz) {
        SP.toast('warn', SP.t('Lizenz fehlt'),
          SP.t('Ohne Gemeinschaftslizenz ist grenzüberschreitender Personenverkehr nicht zulässig.'));
        return;
      }
      SP.db.profile.speichern(kontoId, daten);
      kopf();
      SP.toast('ok', SP.t('Gespeichert'), SP.t('Ihre Unternehmensangaben sind aktualisiert.'));
    });

    /* ---------- Neues Fahrzeug ---------- */
    $('form-fahrzeug').addEventListener('submit', function (e) {
      e.preventDefault();
      var kz = SP.clean($('fz-kennzeichen').value, 20).trim();
      if (!kz) {
        SP.toast('warn', SP.t('Kennzeichen fehlt'),
          SP.t('Ohne Kennzeichen weiß der Fahrgast nicht, in welchen Wagen er steigt.'));
        return;
      }
      SP.db.fahrzeuge.anlegen(kontoId, {
        kennzeichen: kz,
        art: $('fz-art').value,
        marke: $('fz-marke').value,
        plaetze: $('fz-plaetze').value,
        baujahr: $('fz-baujahr').value,
        ausstattung: SP.clean($('fz-ausstattung').value, 200)
          .split(',').map(function (x) { return x.trim(); }).filter(Boolean)
      });
      $('form-fahrzeug').reset();
      fahrzeugeZeichnen(); fahrzeugAuswahl(); buchungenZeichnen();
      SP.toast('ok', SP.t('Fahrzeug gespeichert'), SP.t('{kennzeichen} steht jetzt zur Einteilung bereit.', { kennzeichen: kz }));
    });

    /* ---------- Neuer Fahrer ---------- */
    $('form-fahrer').addEventListener('submit', function (e) {
      e.preventDefault();
      var name = SP.clean($('fr-name').value, 80).trim();
      if (!name) {
        SP.toast('warn', SP.t('Name fehlt'), SP.t('Bitte tragen Sie den Namen des Fahrers ein.'));
        return;
      }
      SP.db.fahrer.anlegen(kontoId, {
        name: name,
        telefon: $('fr-telefon').value,
        seit: $('fr-seit').value,
        sprachen: SP.clean($('fr-sprachen').value, 200)
          .split(',').map(function (x) { return x.trim(); }).filter(Boolean)
      });
      $('form-fahrer').reset();
      fahrerZeichnen(); buchungenZeichnen();
      SP.toast('ok', SP.t('Fahrer gespeichert'),
        SP.t('{name} kann jetzt für Fahrten eingeteilt werden.', { name: name }));
    });

    /* ---------- Neue Linie ----------
       Der Fahrplan wird waehrend des Tippens ausgewertet, damit sofort
       sichtbar ist, was daraus wird - und ob eine Zeile nicht gelesen
       werden konnte. */
    function planPruefen() {
      var halte = SP.db.linien.planLesen($('li-plan').value);
      var kasten = $('li-summe');
      if (halte.length < 2) { kasten.hidden = true; return halte; }
      kasten.hidden = false;
      var gesamt = halte[halte.length - 1].minute;
      $('li-summe-text').textContent =
        SP.t('{start} ab {zeit} Uhr · {n} Halte · {dauer} bis {ziel}', {
          start: halte[0].ort, zeit: halte[0].zeit, n: halte.length,
          dauer: SP.reiseplan.dauerText(gesamt), ziel: halte[halte.length - 1].ort
        });
      return halte;
    }
    $('li-plan').addEventListener('input', planPruefen);

    $('form-linie').addEventListener('submit', function (e) {
      e.preventDefault();
      var halte = SP.db.linien.planLesen($('li-plan').value);
      var tage = Array.prototype.slice
        .call($('li-tage').querySelectorAll('input:checked'))
        .map(function (i) { return Number(i.value); });

      if (halte.length < 2) {
        SP.toast('warn', SP.t('Fahrplan unvollständig'),
          SP.t('Mindestens zwei Zeilen nach dem Muster „Ort 17:30" werden benötigt.'));
        return;
      }
      if (!tage.length) {
        SP.toast('warn', SP.t('Kein Tag gewählt'),
          SP.t('Ohne Wochentage kann niemand einen Reisetag vorgeschlagen bekommen.'));
        return;
      }

      SP.db.linien.anlegen(kontoId, {
        halte: halte, tage: tage,
        preis: $('li-preis').value,
        plaetze: $('li-plaetze').value,
        hinweis: $('li-hinweis').value,
        fahrzeugId: $('li-fahrzeug').value || null
      });
      $('form-linie').reset();
      $('li-tage').querySelectorAll('input').forEach(function (i) { i.checked = false; });
      $('li-summe').hidden = true;
      linienZeichnen();
      SP.toast('ok', SP.t('Linie veröffentlicht'),
        SP.t('{von} nach {nach} · {dauer} Fahrt.', { von: halte[0].ort, nach: halte[halte.length - 1].ort,
          dauer: SP.reiseplan.dauerText(halte[halte.length - 1].minute) }));
    });
  }

  /* ---------- Fahrzeuge anzeigen ---------- */
  function fahrzeugeZeichnen() {
    var box = $('fahrzeuge-liste');
    if (!box) return;
    var liste = SP.db.fahrzeuge.vonUnternehmen(kontoId);
    box.replaceChildren();
    if (!liste.length) {
      box.appendChild(SP.el('p', 'leerhinweis',
        SP.t('Noch kein Fahrzeug eingetragen. Ohne Fahrzeug sieht der Fahrgast nicht, womit er fährt.')));
      return;
    }
    liste.forEach(function (fz) {
      var reihe = SP.el('div', 'lrow');
      var schild = SP.el('span', 'kennzeichen');
      schild.appendChild(SP.el('span', 'kz-eu', 'EU'));
      schild.appendChild(SP.el('span', 'kz-text', fz.kennzeichen));
      reihe.appendChild(schild);

      var mitte = SP.el('span', 'lrow-main');
      mitte.appendChild(SP.el('strong', null,
        SP.t(SP.db.fahrzeuge.ARTEN[fz.art]) + (fz.marke ? ' · ' + fz.marke : '')));
      mitte.appendChild(SP.el('span', null,
        [SP.t('{n} Plätze', { n: fz.plaetze }), fz.baujahr ? SP.t('Baujahr {jahr}', { jahr: fz.baujahr }) : '',
         (fz.ausstattung || []).map(SP.tInhalt).join(', ')].filter(Boolean).join(' · ')));
      reihe.appendChild(mitte);

      var ende = SP.el('span', 'lrow-end');
      var weg = SP.el('button', 'card-link', SP.t('Entfernen'));
      weg.type = 'button';
      weg.addEventListener('click', function () {
        SP.db.fahrzeuge.entfernen(kontoId, fz.id);
        fahrzeugeZeichnen(); fahrzeugAuswahl(); linienZeichnen(); buchungenZeichnen();
        SP.toast('ok', SP.t('Fahrzeug entfernt'), SP.t('Zuordnungen wurden gelöst.'));
      });
      ende.appendChild(weg);
      reihe.appendChild(ende);
      box.appendChild(reihe);
    });
  }

  /* Auswahlfeld im Linienformular fuellen */
  function fahrzeugAuswahl() {
    var wahl = $('li-fahrzeug');
    if (!wahl) return;
    var vorher = wahl.value;
    wahl.replaceChildren();
    var offen = SP.el('option', null, SP.t('Noch offen – wird je Fahrt eingeteilt'));
    offen.value = '';
    wahl.appendChild(offen);
    SP.db.fahrzeuge.vonUnternehmen(kontoId).forEach(function (fz) {
      var o = SP.el('option', null,
        fz.kennzeichen + ' · ' + SP.db.fahrzeuge.ARTEN[fz.art] + ' · ' + SP.anzahl(fz.plaetze, '{n} Platz', '{n} Plätze'));
      o.value = fz.id;
      wahl.appendChild(o);
    });
    wahl.value = vorher;
  }

  /* ---------- Fahrer anzeigen ---------- */
  function fahrerZeichnen() {
    var box = $('fahrer-liste');
    if (!box) return;
    var liste = SP.db.fahrer.vonUnternehmen(kontoId);
    box.replaceChildren();
    if (!liste.length) {
      box.appendChild(SP.el('p', 'leerhinweis', SP.t('Noch kein Fahrer eingetragen.')));
      return;
    }
    liste.forEach(function (fr) {
      var reihe = SP.el('div', 'lrow');
      var av = SP.el('span', 'ava');
      av.appendChild(SP.el('span', null, SP.initials(fr.name)));
      reihe.appendChild(av);

      var mitte = SP.el('span', 'lrow-main');
      mitte.appendChild(SP.el('strong', null, fr.name));
      mitte.appendChild(SP.el('span', null,
        [(fr.sprachen || []).map(SP.tInhalt).join(', '), fr.telefon,
         fr.seit ? SP.t('seit {jahr}', { jahr: fr.seit }) : ''].filter(Boolean).join(' · ')));
      reihe.appendChild(mitte);

      var ende = SP.el('span', 'lrow-end');
      var weg = SP.el('button', 'card-link', SP.t('Entfernen'));
      weg.type = 'button';
      weg.addEventListener('click', function () {
        SP.db.fahrer.entfernen(kontoId, fr.id);
        fahrerZeichnen(); buchungenZeichnen();
        SP.toast('ok', SP.t('Fahrer entfernt'), SP.t('Einteilungen wurden gelöst.'));
      });
      ende.appendChild(weg);
      reihe.appendChild(ende);
      box.appendChild(reihe);
    });
  }

  /* ---------- Linien anzeigen ---------- */
  function linienZeichnen() {
    var box = $('linien-liste');
    if (!box) return;
    var liste = SP.db.linien.vonUnternehmen(kontoId);
    box.replaceChildren();
    if (!liste.length) {
      box.appendChild(SP.el('p', 'leerhinweis',
        SP.t('Noch keine Linie eingetragen. Ohne Linie erscheinen Sie in keinem Vorschlag.')));
      return;
    }
    liste.forEach(function (l) {
      var karte = SP.el('article', 'card card-pad mb12 linienkarte');

      var kopfzeile = SP.el('div', 'flex jc-b ai-s wrapf g12');
      var links = SP.el('div');
      links.appendChild(SP.el('h3', 'h3', SP.t('{von} nach {nach}', { von: SP.tInhalt(l.von), nach: SP.tInhalt(l.nach) })));
      links.appendChild(SP.el('p', 'small muted mt4', l.orte.map(SP.tInhalt).join(' · ')));
      kopfzeile.appendChild(links);

      var weg = SP.el('button', 'card-link', SP.t('Linie entfernen'));
      weg.type = 'button';
      weg.addEventListener('click', function () {
        SP.db.linien.entfernen(kontoId, l.id);
        linienZeichnen();
        SP.toast('ok', SP.t('Linie entfernt'), SP.t('Sie erscheint in keinem Vorschlag mehr.'));
      });
      kopfzeile.appendChild(weg);
      karte.appendChild(kopfzeile);

      /* Wochentage als Streifen - auf einen Blick erkennbar */
      var tage = SP.el('div', 'tagestreifen mt16');
      [1, 2, 3, 4, 5, 6, 0].forEach(function (t) {
        var an = l.tage.indexOf(t) > -1;
        tage.appendChild(SP.el('span', 'tag-punkt' + (an ? ' an' : ''), SP.t(SP.db.linien.KURZ[t])));
      });
      karte.appendChild(tage);

      var werte = SP.el('div', 'flex wrapf g8 mt16');
      werte.appendChild(SP.el('span', 'tag tag-teal', SP.t('ab {zeit} Uhr', { zeit: l.abfahrt })));
      var halteL = SP.db.linien.halte(l);
      werte.appendChild(SP.el('span', 'tag',
        SP.t('{dauer} Fahrt', { dauer: SP.reiseplan.dauerText(halteL.length ? halteL[halteL.length - 1].minute : l.dauer * 60) })));
      werte.appendChild(SP.el('span', 'tag tag-gold', SP.t('{preis} € je Platz', { preis: l.preis })));
      werte.appendChild(SP.el('span', 'tag', SP.t('{n} Plätze', { n: l.plaetze })));
      karte.appendChild(werte);

      var fz = l.fahrzeugId ? SP.db.fahrzeuge.byId(l.fahrzeugId) : null;
      var fzZeile = SP.el('p', 'small mt12 flex g6 ai-c' + (fz ? '' : ' muted'));
      fzZeile.appendChild(SP.icon('bus', 'ic-sm'));
      fzZeile.appendChild(d.createTextNode(fz
        ? fz.kennzeichen + ' · ' + SP.db.fahrzeuge.ARTEN[fz.art] +
          (fz.marke ? ' · ' + fz.marke : '')
        : SP.t('Kein festes Fahrzeug – wird je Fahrt eingeteilt')));
      karte.appendChild(fzZeile);

      if (l.hinweis) karte.appendChild(SP.el('p', 'small muted mt12', SP.tInhalt(l.hinweis)));
      karte.appendChild(SP.reiseplan.klappbar(l, {}, SP.t('Fahrplan ansehen')));
      box.appendChild(karte);
    });
  }

  /* ---------- Buchungen auf meinen Linien ----------
     Hier wird eingeteilt: welcher Wagen, welcher Fahrer. Der Fahrgast
     sieht die Einteilung sofort in seinem Dashboard. */
  function buchungenZeichnen() {
    var box = $('buchungen-liste');
    if (!box) return;
    var liste = SP.db.fahrten.fuerKonto(kontoId)
      .filter(function (f) { return f.unternehmenId === kontoId; });
    box.replaceChildren();
    if (!liste.length) {
      box.appendChild(SP.el('p', 'leerhinweis', SP.t('Noch keine Buchung auf Ihren Linien.')));
      return;
    }
    liste.sort(function (a, b) { return a.abfahrtDatum < b.abfahrtDatum ? -1 : 1; });

    var fahrzeuge = SP.db.fahrzeuge.vonUnternehmen(kontoId);
    var fahrer = SP.db.fahrer.vonUnternehmen(kontoId);

    liste.forEach(function (f) {
      var karte = SP.el('article', 'card card-pad mb12');

      var kopf = SP.el('div', 'flex jc-b ai-s wrapf g12');
      var links = SP.el('div');
      links.appendChild(SP.el('h3', 'h3', SP.t('{von} nach {nach}', { von: SP.tInhalt(f.von), nach: SP.tInhalt(f.nach) })));
      links.appendChild(SP.el('p', 'small muted mt4',
        SP.t('{abDatum}, {abZeit} Uhr · Ankunft {anDatum}, {anZeit} Uhr', {
          abDatum: datumText(f.abfahrtDatum), abZeit: f.abfahrtZeit,
          anDatum: datumText(f.ankunftDatum), anZeit: f.ankunftZeit })));
      kopf.appendChild(links);
      kopf.appendChild(SP.el('span', 'tag ' + (f.status === 'gebucht' ? 'tag-ok' : 'tag-err'),
        f.status === 'gebucht' ? SP.t('gebucht') : SP.t('storniert')));
      karte.appendChild(kopf);

      if (f.status !== 'gebucht') { box.appendChild(karte); return; }

      /* Einteilung */
      var reihe = SP.el('div', 'grid g2 g12 mt16');

      var feldFz = SP.el('div', 'field mb0');
      var labFz = SP.el('label', null, SP.t('Fahrzeug'));
      labFz.setAttribute('for', 'ein-fz-' + f.id);
      feldFz.appendChild(labFz);
      var wrapFz = SP.el('div', 'inp-wrap');
      wrapFz.appendChild(SP.icon('bus'));
      var wahlFz = SP.el('select', 'inp');
      wahlFz.id = 'ein-fz-' + f.id;
      var leerFz = SP.el('option', null, SP.t('Noch nicht eingeteilt'));
      leerFz.value = '';
      wahlFz.appendChild(leerFz);
      fahrzeuge.forEach(function (fz) {
        var o = SP.el('option', null,
          fz.kennzeichen + ' · ' + SP.db.fahrzeuge.ARTEN[fz.art] + ' · ' + SP.anzahl(fz.plaetze, '{n} Platz', '{n} Plätze'));
        o.value = fz.id;
        wahlFz.appendChild(o);
      });
      wahlFz.value = f.fahrzeugId || '';
      wrapFz.appendChild(wahlFz);
      feldFz.appendChild(wrapFz);
      reihe.appendChild(feldFz);

      var feldFr = SP.el('div', 'field mb0');
      var labFr = SP.el('label', null, SP.t('Fahrer an diesem Tag'));
      labFr.setAttribute('for', 'ein-fr-' + f.id);
      feldFr.appendChild(labFr);
      var wrapFr = SP.el('div', 'inp-wrap');
      wrapFr.appendChild(SP.icon('user'));
      var wahlFr = SP.el('select', 'inp');
      wahlFr.id = 'ein-fr-' + f.id;
      var leerFr = SP.el('option', null, SP.t('Noch nicht eingeteilt'));
      leerFr.value = '';
      wahlFr.appendChild(leerFr);
      fahrer.forEach(function (fr) {
        var o = SP.el('option', null,
          fr.name + ((fr.sprachen || []).length ? ' · ' + fr.sprachen.map(SP.tInhalt).join(', ') : ''));
        o.value = fr.id;
        wahlFr.appendChild(o);
      });
      wahlFr.value = f.fahrerId || '';
      wrapFr.appendChild(wahlFr);
      feldFr.appendChild(wrapFr);
      reihe.appendChild(feldFr);
      karte.appendChild(reihe);

      var speichern = SP.el('button', 'btn btn-primary btn-sm mt16', SP.t('Einteilung übernehmen'));
      speichern.type = 'button';
      speichern.addEventListener('click', function () {
        SP.db.fahrten.einteilen(f.id, kontoId, wahlFz.value || null, wahlFr.value || null);
        buchungenZeichnen();
        SP.toast('ok', SP.t('Eingeteilt'),
          SP.t('Der Fahrgast sieht jetzt Fahrzeug und Fahrer für diese Fahrt.'));
      });
      karte.appendChild(speichern);

      if (!f.fahrzeugId || !f.fahrerId) {
        var offen = SP.el('p', 'hint mt12');
        offen.appendChild(SP.icon('alert', 'ic-sm'));
        offen.appendChild(d.createTextNode(
          !f.fahrzeugId && !f.fahrerId ? SP.t('Noch unvollständig: Fahrzeug und Fahrer fehlen.')
            : (!f.fahrzeugId ? SP.t('Noch unvollständig: Fahrzeug fehlt.') : SP.t('Noch unvollständig: Fahrer fehlt.'))));
        karte.appendChild(offen);
      }

      box.appendChild(karte);
    });
  }

  function datumText(iso) {
    var t = SP.db.fahrten.datumAus(iso);
    if (!t) return iso;
    return t.toLocaleDateString(SP.gebiet,
      { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  /* ============================================================
     Autovervollstaendigung in allen Freitextfeldern
     ------------------------------------------------------------
     Dieselben Begriffe wie in der Suche. Wer sein Profil mit den
     vorgeschlagenen Woertern fuellt, wird spaeter auch gefunden -
     das ist der eigentliche Zweck: Eingabe und Suche sprechen
     dieselbe Sprache.
     ============================================================ */
  function vok(id, typen, o) {
    var el = $(id);
    if (el && SP.vok) SP.vok.feld(el, typen, o || {});
  }

  /* Firmennamen aus der Datenbank, fuer den Werdegang */
  function firmenQuelle() {
    return SP.db.profile.arbeitgeber(kontoId).map(function (a) {
      return { typ: 'Unternehmen', text: a.firma, icon: 'building',
        zusatz: [SP.db.BRANCHEN[a.branche], a.ort].filter(Boolean).join(' \u00b7 ') };
    });
  }

  if (!istAG) {
    vok('an-staat', ['staat']);
    vok('an-ort', ['ort', 'region']);
    vok('an-fuehrerschein', ['fuehrerschein'], { min: 0 });
    vok('an-faehigkeiten', ['kenntnis', 'sprache'], { liste: true, max: 10 });
    vok('an-beruf', ['beruf'], {
      /* Passt der Beruf zu einer Branche, wird die Branche gleich mitgesetzt. */
      aufAuswahl: function (e) {
        if (e.wert && $('an-branche')) $('an-branche').value = e.wert;
      }
    });
    vok('st-arbeitgeber', [], { zusatz: firmenQuelle });
    vok('st-position', ['beruf']);
    vok('st-ort', ['ort', 'region']);
    vok('st-land', ['land'], {
      /* Im Werdegang steht das Kuerzel, nicht der ausgeschriebene Name. */
      aufAuswahl: function (e) { $('st-land').value = e.wert || e.text; }
    });
  } else {
    vok('ag-rechtsform', ['rechtsform'], { min: 0 });
    vok('ag-ort', ['ort', 'region']);
    vok('ag-position', ['beruf']);
    vok('ag-leistungen', ['leistung'], { liste: true, trenner: '\n', max: 10 });
    vok('ag-standorte', ['ort', 'region'], { liste: true, max: 10 });
    vok('stx-titel', ['beruf'], {
      aufAuswahl: function (e) {
        if (e.wert && $('stx-branche')) $('stx-branche').value = e.wert;
      }
    });
    vok('stx-ort', ['ort', 'region']);
  }
  if (istTR) {
    vok('tr-ort', ['ort', 'region']);
    vok('tr-rechtsform', ['rechtsform'], { min: 0 });
    vok('li-plan', ['ort', 'region'], { liste: true, trenner: '\n', max: 8 });
  }
  vok('spr-name', ['sprache'], { min: 0 });
  vok('nw-titel', ['kenntnis']);

  /* ---------- Start ---------- */
  kopf();
  sprachenZeichnen();
  nachweiseZeichnen();
  bilderZeichnen();
  bewertungenZeichnen();
  anfragenZeichnen();
  sperrlisteZeichnen();
  if (istAG) stellenZeichnen();
  else if (istTR) {
    fahrzeugeZeichnen(); fahrzeugAuswahl(); fahrerZeichnen();
    linienZeichnen(); buchungenZeichnen();
  }
  else stationenZeichnen();

})(window, document);
