/* Standard Plus - Bedienung der Freitextsuche
   Zeichnet die verstandenen Kriterien und die Vorschlaege.
   Ausgabe ausschliesslich ueber die DOM-API, kein innerHTML. */
(function (w, d) {
  'use strict';
  var SP = w.SP;
  var $ = function (id) { return d.getElementById(id); };

  var sitzung = SP.session.get();
  var betrachterId = sitzung ? sitzung.kontoId : null;
  var richtung = 'arbeitnehmer';   /* wonach gesucht wird */

  var BEISPIELE = {
    arbeitnehmer: [
      SP.t('Polier für München, mindestens 5 Jahre Erfahrung, gutes Deutsch, sofort verfügbar'),
      SP.t('Pflegefachkraft mit Intensivpflege-Erfahrung und Deutsch B2'),
      SP.t('Berufskraftfahrer mit Klasse CE und Gefahrgut, bis 3000 Euro'),
      SP.t('Elektriker aus Italien oder Rumänien, umzugsbereit')
    ],
    arbeitgeber: [
      SP.t('Klinik in Berlin, die Unterkunft und Anerkennungsbegleitung bietet'),
      SP.t('Bauunternehmen in Bayern mit Deutschkurs und unbefristetem Vertrag'),
      SP.t('Gut bewertetes Unternehmen mit Fahrtkostenzuschuss'),
      SP.t('Großes Unternehmen im Bau, das einen Polier sucht')
    ]
  };

  /* Suchrichtung aus der Rolle vorbelegen: Arbeitnehmer suchen Unternehmen */
  if (sitzung && sitzung.role === 'arbeitnehmer') richtung = 'arbeitgeber';

  function richtungSetzen(neu) {
    richtung = neu;
    $('r-an').setAttribute('aria-pressed', String(neu === 'arbeitnehmer'));
    $('r-ag').setAttribute('aria-pressed', String(neu === 'arbeitgeber'));
    $('frage').placeholder = neu === 'arbeitnehmer'
      ? SP.t('Zum Beispiel: Ich suche einen Polier für München, mindestens 5 Jahre Erfahrung, gutes Deutsch, möglichst sofort verfügbar.')
      : SP.t('Zum Beispiel: Ich bin Pflegefachkraft und suche eine Klinik in Berlin, die eine Unterkunft stellt und bei der Anerkennung hilft.');
    beispieleZeichnen();
  }
  $('r-an').addEventListener('click', function () { richtungSetzen('arbeitnehmer'); });
  $('r-ag').addEventListener('click', function () { richtungSetzen('arbeitgeber'); });

  /* ---------- Autovervollstaendigung im Freitextfeld ----------
     Wortmodus: der Satz bleibt erhalten, nur das zuletzt getippte Wort
     wird ergaenzt. Die Vorschlaege richten sich nach der Suchrichtung -
     wer ein Unternehmen sucht, bekommt Leistungen statt Kenntnissen. */
  if (SP.autocomplete && SP.vok) {
    SP.autocomplete($('frage'), {
      wort: true, min: 2, max: 8,
      quelle: function () {
        return richtung === 'arbeitnehmer'
          ? SP.vok.eintraege(['beruf', 'branche', 'ort', 'region', 'land',
                              'kenntnis', 'sprache', 'verfuegbar'])
          : SP.vok.eintraege(['branche', 'ort', 'region', 'land',
                              'leistung', 'rechtsform']);
      }
    });
  }

  function beispieleZeichnen() {
    var box = $('beispiele');
    box.replaceChildren();
    box.appendChild(SP.el('span', 'tiny muted', SP.t('Beispiele zum Ausprobieren:')));
    BEISPIELE[richtung].forEach(function (t) {
      var b = SP.el('button', 'beispiel', t);
      b.type = 'button';
      b.addEventListener('click', function () {
        $('frage').value = t;
        suchen();
      });
      box.appendChild(b);
    });
  }

  /* ---------- Verstandene Kriterien anzeigen ---------- */
  function kriterienZeichnen(k) {
    var box = $('verstanden');
    box.replaceChildren();
    var liste = SP.suchtext.kriterienText(k);

    var karte = SP.el('div', 'card card-pad');
    var kopf = SP.el('p', 'tiny fw7 t-teal mb12', SP.t('DAS HABEN WIR VERSTANDEN'));
    karte.appendChild(kopf);

    if (!liste.length) {
      karte.appendChild(SP.el('p', 'small muted',
        SP.t('Aus Ihrem Text ließ sich kein bekanntes Kriterium herauslesen. Nennen Sie zum Beispiel einen Beruf, eine Stadt, ein Sprachniveau oder eine Frist. Es werden alle Profile nach allgemeiner Eignung sortiert.')));
      box.appendChild(karte);
      return;
    }

    var reihe = SP.el('div', 'kriterien');
    liste.forEach(function (e) {
      var chip = SP.el('span', 'kriterium');
      chip.appendChild(SP.el('span', null, SP.t(e.typ)));
      chip.appendChild(SP.el('b', null, e.wert));
      reihe.appendChild(chip);
    });
    karte.appendChild(reihe);
    karte.appendChild(SP.el('p', 'tiny muted mt12',
      SP.t('Fehlt etwas oder ist etwas falsch verstanden? Ergänzen Sie Ihren Satz und suchen Sie erneut.')));
    box.appendChild(karte);
  }

  /* ---------- Ein Vorschlag ---------- */
  function vorschlagKarte(e, istAG) {
    var p = e.profil;
    var karte = SP.el('article', 'vorschlag');

    var av = SP.el('span', 'ava ava-lg' + (istAG ? ' gold' : ''));
    av.appendChild(SP.el('span', null, SP.initials(SP.db.profile.anzeigename(p))));
    karte.appendChild(av);

    var mitte = SP.el('div', 'vorschlag-mitte');
    mitte.appendChild(SP.el('h3', null, SP.db.profile.anzeigename(p)));
    mitte.appendChild(SP.el('p', 'rolle', istAG
      ? [SP.db.BRANCHEN[p.branche], SP.tInhalt(p.rechtsform)].filter(Boolean).join(' · ')
      : SP.tInhalt(p.beruf) || SP.t('Ohne Berufsangabe')));
    mitte.appendChild(SP.el('p', 'ort', istAG
      ? [SP.tInhalt(p.ort), p.groesse ? SP.t('{n} Mitarbeitende', { n: p.groesse }) : ''].filter(Boolean).join(' · ')
      : [SP.tInhalt(p.ort), p.land, p.verfuegbar ? SP.t('verfügbar {wann}', { wann: SP.tInhalt(p.verfuegbar) }) : ''].filter(Boolean).join(' · ')));

    var gruende = SP.el('div', 'gruende');
    e.gruende.slice(0, 5).forEach(function (g) {
      var chip = SP.el('span', 'grund');
      chip.appendChild(SP.icon('check'));
      chip.appendChild(SP.el('span', null, SP.tInhalt(g)));
      gruende.appendChild(chip);
    });
    e.gegen.slice(0, 2).forEach(function (g) {
      var chip = SP.el('span', 'grund gegen');
      chip.appendChild(SP.icon('minus'));
      chip.appendChild(SP.el('span', null, SP.tInhalt(g)));
      gruende.appendChild(chip);
    });
    mitte.appendChild(gruende);

    var knopf = SP.el('a', 'btn btn-outline btn-sm mt12', SP.t('Profil ansehen'));
    knopf.href = 'standardplus-profil-ansicht.html?id=' + encodeURIComponent(p.kontoId);
    mitte.appendChild(knopf);
    karte.appendChild(mitte);

    var rechts = SP.el('div', 'vorschlag-rechts');
    rechts.appendChild(SP.el('p', 'treffer-wert ' +
      (e.wert >= 75 ? 'hoch' : (e.wert >= 50 ? 'mittel' : 'niedrig')), e.wert + ' %'));
    rechts.appendChild(SP.el('p', 'treffer-label', SP.t('Übereinstimmung')));
    karte.appendChild(rechts);

    SP.klickbar(karte, knopf);
    return karte;
  }

  /* ---------- Suche ausfuehren ---------- */
  function suchen() {
    var text = SP.clean($('frage').value, 400);
    var box = $('ergebnisse');
    box.replaceChildren();

    if (text.length < 3) {
      $('verstanden').replaceChildren();
      var hinweis = SP.el('div', 'notice notice-warn');
      hinweis.appendChild(SP.icon('info'));
      hinweis.appendChild(SP.el('span', null,
        SP.t('Bitte beschreiben Sie in einem Satz, was Sie suchen.')));
      box.appendChild(hinweis);
      return;
    }

    var k = SP.suchtext.analysieren(text);
    kriterienZeichnen(k);
    SP.audit('Freitextsuche', richtung + ': ' + text.slice(0, 80));

    var istAG = richtung === 'arbeitgeber';
    var treffer = istAG
      ? SP.suchtext.arbeitgeber(k, betrachterId)
      : SP.suchtext.arbeitnehmer(k, betrachterId);

    letzte = { treffer: treffer, istAG: istAG };
    ergebnisZeichnen();
  }

  /* ---------- Ansicht: Kartenstapel zum Wischen oder Liste ----------
     Gemerkt wird die Wahl nur mit Einwilligung "funktional" (SP.store). */
  var ansicht = SP.store.get('suchansicht', 'wischen') === 'liste' ? 'liste' : 'wischen';
  var letzte = null;

  function ansichtSetzen(neu) {
    ansicht = neu;
    SP.store.set('suchansicht', neu);
    ergebnisZeichnen();
  }

  function ergebnisZeichnen() {
    if (!letzte) return;
    var treffer = letzte.treffer, istAG = letzte.istAG;
    var box = $('ergebnisse');
    box.replaceChildren();

    var kopf = SP.el('div', 'flex jc-b ai-c wrapf g12 mb16');
    var titel = SP.el('div');
    titel.appendChild(SP.el('h2', 'h3', istAG ? SP.t('Passende Unternehmen') : SP.t('Passende Profile')));
    titel.appendChild(SP.el('p', 'small muted',
      SP.anzahl(treffer.length, '{n} Vorschlag, nach Übereinstimmung sortiert', '{n} Vorschläge, nach Übereinstimmung sortiert')));
    kopf.appendChild(titel);

    if (treffer.length) {
      var wahl = SP.el('div', 'ansicht-wahl');
      wahl.setAttribute('role', 'group');
      wahl.setAttribute('aria-label', SP.t('Ansicht'));
      [['wischen', 'karten', SP.t('Wischen')], ['liste', 'list', SP.t('Liste')]].forEach(function (x) {
        var b = SP.el('button');
        b.type = 'button';
        b.setAttribute('aria-pressed', String(ansicht === x[0]));
        b.appendChild(SP.icon(x[1], 'ic-sm'));
        b.appendChild(d.createTextNode(x[2]));
        b.addEventListener('click', function () { if (ansicht !== x[0]) ansichtSetzen(x[0]); });
        wahl.appendChild(b);
      });
      kopf.appendChild(wahl);
    }
    box.appendChild(kopf);

    if (!treffer.length) {
      var leer = SP.el('div', 'notice notice-warn');
      leer.appendChild(SP.icon('info'));
      leer.appendChild(SP.el('span', null, istAG
        ? SP.t('Es sind noch keine Unternehmensprofile hinterlegt.')
        : SP.t('Es sind noch keine Bewerberprofile hinterlegt.')));
      box.appendChild(leer);
      return;
    }

    if (ansicht === 'wischen' && SP.wischen) {
      var stapel = SP.el('div');
      box.appendChild(stapel);
      var wurzel = SP.wischen(stapel, treffer, {
        istAG: istAG, betrachterId: betrachterId, rolle: sitzung ? sitzung.role : null,
        zurListe: function () { ansichtSetzen('liste'); }
      });
      box.appendChild(SP.el('p', 'tiny muted mt24 wisch-fuss',
        SP.t('Die Prozentangabe zeigt, wie viele Ihrer Kriterien erfüllt sind – nicht die Eignung eines Menschen. Sie ist eine Sortierhilfe, keine Bewertung und keine Entscheidung.')));
      return wurzel;
    }

    treffer.forEach(function (e) { box.appendChild(vorschlagKarte(e, istAG)); });

    box.appendChild(SP.el('p', 'tiny muted mt16',
      SP.t('Die Prozentangabe zeigt, wie viele Ihrer Kriterien erfüllt sind – nicht die Eignung eines Menschen. Sie ist eine Sortierhilfe, keine Bewertung und keine Entscheidung.')));
  }

  $('suchen').addEventListener('click', suchen);
  $('frage').addEventListener('keydown', function (ev) {
    /* Enter sucht, Umschalt+Enter macht einen Zeilenumbruch.
       Hat die Vorschlagsliste das Enter schon verbraucht (Auswahl eines
       Begriffs), wird hier nicht zusaetzlich gesucht. */
    if (ev.defaultPrevented) return;
    if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); suchen(); }
  });

  /* Vorbelegung aus der Adresszeile, etwa von der Startseite */
  var vorgabe = new URLSearchParams(w.location.search).get('q');
  richtungSetzen(new URLSearchParams(w.location.search).get('art') === 'unternehmen'
    ? 'arbeitgeber' : richtung);
  if (vorgabe) {
    $('frage').value = SP.clean(vorgabe, 400);
    suchen();
  }

})(window, document);
