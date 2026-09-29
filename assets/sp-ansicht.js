/* Standard Plus - Ausfuehrliche Profilansicht
   Zeigt ein Arbeitnehmer- oder Arbeitgeberprofil in der Tiefe, die dem
   Betrachter zusteht. Die Abstufung kommt aus SP.db.profile.sichtRecht():
     eigen      - eigenes Profil
     voll       - beidseitige Freigabe liegt vor
     pseudonym  - angemeldet, aber keine Freigabe
     anonym     - nicht angemeldet
     gesperrt   - eine Seite hat die andere gesperrt
   Ausgabe ausschliesslich ueber die DOM-API, kein innerHTML. */
(function (w, d) {
  'use strict';
  var SP = w.SP;
  var $ = function (id) { return d.getElementById(id); };

  var parameter = new URLSearchParams(w.location.search);
  var zielId = parameter.get('id') || '';
  var sitzung = SP.session.get();
  var betrachterId = sitzung ? sitzung.kontoId : null;

  var profil = SP.db.profile.holen(zielId);
  var konto = SP.db.konten.byId(zielId);
  var istAG = profil && profil.rolle === 'arbeitgeber';

  /* Musteransicht: zeigt die Vollansicht ohne Freigabe - aber ausschliesslich
     fuer die erfundenen Beispielkonten. Bei echten Konten greift immer die
     normale Abstufung, sonst waere der Schutz wertlos. */
  var musterModus = parameter.get('muster') === '1' && !!(konto && konto.demo);
  var recht = musterModus ? 'muster' : SP.db.profile.sichtRecht(betrachterId, zielId);
  var vollSicht = musterModus || recht === 'voll' || recht === 'eigen';

  $('zurueck').addEventListener('click', function () {
    if (d.referrer && d.referrer.indexOf(w.location.origin) === 0) w.history.back();
    else if (musterModus) w.location.href = 'standardplus-musterprofile.html';
    else w.location.href = istAG ? 'standardplus-unternehmen.html' : 'standardplus-talente.html';
  });

  if (!profil || !konto) {
    $('kopf').replaceChildren(hinweis('warn', 'alert',
      SP.t('Dieses Profil wurde nicht gefunden. Möglicherweise wurde das Konto gelöscht.')));
    return;
  }

  /* ---------- kleine Bausteine ---------- */
  function hinweis(art, ikon, text) {
    var box = SP.el('div', 'notice notice-' + art);
    box.appendChild(SP.icon(ikon));
    box.appendChild(SP.el('span', null, text));
    return box;
  }
  function sterneReihe(wert, anzahl) {
    var wrap = SP.el('span', 'sterne');
    for (var i = 1; i <= 5; i++) {
      wrap.appendChild(SP.icon('star', i <= Math.round(wert) ? 'voll' : ''));
    }
    wrap.appendChild(SP.el('span', 'sterne-wert', SP.zahl(wert, 1)));
    if (anzahl != null) {
      wrap.appendChild(SP.el('span', 'sterne-anzahl',
        '(' + SP.anzahl(anzahl, '{n} Bewertung', '{n} Bewertungen') + ')'));
    }
    return wrap;
  }
  function abschnitt(titel, ikon) {
    var s = SP.el('section', 'abschnitt');
    var h = SP.el('h2');
    h.appendChild(SP.icon(ikon, 'ic-lg'));
    h.appendChild(SP.el('span', null, titel));
    s.appendChild(h);
    return s;
  }
  /* Ein Datenfeld: [Symbol, Bezeichnung, Wert, Zusatz, Auszeichnung]
     Auszeichnung: 'wichtig', 'gold' oder 'zu' (Inhalt erst nach Freigabe). */
  function datenfeld(f) {
    var box = SP.el('div', 'datenfeld' + (f[4] ? ' ' + f[4] : ''));
    box.appendChild(SP.icon(f[4] === 'zu' ? 'lock' : f[0]));
    var text = SP.el('div', 'datenfeld-text');
    text.appendChild(SP.el('dt', null, f[1]));
    var wert = SP.el('dd', null, f[2]);
    if (f[3]) wert.appendChild(SP.el('small', null, f[3]));
    text.appendChild(wert);
    box.appendChild(text);
    return box;
  }

  /* Ein Raster aus Datenfeldern, leere Werte fallen weg */
  function datengrid(felder, kompakt) {
    var dl = SP.el('dl', 'datengrid' + (kompakt ? ' kompakt' : ''));
    felder.filter(function (f) { return f && f[2]; }).forEach(function (f) {
      dl.appendChild(datenfeld(f));
    });
    return dl;
  }

  /* Eine beschriftete Gruppe von Datenfeldern */
  function datengruppe(titel, felder) {
    var g = SP.el('div', 'datengruppe');
    if (titel) g.appendChild(SP.el('p', 'datengruppe-titel', titel));
    g.appendChild(datengrid(felder));
    return g;
  }

  /* ---------- Kopfbereich ---------- */
  function kopfBauen() {
    var box = $('kopf');
    box.replaceChildren();
    var wrap = SP.el('div', 'profilkopf');

    var av = SP.el('span', 'ava' + (istAG ? ' gold' : ''));
    if (!istAG) {
      var sil = d.createElementNS('http://www.w3.org/2000/svg', 'svg');
      sil.setAttribute('class', 'silhouette');
      sil.setAttribute('viewBox', '0 0 24 24');
      sil.setAttribute('aria-hidden', 'true');
      var use = d.createElementNS('http://www.w3.org/2000/svg', 'use');
      use.setAttribute('href', '#i-portrait');
      sil.appendChild(use);
      av.appendChild(sil);
    }
    av.appendChild(SP.el('span', null, SP.initials(SP.db.profile.anzeigename(profil))));
    wrap.appendChild(av);

    var text = SP.el('div', 'grow');
    var name = vollSicht ? SP.db.profile.vollerName(profil) : SP.db.profile.anzeigename(profil);
    text.appendChild(SP.el('h1', 'h2', name));
    text.appendChild(SP.el('p', 'lede mb12',
      istAG ? [SP.db.BRANCHEN[profil.branche] || '', profil.rechtsform].filter(Boolean).join(' · ')
            : SP.tInhalt(profil.beruf) || SP.t('Ohne Berufsangabe')));

    var marken = SP.el('div', 'flex wrapf g8 mb12');
    var schnitt = SP.db.bewertungen.schnitt(zielId);
    if (schnitt) marken.appendChild(sterneReihe(schnitt.wert, schnitt.anzahl));
    else marken.appendChild(SP.el('span', 'tag', SP.t('Noch keine Bewertung')));

    var geprueft = (profil.nachweise || []).filter(function (n) { return n.geprueft; }).length;
    if (geprueft) {
      var g = SP.el('span', 'tag tag-ok');
      g.appendChild(SP.icon('verified', 'ic-sm'));
      g.appendChild(SP.el('span', null, SP.anzahl(geprueft, '{n} geprüfter Nachweis', '{n} geprüfte Nachweise')));
      marken.appendChild(g);
    }
    if (!istAG && profil.verfuegbar) {
      marken.appendChild(SP.el('span', 'tag tag-teal', SP.t('Verfügbar {wann}', { wann: SP.tInhalt(profil.verfuegbar) })));
    }
    if (istAG && profil.groesse) {
      marken.appendChild(SP.el('span', 'tag', SP.t('{n} Mitarbeitende', { n: profil.groesse })));
    }
    text.appendChild(marken);

    wrap.appendChild(text);
    box.appendChild(wrap);

    var ort = [SP.tInhalt(profil.ort), profil.land].filter(Boolean).join(', ');
    var alterJahre = SP.db.profile.alter(profil);
    var meta = istAG
      ? [['pin', SP.t('Sitz'), ort],
         ['calendar', SP.t('Gegründet'), profil.gegruendet],
         ['users', SP.t('Mitarbeitende'), profil.groesse],
         ['briefcase', SP.t('Offene Stellen'),
          String(SP.db.stellen.vonArbeitgeber(zielId).filter(function (x) { return x.offen; }).length)]]
      : [['pin', SP.t('Region'), ort],
         ['calendar', SP.t('Alter'), alterJahre ? SP.anzahl(alterJahre, '{n} Jahr', '{n} Jahre') : ''],
         ['clock', SP.t('Erfahrung'), profil.erfahrung ? SP.anzahl(profil.erfahrung, '{n} Jahr', '{n} Jahre') : ''],
         ['arrowright', SP.t('Wunschland'), SP.tInhalt(profil.zielland)]];
    box.appendChild(datengrid(meta, true));
  }

  /* ---------- Sichtbarkeitshinweis ---------- */
  function sichtBauen() {
    var box = $('sicht');
    box.replaceChildren();
    var texte = {
      eigen: ['info', 'user', SP.t('Das ist Ihr eigenes Profil. So sehen Sie es selbst; andere sehen je nach Freigabe weniger.')],
      voll: ['ok', 'check', SP.t('Vollansicht: Es besteht eine beidseitige Freigabe. Name, Kontaktdaten und Nachweise sind sichtbar.')],
      pseudonym: ['warn', 'lock', SP.t('Eingeschränkte Ansicht: Nachname, Kontaktdaten und Dokumenteninhalte werden erst nach beidseitiger Freigabe angezeigt.')],
      anonym: ['warn', 'lock', SP.t('Sie sind nicht angemeldet. Öffentlich sichtbar ist nur ein stark gekürzter Auszug.')],
      gesperrt: ['err', 'shield', SP.t('Zwischen diesem Profil und Ihrem Konto besteht eine Sperre. Es werden keine Details angezeigt.')],
      muster: ['info', 'eye', SP.t('Musteransicht: So sieht dieses Profil aus, wenn eine beidseitige Freigabe besteht. Bei echten Konten ist diese Tiefe nur nach Freigabe erreichbar - der Schutz gilt uneingeschränkt.')]
    }[recht];
    var h = hinweis(texte[0], texte[1], texte[2]);
    h.classList.add('sichthinweis');
    box.appendChild(h);
  }

  /* ---------- Aktionen ---------- */
  function aktionenBauen() {
    var box = $('aktionen');
    box.replaceChildren();
    if (musterModus) {
      var vergleich = SP.el('a', 'btn btn-outline',
        SP.t('Zum Vergleich: eingeschränkte Ansicht'));
      vergleich.href = 'standardplus-profil-ansicht.html?id=' + encodeURIComponent(zielId);
      box.appendChild(vergleich);
      var zurueckMuster = SP.el('a', 'btn btn-primary', SP.t('Alle Musterprofile'));
      zurueckMuster.href = 'standardplus-musterprofile.html';
      box.appendChild(zurueckMuster);
      return;
    }
    if (recht === 'eigen') {
      var bearbeiten = SP.el('a', 'btn btn-primary', SP.t('Profil bearbeiten'));
      bearbeiten.href = 'standardplus-profil.html';
      box.appendChild(bearbeiten);
      return;
    }
    if (!betrachterId) {
      var anmelden = SP.el('a', 'btn btn-primary', SP.t('Anmelden für die Vollansicht'));
      anmelden.href = 'standardplus-login.html?ziel=' +
        encodeURIComponent('standardplus-profil-ansicht.html');
      box.appendChild(anmelden);
      return;
    }
    if (recht === 'gesperrt') {
      var auf = SP.el('button', 'btn btn-outline', SP.t('Sperre aufheben'));
      auf.type = 'button';
      auf.addEventListener('click', function () {
        SP.db.sperren.aufheben(betrachterId, zielId);
        SP.toast('ok', SP.t('Sperre aufgehoben'), SP.t('Das Profil ist wieder sichtbar.'));
        w.location.reload();
      });
      box.appendChild(auf);
      return;
    }

    var anfrage = SP.db.anfragen.zwischen(betrachterId, zielId);
    var status = SP.db.anfragen.status(anfrage);

    if (sitzung.role === 'arbeitgeber' && !istAG) {
      if (status === 'keine') {
        var senden = SP.el('button', 'btn btn-primary', SP.t('Anfrage senden'));
        senden.type = 'button';
        senden.addEventListener('click', function () {
          var offene = SP.db.stellen.vonArbeitgeber(betrachterId)
            .filter(function (s) { return s.offen; });
          SP.db.anfragen.anlegen(betrachterId, zielId, offene.length ? offene[0].id : null);
          SP.toast('ok', SP.t('Anfrage gesendet'),
            SP.t('{name} entscheidet über die Freigabe.', { name: SP.db.profile.anzeigename(profil) }));
          w.location.reload();
        });
        box.appendChild(senden);
      } else {
        box.appendChild(SP.el('span', 'tag ' +
          (status === 'beidseitig' ? 'tag-ok' : (status === 'abgelehnt' ? 'tag-err' : 'tag-warn')),
          status === 'beidseitig' ? SP.t('Beidseitig freigegeben')
            : (status === 'abgelehnt' ? SP.t('Anfrage abgelehnt') : SP.t('Anfrage läuft'))));
      }
    }

    if (istAG && sitzung.role === 'arbeitnehmer' && status !== 'keine') {
      box.appendChild(SP.el('span', 'tag ' + (status === 'beidseitig' ? 'tag-ok' : 'tag-warn'),
        status === 'beidseitig' ? SP.t('Beidseitig freigegeben') : SP.t('Anfrage liegt vor')));
    }

    if (SP.db.bewertungen.darfBewerten(betrachterId, zielId)) {
      var bewerten = SP.el('button', 'btn btn-gold', SP.t('Bewertung abgeben'));
      bewerten.type = 'button';
      bewerten.addEventListener('click', function () { $('modal-bewertung').classList.add('show'); });
      box.appendChild(bewerten);
    }

    if (status === 'beidseitig') {
      var iv = SP.el('a', 'btn btn-outline', SP.t('Videointerview'));
      /* Die eigene Rolle wird mitgegeben, damit die Interviewseite nicht
         noch einmal danach fragen muss. */
      iv.href = 'standardplus-interview.html?rolle=' + encodeURIComponent(sitzung.role);
      box.appendChild(iv);
    }

    var sperren = SP.el('button', 'btn btn-outline', SP.t('Auf meine Sperrliste'));
    sperren.type = 'button';
    sperren.addEventListener('click', function () { $('modal-sperre').classList.add('show'); });
    box.appendChild(sperren);
  }

  /* ---------- Inhalt ---------- */
  function inhaltBauen() {
    var box = $('inhalt');
    box.replaceChildren();
    if (recht === 'gesperrt') return;

    if (recht === 'anonym') {
      var s = abschnitt(SP.t('Kurzprofil'), 'user');
      s.appendChild(datengrid(istAG
        ? [['grid', SP.t('Branche'), SP.db.BRANCHEN[profil.branche]],
           ['pin', SP.t('Ort'), SP.tInhalt(profil.ort)],
           ['users', SP.t('Größe'), profil.groesse]]
        : [['briefcase', SP.t('Beruf'), SP.tInhalt(profil.beruf)],
           ['grid', SP.t('Branche'), SP.db.BRANCHEN[profil.branche]],
           ['globe', SP.t('Region'), profil.land],
           ['clock', SP.t('Erfahrung'), profil.erfahrung ? SP.anzahl(profil.erfahrung, '{n} Jahr', '{n} Jahre') : '']]));
      s.appendChild(SP.el('p', 'leerhinweis mt16',
        SP.t('Werdegang, Sprachen, Nachweise und Bewertungen sind angemeldeten Konten vorbehalten.')));
      box.appendChild(s);
      return;
    }

    if (istAG) inhaltArbeitgeber(box); else inhaltArbeitnehmer(box);
    bewertungenBauen(box);
  }

  /* ---------- Arbeitnehmerprofil ---------- */
  function inhaltArbeitnehmer(box) {
    if (profil.ueberMich) {
      var ue = abschnitt(SP.t('Über mich'), 'user');
      ue.appendChild(SP.el('p', null, SP.tInhalt(profil.ueberMich)));
      box.appendChild(ue);
    }

    var alterJahre = SP.db.profile.alter(profil);
    var eck = abschnitt(SP.t('Eckdaten'), 'list');

    eck.appendChild(datengruppe(SP.t('Zur Person'), [
      ['user', SP.t('Name'), vollSicht ? SP.db.profile.vollerName(profil)
                                 : SP.db.profile.anzeigename(profil),
       vollSicht ? null : SP.t('Nachname nach Freigabe'), vollSicht ? null : 'zu'],
      ['calendar', SP.t('Alter'), alterJahre ? SP.anzahl(alterJahre, '{n} Jahr', '{n} Jahre') : '',
       profil.geburtsjahr ? SP.t('Jahrgang {jahr}', { jahr: profil.geburtsjahr }) : null],
      ['globe', SP.t('Staatsangehörigkeit'), SP.tInhalt(profil.staatsangehoerigkeit)],
      ['pin', SP.t('Wohnort'), [SP.tInhalt(profil.ort), profil.land].filter(Boolean).join(', ')]
    ]));

    eck.appendChild(datengruppe(SP.t('Beruf und Erfahrung'), [
      ['briefcase', SP.t('Beruf'), SP.tInhalt(profil.beruf)],
      ['grid', SP.t('Branche'), SP.db.BRANCHEN[profil.branche]],
      ['clock', SP.t('Berufserfahrung'), profil.erfahrung ? SP.anzahl(profil.erfahrung, '{n} Jahr', '{n} Jahre') : ''],
      ['translate', SP.t('Deutschkenntnisse'), profil.deutsch,
       profil.deutsch ? SP.t('nach Referenzrahmen') : null]
    ]));

    eck.appendChild(datengruppe(SP.t('Konditionen und Einsatz'), [
      ['euro', SP.t('Gehaltsvorstellung'),
       profil.gehalt ? Number(profil.gehalt).toLocaleString(SP.gebiet) + ' €' : '',
       SP.t('netto im Monat'), 'wichtig'],
      ['calendar', SP.t('Verfügbar'), SP.tInhalt(profil.verfuegbar), null, 'wichtig'],
      ['arrowright', SP.t('Wunschland'), SP.tInhalt(profil.zielland)],
      ['truck', SP.t('Führerschein'), profil.fuehrerschein || SP.t('keine Angabe')],
      ['pin', SP.t('Umzugsbereit'), profil.umzugsbereit ? SP.t('ja') : SP.t('nein')]
    ]));

    eck.appendChild(datengruppe(SP.t('Kontakt'), [
      ['mail', SP.t('E-Mail'), vollSicht ? konto.mail : SP.t('nach beidseitiger Freigabe'),
       null, vollSicht ? null : 'zu'],
      ['chat', SP.t('Telefon'),
       vollSicht ? (profil.telefon || SP.t('nicht hinterlegt')) : SP.t('nach beidseitiger Freigabe'),
       null, vollSicht ? null : 'zu']
    ]));
    box.appendChild(eck);

    sprachenBauen(box);

    if ((profil.faehigkeiten || []).length) {
      var f = abschnitt(SP.t('Kenntnisse und Nachweise im Beruf'), 'check');
      var tags = SP.el('div', 'flex wrapf g8');
      profil.faehigkeiten.forEach(function (k) { tags.appendChild(SP.el('span', 'tag tag-teal', SP.tInhalt(k))); });
      f.appendChild(tags);
      box.appendChild(f);
    }

    werdegangBauen(box);
    nachweiseBauen(box);
    galerieBauen(box, SP.t('Arbeitsproben'));
  }

  /* ---------- Arbeitgeberprofil ---------- */
  function inhaltArbeitgeber(box) {
    if (profil.beschreibung) {
      var ue = abschnitt(SP.t('Über das Unternehmen'), 'building');
      ue.appendChild(SP.el('p', null, SP.tInhalt(profil.beschreibung)));
      box.appendChild(ue);
    }

    var alterFirma = profil.gegruendet
      ? (new Date().getFullYear() - Number(profil.gegruendet)) : null;
    var offeneStellen = SP.db.stellen.vonArbeitgeber(zielId)
      .filter(function (x) { return x.offen; }).length;
    var eck = abschnitt(SP.t('Unternehmensdaten'), 'list');

    eck.appendChild(datengruppe(SP.t('Das Unternehmen'), [
      ['building', SP.t('Firma'), profil.firma],
      ['scale', SP.t('Rechtsform'), profil.rechtsform],
      ['grid', SP.t('Branche'), SP.db.BRANCHEN[profil.branche]],
      ['calendar', SP.t('Gegründet'), profil.gegruendet,
       alterFirma && alterFirma > 0 ? SP.anzahl(alterFirma, 'seit {n} Jahr am Markt', 'seit {n} Jahren am Markt') : null],
      ['users', SP.t('Mitarbeitende'), profil.groesse]
    ]));

    eck.appendChild(datengruppe(SP.t('Standort und Bedarf'), [
      ['pin', SP.t('Sitz'), [SP.tInhalt(profil.ort), profil.land].filter(Boolean).join(', ')],
      ['globe', SP.t('Weitere Standorte'), (function () {
        var weitere = (profil.standorte || [])
          .map(function (o) { return o.ort; })
          .filter(function (o) { return o && o !== profil.ort; });
        return weitere.length ? weitere.map(SP.tInhalt).join(', ') : SP.t('nur der Hauptsitz');
      })()],
      ['briefcase', SP.t('Offene Stellen'), String(offeneStellen),
       offeneStellen ? SP.t('siehe unten') : SP.t('derzeit keine'), offeneStellen ? 'gold' : null],
      ['verified', SP.t('Geprüfte Nachweise'),
       String((profil.nachweise || []).filter(function (n) { return n.geprueft; }).length)]
    ]));

    eck.appendChild(datengruppe(SP.t('Ansprechperson'), [
      ['user', SP.t('Name'), vollSicht ? profil.ansprechperson : SP.t('nach beidseitiger Freigabe'),
       null, vollSicht ? null : 'zu'],
      ['briefcase', SP.t('Position'), vollSicht ? SP.tInhalt(profil.position) : '—',
       null, vollSicht ? null : 'zu'],
      ['mail', SP.t('E-Mail'), vollSicht ? konto.mail : SP.t('nach beidseitiger Freigabe'),
       null, vollSicht ? null : 'zu'],
      ['chat', SP.t('Telefon'),
       vollSicht ? (profil.telefon || SP.t('nicht hinterlegt')) : SP.t('nach beidseitiger Freigabe'),
       null, vollSicht ? null : 'zu']
    ]));
    box.appendChild(eck);

    if ((profil.standorte || []).length) {
      var st = abschnitt(SP.t('Standorte'), 'pin');
      var liste = SP.el('div', 'flex wrapf g8');
      profil.standorte.forEach(function (o) {
        var t = SP.el('span', 'tag');
        t.appendChild(SP.el('span', 'cc', o.land || 'DE'));
        t.appendChild(SP.el('span', null, SP.tInhalt(o.ort)));
        liste.appendChild(t);
      });
      st.appendChild(liste);
      box.appendChild(st);
    }

    if ((profil.leistungen || []).length) {
      var le = abschnitt(SP.t('Das bieten wir Mitarbeitenden'), 'handshake');
      var ul = SP.el('ul', 'list-check');
      profil.leistungen.forEach(function (x) {
        var li = SP.el('li');
        li.appendChild(SP.icon('check', 'ic-sm'));
        li.appendChild(SP.el('span', null, SP.tInhalt(x)));
        ul.appendChild(li);
      });
      le.appendChild(ul);
      box.appendChild(le);
    }

    var stellen = SP.db.stellen.vonArbeitgeber(zielId).filter(function (s) { return s.offen; });
    var sa = abschnitt(SP.t('Offene Stellen'), 'briefcase');
    if (!stellen.length) {
      sa.appendChild(SP.el('p', 'leerhinweis', SP.t('Derzeit keine offenen Ausschreibungen.')));
    } else {
      stellen.forEach(function (s) {
        var reihe = SP.el('div', 'lrow');
        var ic = SP.el('span', 'act-ic gold');
        ic.appendChild(SP.icon('briefcase', 'ic-sm'));
        reihe.appendChild(ic);
        var mitte = SP.el('span', 'lrow-main');
        mitte.appendChild(SP.el('strong', null, SP.tInhalt(s.titel)));
        mitte.appendChild(SP.el('span', null,
          [SP.tInhalt(s.ort), SP.tInhalt(s.verguetung), SP.tInhalt(s.beschreibung)].filter(Boolean).join(' · ')));
        reihe.appendChild(mitte);

        /* Von der Ausschreibung direkt in die Freitextsuche: der Stellentext
           wird zur Suchanfrage. So haengen Stelle und Vorschlagsliste
           zusammen, statt nebeneinander zu stehen. */
        var frage = [s.titel, s.ort ? SP.t('in {ort}', { ort: s.ort }) : ''].filter(Boolean).join(' ');
        var ende = SP.el('span', 'lrow-end');
        var passend = SP.el('a', 'btn btn-outline btn-sm', SP.t('Passende Profile'));
        passend.href = 'standardplus-suche.html?q=' + encodeURIComponent(frage);
        ende.appendChild(passend);
        reihe.appendChild(ende);
        SP.klickbar(reihe, passend);
        sa.appendChild(reihe);
      });
    }
    box.appendChild(sa);

    sprachenBauen(box);
    nachweiseBauen(box);
    galerieBauen(box, SP.t('Eindrücke vom Arbeitsplatz'));
  }

  /* ---------- gemeinsame Abschnitte ---------- */
  function sprachenBauen(box) {
    var liste = profil.sprachen || [];
    if (!liste.length) return;
    var s = abschnitt(SP.t('Sprachkenntnisse'), 'translate');
    liste.forEach(function (sp) {
      var stufe = SP.db.NIVEAUS.indexOf(sp.niveau);
      var anteil = Math.round(((stufe < 0 ? 0 : stufe) + 1) / SP.db.NIVEAUS.length * 100);
      var bar = SP.el('div', 'bar');
      var kopf = SP.el('div', 'bar-h');
      kopf.appendChild(SP.el('span', 'small', SP.tInhalt(sp.sprache)));
      kopf.appendChild(SP.el('b', null, SP.tInhalt(sp.niveau)));
      bar.appendChild(kopf);
      var track = SP.el('div', 'bar-t');
      track.appendChild(SP.el('div', 'bar-f pct-' + anteil));
      bar.appendChild(track);
      s.appendChild(bar);
    });
    s.appendChild(SP.el('p', 'tiny muted mt8',
      SP.t('Stufen nach dem Gemeinsamen Europäischen Referenzrahmen (A1 bis C2).')));
    box.appendChild(s);
  }

  function werdegangBauen(box) {
    var liste = profil.stationen || [];
    var s = abschnitt(SP.t('Beruflicher Werdegang'), 'clock');
    if (!liste.length) {
      s.appendChild(SP.el('p', 'leerhinweis', SP.t('Noch keine Stationen hinterlegt.')));
      box.appendChild(s);
      return;
    }
    var ul = SP.el('ul', 'werdegang');
    liste.forEach(function (st) {
      var li = SP.el('li');
      li.appendChild(SP.el('span', 'zeit', [st.von, SP.tInhalt(st.bis)].filter(Boolean).join(' ' + SP.t('bis') + ' ')));
      li.appendChild(SP.el('h4', null, SP.tInhalt(st.position)));
      /* Ohne Freigabe wird der Name des früheren Arbeitgebers nicht genannt */
      li.appendChild(SP.el('p', 'firma', vollSicht
        ? [st.arbeitgeber, SP.tInhalt(st.ort), st.land].filter(Boolean).join(' · ')
        : SP.t('Arbeitgeber wird nach Freigabe genannt') + ' · ' + [SP.tInhalt(st.ort), st.land].filter(Boolean).join(', ')));
      if (st.taetigkeit) li.appendChild(SP.el('p', null, SP.tInhalt(st.taetigkeit)));
      ul.appendChild(li);
    });
    s.appendChild(ul);
    box.appendChild(s);
  }

  function groesseText(bytes) {
    if (!bytes) return '';
    return bytes > 1048576 ? SP.zahl(bytes / 1048576, 1) + ' MB'
                           : Math.round(bytes / 1024) + ' KB';
  }

  function nachweiseBauen(box) {
    var liste = profil.nachweise || [];
    var s = abschnitt(SP.t('Zeugnisse, Diplome und Zertifikate'), 'doc');
    if (!liste.length) {
      s.appendChild(SP.el('p', 'leerhinweis', SP.t('Noch keine Nachweise hinterlegt.')));
      box.appendChild(s);
      return;
    }
    liste.forEach(function (n) {
      var reihe = SP.el('div', 'dok');
      reihe.appendChild(SP.icon('doc', 'ic-lg'));
      var info = SP.el('div', 'dok-info');
      info.appendChild(SP.el('strong', null, SP.tInhalt(n.titel)));
      info.appendChild(SP.el('span', null,
        [SP.db.ARTEN[n.art] || SP.t('Nachweis'), n.dateiname, groesseText(n.groesse)]
          .filter(Boolean).join(' · ')));
      reihe.appendChild(info);

      var ende = SP.el('span', 'dok-aktion flex g8 ai-c');
      ende.appendChild(SP.el('span', n.geprueft ? 'tag tag-ok' : 'tag tag-warn',
        n.geprueft ? SP.t('geprüft') : SP.t('ungeprüft')));
      /* Nur eingebettete PDF- und Bilddateien als Download - nie andere Adressarten */
      var sicherInhalt = /^data:(application\/pdf|image\/(png|jpeg|webp|gif));base64,/i.test(String(n.inhalt || ''));
      if (vollSicht && sicherInhalt) {
        var a = SP.el('a', 'btn btn-outline btn-sm', SP.t('Herunterladen'));
        a.href = n.inhalt;
        a.download = n.dateiname || 'nachweis';
        ende.appendChild(a);
      } else if (vollSicht) {
        ende.appendChild(SP.el('span', 'tiny muted', SP.t('Beispieldatei ohne Inhalt')));
      } else {
        ende.appendChild(SP.el('span', 'tiny muted', SP.t('Inhalt nach Freigabe')));
      }
      reihe.appendChild(ende);
      s.appendChild(reihe);
    });
    s.appendChild(SP.el('p', 'tiny muted mt12',
      SP.t('Der Vermerk „geprüft" bedeutet, dass Standard Plus das Original gesehen hat. Dateiinhalte werden erst nach beidseitiger Freigabe zugänglich.')));
    box.appendChild(s);
  }

  function galerieBauen(box, titel) {
    var liste = profil.bilder || [];
    if (!liste.length) return;
    var s = abschnitt(titel, 'palette');
    var g = SP.el('div', 'galerie');
    liste.forEach(function (b) {
      var fig = SP.el('figure');
      var img = d.createElement('img');
      img.src = b.inhalt;
      img.alt = b.titel || SP.t('Arbeitsprobe');
      img.loading = 'lazy';
      fig.appendChild(img);
      if (b.titel) fig.appendChild(SP.el('figcaption', null, SP.tInhalt(b.titel)));
      g.appendChild(fig);
    });
    s.appendChild(g);
    box.appendChild(s);
  }

  function bewertungenBauen(box) {
    var liste = SP.db.bewertungen.fuerKonto(zielId);
    var s = abschnitt(SP.t('Bewertungen'), 'star');
    if (!liste.length) {
      s.appendChild(SP.el('p', 'leerhinweis',
        SP.t('Noch keine Bewertungen. Bewerten kann nur, wer nachweislich zusammengearbeitet hat.')));
      box.appendChild(s);
      return;
    }
    var schnitt = SP.db.bewertungen.schnitt(zielId);
    var kopf = SP.el('div', 'flex ai-c g12 mb16');
    kopf.appendChild(sterneReihe(schnitt.wert, schnitt.anzahl));
    s.appendChild(kopf);

    liste.forEach(function (b) {
      var karte = SP.el('div', 'bewertung');
      var k = SP.el('div', 'bewertung-kopf');
      k.appendChild(sterneReihe(b.sterne));
      if (b.taetigkeit) k.appendChild(SP.el('span', 'tag', SP.tInhalt(b.taetigkeit)));
      if (b.zeitraum) k.appendChild(SP.el('span', 'tiny muted', SP.tInhalt(b.zeitraum)));
      karte.appendChild(k);
      if (b.text) karte.appendChild(SP.el('p', null, SP.tInhalt(b.text)));
      var vonProfil = SP.db.profile.holen(b.vonId);
      karte.appendChild(SP.el('p', 'quelle mt8',
        SP.t('Von {name}', { name: SP.db.profile.anzeigename(vonProfil) || SP.t('einem Konto') }) +
        ' · ' + new Date(b.datum).toLocaleDateString(SP.gebiet)));
      s.appendChild(karte);
    });
    s.appendChild(SP.el('p', 'tiny muted mt12',
      SP.t('Bewertungen stammen ausschließlich von Konten mit beidseitiger Freigabe. Jedes Konto kann ein anderes nur einmal bewerten.')));
    box.appendChild(s);
  }

  /* ---------- Bewertungsdialog ---------- */
  var gewaehlt = 5;
  var wahl = $('sternwahl');
  for (var i = 1; i <= 5; i++) {
    (function (n) {
      var b = SP.el('button', n <= gewaehlt ? 'an' : '');
      b.type = 'button';
      b.setAttribute('aria-label', SP.anzahl(n, '1 von 5 Sternen', '{n} von 5 Sternen'));
      b.appendChild(SP.icon('star'));
      b.addEventListener('click', function () {
        gewaehlt = n;
        Array.prototype.forEach.call(wahl.children, function (el, k) {
          el.classList.toggle('an', k < n);
        });
      });
      wahl.appendChild(b);
    })(i);
  }
  $('bw-abbrechen').addEventListener('click', function () {
    $('modal-bewertung').classList.remove('show');
  });
  $('bw-senden').addEventListener('click', function () {
    var erg = SP.db.bewertungen.abgeben(betrachterId, zielId, {
      sterne: gewaehlt,
      text: $('bw-text').value,
      zeitraum: $('bw-zeitraum').value,
      taetigkeit: $('bw-taetigkeit').value
    });
    $('modal-bewertung').classList.remove('show');
    if (erg) {
      SP.toast('ok', SP.t('Bewertung veröffentlicht'), SP.t('Sie erscheint jetzt im Profil.'));
      w.location.reload();
    } else {
      SP.toast('err', SP.t('Nicht möglich'),
        SP.t('Bewerten kann nur, wer eine beidseitige Freigabe hat und noch nicht bewertet hat.'));
    }
  });

  /* ---------- Sperrdialog ---------- */
  $('sp-abbrechen').addEventListener('click', function () {
    $('modal-sperre').classList.remove('show');
  });
  $('sp-setzen').addEventListener('click', function () {
    SP.db.sperren.setzen(betrachterId, zielId, $('sp-grund').value);
    $('modal-sperre').classList.remove('show');
    SP.toast('ok', SP.t('Sperre gesetzt'), SP.t('Das Profil ist für Sie ausgeblendet.'));
    w.location.reload();
  });
  d.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    $('modal-bewertung').classList.remove('show');
    $('modal-sperre').classList.remove('show');
  });

  /* ---------- Start ---------- */
  d.title = SP.db.profile.anzeigename(profil) + ' – Standard Plus';
  SP.audit('Profil aufgerufen', SP.db.profile.anzeigename(profil) + ' (' + recht + ')');
  kopfBauen();
  sichtBauen();
  aktionenBauen();
  inhaltBauen();

})(window, document);
