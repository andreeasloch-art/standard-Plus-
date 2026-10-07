/* ============================================================
   Standard Plus - Freitextsuche mit Empfehlungen
   ------------------------------------------------------------
   Sie schreiben in normaler Sprache, was Sie suchen. Der Text
   wird nach bekannten Begriffen durchsucht (Berufe, Branchen,
   Orte, Sprachniveaus, Fristen, Zahlen) und daraus entstehen
   Suchkriterien. Diese Kriterien werden angezeigt, damit
   nachvollziehbar bleibt, worauf die Vorschlaege beruhen.

   Wichtig zur Einordnung: Das ist eine regelbasierte Auswertung
   mit festem Woerterbuch, kein Sprachmodell. Sie versteht, was
   im Woerterbuch steht - nicht mehr. Genau deshalb kann sie
   jeden Vorschlag begruenden.
   ============================================================ */
(function (w, d) {
  'use strict';
  var SP = w.SP;

  /* Vergleichsform: Kleinschreibung, keine Umlaute, keine Akzente.
     Die Umschreibungen ue/oe/ae werden ebenfalls aufgeloest - und zwar
     auf beiden Seiten des Vergleichs. So findet "Muenchen" auch
     "München", ohne dass die Trefferlogik doppelt gefuehrt werden muss. */
  function norm(s) {
    return String(s == null ? '' : s).toLowerCase()
      .replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 'ss')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/ae/g, 'a').replace(/oe/g, 'o').replace(/ue/g, 'u');
  }

  /* Kurze Begriffe wie "it" oder "bau" duerfen nicht in anderen Woertern
     gefunden werden ("mit", "Gefahrgut"). Ab vier Zeichen genuegt Teiltreffer. */
  function enthaelt(text, wort) {
    if (wort.length > 3) return text.indexOf(wort) > -1;
    var sicher = wort.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp('(^|[^a-z0-9])' + sicher + '([^a-z0-9]|$)').test(text);
  }

  /* ---------- Woerterbuecher ---------- */
  var BERUFE = {
    pflege: ['pflege', 'pflegekraft', 'pflegefachkraft', 'krankenschwester', 'krankenpfleger',
             'altenpfleger', 'altenpflegerin', 'intensivpflege', 'gesundheits', 'pfleger',
             'medizin', 'klinik', 'krankenhaus', 'stationsleitung', 'palliativ', 'demenz',
             'nurse', 'nursing', 'carer', 'caregiver', 'hospital', 'asistent medical', 'asistenta medicala',
             'ingrijire', 'infirmier', 'infirmiera', 'spital'],
    bau: ['bau', 'polier', 'baufuhrer', 'bauleiter', 'maurer', 'rohbau', 'stahlbeton',
          'elektriker', 'elektroinstallateur', 'handwerker', 'schweisser', 'zimmerer',
          'dachdecker', 'installateur', 'monteur', 'kran', 'geruestbauer', 'fliesenleger',
          'construction', 'foreman', 'site manager', 'maistru', 'bricklayer', 'electrician', 'welder', 'carpenter', 'constructii',
          'zidar', 'electrician', 'sudor', 'dulgher', 'instalator', 'faiantar'],
    it: ['it', 'entwickler', 'developer', 'programmierer', 'softwareentwickler', 'informatiker',
         'systemadministrator', 'admin', 'netzwerk', 'react', 'java', 'python', 'linux',
         'datenbank', 'devops', 'frontend', 'backend', 'fullstack', 'full-stack',
         'software', 'programmer', 'engineer', 'database', 'programator', 'inginer software'],
    gastro: ['koch', 'kochin', 'kuche', 'gastronomie', 'restaurant', 'hotel', 'sous chef',
             'chefkoch', 'service', 'kellner', 'patisserie', 'barkeeper', 'hotelfach',
             'cook', 'chef', 'kitchen', 'waiter', 'waitress', 'bucatar', 'bucatarie', 'ospatar', 'hotelier'],
    logistik: ['fahrer', 'kraftfahrer', 'berufskraftfahrer', 'lkw', 'lastwagen', 'logistik',
               'spedition', 'lager', 'lagerist', 'staplerfahrer', 'kurier', 'transport',
               'driver', 'truck', 'warehouse', 'forklift', 'courier', 'sofer', 'camion', 'depozit',
               'stivuitor', 'curier', 'logistica'],
    produktion: ['produktion', 'industrie', 'maschinenbediener', 'fertigung', 'montage',
                 'zerspanung', 'schlosser', 'mechaniker', 'techniker', 'werker',
                 'production', 'factory', 'machine operator', 'mechanic', 'productie', 'fabrica',
                 'operator', 'mecanic', 'lacatus', 'tehnician'],
    buero: ['buro', 'verwaltung', 'sachbearbeiter', 'buchhalter', 'buchhaltung', 'assistenz',
            'sekretariat', 'kaufmann', 'kauffrau', 'personal', 'controlling',
            'office', 'accountant', 'administration', 'birou', 'contabil', 'contabilitate', 'secretara']
  };

  /* Anzeigeform der Orte, damit in den Kriterien nicht die Vergleichsform steht */
  var ORT_NAME = {
    munchen: 'München', koln: 'Köln', dusseldorf: 'Düsseldorf', nurnberg: 'Nürnberg',
    zurich: 'Zürich', thuringen: 'Thüringen', 'baden-wurttemberg': 'Baden-Württemberg',
    'nordrhein-westfalen': 'Nordrhein-Westfalen', 'rheinland-pfalz': 'Rheinland-Pfalz'
  };

  var ORTE = ['munchen', 'berlin', 'hamburg', 'koln', 'frankfurt', 'stuttgart', 'dusseldorf',
              'leipzig', 'dresden', 'nurnberg', 'hannover', 'bremen', 'essen', 'dortmund',
              'wien', 'graz', 'linz', 'salzburg', 'zurich', 'basel', 'bern',
              'bayern', 'sachsen', 'hessen', 'niedersachsen', 'brandenburg', 'thuringen',
              'baden-wurttemberg', 'nordrhein-westfalen', 'rheinland-pfalz'];

  /* Englische und rumaenische Ortsnamen auf die deutsche Vergleichsform */
  var ORT_ALIAS = {
    munich: 'munchen', cologne: 'koln', vienna: 'wien', viena: 'wien', nuremberg: 'nurnberg',
    zurich: 'zurich', bavaria: 'bayern', saxony: 'sachsen', hesse: 'hessen', hessa: 'hessen',
    'lower saxony': 'niedersachsen', 'saxonia inferioara': 'niedersachsen', thuringia: 'thuringen',
    turingia: 'thuringen', 'north rhine-westphalia': 'nordrhein-westfalen',
    'renania de nord-westfalia': 'nordrhein-westfalen', 'rhineland-palatinate': 'rheinland-pfalz',
    'renania-palatinat': 'rheinland-pfalz', saxonia: 'sachsen'
  };

  var LAENDER = {
    RO: ['rumanien', 'rumanisch', 'rumane', 'rumanin', 'romania', 'romanian', 'roman', 'romanca'],
    PL: ['polen', 'polnisch', 'pole', 'polin', 'poland', 'polish', 'polonia', 'polonez'],
    BG: ['bulgarien', 'bulgarisch', 'bulgare', 'bulgaria', 'bulgarian', 'bulgar'],
    HU: ['ungarn', 'ungarisch', 'ungar', 'hungary', 'hungarian', 'ungaria', 'maghiar'],
    IT: ['italien', 'italienisch', 'italiener', 'italy', 'italian', 'italia'],
    CZ: ['tschechien', 'tschechisch', 'czechia', 'czech', 'cehia'],
    HR: ['kroatien', 'kroatisch', 'croatia', 'croatian', 'croatia'],
    SK: ['slowakei', 'slowakisch', 'slovakia', 'slovak', 'slovacia'],
    DE: ['deutschland', 'deutsche', 'germany', 'germania']
  };

  var LEISTUNGEN = {
    unterkunft: ['unterkunft', 'wohnung', 'wohnraum', 'zimmer', 'unterbringung', 'werkswohnung',
                 'accommodation', 'housing', 'cazare', 'locuinta'],
    sprachkurs: ['sprachkurs', 'deutschkurs', 'sprachschule', 'sprachforderung',
                 'language course', 'german course', 'curs de limba', 'curs de germana'],
    fahrtkosten: ['fahrtkosten', 'anreise', 'fahrtkostenzuschuss', 'reisekosten',
                  'travel costs', 'travel expenses', 'travel allowance', 'costuri de transport', 'decontare transport',
                  'decontarea transportului', 'decontarea costurilor de transport'],
    anerkennung: ['anerkennung', 'anerkennungsverfahren', 'berufsanerkennung',
                  'recognition', 'recunoastere'],
    unbefristet: ['unbefristet', 'festanstellung', 'dauerstelle',
                  'permanent', 'nedeterminat', 'perioada nedeterminata'],
    kita: ['kita', 'kinderbetreuung', 'betriebskindergarten', 'childcare', 'gradinita']
  };

  /* ---------- Freitext auswerten ---------- */
  SP.suchtext = {

    analysieren: function (text) {
      var t = ' ' + norm(text) + ' ';
      var k = {
        rohtext: SP.clean(text, 400),
        branchen: [], berufsworte: [], orte: [], laender: [], faehigkeiten: [],
        leistungen: [], sprachniveau: null, verfuegbarSofort: false,
        erfahrungMin: null, gehaltMax: null, fuehrerschein: null,
        bewertungMin: null, groesse: null
      };

      /* Branchen und Berufsbegriffe */
      Object.keys(BERUFE).forEach(function (branche) {
        BERUFE[branche].forEach(function (wort) {
          if (enthaelt(t, wort)) {
            if (k.branchen.indexOf(branche) < 0) k.branchen.push(branche);
            if (k.berufsworte.indexOf(wort) < 0) k.berufsworte.push(wort);
          }
        });
      });

      /* Orte und Herkunftslaender */
      ORTE.forEach(function (o) { if (enthaelt(t, o)) k.orte.push(o); });
      Object.keys(ORT_ALIAS).forEach(function (a) {
        if (enthaelt(t, a) && k.orte.indexOf(ORT_ALIAS[a]) < 0) k.orte.push(ORT_ALIAS[a]);
      });
      Object.keys(LAENDER).forEach(function (code) {
        LAENDER[code].forEach(function (wort) {
          if (enthaelt(t, wort) && k.laender.indexOf(code) < 0) k.laender.push(code);
        });
      });

      /* Sprachniveau: ausdruecklich genannt oder umschrieben */
      var stufe = t.match(/\b([abc][12])\b/);
      if (stufe) k.sprachniveau = stufe[1].toUpperCase();
      else if (/(sehr gut|fliessend|verhandlungssicher)e?s? deutsch|fluent german|germana fluent|germana foarte bun/.test(t)) k.sprachniveau = 'C1';
      else if (/gute?s? deutsch|deutsch.{0,12}(gut|sicher)|good german|germana bun/.test(t)) k.sprachniveau = 'B2';
      else if (/deutsch|deutschkenntnis|german|germana/.test(t)) k.sprachniveau = 'B1';

      /* Verfuegbarkeit */
      if (/sofort|kurzfristig|umgehend|ab sofort|schnell|dringend|immediately|asap|urgent|imediat|urgent|cat mai repede/.test(t)) k.verfuegbarSofort = true;

      /* Berufserfahrung */
      var erf = t.match(/(\d{1,2})\s*(\+)?\s*jahre?n?\s*(berufs)?erfahrung/) ||
                t.match(/(?:mindestens|min\.?|ab)\s*(\d{1,2})\s*jahre/) ||
                t.match(/(\d{1,2})\s*(\+)?\s*years?\s*(of\s*)?experience/) ||
                t.match(/(?:at least|minimum)\s*(\d{1,2})\s*years/) ||
                t.match(/(\d{1,2})\s*(\+)?\s*ani\s*(de\s*)?experienta/) ||
                t.match(/(?:minimum|cel putin)\s*(\d{1,2})\s*ani/);
      if (erf) k.erfahrungMin = parseInt(erf[1], 10);
      else if (/sehr erfahren|langjahrig|routiniert|very experienced|foarte experimentat/.test(t)) k.erfahrungMin = 8;
      else if (/\berfahren\b|\bexperienced\b|\bexperimentat/.test(t)) k.erfahrungMin = 5;
      else if (/berufseinsteiger|einsteiger|ohne erfahrung|no experience|entry level|fara experienta|incepator/.test(t)) k.erfahrungMin = 0;

      /* Gehaltsobergrenze */
      var geld = t.match(/(?:bis|max\.?|maximal|hochstens|nicht mehr als|up to|at most|pana la|cel mult)\s*(\d[\d.,]{2,6})\s*(?:euro|eur|€)?/);
      if (geld) {
        var wert = parseInt(geld[1].replace(/[.,]/g, ''), 10);
        if (wert > 300 && wert < 100000) k.gehaltMax = wert;
      }

      /* Fuehrerschein */
      var fs = t.match(/\b(?:klasse|class|categoria|categorie)\s*(ce|c1|c|be|b)\b/) || t.match(/\b(ce|c1)\s*(?:schein|fuhrerschein|licen[cs]e|permis)/);
      if (fs) k.fuehrerschein = fs[1].toUpperCase();
      else if (/fuhrerschein|fahrerlaubnis|driving licen[cs]e|permis de conducere/.test(t)) k.fuehrerschein = 'B';

      /* Bewertung */
      if (/gut bewertet|bestbewertet|top bewertung|zuverlassig|serios|well rated|top rated|reliable|bine evaluat|de incredere/.test(t)) k.bewertungMin = 4;

      /* Unternehmensgroesse */
      if (/klein(es)? (unternehmen|betrieb|firma)|familienbetrieb|small (company|business|firm)|family business|firma mica|afacere de familie/.test(t)) k.groesse = 'klein';
      else if (/konzern|gross(es)? unternehmen|grossunternehmen|large (company|corporation)|corporation|corporatie|firma mare/.test(t)) k.groesse = 'gross';

      /* Leistungen fuer Mitarbeitende */
      Object.keys(LEISTUNGEN).forEach(function (key) {
        LEISTUNGEN[key].forEach(function (wort) {
          if (enthaelt(t, wort) && k.leistungen.indexOf(key) < 0) k.leistungen.push(key);
        });
      });

      /* Freie Fachbegriffe aus den vorhandenen Profilen */
      var bekannt = {};
      SP.db.profile.arbeitnehmer().forEach(function (p) {
        (p.faehigkeiten || []).forEach(function (f) { bekannt[norm(f)] = f; });
      });
      Object.keys(bekannt).forEach(function (nf) {
        if (nf.length > 3 && enthaelt(t, nf)) k.faehigkeiten.push(bekannt[nf]);
      });

      return k;
    },

    /* Kriterien in lesbare Stichworte uebersetzen */
    kriterienText: function (k) {
      var BRANCHEN = SP.db.BRANCHEN;
      var LEIST_TEXT = {
        unterkunft: 'Unterkunft', sprachkurs: 'Sprachkurs', fahrtkosten: 'Fahrtkosten',
        anerkennung: 'Anerkennung', unbefristet: 'unbefristet', kita: 'Kinderbetreuung'
      };
      var liste = [];
      k.branchen.forEach(function (b) { liste.push({ typ: 'Branche', wert: SP.tInhalt(BRANCHEN[b] || b) }); });
      k.orte.forEach(function (o) {
        liste.push({ typ: 'Ort', wert: SP.tInhalt(ORT_NAME[o] || (o.charAt(0).toUpperCase() + o.slice(1))) });
      });
      k.laender.forEach(function (l) { liste.push({ typ: 'Herkunft', wert: (SP.vok ? SP.vok.landName(l) : l) }); });
      k.faehigkeiten.forEach(function (f) { liste.push({ typ: 'Kenntnis', wert: f }); });
      if (k.sprachniveau) liste.push({ typ: 'Deutsch', wert: SP.t('ab {stufe}', { stufe: k.sprachniveau }) });
      if (k.verfuegbarSofort) liste.push({ typ: 'Verfügbar', wert: SP.t('kurzfristig') });
      if (k.erfahrungMin != null) liste.push({ typ: 'Erfahrung', wert: SP.anzahl(k.erfahrungMin, 'ab {n} Jahr', 'ab {n} Jahren') });
      if (k.gehaltMax) liste.push({ typ: 'Budget', wert: SP.t('bis {betrag} €', { betrag: k.gehaltMax.toLocaleString(SP.gebiet) }) });
      if (k.fuehrerschein) liste.push({ typ: 'Führerschein', wert: SP.t('Klasse {klasse}', { klasse: k.fuehrerschein }) });
      if (k.bewertungMin) liste.push({ typ: 'Bewertung', wert: SP.anzahl(k.bewertungMin, 'ab {n} Stern', 'ab {n} Sternen') });
      if (k.groesse) liste.push({ typ: 'Größe', wert: SP.t(k.groesse === 'klein' ? 'kleiner Betrieb' : 'großes Unternehmen') });
      k.leistungen.forEach(function (l) { liste.push({ typ: 'Leistung', wert: SP.t(LEIST_TEXT[l] || l) }); });
      return liste;
    },

    /* ---------- Empfehlung: passende Arbeitnehmer ---------- */
    arbeitnehmer: function (k, betrachterId) {
      var STUFEN = { A1: 0, A2: 1, B1: 2, B2: 3, C1: 4, C2: 5 };
      return SP.db.profile.arbeitnehmer(betrachterId).map(function (p) {
        var punkte = 0, moeglich = 0, gruende = [], gegen = [];
        var textProfil = norm([p.beruf, (p.faehigkeiten || []).join(' '), p.ueberMich,
          (p.stationen || []).map(function (s) { return s.position + ' ' + s.taetigkeit; }).join(' ')].join(' '));

        /* Branche und Beruf */
        if (k.branchen.length) {
          moeglich += 30;
          if (k.branchen.indexOf(p.branche) > -1) {
            punkte += 30;
            gruende.push(SP.t('Branche {name}', { name: SP.tInhalt(SP.db.BRANCHEN[p.branche] || p.branche) }));
          }
        }
        var berufTreffer = k.berufsworte.filter(function (b) { return enthaelt(textProfil, b); });
        if (k.berufsworte.length) {
          moeglich += 25;
          if (berufTreffer.length) {
            punkte += 25;
            gruende.push(SP.t('Beruf passt: {beruf}', { beruf: SP.tInhalt(p.beruf) }));
          }
        }

        /* Fachliche Kenntnisse */
        if (k.faehigkeiten.length) {
          moeglich += 20;
          var treffer = k.faehigkeiten.filter(function (f) { return textProfil.indexOf(norm(f)) > -1; });
          if (treffer.length) {
            punkte += Math.min(20, treffer.length * 10);
            gruende.push(SP.t('Kenntnisse: {liste}', { liste: treffer.map(SP.tInhalt).join(', ') }));
          }
        }

        /* Zielregion und Herkunft */
        if (k.orte.length) {
          moeglich += 15;
          var ziel = norm([p.zielland, p.ort].join(' '));
          if (k.orte.some(function (o) { return ziel.indexOf(o) > -1; })) {
            punkte += 15; gruende.push(SP.t('Wunschregion passt'));
          } else if (p.umzugsbereit) {
            punkte += 8; gruende.push(SP.t('umzugsbereit'));
          }
        }
        if (k.laender.length) {
          moeglich += 10;
          if (k.laender.indexOf(p.land) > -1) { punkte += 10; gruende.push(SP.t('Herkunft {land}', { land: (SP.vok ? SP.vok.landName(p.land) : p.land) })); }
        }

        /* Sprache */
        if (k.sprachniveau) {
          moeglich += 15;
          var hat = STUFEN[p.deutsch], will = STUFEN[k.sprachniveau];
          if (hat != null && hat >= will) { punkte += 15; gruende.push(SP.t('Deutsch {stufe}', { stufe: p.deutsch })); }
          else if (hat != null && hat === will - 1) { punkte += 7; gruende.push(SP.t('Deutsch {stufe}, knapp darunter', { stufe: p.deutsch })); }
          else gegen.push(SP.t('Deutsch {stufe}', { stufe: p.deutsch || SP.t('ohne Angabe') }));
        }

        /* Verfuegbarkeit */
        if (k.verfuegbarSofort) {
          moeglich += 12;
          if (/sofort/.test(norm(p.verfuegbar))) { punkte += 12; gruende.push(SP.t('ab sofort verfügbar')); }
          else if (/2 wochen|4 wochen/.test(norm(p.verfuegbar))) { punkte += 6; gruende.push(SP.t('verfügbar: {wann}', { wann: SP.tInhalt(p.verfuegbar) })); }
          else gegen.push(SP.t('erst: {wann}', { wann: p.verfuegbar ? SP.tInhalt(p.verfuegbar) : SP.t('unbekannt') }));
        }

        /* Erfahrung */
        if (k.erfahrungMin != null) {
          moeglich += 12;
          var jahre = Number(p.erfahrung) || 0;
          if (jahre >= k.erfahrungMin) { punkte += 12; gruende.push(SP.anzahl(jahre, '{n} Jahr Erfahrung', '{n} Jahre Erfahrung')); }
          else gegen.push(SP.anzahl(jahre, 'nur {n} Jahr Erfahrung', 'nur {n} Jahre Erfahrung'));
        }

        /* Budget */
        if (k.gehaltMax) {
          moeglich += 10;
          var g = Number(p.gehalt) || 0;
          if (g && g <= k.gehaltMax) { punkte += 10; gruende.push(SP.t('Gehaltswunsch im Budget')); }
          else if (g) gegen.push(SP.t('Gehaltswunsch {betrag} €', { betrag: g.toLocaleString(SP.gebiet) }));
        }

        /* Fuehrerschein */
        if (k.fuehrerschein) {
          moeglich += 10;
          if (norm(p.fuehrerschein).indexOf(norm(k.fuehrerschein)) > -1) {
            punkte += 10; gruende.push(SP.t('Führerschein {klasse}', { klasse: p.fuehrerschein }));
          } else gegen.push(SP.t('Führerschein fehlt'));
        }

        /* Bewertung fliesst immer leicht ein */
        var bw = SP.db.bewertungen.schnitt(p.kontoId);
        moeglich += 8;
        if (bw) {
          punkte += Math.round((bw.wert - 3) * 4);
          if (bw.wert >= 4) gruende.push(SP.t('{wert} Sterne', { wert: SP.zahl(bw.wert, 1) }));
        }
        /* Geprüfte Nachweise ebenso */
        var gepr = (p.nachweise || []).filter(function (n) { return n.geprueft; }).length;
        moeglich += 8;
        if (gepr) {
          punkte += Math.min(8, gepr * 3);
          gruende.push(SP.anzahl(gepr, '{n} geprüfter Nachweis', '{n} geprüfte Nachweise'));
        }

        return {
          profil: p, gruende: gruende, gegen: gegen,
          wert: moeglich ? Math.max(0, Math.min(100, Math.round(punkte / moeglich * 100))) : 50
        };
      }).sort(function (a, b) { return b.wert - a.wert; });
    },

    /* ---------- Empfehlung: passende Arbeitgeber ---------- */
    arbeitgeber: function (k, betrachterId) {
      return SP.db.profile.arbeitgeber(betrachterId).map(function (p) {
        var punkte = 0, moeglich = 0, gruende = [], gegen = [];
        var stellen = SP.db.stellen.vonArbeitgeber(p.kontoId).filter(function (s) { return s.offen; });
        var textFirma = norm([p.beschreibung, (p.leistungen || []).join(' '),
          stellen.map(function (s) { return s.titel + ' ' + s.beschreibung; }).join(' ')].join(' '));

        /* Branche */
        if (k.branchen.length) {
          moeglich += 30;
          if (k.branchen.indexOf(p.branche) > -1) {
            punkte += 30; gruende.push(SP.t('Branche {name}', { name: SP.tInhalt(SP.db.BRANCHEN[p.branche] || p.branche) }));
          }
        }

        /* Offene Stellen zum gesuchten Beruf */
        if (k.berufsworte.length) {
          moeglich += 25;
          var passende = stellen.filter(function (s) {
            var st = norm(s.titel + ' ' + s.beschreibung);
            return k.berufsworte.some(function (b) { return enthaelt(st, b); });
          });
          if (passende.length) {
            punkte += 25;
            gruende.push(SP.t('offene Stelle: {titel}', { titel: SP.tInhalt(passende[0].titel) }));
          } else if (textFirma && k.berufsworte.some(function (b) { return enthaelt(textFirma, b); })) {
            punkte += 12; gruende.push(SP.t('sucht in diesem Bereich'));
          } else if (!stellen.length) {
            gegen.push(SP.t('derzeit keine offene Stelle'));
          }
        }

        /* Ort */
        if (k.orte.length) {
          moeglich += 20;
          var orte = norm([p.ort, (p.standorte || []).map(function (o) { return o.ort; }).join(' ')].join(' '));
          if (k.orte.some(function (o) { return orte.indexOf(o) > -1; })) {
            punkte += 20; gruende.push(SP.t('Standort {ort}', { ort: SP.tInhalt(p.ort) }));
          } else gegen.push(SP.t('Standort {ort}', { ort: SP.tInhalt(p.ort) }));
        }

        /* Leistungen fuer Mitarbeitende */
        if (k.leistungen.length) {
          moeglich += 20;
          var LEIST = { unterkunft: 'unterkunft|wohnung', sprachkurs: 'sprachkurs|deutschkurs',
            fahrtkosten: 'fahrtkosten', anerkennung: 'anerkennung', unbefristet: 'unbefristet',
            kita: 'kita|kinder' };
          var alle = norm((p.leistungen || []).join(' '));
          var gefunden = k.leistungen.filter(function (l) { return new RegExp(LEIST[l]).test(alle); });
          if (gefunden.length) {
            punkte += Math.min(20, gefunden.length * 10);
            gruende.push(SP.t('bietet: {liste}', { liste: gefunden.map(function (l) {
              return SP.t({ unterkunft: 'Unterkunft', sprachkurs: 'Sprachkurs', fahrtkosten: 'Fahrtkosten',
                       anerkennung: 'Anerkennungsbegleitung', unbefristet: 'unbefristeten Vertrag',
                       kita: 'Kinderbetreuung' }[l]);
            }).join(', ') }));
          } else gegen.push(SP.t('gesuchte Leistungen nicht ausgewiesen'));
        }

        /* Groesse */
        if (k.groesse) {
          moeglich += 10;
          var klein = ['1-9', '10-49'].indexOf(p.groesse) > -1;
          var gross = ['250-999', '1000+'].indexOf(p.groesse) > -1;
          if ((k.groesse === 'klein' && klein) || (k.groesse === 'gross' && gross)) {
            punkte += 10; gruende.push(SP.t('{groesse} Mitarbeitende', { groesse: p.groesse }));
          }
        }

        /* Bewertung durch fruehere Beschaeftigte */
        var bw = SP.db.bewertungen.schnitt(p.kontoId);
        moeglich += 15;
        if (bw) {
          punkte += Math.round((bw.wert - 2.5) * 6);
          gruende.push(SP.anzahl(bw.anzahl, '{wert} Sterne von {n} Person', '{wert} Sterne von {n} Personen', { wert: SP.zahl(bw.wert, 1) }));
          if (k.bewertungMin && bw.wert < k.bewertungMin) gegen.push(SP.t('unter Ihrer Mindestbewertung'));
        } else if (k.bewertungMin) gegen.push(SP.t('noch keine Bewertungen'));

        /* Geprueftes Unternehmen */
        var gepr = (p.nachweise || []).filter(function (n) { return n.geprueft; }).length;
        moeglich += 10;
        if (gepr) { punkte += Math.min(10, gepr * 5); gruende.push(SP.t('geprüfte Unternehmensnachweise')); }

        return {
          profil: p, stellen: stellen, gruende: gruende, gegen: gegen,
          wert: moeglich ? Math.max(0, Math.min(100, Math.round(punkte / moeglich * 100))) : 50
        };
      }).sort(function (a, b) { return b.wert - a.wert; });
    }
  };

})(window, document);
