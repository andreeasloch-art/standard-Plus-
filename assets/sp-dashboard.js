/* Standard Plus - Dashboard
   Zeigt echte Zahlen aus SP.db statt erfundener Kennwerte und
   protokolliert jede Entscheidung nachvollziehbar. */
(function (w, d) {
  'use strict';
  var SP = w.SP;
  var $ = function (id) { return d.getElementById(id); };

  var sitzung = SP.session.get();
  if (!sitzung) return;
  var kontoId = sitzung.kontoId;
  var istAG = sitzung.role === 'arbeitgeber';
  var istTR = sitzung.role === 'transport';

  /* ---------- Begruessung ---------- */
  var h = new Date().getHours();
  var gruss = h < 11 ? SP.t('Guten Morgen') : (h < 18 ? SP.t('Guten Tag') : SP.t('Guten Abend'));
  var h1 = d.querySelector('.topbar h1');
  if (h1) h1.replaceChildren(d.createTextNode(gruss + ', ' + sitzung.user));
  var top = $('topline');
  if (top) {
    top.textContent = new Date().toLocaleDateString(SP.gebiet,
      { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) +
      (istAG ? '' : ' · ' + (istTR ? SP.t('Ihre Sicht als Beförderungsunternehmen')
                           : SP.t('Ihre Sicht als Arbeitnehmer')));
  }

  /* ---------- Kennzahlen aus der Datenbank ---------- */
  function kennzahlen() {
    var k = SP.db.kennzahlen(kontoId);
    var beschriftung = d.querySelectorAll('.kpi-l');

    /* Diese beiden gelten fuer beide Rollen gleich */
    $('kpi-freigaben').textContent = k.anfragenBeidseitig;
    $('kpi-offen').textContent = k.anfragenOffen;

    if (istAG) {
      $('kpi-profile').textContent = k.profile;
      $('kpi-stellen').textContent = SP.db.stellen.vonArbeitgeber(kontoId)
        .filter(function (s) { return s.offen; }).length;
      var textAG = [SP.t('Profile in der Datenbank'), SP.t('Beidseitige Freigaben'),
                    SP.t('Offene Anfragen'), SP.t('Eigene offene Stellen')];
      beschriftung.forEach(function (el, i) { if (textAG[i]) el.textContent = textAG[i]; });
      if ($('c-talente')) $('c-talente').textContent = k.profile;
    } else if (istTR) {
      /* Befoerderungsunternehmen sehen ihr eigenes Geschaeft */
      var meineLinien = SP.db.linien.vonUnternehmen(kontoId);
      var meineFahrten = SP.db.fahrten.fuerKonto(kontoId)
        .filter(function (f) { return f.unternehmenId === kontoId && f.status === 'gebucht'; });
      $('kpi-profile').textContent = meineLinien.length;
      $('kpi-freigaben').textContent = meineFahrten.length;
      $('kpi-offen').textContent = k.profile;
      $('kpi-stellen').textContent = k.unternehmen;
      var textTR = [SP.t('Eigene Linien'), SP.t('Gebuchte Fahrten'),
                    SP.t('Vermittelbare Arbeitskräfte'), SP.t('Unternehmen auf der Plattform')];
      beschriftung.forEach(function (el, i) { if (textTR[i]) el.textContent = textTR[i]; });
      if ($('c-talente')) $('c-talente').textContent = meineLinien.length;
      if ($('side-suchen')) $('side-suchen').textContent = SP.t('Linien ansehen');
      if ($('vorschlag-titel')) $('vorschlag-titel').textContent = SP.t('Ihre Linien');
      if ($('vorschlag-alle')) $('vorschlag-alle').href = 'standardplus-transport.html';
    } else {
      /* Arbeitnehmer sehen den Markt aus ihrer Sicht */
      $('kpi-profile').textContent = k.unternehmen;
      $('kpi-stellen').textContent = SP.db.stellen.liste().length;
      var textAN = [SP.t('Unternehmen auf der Plattform'), SP.t('Beidseitige Freigaben'),
                    SP.t('Anfragen an Sie'), SP.t('Offene Stellen insgesamt')];
      beschriftung.forEach(function (el, i) { if (textAN[i]) el.textContent = textAN[i]; });
      if ($('c-talente')) $('c-talente').textContent = k.unternehmen;
      if ($('side-suchen')) $('side-suchen').textContent = SP.t('Unternehmen finden');
      if ($('vorschlag-titel')) $('vorschlag-titel').textContent = SP.t('Passende Unternehmen');
      if ($('vorschlag-alle')) $('vorschlag-alle').href = 'standardplus-unternehmen.html';
    }
    return k;
  }

  /* ---------- Passende Profile ---------- */
  var STUFEN = { A1: 0, A2: 1, B1: 2, B2: 3, C1: 4, C2: 5 };
  var ICON = { pflege: 'health', bau: 'helmet', it: 'code', gastro: 'utensils',
               logistik: 'truck', produktion: 'factory', buero: 'office' };

  function bewerten(p) {
    var punkte = 55;
    if (p.erfahrung) punkte += Math.min(Number(p.erfahrung) || 0, 12) * 2;
    punkte += (STUFEN[p.deutsch] || 0) * 3;
    if ((p.faehigkeiten || []).length) punkte += Math.min(p.faehigkeiten.length, 4) * 2;
    if (p.verfuegbar === 'ab sofort') punkte += 4;
    return Math.max(50, Math.min(98, punkte));
  }

  /* Fuer Arbeitnehmer: Unternehmen mit offenen Stellen in der eigenen Branche */
  function unternehmenZeichnen() {
    var box = $('match-list');
    if (!box) return;
    box.replaceChildren();
    var meinProfil = SP.db.profile.holen(kontoId) || {};

    var liste = SP.db.profile.arbeitgeber(kontoId).map(function (p) {
      var stellen = SP.db.stellen.vonArbeitgeber(p.kontoId).filter(function (s) { return s.offen; });
      var punkte = 0;
      if (meinProfil.branche && p.branche === meinProfil.branche) punkte += 50;
      if (stellen.length) punkte += 25;
      var bw = SP.db.bewertungen.schnitt(p.kontoId);
      if (bw) punkte += Math.round(bw.wert * 5);
      return { p: p, stellen: stellen, wert: Math.min(98, punkte) };
    }).sort(function (a, b) { return b.wert - a.wert; }).slice(0, 4);

    if (!liste.length) {
      var leer = SP.el('div', 'notice notice-info');
      leer.appendChild(SP.icon('info'));
      leer.appendChild(SP.el('span', null, SP.t('Noch keine Unternehmensprofile hinterlegt.')));
      box.appendChild(leer);
      return;
    }

    liste.forEach(function (e) {
      var reihe = SP.el('div', 'lrow');
      var av = SP.el('span', 'ava gold');
      av.appendChild(SP.el('span', null, SP.initials(e.p.firma)));
      reihe.appendChild(av);

      var mitte = SP.el('span', 'lrow-main');
      mitte.appendChild(SP.el('strong', null, e.p.firma));
      mitte.appendChild(SP.el('span', null, [SP.db.BRANCHEN[e.p.branche], SP.tInhalt(e.p.ort),
        e.stellen.length ? SP.anzahl(e.stellen.length, '{n} offene Stelle', '{n} offene Stellen')
                         : SP.t('keine offene Stelle')].filter(Boolean).join(' · ')));
      reihe.appendChild(mitte);

      var ende = SP.el('span', 'lrow-end');
      var bw = SP.db.bewertungen.schnitt(e.p.kontoId);
      if (bw) {
        ende.appendChild(SP.el('span', 'score ' + (bw.wert >= 4.5 ? 'hi' : 'md'),
          SP.zahl(bw.wert, 1) + ' \u2605'));
      }
      var link = SP.el('a', 'btn btn-outline btn-sm', SP.t('Ansehen'));
      link.href = 'standardplus-profil-ansicht.html?id=' + encodeURIComponent(e.p.kontoId);
      ende.appendChild(link);
      reihe.appendChild(ende);
      SP.klickbar(reihe, link);
      box.appendChild(reihe);
    });
  }

  /* ---------- Eigene Linien im Dashboard ---------- */
  function eigeneLinienZeichnen() {
    var box = $('match-list');
    if (!box) return;
    var liste = SP.db.linien.vonUnternehmen(kontoId);
    box.replaceChildren();
    if (!liste.length) {
      var leer = SP.el('div', 'notice notice-info');
      leer.appendChild(SP.icon('info'));
      leer.appendChild(SP.el('span', null,
        SP.t('Noch keine Linie eingetragen. Unter „Mein Profil" legen Sie Strecke, Wochentage und Abfahrtszeit fest – danach erscheinen Sie in den Reisevorschlägen.')));
      box.appendChild(leer);
      return;
    }
    liste.forEach(function (l) {
      var reihe = SP.el('div', 'lrow');
      var ic = SP.el('span', 'act-ic');
      ic.appendChild(SP.icon('bus', 'ic-sm'));
      reihe.appendChild(ic);

      var mitte = SP.el('span', 'lrow-main');
      mitte.appendChild(SP.el('strong', null, SP.t('{von} nach {nach}', { von: SP.tInhalt(l.von), nach: SP.tInhalt(l.nach) })));
      mitte.appendChild(SP.el('span', null,
        l.tage.slice().sort().map(function (t) { return SP.t(SP.db.linien.KURZ[t]); }).join(', ') +
        ' · ' + SP.t('ab {zeit} Uhr', { zeit: l.abfahrt }) + ' · ' + SP.reiseplan.dauerText(Math.round(l.dauer * 60))));
      reihe.appendChild(mitte);

      var ende = SP.el('span', 'lrow-end');
      ende.appendChild(SP.el('span', 'score md', l.preis + ' €'));
      reihe.appendChild(ende);
      box.appendChild(reihe);
    });
  }

  function vorschlaegeZeichnen() {
    var box = $('match-list');
    if (!box) return;
    if (istTR) { eigeneLinienZeichnen(); return; }
    if (!istAG) { unternehmenZeichnen(); return; }
    var eigene = SP.db.anfragen.fuerKonto(kontoId).map(function (a) { return a.arbeitnehmerId; });
    /* Ausgeblendete fallen weg; wer schon Interesse gezeigt hat, steht oben eigens */
    var weg = SP.db.wischen.ausgeblendete(kontoId).concat(
      SP.db.wischen.interessenAn(kontoId).map(function (x) { return x.vonId; }));
    var profile = SP.db.profile.arbeitnehmer()
      .filter(function (p) { return eigene.indexOf(p.kontoId) === -1 && weg.indexOf(p.kontoId) === -1; })
      .map(function (p) { return { p: p, wert: bewerten(p) }; })
      .sort(function (a, b) { return b.wert - a.wert; })
      .slice(0, 4);

    box.replaceChildren();
    interessenZeichnen(box, eigene);

    if (!profile.length) {
      var leer = SP.el('div', 'notice notice-info');
      leer.appendChild(SP.icon('info'));
      leer.appendChild(SP.el('span', null,
        SP.t('Keine offenen Vorschläge. Alle passenden Profile haben Sie bereits angefragt.')));
      box.appendChild(leer);
    }

    profile.forEach(function (e) {
      var p = e.p;
      var gold = ['bau', 'gastro', 'logistik'].indexOf(p.branche) > -1;
      var reihe = SP.el('div', 'lrow');

      var av = SP.el('span', 'ava' + (gold ? ' gold' : ''));
      av.appendChild(SP.el('span', null, SP.initials(SP.db.profile.anzeigename(p))));
      if (ICON[p.branche]) {
        var r = SP.el('span', 'ava-role');
        r.appendChild(SP.icon(ICON[p.branche]));
        av.appendChild(r);
      }
      reihe.appendChild(av);

      var mitte = SP.el('span', 'lrow-main');
      mitte.appendChild(SP.el('strong', null, SP.db.profile.anzeigename(p)));
      mitte.appendChild(SP.el('span', null, [SP.tInhalt(p.beruf), SP.tInhalt(p.ort),
        p.erfahrung ? SP.anzahl(p.erfahrung, '{n} Jahr', '{n} Jahre') : ''].filter(Boolean).join(' · ')));
      reihe.appendChild(mitte);

      var ende = SP.el('span', 'lrow-end');
      ende.appendChild(SP.el('span',
        'score ' + (e.wert >= 90 ? 'hi' : (e.wert >= 80 ? 'md' : 'lo')), e.wert + ' %'));

      var ja = SP.el('button', 'mini yes');
      ja.type = 'button';
      ja.setAttribute('aria-label', SP.t('Anfrage an {name}', { name: SP.db.profile.anzeigename(p) }));
      ja.appendChild(SP.icon('heart', 'ic-sm'));
      ja.addEventListener('click', function () {
        if (sitzung.role !== 'arbeitgeber') {
          SP.toast('info', SP.t('Nur für Arbeitgeber'), SP.t('Anfragen können nur Arbeitgeberkonten stellen.'));
          return;
        }
        var offene = SP.db.stellen.vonArbeitgeber(kontoId).filter(function (x) { return x.offen; });
        SP.db.anfragen.anlegen(kontoId, p.kontoId, offene.length ? offene[0].id : null);
        SP.toast('ok', SP.t('Anfrage gesendet'),
          SP.t('{name} entscheidet über die Freigabe.', { name: SP.db.profile.anzeigename(p) }));
        kennzahlen();
        vorschlaegeZeichnen();
      });

      var nein = SP.el('button', 'mini no');
      nein.type = 'button';
      nein.setAttribute('aria-label', SP.t('{name} ausblenden', { name: SP.db.profile.anzeigename(p) }));
      nein.appendChild(SP.icon('x', 'ic-sm'));
      nein.addEventListener('click', function () {
        SP.db.wischen.ausblenden(kontoId, p.kontoId);
        reihe.hidden = true;
      });

      ende.appendChild(ja); ende.appendChild(nein);
      reihe.appendChild(ende);
      SP.klickbar(reihe, 'standardplus-profil-ansicht.html?id=' +
        encodeURIComponent(p.kontoId));
      box.appendChild(reihe);
    });

    /* Direkt in den Kartenstapel: Suche nach der eigenen offenen Stelle */
    var stelle = SP.db.stellen.vonArbeitgeber(kontoId).filter(function (x) { return x.offen; })[0];
    var wisch = SP.el('a', 'btn btn-outline btn-sm mt12');
    wisch.href = 'standardplus-suche.html' +
      (stelle ? '?q=' + encodeURIComponent(SP.tInhalt(stelle.titel)) : '');
    wisch.appendChild(SP.icon('karten', 'ic-sm'));
    wisch.appendChild(d.createTextNode(SP.t('Vorschläge wischen')));
    box.appendChild(wisch);
  }

  /* ---------- Interesse von Fachkraeften (Haken in der Wischansicht) ----------
     Sichtbar ist nur, was auch sonst ohne Freigabe sichtbar ist:
     Kurzname, Beruf, Ort. Die Anfrage bleibt ein eigener Schritt. */
  function interessenZeichnen(box, schonAngefragt) {
    var liste = SP.db.wischen.interessenAn(kontoId).filter(function (x) {
      return schonAngefragt.indexOf(x.vonId) === -1 && !SP.db.sperren.gesperrt(kontoId, x.vonId);
    }).map(function (x) {
      return { x: x, p: SP.db.profile.holen(x.vonId) };
    }).filter(function (e) { return e.p; });
    if (!liste.length) return;

    var kopf = SP.el('p', 'interesse-kopf');
    kopf.appendChild(SP.icon('heart', 'ic-sm'));
    kopf.appendChild(SP.el('span', null, SP.t('Interesse an Ihrem Unternehmen')));
    kopf.appendChild(SP.el('span', 'zahl', String(liste.length)));
    box.appendChild(kopf);

    liste.forEach(function (e) {
      var p = e.p;
      var reihe = SP.el('div', 'lrow interesse');
      var av = SP.el('span', 'ava');
      av.appendChild(SP.el('span', null, SP.initials(SP.db.profile.anzeigename(p))));
      reihe.appendChild(av);
      var mitte = SP.el('span', 'lrow-main');
      mitte.appendChild(SP.el('strong', null, SP.db.profile.anzeigename(p)));
      mitte.appendChild(SP.el('span', null, [SP.tInhalt(p.beruf), SP.tInhalt(p.ort),
        zeitform(e.x.datum)].filter(Boolean).join(' · ')));
      reihe.appendChild(mitte);

      var ende = SP.el('span', 'lrow-end');
      var anfragen = SP.el('button', 'btn btn-primary btn-sm');
      anfragen.type = 'button';
      anfragen.textContent = SP.t('Anfrage senden');
      anfragen.addEventListener('click', function () {
        var offene = SP.db.stellen.vonArbeitgeber(kontoId).filter(function (x) { return x.offen; });
        if (!SP.db.anfragen.anlegen(kontoId, p.kontoId, offene.length ? offene[0].id : null)) return;
        SP.toast('ok', SP.t('Anfrage gesendet'),
          SP.t('{name} entscheidet über die Freigabe.', { name: SP.db.profile.anzeigename(p) }));
        kennzahlen();
        vorschlaegeZeichnen();
      });
      ende.appendChild(anfragen);
      reihe.appendChild(ende);
      SP.klickbar(reihe, 'standardplus-profil-ansicht.html?id=' + encodeURIComponent(p.kontoId));
      box.appendChild(reihe);
    });
    box.appendChild(SP.el('p', 'interesse-kopf', SP.t('Weitere Vorschläge')));
  }

  /* ---------- Suche mit Autovervollstaendigung ---------- */
  var suche = $('suche');
  if (suche) {
    SP.autocomplete(suche, {
      quelle: SP.vok.quelle(['ort', 'region', 'beruf', 'branche', 'kenntnis', 'sprache'],
        SP.suchquellen.global(kontoId)),
      max: 9,
      aufAuswahl: function (eintrag) {
        /* Profile, Unternehmen und Stellen fuehren direkt zum Ziel,
           Berufe und Branchen in die gefilterte Talentsuche */
        w.location.href = eintrag.ziel ||
          ('standardplus-talente.html?q=' + encodeURIComponent(eintrag.text));
      }
    });
    suche.addEventListener('keydown', function (ev) {
      if (ev.key !== 'Enter') return;
      var q = SP.clean(suche.value, 80);
      if (!q) return;
      w.location.href = 'standardplus-talente.html?q=' + encodeURIComponent(q);
    });
  }

  /* ---------- Benachrichtigungen ---------- */
  var bell = $('btn-bell');
  if (bell) {
    bell.addEventListener('click', function () {
      var k = SP.db.kennzahlen(kontoId);
      SP.toast('info', SP.t('Ihr Stand'),
        SP.t('{offen} offene Anfragen, {freigaben} beidseitige Freigaben, {profile} Profile in der Datenbank.',
          { offen: k.anfragenOffen, freigaben: k.anfragenBeidseitig, profile: k.profile }));
      var dot = bell.querySelector('.dot');
      if (dot) dot.remove();
    });
  }

  /* ---------- Aktivitaeten aus der Datenbank ---------- */
  function zeitform(iso) {
    var min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    if (min < 1) return SP.t('gerade eben');
    if (min < 60) return SP.t('vor {n} Min.', { n: min });
    if (min < 1440) return SP.t('vor {n} Std.', { n: Math.round(min / 60) });
    return SP.anzahl(Math.round(min / 1440), 'vor {n} Tag', 'vor {n} Tagen');
  }

  function aktivitaetenZeichnen() {
    var box = $('aktivitaeten');
    if (!box) return;
    box.replaceChildren();

    var eintraege = [];
    SP.db.anfragen.fuerKonto(kontoId).forEach(function (a) {
      var status = SP.db.anfragen.status(a);
      var gegen = a.arbeitgeberId === kontoId ? a.arbeitnehmerId : a.arbeitgeberId;
      var name = SP.db.profile.anzeigename(SP.db.profile.holen(gegen)) || SP.t('Unbekannt');
      eintraege.push({
        zeit: a.entschieden || a.angelegt,
        icon: status === 'beidseitig' ? 'check' : (status === 'abgelehnt' ? 'x' : 'clock'),
        art: status === 'beidseitig' ? 'ok' : (status === 'abgelehnt' ? '' : 'gold'),
        titel: status === 'beidseitig' ? SP.t('Beidseitige Freigabe')
             : (status === 'abgelehnt' ? SP.t('Anfrage abgelehnt') : SP.t('Anfrage gestellt')),
        text: name
      });
    });
    SP.db.stellen.vonArbeitgeber(kontoId).forEach(function (st) {
      eintraege.push({ zeit: st.angelegt, icon: 'briefcase', art: 'gold',
        titel: SP.t('Stelle ausgeschrieben'), text: SP.tInhalt(st.titel) });
    });

    eintraege.sort(function (a, b) { return String(b.zeit).localeCompare(String(a.zeit)); });

    if (!eintraege.length) {
      var leer = SP.el('div', 'notice notice-info');
      leer.appendChild(SP.icon('info'));
      leer.appendChild(SP.el('span', null,
        SP.t('Noch keine Vorgänge. Sobald Sie eine Anfrage stellen, erscheint sie hier.')));
      box.appendChild(leer);
      return;
    }

    eintraege.slice(0, 6).forEach(function (e) {
      var reihe = SP.el('div', 'act');
      var ic = SP.el('span', 'act-ic ' + e.art);
      ic.appendChild(SP.icon(e.icon, 'ic-sm'));
      reihe.appendChild(ic);
      var mitte = SP.el('span', 'grow');
      mitte.appendChild(SP.el('strong', null, e.titel));
      mitte.appendChild(SP.el('span', null, e.text));
      reihe.appendChild(mitte);
      reihe.appendChild(SP.el('time', null, zeitform(e.zeit)));
      box.appendChild(reihe);
    });
  }

  /* ---------- Datenschutzstatus ---------- */
  function statusZeichnen(k) {
    var zwei = $('ds-2fa');
    if (zwei) zwei.textContent = sitzung.mfa
      ? SP.t('Für Ihr Konto aktiv und verpflichtend.')
      : SP.t('Noch nicht eingerichtet – bitte nachholen.');
    var zug = $('ds-zugriffe');
    if (zug) zug.textContent = SP.anzahl(SP.auditLog().length, '{n} protokollierter Vorgang in dieser Sitzung, im Datenschutz-Center einsehbar.',
      '{n} protokollierte Vorgänge in dieser Sitzung, im Datenschutz-Center einsehbar.');
    var off = $('ds-offen');
    if (off) off.textContent = k.anfragenOffen === 1
      ? SP.t('1 offene Anfrage') : SP.anzahl(k.anfragenOffen, '{n} offene Anfrage', '{n} offene Anfragen');
    var offT = $('ds-offen-text');
    if (offT) offT.textContent = k.anfragenOffen
      ? SP.t('Warten auf die Entscheidung der Gegenseite.')
      : SP.t('Aktuell wartet keine Anfrage auf eine Entscheidung.');
  }

  /* ============================================================
     Anreise
     ------------------------------------------------------------
     Sobald sich Arbeitgeber und Arbeitnehmer einig sind, entsteht
     hier die Frage nach der Anreise. Der Arbeitnehmer bekommt die
     Reisetage vorgeschlagen, die auf den hinterlegten Linien
     tatsaechlich fahren - von seinem Wohnort zum Arbeitsort.

     Sobald er einen Tag gewaehlt hat, sieht der Arbeitgeber, wann
     gefahren wird und wann angekommen ist.
     ============================================================ */

  function datumLang(iso) {
    var t = SP.db.fahrten.datumAus(iso);
    if (!t) return iso;
    return t.toLocaleDateString(SP.gebiet,
      { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }
  function tagZahl(iso) {
    var t = SP.db.fahrten.datumAus(iso);
    return t ? String(t.getDate()) : '–';
  }
  function monatKurz(iso) {
    var t = SP.db.fahrten.datumAus(iso);
    return t ? t.toLocaleDateString(SP.gebiet, { month: 'short' }) : '';
  }

  /* Alle Zusammenarbeiten, die beidseitig freigegeben sind */
  function einigungen() {
    return SP.db.anfragen.fuerKonto(kontoId).filter(function (a) {
      return SP.db.anfragen.status(a) === 'beidseitig';
    });
  }

  /* ---------- Eine gebuchte Anreise darstellen ---------- */
  function anreiseZeigen(box, fahrt, fuerAG) {
    var unternehmen = SP.db.profile.holen(fahrt.unternehmenId);
    var kasten = SP.el('div', 'anreise');

    var kopf = SP.el('div', 'anreise-kopf');
    kopf.appendChild(SP.icon('check'));
    kopf.appendChild(SP.el('b', null, fuerAG
      ? SP.t('Anreise steht fest')
      : SP.t('Ihre Anreise ist gebucht')));
    kopf.appendChild(SP.el('span', 'small',
      '· ' + ((unternehmen && unternehmen.firma) || SP.t('Beförderungsunternehmen'))));
    kasten.appendChild(kopf);

    var leib = SP.el('div', 'anreise-leib');
    var strecke = SP.el('div', 'anreise-strecke');

    var ab = SP.el('div', 'anreise-punkt');
    ab.appendChild(SP.el('p', 'ort', SP.tInhalt(fahrt.von)));
    ab.appendChild(SP.el('p', 'zeit', SP.t('Abfahrt {datum}, {zeit} Uhr',
      { datum: datumLang(fahrt.abfahrtDatum), zeit: fahrt.abfahrtZeit })));
    strecke.appendChild(ab);

    var pfeil = SP.el('div', 'anreise-pfeil');
    pfeil.appendChild(SP.icon('arrowright', 'ic-lg'));
    var tage = Math.round(
      (SP.db.fahrten.datumAus(fahrt.ankunftDatum) - SP.db.fahrten.datumAus(fahrt.abfahrtDatum))
      / 86400000);
    pfeil.appendChild(SP.el('span', null, fahrt.minuten
      ? SP.reiseplan.dauerText(fahrt.minuten)
      : (tage > 0 ? SP.t('über Nacht') : SP.t('am selben Tag'))));
    strecke.appendChild(pfeil);

    var an = SP.el('div', 'anreise-punkt rechts');
    an.appendChild(SP.el('p', 'ort', SP.tInhalt(fahrt.nach)));
    an.appendChild(SP.el('p', 'zeit', SP.t('Ankunft {datum}, {zeit} Uhr',
      { datum: datumLang(fahrt.ankunftDatum), zeit: fahrt.ankunftZeit })));
    strecke.appendChild(an);
    leib.appendChild(strecke);

    var marken = SP.el('div', 'flex wrapf g8 mt16');
    marken.appendChild(SP.el('span', 'tag tag-teal', SP.t('{preis} € je Platz', { preis: fahrt.preis })));
    if (unternehmen && unternehmen.telefon) {
      marken.appendChild(SP.el('span', 'tag', SP.t('Rückfragen: {telefon}', { telefon: unternehmen.telefon })));
    }
    leib.appendChild(marken);

    /* ---------- Womit und mit wem ----------
       Das ist der Teil, den man vom Fahrdienst kennt: Kennzeichen,
       Fahrzeug, Fahrer. Der Fahrername steht hier nur, weil diese
       Person tatsaechlich diese Fahrt faehrt - nicht im oeffentlichen
       Verzeichnis. */
    var ein = SP.db.fahrten.einteilung(fahrt);
    var kasten2 = SP.el('div', 'einteilung mt16');

    if (ein.fahrzeug) {
      var fz = ein.fahrzeug;
      var zeileFz = SP.el('div', 'einteilung-zeile');

      var schild = SP.el('span', 'kennzeichen');
      schild.appendChild(SP.el('span', 'kz-eu', 'EU'));
      schild.appendChild(SP.el('span', 'kz-text', fz.kennzeichen));
      zeileFz.appendChild(schild);

      var textFz = SP.el('div');
      textFz.appendChild(SP.el('strong', null,
        SP.t(SP.db.fahrzeuge.ARTEN[fz.art]) + (fz.marke ? ' · ' + fz.marke : '')));
      textFz.appendChild(SP.el('span', 'klein',
        [SP.t('{n} Plätze', { n: fz.plaetze }), fz.baujahr ? SP.t('Baujahr {jahr}', { jahr: fz.baujahr }) : '',
         (fz.ausstattung || []).map(SP.tInhalt).join(', ')].filter(Boolean).join(' · ')));
      zeileFz.appendChild(textFz);
      kasten2.appendChild(zeileFz);
    }

    if (ein.fahrer) {
      var fr = ein.fahrer;
      var zeileFr = SP.el('div', 'einteilung-zeile');
      var av = SP.el('span', 'ava');
      av.appendChild(SP.el('span', null, SP.initials(fr.name)));
      zeileFr.appendChild(av);
      var textFr = SP.el('div');
      textFr.appendChild(SP.el('strong', null, SP.t('{name} fährt', { name: fr.name })));
      textFr.appendChild(SP.el('span', 'klein',
        [(fr.sprachen || []).length ? SP.t('spricht {sprachen}', { sprachen: fr.sprachen.map(SP.tInhalt).join(', ') }) : '',
         fuerAG ? '' : fr.telefon].filter(Boolean).join(' · ')));
      zeileFr.appendChild(textFr);
      kasten2.appendChild(zeileFr);
    }

    if (!ein.vollstaendig) {
      var wartet = SP.el('p', 'hint mb0' + (ein.fahrzeug || ein.fahrer ? ' mt12' : ''));
      wartet.appendChild(SP.icon('clock', 'ic-sm'));
      wartet.appendChild(d.createTextNode(
        !ein.fahrzeug && !ein.fahrer
          ? SP.t('Fahrzeug und Fahrer werden vom Unternehmen noch eingeteilt.')
          : (!ein.fahrer
              ? SP.t('Wer fährt, steht meist erst kurz vorher fest. Sie sehen es hier, sobald es eingeteilt ist.')
              : SP.t('Das Fahrzeug wird noch eingeteilt.'))));
      kasten2.appendChild(wartet);
    }
    leib.appendChild(kasten2);

    var linieF = SP.db.linien.byId(fahrt.linienId);
    if (linieF) {
      leib.appendChild(SP.reiseplan.klappbar(linieF,
        { vonIndex: fahrt.vonIndex, nachIndex: fahrt.nachIndex },
        SP.t('Reiseplan mit allen Halten')));
    }

    /* Meldung an den Fahrgast, wenn neu eingeteilt wurde */
    if (!fuerAG && ein.vollstaendig && !fahrt.einteilungGesehen) {
      SP.db.fahrten.einteilungGesehen(fahrt.id);
      SP.toast('ok', SP.t('Fahrzeug und Fahrer stehen fest'),
        ein.fahrzeug.kennzeichen + ' · ' + SP.db.fahrzeuge.ARTEN[ein.fahrzeug.art] +
        ' · ' + SP.t('{name} fährt.', { name: ein.fahrer.name }));
    }

    if (!fuerAG) {
      var weg = SP.el('button', 'btn btn-outline btn-sm mt16', SP.t('Anreise stornieren'));
      weg.type = 'button';
      weg.addEventListener('click', function () {
        SP.db.fahrten.stornieren(fahrt.id, kontoId);
        anreiseZeichnen();
        SP.toast('ok', SP.t('Storniert'), SP.t('Sie können einen anderen Tag wählen.'));
      });
      leib.appendChild(weg);
    } else if (!fahrt.gesehenAG) {
      /* Fuer den Arbeitgeber ist das die eigentliche Benachrichtigung */
      SP.db.fahrten.alsGesehen(fahrt.id);
      SP.toast('ok', SP.t('Anreise gemeldet'),
        SP.t('Abfahrt {ab}, Ankunft {an} um {zeit} Uhr.',
          { ab: datumLang(fahrt.abfahrtDatum), an: datumLang(fahrt.ankunftDatum), zeit: fahrt.ankunftZeit }));
    }

    kasten.appendChild(leib);
    box.appendChild(kasten);
  }

  /* ---------- Vorschlaege fuer den Arbeitnehmer ---------- */
  function vorschlaegeAnreise(box, anfrage, eigenerOrt, zielOrt, agName) {
    var heute = SP.db.fahrten.textAus(new Date());
    var treffer = SP.db.fahrten.vorschlagen(eigenerOrt, zielOrt, heute, null).slice(0, 6);

    var kopf = SP.el('p', 'small mb8');
    /* Ganzer Satz mit Platzhaltern - die Orte werden danach fett gesetzt */
    SP.t('Von {von} nach {nach} – für Ihre Zusammenarbeit mit {firma}.',
      { von: '\u0001', nach: '\u0002', firma: agName })
      .split(/(\u0001|\u0002)/).forEach(function (teil) {
        if (teil === '\u0001') kopf.appendChild(SP.el('b', null, eigenerOrt));
        else if (teil === '\u0002') kopf.appendChild(SP.el('b', null, zielOrt));
        else if (teil) kopf.appendChild(d.createTextNode(teil));
      });
    box.appendChild(kopf);

    if (!treffer.length) {
      var leer = SP.el('div', 'notice notice-warn mt12');
      leer.appendChild(SP.icon('info'));
      leer.appendChild(SP.el('span', null,
        SP.t('Auf dieser Strecke fährt derzeit keine hinterlegte Linie. Fragen Sie ein Beförderungsunternehmen direkt an – die Übersicht finden Sie unter „Alle Linien ansehen".')));
      box.appendChild(leer);
      return;
    }

    box.appendChild(SP.el('p', 'tiny muted mb8',
      SP.anzahl(treffer.length, '{n} möglicher Reisetag.', '{n} mögliche Reisetage, nach Abfahrt sortiert. Der früheste ist hervorgehoben.')));

    var liste = SP.el('div', 'reise-liste');
    treffer.forEach(function (v, i) {
      var unternehmen = SP.db.profile.holen(v.unternehmenId);
      var reihe = SP.el('div', 'reise' + (i === 0 ? ' empfohlen' : ''));

      var tag = SP.el('div', 'reise-tag');
      tag.appendChild(SP.el('b', null, tagZahl(v.abfahrtDatum)));
      tag.appendChild(SP.el('span', null, monatKurz(v.abfahrtDatum)));
      reihe.appendChild(tag);

      var weg = SP.el('div', 'reise-weg');
      weg.appendChild(SP.el('strong', null, SP.t('{tag}, Abfahrt {zeit} Uhr', { tag: SP.t(v.wochentag), zeit: v.abfahrtZeit })));
      weg.appendChild(SP.el('span', 'zeiten',
        SP.t('Ankunft {datum}, {zeit} Uhr', { datum: datumLang(v.ankunftDatum), zeit: v.ankunftZeit }) +
        (v.ueberNacht ? ' (' + SP.t('über Nacht') + ')' : '') + ' · ' +
        SP.t('{dauer} unterwegs', { dauer: SP.reiseplan.dauerText(v.minuten) })));
      weg.appendChild(SP.el('span', 'firma',
        ((unternehmen && unternehmen.firma) || SP.t('Beförderungsunternehmen')) +
        (v.zwischenhalte.length ? ' · ' + SP.t('über {orte}', { orte: v.zwischenhalte.map(SP.tInhalt).join(', ') }) : '') +
        ' · ' + SP.anzahl(v.frei, '{n} Platz frei', '{n} Plätze frei')));
      reihe.appendChild(weg);

      var ende = SP.el('div', 'reise-ende');
      ende.appendChild(SP.el('span', 'reise-preis', v.preis + ' €'));
      var buchen = SP.el('button', 'btn btn-primary btn-sm', SP.t('Diesen Tag wählen'));
      buchen.type = 'button';
      buchen.addEventListener('click', function () {
        var f = SP.db.fahrten.buchen(v, kontoId, anfrage.arbeitgeberId, anfrage.id);
        if (!f) return;
        anreiseZeichnen();
        SP.toast('ok', SP.t('Anreise eingetragen'),
          SP.t('{firma} wird benachrichtigt: Abfahrt {ab}, Ankunft {an} um {zeit} Uhr.',
            { firma: agName, ab: datumLang(f.abfahrtDatum), an: datumLang(f.ankunftDatum), zeit: f.ankunftZeit }));
      });
      ende.appendChild(buchen);
      reihe.appendChild(ende);

      /* Der Verlauf gehoert unter den Vorschlag, nicht daneben -
         sonst wird die Zeile zu breit zum Lesen. */
      var huelle = SP.el('div', 'reise-huelle');
      huelle.appendChild(reihe);
      var linie = SP.db.linien.byId(v.linienId);
      if (linie) {
        huelle.appendChild(SP.reiseplan.klappbar(linie,
          { vonIndex: v.vonIndex, nachIndex: v.nachIndex },
          SP.t('Wie gefahren wird')));
      }
      liste.appendChild(huelle);
    });
    box.appendChild(liste);
  }

  /* ---------- Anreiseblock zeichnen ---------- */
  function anreiseZeichnen() {
    var karte = $('anreise-karte'), box = $('anreise-inhalt');
    if (!karte || !box) return;
    box.replaceChildren();

    /* Befoerderungsunternehmen sehen hier ihre Buchungen */
    if (istTR) {
      var buchungen = SP.db.fahrten.fuerKonto(kontoId)
        .filter(function (f) { return f.unternehmenId === kontoId && f.status === 'gebucht'; });
      karte.hidden = false;
      $('anreise-titel').textContent = SP.t('Buchungen auf Ihren Linien');
      if (!buchungen.length) {
        box.appendChild(SP.el('p', 'leerhinweis',
          SP.t('Noch keine Buchung. Tragen Sie unter „Mein Profil" Ihre Linien ein.')));
        return;
      }
      buchungen.sort(function (a, b) { return a.abfahrtDatum < b.abfahrtDatum ? -1 : 1; });
      buchungen.forEach(function (f) { anreiseZeigen(box, f, true); });
      return;
    }

    var offen = einigungen();
    if (!offen.length) { karte.hidden = true; return; }
    karte.hidden = false;
    $('anreise-titel').textContent = istAG ? SP.t('Anreise Ihrer Fachkraft') : SP.t('Ihre Anreise');

    offen.forEach(function (a) {
      var agProfil = SP.db.profile.holen(a.arbeitgeberId);
      var anProfil = SP.db.profile.holen(a.arbeitnehmerId);
      var fahrt = SP.db.fahrten.zwischen(a.arbeitnehmerId, a.arbeitgeberId);

      if (fahrt) { anreiseZeigen(box, fahrt, istAG); return; }

      if (istAG) {
        var warten = SP.el('div', 'notice notice-info');
        warten.appendChild(SP.icon('clock'));
        warten.appendChild(SP.el('span', null,
          SP.t('{name} hat noch keinen Reisetag gewählt. Sobald das geschehen ist, sehen Sie hier Abfahrt und Ankunft.',
            { name: SP.db.profile.anzeigename(anProfil) || SP.t('Die Fachkraft') })));
        box.appendChild(warten);
        return;
      }

      var vonOrt = (anProfil && anProfil.ort) || '';
      var nachOrt = (agProfil && agProfil.ort) || '';
      if (!vonOrt || !nachOrt) {
        var fehlt = SP.el('div', 'notice notice-warn');
        fehlt.appendChild(SP.icon('info'));
        fehlt.appendChild(SP.el('span', null,
          (!vonOrt ? SP.t('Für Reisevorschläge fehlt Ihr Wohnort im Profil.')
            : SP.t('Für Reisevorschläge fehlt der Arbeitsort des Unternehmens.'))));
        box.appendChild(fehlt);
        return;
      }
      vorschlaegeAnreise(box, a, vonOrt, nachOrt,
        (agProfil && agProfil.firma) || SP.t('dem Unternehmen'));
    });
  }

  var k = kennzahlen();
  anreiseZeichnen();
  vorschlaegeZeichnen();
  aktivitaetenZeichnen();
  statusZeichnen(k);

})(window, document);
