/* ============================================================
   Standard Plus - Datenhaltung
   ------------------------------------------------------------
   Konten, Profile, Werdegang, Sprachen, Nachweise, Bilder,
   Bewertungen, Sperrlisten, Stellen und Anfragen.

   Speicherort im Prototyp: localStorage dieses Browsers.
   Fuer den Echtbetrieb gehoert dieselbe Struktur auf einen
   EU-Server; die Tabellen sind 1:1 uebertragbar. Dateien duerfen
   dann nicht mehr als Data-URL im Datensatz liegen, sondern in
   einem Objektspeicher mit signierten, kurzlebigen Links.
   ============================================================ */
(function (w, d) {
  'use strict';
  var SP = w.SP;
  var KEY = 'sp.db.v2';
  var DEMO_PW = 'Demo!2026';

  var leer = {
    version: 3, konten: [], profile: {}, stellen: [],
    anfragen: [], bewertungen: [], sperren: [],
    linien: [], fahrten: [], fahrzeuge: [], fahrer: [], interessen: [], ausgeblendet: [], namen: 2, seed: false
  };

  function laden() {
    try {
      var roh = w.localStorage.getItem(KEY);
      if (!roh) return JSON.parse(JSON.stringify(leer));
      var db = JSON.parse(roh);
      ['konten', 'stellen', 'anfragen', 'bewertungen', 'sperren',
       'linien', 'fahrten', 'fahrzeuge', 'fahrer', 'interessen', 'ausgeblendet'].forEach(function (k) {
        if (!Array.isArray(db[k])) db[k] = [];
      });
      if (!db.profile || typeof db.profile !== 'object') db.profile = {};
      if (db.namen !== 2) db = namenErneuern(db);
      return db;
    } catch (e) { return JSON.parse(JSON.stringify(leer)); }
  }
  /* Beispieldaten nennen keine echten Unternehmen. Aeltere Speicherstaende
     im Browser werden einmalig auf die erfundenen Namen umgestellt. */
  var NAMEN_ALT_NEU = [
    ['Hochtief AG', 'Musterbau AG'],
    ['Klinikum Berlin Mitte', 'Musterklinikum Berlin'],
    ['Allianz Țiriac · ', 'Haftpflichtversicherung · '],
    ['Groupama · ', 'Haftpflichtversicherung · '],
    ['Spitalul Clinic Cluj', 'Beispielklinik Cluj'],
    ['Spitalul Județean', 'Beispielspital Cluj'],
    ['Vest Trans Timișoara SRL', 'Beispiel Reisen Timișoara SRL'],
    ['Carpat Lines SRL', 'Beispiel Linien Cluj SRL'],
    ['Restaurant Nuance', 'Restaurant Exemplu'],
    ['MedSoft Sp. z o.o.', 'Przykład Soft Sp. z o.o.'],
    ['Construct SA', 'Exemplu Construct SA'],
    ['Bau Vest SRL', 'Exemplu Bau SRL'],
    ['Elettro Nord SRL', 'Esempio Elettro SRL'],
    ['Trans-Pol Sp. z o.o.', 'Przykład Trans Sp. z o.o.'],
    ['DataHu Kft.', 'Példa Data Kft.'],
    ['Dom za stari hora', 'Beispiel-Seniorenheim Sofia']
  ];
  function namenErneuern(db) {
    try {
      var text = JSON.stringify(db);
      NAMEN_ALT_NEU.forEach(function (paar) {
        if (paar[0] === 'Construct SA') {
          text = text.replace(/(^|[^u] )Construct SA/g, function (m, vor) { return vor + paar[1]; });
        } else {
          text = text.split(paar[0]).join(paar[1]);
        }
      });
      db = JSON.parse(text);
    } catch (e) {}
    db.namen = 2;
    try { w.localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {}
    return db;
  }
  function speichern(db) {
    try { w.localStorage.setItem(KEY, JSON.stringify(db)); return true; }
    catch (e) {
      SP.toast('err', SP.t('Speichern nicht möglich'),
        SP.t('Der lokale Speicher ist voll. Bitte entfernen Sie Bilder oder Nachweise.'));
      return false;
    }
  }
  function id(p) { return p + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7); }

  /* Ortsnamen vergleichbar machen: "Timisoara" soll "Timișoara" finden
     und "Muenchen" auch "München". Dieselbe Regel wie in der Suche. */
  function vergleichsform(s2) {
    return String(s2 == null ? '' : s2).toLowerCase().trim()
      .replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 'ss')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/ae/g, 'a').replace(/oe/g, 'o').replace(/ue/g, 'u');
  }

  /* ---------- Passwoerter ---------- */
  function zufall(n) {
    var a = new Uint8Array(n);
    (w.crypto || w.msCrypto).getRandomValues(a);
    return Array.prototype.map.call(a, function (b) { return b.toString(16).padStart(2, '0'); }).join('');
  }
  function hashen(pw, salt) {
    var daten = new TextEncoder().encode(salt + ':' + pw);
    if (w.crypto && w.crypto.subtle) {
      return w.crypto.subtle.digest('SHA-256', daten).then(function (buf) {
        return Array.prototype.map.call(new Uint8Array(buf),
          function (b) { return b.toString(16).padStart(2, '0'); }).join('');
      });
    }
    var h = 0, s = salt + ':' + pw;
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return Promise.resolve('unsicher-' + (h >>> 0).toString(16));
  }

  var DB = SP.db = {

    NIVEAUS: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Muttersprache'],
    ARTEN: {
      zeugnis: SP.t('Arbeitszeugnis'), diplom: SP.t('Diplom oder Abschluss'),
      zertifikat: SP.t('Zertifikat'), anerkennung: SP.t('Anerkennungsbescheid'),
      fuehrerschein: SP.t('Führerschein'), gesundheit: SP.t('Gesundheitsnachweis'),
      gewerbe: SP.t('Handelsregister oder Gewerbe'), aueg: SP.t('Erlaubnis nach AÜG'),
      sonstiges: SP.t('Sonstiger Nachweis')
    },
    BRANCHEN: {
      pflege: SP.t('Pflege und Gesundheit'), bau: SP.t('Bau und Handwerk'), it: SP.t('IT und Technologie'),
      gastro: SP.t('Gastronomie'), logistik: SP.t('Logistik'), produktion: SP.t('Industrie und Produktion'),
      buero: SP.t('Verwaltung und Büro')
    },
    demoPasswort: DEMO_PW,

    /* ================= KONTEN ================= */
    konten: {
      findenPerMail: function (mail) {
        var m = String(mail || '').trim().toLowerCase();
        return laden().konten.filter(function (k) { return k.mail === m; })[0] || null;
      },
      byId: function (kid) { return laden().konten.filter(function (k) { return k.id === kid; })[0] || null; },
      anlegen: function (daten) {
        var db = laden();
        var mail = String(daten.mail || '').trim().toLowerCase();
        if (db.konten.some(function (k) { return k.mail === mail; })) {
          return Promise.reject(new Error(SP.t('Diese E-Mail-Adresse ist bereits registriert.')));
        }
        var salt = zufall(16);
        return hashen(daten.passwort, salt).then(function (hash) {
          var konto = {
            id: id('k'),
            rolle: ['arbeitgeber', 'transport'].indexOf(daten.rolle) > -1
              ? daten.rolle : 'arbeitnehmer',
            mail: mail, name: SP.clean(daten.name, 80), salt: salt, hash: hash,
            mfa: true, newsletter: !!daten.newsletter, angelegt: new Date().toISOString()
          };
          db.konten.push(konto);
          db.profile[konto.id] = DB.profile.leeresProfil(konto);
          speichern(db);
          SP.audit('Konto angelegt', konto.rolle + ' - ' + konto.mail);
          return konto;
        });
      },
      pruefen: function (mail, pw) {
        var konto = DB.konten.findenPerMail(mail);
        if (!konto) return Promise.resolve(null);
        if (konto.demo) return Promise.resolve(pw === DEMO_PW ? konto : null);
        return hashen(pw, konto.salt).then(function (h) { return h === konto.hash ? konto : null; });
      },
      loeschen: function (kid) {
        var db = laden();
        db.konten = db.konten.filter(function (k) { return k.id !== kid; });
        delete db.profile[kid];
        db.stellen = db.stellen.filter(function (s) { return s.arbeitgeberId !== kid; });
        db.anfragen = db.anfragen.filter(function (a) {
          return a.arbeitgeberId !== kid && a.arbeitnehmerId !== kid;
        });
        db.bewertungen = db.bewertungen.filter(function (b) { return b.vonId !== kid && b.zuId !== kid; });
        db.sperren = db.sperren.filter(function (s) { return s.vonId !== kid && s.zuId !== kid; });
        db.interessen = db.interessen.filter(function (x) { return x.vonId !== kid && x.zuId !== kid; });
        db.ausgeblendet = db.ausgeblendet.filter(function (x) { return x.vonId !== kid && x.zuId !== kid; });
        db.linien = db.linien.filter(function (l) { return l.unternehmenId !== kid; });
        db.fahrzeuge = db.fahrzeuge.filter(function (f) { return f.unternehmenId !== kid; });
        db.fahrer = db.fahrer.filter(function (f) { return f.unternehmenId !== kid; });
        db.fahrten = db.fahrten.filter(function (f) {
          return f.unternehmenId !== kid && f.arbeitnehmerId !== kid && f.arbeitgeberId !== kid;
        });
        speichern(db);
        SP.audit('Konto gelöscht', 'Art. 17 DSGVO');
      }
    },

    /* ================= PROFILE ================= */
    profile: {
      leeresProfil: function (konto) {
        var basis = {
          kontoId: konto.id, rolle: konto.rolle, sichtbar: true, aktualisiert: null,
          sprachen: [], nachweise: [], bilder: [], telefon: ''
        };
        if (konto.rolle === 'transport') {
          return Object.assign(basis, {
            firma: '', rechtsform: '', ort: '', land: 'RO', gegruendet: '',
            ansprechperson: konto.name, position: '', beschreibung: '',
            lizenz: '', versicherung: '', flotte: '', leistungen: []
          });
        }
        if (konto.rolle === 'arbeitgeber') {
          return Object.assign(basis, {
            firma: '', rechtsform: '', branche: '', ort: '', land: 'DE', groesse: '',
            gegruendet: '', ansprechperson: konto.name, position: '',
            beschreibung: '', leistungen: [], standorte: []
          });
        }
        return Object.assign(basis, {
          vorname: (konto.name || '').split(' ')[0] || '',
          nachname: (konto.name || '').split(' ').slice(1).join(' '),
          geburtsjahr: '', staatsangehoerigkeit: '', land: '', ort: '', zielland: 'DE',
          beruf: '', branche: '', erfahrung: '', deutsch: '', gehalt: '', verfuegbar: '',
          fuehrerschein: '', umzugsbereit: true, faehigkeiten: [], stationen: [], ueberMich: ''
        });
      },
      holen: function (kid) { return laden().profile[kid] || null; },
      speichern: function (kid, daten) {
        var db = laden();
        var neu = Object.assign({}, db.profile[kid] || {}, daten,
          { kontoId: kid, aktualisiert: new Date().toISOString() });
        db.profile[kid] = neu;
        speichern(db);
        SP.audit('Profil gespeichert', kid);
        return neu;
      },
      anzeigename: function (p) {
        if (!p) return '';
        if (p.rolle === 'arbeitgeber') return p.firma || SP.t('Unternehmen');
        var n = (p.nachname || '').trim();
        return (p.vorname || SP.t('Profil')) + (n ? ' ' + n.charAt(0).toUpperCase() + '.' : '');
      },
      vollerName: function (p) {
        if (!p) return '';
        if (p.rolle === 'arbeitgeber') return p.firma || SP.t('Unternehmen');
        return [p.vorname, p.nachname].filter(Boolean).join(' ');
      },
      alter: function (p) {
        if (!p || !p.geburtsjahr) return null;
        var j = new Date().getFullYear() - Number(p.geburtsjahr);
        return (j > 13 && j < 100) ? j : null;
      },
      vollstaendig: function (p) {
        if (!p) return 0;
        var felder = p.rolle === 'arbeitgeber'
          ? ['firma', 'branche', 'ort', 'ansprechperson', 'beschreibung', 'groesse']
          : ['vorname', 'beruf', 'branche', 'land', 'erfahrung', 'deutsch', 'geburtsjahr'];
        var voll = felder.filter(function (f) { return String(p[f] || '').trim(); }).length;
        var extra = 0;
        if ((p.sprachen || []).length) extra++;
        if (p.rolle === 'arbeitgeber' ? (p.leistungen || []).length : (p.stationen || []).length) extra++;
        if ((p.nachweise || []).length) extra++;
        return Math.round((voll + extra) / (felder.length + 3) * 100);
      },

      /* Wer darf welche Tiefe sehen */
      sichtRecht: function (betrachterId, zielId) {
        if (!betrachterId) return 'anonym';
        if (betrachterId === zielId) return 'eigen';
        if (DB.sperren.gesperrt(betrachterId, zielId)) return 'gesperrt';
        var frei = laden().anfragen.some(function (a) {
          var beteiligt = (a.arbeitgeberId === betrachterId && a.arbeitnehmerId === zielId) ||
                          (a.arbeitnehmerId === betrachterId && a.arbeitgeberId === zielId);
          return beteiligt && DB.anfragen.status(a) === 'beidseitig';
        });
        return frei ? 'voll' : 'pseudonym';
      },

      arbeitnehmer: function (betrachterId) {
        var db = laden();
        return db.konten
          .filter(function (k) { return k.rolle === 'arbeitnehmer'; })
          .map(function (k) { return db.profile[k.id]; })
          .filter(function (p) {
            if (!p || !p.sichtbar || !p.beruf) return false;
            return !betrachterId || !DB.sperren.gesperrt(betrachterId, p.kontoId);
          });
      },
      arbeitgeber: function (betrachterId) {
        var db = laden();
        return db.konten
          .filter(function (k) { return k.rolle === 'arbeitgeber'; })
          .map(function (k) { return db.profile[k.id]; })
          .filter(function (p) {
            if (!p || !p.firma) return false;
            return !betrachterId || !DB.sperren.gesperrt(betrachterId, p.kontoId);
          });
      }
    },

    /* ================= WERDEGANG ================= */
    stationen: {
      hinzufuegen: function (kid, st) {
        var p = DB.profile.holen(kid); if (!p) return null;
        var liste = (p.stationen || []).slice();
        liste.push({
          id: id('st'),
          arbeitgeber: SP.clean(st.arbeitgeber, 100), position: SP.clean(st.position, 100),
          ort: SP.clean(st.ort, 80), land: SP.clean(st.land, 40),
          von: SP.clean(st.von, 10), bis: SP.clean(st.bis, 20),
          taetigkeit: SP.clean(st.taetigkeit, 500)
        });
        liste.sort(function (a, b) { return String(b.von).localeCompare(String(a.von)); });
        SP.audit('Station ergänzt', st.arbeitgeber);
        return DB.profile.speichern(kid, { stationen: liste });
      },
      entfernen: function (kid, stId) {
        var p = DB.profile.holen(kid); if (!p) return null;
        return DB.profile.speichern(kid,
          { stationen: (p.stationen || []).filter(function (s) { return s.id !== stId; }) });
      }
    },

    /* ================= SPRACHEN ================= */
    sprachen: {
      setzen: function (kid, liste) {
        var sauber = (liste || []).filter(function (s) { return s.sprache; })
          .map(function (s) { return { sprache: SP.clean(s.sprache, 40), niveau: s.niveau || 'A1' }; })
          .slice(0, 8);
        return DB.profile.speichern(kid, { sprachen: sauber });
      }
    },

    /* ================= NACHWEISE UND BILDER ================= */
    dateien: {
      MAX_DOK: 500 * 1024,
      hinzufuegenNachweis: function (kid, eintrag) {
        var p = DB.profile.holen(kid); if (!p) return null;
        var liste = (p.nachweise || []).slice();
        if (liste.length >= 12) { SP.toast('warn', SP.t('Grenze erreicht'), SP.t('Höchstens zwölf Nachweise.')); return null; }
        var n = {
          id: id('n'), titel: SP.clean(eintrag.titel, 120), art: eintrag.art || 'sonstiges',
          dateiname: SP.clean(eintrag.dateiname, 160), typ: eintrag.typ || '',
          groesse: eintrag.groesse || 0, inhalt: eintrag.inhalt || null,
          geprueft: false, hochgeladen: new Date().toISOString()
        };
        liste.push(n);
        DB.profile.speichern(kid, { nachweise: liste });
        SP.audit('Nachweis hochgeladen', n.titel);
        return n;
      },
      entfernenNachweis: function (kid, nId) {
        var p = DB.profile.holen(kid); if (!p) return;
        DB.profile.speichern(kid,
          { nachweise: (p.nachweise || []).filter(function (n) { return n.id !== nId; }) });
        SP.audit('Nachweis entfernt', nId);
      },
      hinzufuegenBild: function (kid, bild) {
        var p = DB.profile.holen(kid); if (!p) return null;
        var liste = (p.bilder || []).slice();
        if (liste.length >= 8) { SP.toast('warn', SP.t('Grenze erreicht'), SP.t('Höchstens acht Bilder.')); return null; }
        var b = {
          id: id('b'), titel: SP.clean(bild.titel, 120),
          inhalt: bild.inhalt, hochgeladen: new Date().toISOString()
        };
        liste.push(b);
        DB.profile.speichern(kid, { bilder: liste });
        SP.audit('Bild hochgeladen', b.titel);
        return b;
      },
      entfernenBild: function (kid, bId) {
        var p = DB.profile.holen(kid); if (!p) return;
        DB.profile.speichern(kid,
          { bilder: (p.bilder || []).filter(function (b) { return b.id !== bId; }) });
      }
    },

    /* ================= BEWERTUNGEN ================= */
    bewertungen: {
      /* Bewerten darf nur, wer eine beidseitige Freigabe mit der Gegenseite hat.
         So entstehen keine Bewertungen ohne tatsaechliche Zusammenarbeit. */
      darfBewerten: function (vonId, zuId) {
        if (!vonId || vonId === zuId) return false;
        var schon = laden().bewertungen.some(function (b) { return b.vonId === vonId && b.zuId === zuId; });
        if (schon) return false;
        return DB.profile.sichtRecht(vonId, zuId) === 'voll';
      },
      abgeben: function (vonId, zuId, daten) {
        if (!DB.bewertungen.darfBewerten(vonId, zuId)) return null;
        var db = laden();
        var b = {
          id: id('bw'), vonId: vonId, zuId: zuId,
          sterne: Math.max(1, Math.min(5, Number(daten.sterne) || 5)),
          text: SP.clean(daten.text, 600), zeitraum: SP.clean(daten.zeitraum, 60),
          taetigkeit: SP.clean(daten.taetigkeit, 120), datum: new Date().toISOString()
        };
        db.bewertungen.push(b);
        speichern(db);
        SP.audit('Bewertung abgegeben', zuId + ' - ' + b.sterne + ' Sterne');
        return b;
      },
      fuerKonto: function (kid) {
        return laden().bewertungen.filter(function (b) { return b.zuId === kid; })
          .sort(function (a, b) { return b.datum.localeCompare(a.datum); });
      },
      schnitt: function (kid) {
        var liste = DB.bewertungen.fuerKonto(kid);
        if (!liste.length) return null;
        var summe = liste.reduce(function (s, b) { return s + b.sterne; }, 0);
        return { wert: Math.round(summe / liste.length * 10) / 10, anzahl: liste.length };
      }
    },

    /* ================= SPERRLISTE =================
       Bewusst als persoenliche Liste: Sie blenden ein Gegenueber fuer sich aus.
       Eine gemeinsame, unternehmensuebergreifende schwarze Liste gibt es nicht -
       die waere arbeits- und datenschutzrechtlich hoch problematisch. */
    sperren: {
      setzen: function (vonId, zuId, grund) {
        var db = laden();
        if (db.sperren.some(function (s) { return s.vonId === vonId && s.zuId === zuId; })) return;
        db.sperren.push({
          id: id('sp'), vonId: vonId, zuId: zuId,
          grund: SP.clean(grund, 300), datum: new Date().toISOString()
        });
        speichern(db);
        SP.audit('Sperrliste ergänzt', zuId);
      },
      aufheben: function (vonId, zuId) {
        var db = laden();
        db.sperren = db.sperren.filter(function (s) { return !(s.vonId === vonId && s.zuId === zuId); });
        speichern(db);
        SP.audit('Sperre aufgehoben', zuId);
      },
      meine: function (kid) { return laden().sperren.filter(function (s) { return s.vonId === kid; }); },
      gesperrt: function (a, b) {
        return laden().sperren.some(function (s) {
          return (s.vonId === a && s.zuId === b) || (s.vonId === b && s.zuId === a);
        });
      }
    },

    /* ================= WISCHANSICHT =================
       Haken = Interesse, Kreuz = ausblenden. Beides gehoert der Person,
       die gewischt hat, und wird mit ihrem Konto geloescht und exportiert.
       Ein Interesse zeigt dem Unternehmen nur das Kurzprofil - Name und
       Kontaktdaten weiterhin erst nach beidseitiger Freigabe. */
    wischen: {
      interesse: function (vonId, zuId) {
        if (DB.sperren.gesperrt(vonId, zuId)) {
          SP.toast('warn', SP.t('Nicht möglich'), SP.t('Zwischen diesen Konten besteht eine Sperre.'));
          return null;
        }
        var db = laden();
        var da = db.interessen.filter(function (x) { return x.vonId === vonId && x.zuId === zuId; })[0];
        if (da) return da;
        var neu = { id: id('i'), vonId: vonId, zuId: zuId, datum: new Date().toISOString() };
        db.interessen.push(neu); speichern(db);
        SP.audit('Interesse bekundet', zuId);
        return neu;
      },
      interesseZurueck: function (vonId, zuId) {
        var db = laden();
        db.interessen = db.interessen.filter(function (x) { return !(x.vonId === vonId && x.zuId === zuId); });
        speichern(db);
        SP.audit('Interesse zurückgenommen', zuId);
      },
      hatInteresse: function (vonId, zuId) {
        return laden().interessen.some(function (x) { return x.vonId === vonId && x.zuId === zuId; });
      },
      interessenAn: function (zuId) {
        return laden().interessen.filter(function (x) { return x.zuId === zuId; })
          .sort(function (a, b) { return a.datum < b.datum ? 1 : -1; });
      },
      ausblenden: function (vonId, zuId) {
        var db = laden();
        if (db.ausgeblendet.some(function (x) { return x.vonId === vonId && x.zuId === zuId; })) return;
        db.ausgeblendet.push({ vonId: vonId, zuId: zuId, datum: new Date().toISOString() });
        speichern(db);
        SP.audit('Vorschlag ausgeblendet', zuId);
      },
      einblenden: function (vonId, zuIds) {
        var liste = [].concat(zuIds);
        var db = laden();
        db.ausgeblendet = db.ausgeblendet.filter(function (x) {
          return !(x.vonId === vonId && liste.indexOf(x.zuId) > -1);
        });
        speichern(db);
      },
      ausgeblendete: function (vonId) {
        return laden().ausgeblendet.filter(function (x) { return x.vonId === vonId; })
          .map(function (x) { return x.zuId; });
      }
    },

    /* ================= STELLEN ================= */
    stellen: {
      anlegen: function (agId, daten) {
        var db = laden();
        var s = {
          id: id('s'), arbeitgeberId: agId, titel: SP.clean(daten.titel, 120),
          branche: daten.branche || '', ort: SP.clean(daten.ort, 80),
          verguetung: SP.clean(daten.verguetung, 40),
          beschreibung: SP.clean(daten.beschreibung, 1200),
          angelegt: new Date().toISOString(), offen: true
        };
        db.stellen.push(s); speichern(db);
        SP.audit('Stelle ausgeschrieben', s.titel);
        return s;
      },
      liste: function () { return laden().stellen.filter(function (s) { return s.offen; }); },
      vonArbeitgeber: function (kid) {
        return laden().stellen.filter(function (s) { return s.arbeitgeberId === kid; });
      },
      byId: function (sid) { return laden().stellen.filter(function (s) { return s.id === sid; })[0] || null; },
      schliessen: function (sid) {
        var db = laden();
        db.stellen.forEach(function (s) { if (s.id === sid) s.offen = false; });
        speichern(db);
      }
    },

    /* ================= ANFRAGEN ================= */
    anfragen: {
      anlegen: function (agId, anId, stelleId) {
        if (DB.sperren.gesperrt(agId, anId)) {
          SP.toast('warn', SP.t('Nicht möglich'), SP.t('Zwischen diesen Konten besteht eine Sperre.'));
          return null;
        }
        var db = laden();
        var vorhanden = db.anfragen.filter(function (a) {
          return a.arbeitgeberId === agId && a.arbeitnehmerId === anId;
        })[0];
        if (vorhanden) return vorhanden;
        var a = {
          id: id('a'), arbeitgeberId: agId, arbeitnehmerId: anId, stelleId: stelleId || null,
          freigabeAG: true, freigabeAN: false, abgelehnt: false, angelegt: new Date().toISOString()
        };
        db.anfragen.push(a); speichern(db);
        SP.audit('Anfrage gestellt', anId);
        return a;
      },
      /* Nur solange die Gegenseite noch nicht entschieden hat -
         fuer "Rueckgaengig" in der Wischansicht */
      zuruecknehmen: function (agId, anId) {
        var db = laden(), vorher = db.anfragen.length;
        db.anfragen = db.anfragen.filter(function (a) {
          return !(a.arbeitgeberId === agId && a.arbeitnehmerId === anId && !a.freigabeAN && !a.abgelehnt);
        });
        if (db.anfragen.length === vorher) return false;
        speichern(db);
        SP.audit('Anfrage zurückgenommen', anId);
        return true;
      },
      fuerKonto: function (kid) {
        return laden().anfragen.filter(function (a) {
          return a.arbeitgeberId === kid || a.arbeitnehmerId === kid;
        });
      },
      zwischen: function (a1, a2) {
        return laden().anfragen.filter(function (a) {
          return (a.arbeitgeberId === a1 && a.arbeitnehmerId === a2) ||
                 (a.arbeitgeberId === a2 && a.arbeitnehmerId === a1);
        })[0] || null;
      },
      entscheiden: function (aid, zustimmen) {
        var db = laden();
        db.anfragen.forEach(function (a) {
          if (a.id !== aid) return;
          if (zustimmen) { a.freigabeAN = true; a.abgelehnt = false; }
          else { a.abgelehnt = true; a.freigabeAN = false; }
          a.entschieden = new Date().toISOString();
        });
        speichern(db);
        SP.audit(zustimmen ? 'Freigabe erteilt' : 'Anfrage abgelehnt', aid);
      },
      status: function (a) {
        if (!a) return 'keine';
        if (a.abgelehnt) return 'abgelehnt';
        return (a.freigabeAG && a.freigabeAN) ? 'beidseitig' : 'offen';
      },
      kontakt: function (a, kid) {
        if (DB.anfragen.status(a) !== 'beidseitig') return null;
        var db = laden();
        var gegen = a.arbeitgeberId === kid ? a.arbeitnehmerId : a.arbeitgeberId;
        var konto = db.konten.filter(function (k) { return k.id === gegen; })[0];
        var profil = db.profile[gegen];
        if (!konto) return null;
        return {
          name: DB.profile.vollerName(profil) || konto.name,
          mail: konto.mail,
          telefon: (profil && profil.telefon) || 'nicht hinterlegt'
        };
      }
    },

    /* ================= LINIEN =================
       Eine Linie ist eine wiederkehrende Fahrt: dieselbe Strecke,
       dieselben Wochentage, dieselbe Abfahrtszeit.

       "orte" enthaelt die Haltestellen in der Reihenfolge der Fahrt,
       Start und Ziel eingeschlossen. Daraus ergibt sich von selbst,
       welche Teilstrecken buchbar sind: Timisoara -> Muenchen ist es,
       Muenchen -> Timisoara auf derselben Linie nicht.
       ============================================================ */
    linien: {
      /* ---------- Zeitrechnung ---------- */
      minutenAus: function (hhmm) {
        var t = String(hhmm || '').split(':');
        return (Number(t[0]) || 0) * 60 + (Number(t[1]) || 0);
      },
      zeitAus: function (minuten) {
        var m = ((minuten % 1440) + 1440) % 1440;
        return String(Math.floor(m / 60)).padStart(2, '0') + ':' +
               String(m % 60).padStart(2, '0');
      },

      /* ---------- Fahrplan einer Linie ----------
         Liefert jeden Halt mit Uhrzeit und mit dem Abstand zur Abfahrt
         in Minuten. Linien ohne eigene Zeiten bekommen sie gleichmaessig
         verteilt - eine Schaetzung ist besser als gar keine Angabe,
         sie wird aber als solche gekennzeichnet. */
      halte: function (linie) {
        if (Array.isArray(linie.halte) && linie.halte.length > 1) return linie.halte;
        var orte = linie.orte || [];
        if (orte.length < 2) return [];
        var gesamt = (linie.dauer || 1) * 60;
        var start = DB.linien.minutenAus(linie.abfahrt);
        return orte.map(function (o, i) {
          var minute = Math.round(gesamt * i / (orte.length - 1));
          return {
            ort: o, minute: minute,
            zeit: DB.linien.zeitAus(start + minute),
            geschaetzt: true
          };
        });
      },

      /* ---------- Fahrplan aus Text lesen ----------
         Eine Zeile je Halt, Uhrzeit am Ende:
             Timisoara 17:30
             Arad 19:00
             Wien 04:00
         Wird eine Uhrzeit kleiner als die vorherige, ist ein Tag
         vergangen - so entstehen die Minutenabstaende von selbst. */
      planLesen: function (text) {
        var zeilen = String(text || '').split(/\n/)
          .map(function (z) { return z.trim(); }).filter(Boolean).slice(0, 20);
        var halte = [], vorher = null, tage = 0, start = null;

        zeilen.forEach(function (z) {
          var treffer = z.match(/^(.*?)[\s,;–-]+(\d{1,2})[:.](\d{2})\s*$/);
          if (!treffer) return;
          var ort = SP.clean(treffer[1], 80).replace(/[,;]+$/, '').trim();
          if (!ort) return;
          var stunde = Math.min(23, Number(treffer[2]));
          var minute = Math.min(59, Number(treffer[3]));
          var uhr = stunde * 60 + minute;

          if (vorher !== null && uhr <= vorher) tage++;
          vorher = uhr;
          if (start === null) start = uhr;

          halte.push({
            ort: ort,
            zeit: DB.linien.zeitAus(uhr),
            minute: uhr + tage * 1440 - start
          });
        });
        return halte.length > 1 ? halte : [];
      },

      WOCHENTAGE: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch',
                   'Donnerstag', 'Freitag', 'Samstag'],
      KURZ: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],

      liste: function () { return laden().linien.slice(); },

      vonUnternehmen: function (uid) {
        return laden().linien.filter(function (l) { return l.unternehmenId === uid; });
      },

      byId: function (lid) {
        return laden().linien.filter(function (l) { return l.id === lid; })[0] || null;
      },

      anlegen: function (uid, daten) {
        var db = laden();

        /* Bevorzugt der ausgeschriebene Fahrplan mit Uhrzeiten.
           Ohne ihn nur die Ortsliste - dann werden die Zeiten geschaetzt. */
        var halte = Array.isArray(daten.halte) && daten.halte.length > 1
          ? daten.halte
          : DB.linien.planLesen(daten.plan);

        var orte = halte.length
          ? halte.map(function (h) { return h.ort; })
          : (daten.orte || []).map(function (o) { return SP.clean(o, 80).trim(); })
              .filter(Boolean).slice(0, 14);
        if (orte.length < 2) return null;

        var abfahrt = halte.length ? halte[0].zeit : (SP.clean(daten.abfahrt, 5) || '08:00');
        var dauer = halte.length
          ? Math.max(0.25, halte[halte.length - 1].minute / 60)
          : Math.max(1, Math.min(72, Number(daten.dauer) || 20));

        var l = {
          id: id('l'), unternehmenId: uid,
          orte: orte,
          halte: halte.length ? halte : null,
          von: orte[0], nach: orte[orte.length - 1],
          tage: (daten.tage || []).filter(function (t) { return t >= 0 && t <= 6; }),
          abfahrt: abfahrt,
          dauer: Math.min(72, dauer),
          preis: Math.max(0, Math.min(2000, Number(daten.preis) || 0)),
          plaetze: Math.max(1, Math.min(99, Number(daten.plaetze) || 50)),
          hinweis: SP.clean(daten.hinweis, 300),
          fahrzeugId: daten.fahrzeugId || null,
          angelegt: new Date().toISOString()
        };
        db.linien.push(l); speichern(db);
        SP.audit('Linie angelegt', l.von + ' nach ' + l.nach);
        return l;
      },

      entfernen: function (uid, lid) {
        var db = laden();
        db.linien = db.linien.filter(function (l) {
          return !(l.id === lid && l.unternehmenId === uid);
        });
        speichern(db); SP.audit('Linie entfernt', lid);
      },

      /* Freie Plaetze an einem bestimmten Tag */
      freiePlaetze: function (lid, datum) {
        var l = DB.linien.byId(lid);
        if (!l) return 0;
        /* Gezaehlt wird nach dem Tag, an dem die Linie losfaehrt - sonst
           zaehlten Zusteiger vom Folgetag auf einen anderen Bus. */
        var belegt = laden().fahrten.filter(function (f) {
          return f.linienId === lid && f.status === 'gebucht' &&
                 (f.linienStart || f.abfahrtDatum) === datum;
        }).length;
        return Math.max(0, l.plaetze - belegt);
      }
    },

    /* ================= FAHRZEUGE =================
       Vom Siebensitzer bis zum Reisebus. Kennzeichen und Ausstattung
       gehoeren dem Unternehmen, nicht einer Person - sie duerfen
       deshalb offen stehen.
       ============================================================ */
    fahrzeuge: {
      ARTEN: {
        reisebus: SP.t('Reisebus'),
        kleinbus: SP.t('Kleinbus'),
        van9: SP.t('Kleinbus, 9 Sitze'),
        van7: SP.t('Van, 7 Sitze'),
        pkw: SP.t('PKW')
      },

      liste: function () { return laden().fahrzeuge.slice(); },

      vonUnternehmen: function (uid) {
        return laden().fahrzeuge.filter(function (f) { return f.unternehmenId === uid; });
      },

      byId: function (fid) {
        return laden().fahrzeuge.filter(function (f) { return f.id === fid; })[0] || null;
      },

      anlegen: function (uid, daten) {
        var kennzeichen = SP.clean(daten.kennzeichen, 20).toUpperCase().trim();
        if (!kennzeichen) return null;
        var db = laden();
        var f = {
          id: id('fz'), unternehmenId: uid,
          kennzeichen: kennzeichen,
          art: DB.fahrzeuge.ARTEN[daten.art] ? daten.art : 'reisebus',
          marke: SP.clean(daten.marke, 60),
          plaetze: Math.max(1, Math.min(99, Number(daten.plaetze) || 50)),
          baujahr: SP.clean(daten.baujahr, 4),
          ausstattung: (daten.ausstattung || []).map(function (a) { return SP.clean(a, 40); })
            .filter(Boolean).slice(0, 10),
          angelegt: new Date().toISOString()
        };
        db.fahrzeuge.push(f); speichern(db);
        SP.audit('Fahrzeug angelegt', f.kennzeichen);
        return f;
      },

      entfernen: function (uid, fid) {
        var db = laden();
        db.fahrzeuge = db.fahrzeuge.filter(function (f) {
          return !(f.id === fid && f.unternehmenId === uid);
        });
        /* Zuordnungen loesen, damit keine Fahrt auf ein geloeschtes
           Fahrzeug zeigt und ins Leere laeuft. */
        db.linien.forEach(function (l) { if (l.fahrzeugId === fid) l.fahrzeugId = null; });
        db.fahrten.forEach(function (f) { if (f.fahrzeugId === fid) f.fahrzeugId = null; });
        speichern(db); SP.audit('Fahrzeug entfernt', fid);
      }
    },

    /* ================= FAHRER =================
       Hier stehen Namen und Telefonnummern - also personenbezogene
       Daten. Sie werden deshalb NICHT oeffentlich gezeigt, sondern
       nur den Fahrgaesten der jeweiligen Fahrt (Art. 5 Abs. 1 lit. c
       DSGVO, Datenminimierung).
       ============================================================ */
    fahrer: {
      vonUnternehmen: function (uid) {
        return laden().fahrer.filter(function (f) { return f.unternehmenId === uid; });
      },

      byId: function (fid) {
        return laden().fahrer.filter(function (f) { return f.id === fid; })[0] || null;
      },

      anlegen: function (uid, daten) {
        var name = SP.clean(daten.name, 80).trim();
        if (!name) return null;
        var db = laden();
        var f = {
          id: id('fr'), unternehmenId: uid,
          name: name,
          telefon: SP.clean(daten.telefon, 40),
          sprachen: (daten.sprachen || []).map(function (x) { return SP.clean(x, 40); })
            .filter(Boolean).slice(0, 8),
          seit: SP.clean(daten.seit, 4),
          angelegt: new Date().toISOString()
        };
        db.fahrer.push(f); speichern(db);
        SP.audit('Fahrer angelegt', name);
        return f;
      },

      entfernen: function (uid, fid) {
        var db = laden();
        db.fahrer = db.fahrer.filter(function (f) {
          return !(f.id === fid && f.unternehmenId === uid);
        });
        db.fahrten.forEach(function (f) { if (f.fahrerId === fid) f.fahrerId = null; });
        speichern(db); SP.audit('Fahrer entfernt', fid);
      }
    },

    /* ================= FAHRTEN =================
       Die eigentliche Anreise: eine gebuchte Teilstrecke einer Linie
       an einem konkreten Tag.
       ============================================================ */
    fahrten: {

      /* ---------- Termine einer Linie ab einem Datum ---------- */
      naechsteTermine: function (linie, abDatum, anzahl) {
        var termine = [];
        if (!linie.tage.length) return termine;

        var start = DB.fahrten.datumAus(abDatum);
        if (!start) return termine;

        /* Hoechstens ein Vierteljahr vorausschauen - danach ist die
           Planung ohnehin Makulatur. */
        for (var i = 0; i < 92 && termine.length < (anzahl || 6); i++) {
          var tag = new Date(start.getTime());
          tag.setDate(tag.getDate() + i);
          if (linie.tage.indexOf(tag.getDay()) < 0) continue;
          termine.push(DB.fahrten.textAus(tag));
        }
        return termine;
      },

      /* ---------- Ankunft aus Abfahrt und Dauer ---------- */
      ankunft: function (datum, abfahrtZeit, dauerStunden) {
        var tag = DB.fahrten.datumAus(datum);
        if (!tag) return null;
        var teile = String(abfahrtZeit || '08:00').split(':');
        tag.setHours(Number(teile[0]) || 0, Number(teile[1]) || 0, 0, 0);
        var an = new Date(tag.getTime() + dauerStunden * 3600000);
        return {
          datum: DB.fahrten.textAus(an),
          zeit: String(an.getHours()).padStart(2, '0') + ':' +
                String(an.getMinutes()).padStart(2, '0'),
          naechsterTag: DB.fahrten.textAus(an) !== DB.fahrten.textAus(tag)
        };
      },

      datumAus: function (text) {
        var t = String(text || '').slice(0, 10).split('-');
        if (t.length !== 3) return null;
        var d2 = new Date(Number(t[0]), Number(t[1]) - 1, Number(t[2]));
        return isNaN(d2.getTime()) ? null : d2;
      },

      textAus: function (datum) {
        return datum.getFullYear() + '-' +
          String(datum.getMonth() + 1).padStart(2, '0') + '-' +
          String(datum.getDate()).padStart(2, '0');
      },

      /* ---------- Passende Linien fuer eine Strecke ---------- */
      passendeLinien: function (von, nach) {
        var nv = vergleichsform(von), nn = vergleichsform(nach);
        if (!nv || !nn) return [];
        return laden().linien.filter(function (l) {
          var orte = l.orte.map(vergleichsform);
          var i = orte.indexOf(nv), k = orte.indexOf(nn);
          /* Reihenfolge zaehlt: Einstieg muss vor dem Ausstieg liegen */
          return i > -1 && k > -1 && i < k;
        }).map(function (l) {
          var orte = l.orte.map(vergleichsform);
          var i = orte.indexOf(nv), k = orte.indexOf(nn);
          return {
            linie: l, vonIndex: i, nachIndex: k,
            einstieg: l.orte[i],
            ausstieg: l.orte[k],
            zwischenhalte: l.orte.slice(i + 1, k)
          };
        });
      },

      /* ---------- Vorschlaege: welche Tage kommen in Frage ----------
         Gibt fertige Vorschlaege zurueck, sortiert nach Abfahrt.
         "spaetestens" ist der Arbeitsbeginn - danach nuetzt keine
         Ankunft mehr etwas. */
      vorschlagen: function (von, nach, abDatum, spaetestens) {
        var raus = [];
        DB.fahrten.passendeLinien(von, nach).forEach(function (treffer) {
          var l = treffer.linie;
          var halte = DB.linien.halte(l);
          var ein = halte[treffer.vonIndex], aus = halte[treffer.nachIndex];
          if (!ein || !aus) return;

          DB.fahrten.naechsteTermine(l, abDatum, 8).forEach(function (datum) {
            /* Alles rechnet ab dem Start der Linie. Wer erst in Wien
               zusteigt, faehrt weniger lang - und oft an einem anderen
               Tag als dem, an dem die Linie losgefahren ist. */
            var start = DB.fahrten.datumAus(datum);
            if (!start) return;
            var startMinuten = DB.linien.minutenAus(l.abfahrt);
            start.setHours(0, startMinuten, 0, 0);

            var abfahrt = new Date(start.getTime() + ein.minute * 60000);
            var ankunft = new Date(start.getTime() + aus.minute * 60000);
            var ankunftDatum = DB.fahrten.textAus(ankunft);
            if (spaetestens && ankunftDatum > spaetestens) return;

            raus.push({
              linienId: l.id,
              unternehmenId: l.unternehmenId,
              einstieg: treffer.einstieg,
              ausstieg: treffer.ausstieg,
              zwischenhalte: treffer.zwischenhalte,
              vonIndex: treffer.vonIndex,
              nachIndex: treffer.nachIndex,
              abfahrtDatum: DB.fahrten.textAus(abfahrt),
              abfahrtZeit: DB.linien.zeitAus(
                abfahrt.getHours() * 60 + abfahrt.getMinutes()),
              ankunftDatum: ankunftDatum,
              ankunftZeit: DB.linien.zeitAus(
                ankunft.getHours() * 60 + ankunft.getMinutes()),
              ueberNacht: ankunftDatum !== DB.fahrten.textAus(abfahrt),
              /* Dauer der gebuchten Teilstrecke, nicht der ganzen Linie */
              dauer: Math.round((aus.minute - ein.minute) / 6) / 10,
              minuten: aus.minute - ein.minute,
              geschaetzt: !!ein.geschaetzt,
              preis: l.preis,
              frei: DB.linien.freiePlaetze(l.id, datum),
              linienStart: datum,
              wochentag: DB.linien.WOCHENTAGE[start.getDay()]
            });
          });
        });
        raus.sort(function (a, b) {
          if (a.abfahrtDatum !== b.abfahrtDatum) return a.abfahrtDatum < b.abfahrtDatum ? -1 : 1;
          return a.abfahrtZeit < b.abfahrtZeit ? -1 : 1;
        });
        return raus;
      },

      /* ---------- Buchen ---------- */
      buchen: function (vorschlag, anId, agId, anfrageId) {
        if (DB.linien.freiePlaetze(vorschlag.linienId,
              vorschlag.linienStart || vorschlag.abfahrtDatum) < 1) {
          SP.toast('warn', SP.t('Ausgebucht'),
            SP.t('Für diesen Tag ist kein Platz mehr frei. Bitte wählen Sie einen anderen.'));
          return null;
        }
        var db = laden();
        /* Eine laufende Anreise je Zusammenarbeit - eine zweite waere
           fast immer ein Versehen. */
        var schon = db.fahrten.filter(function (f) {
          return f.arbeitnehmerId === anId && f.arbeitgeberId === agId && f.status === 'gebucht';
        })[0];
        if (schon) {
          SP.toast('warn', SP.t('Bereits gebucht'),
            SP.t('Für diese Zusammenarbeit ist schon eine Anreise eingetragen.'));
          return schon;
        }
        var f = {
          id: id('f'),
          linienId: vorschlag.linienId,
          unternehmenId: vorschlag.unternehmenId,
          arbeitnehmerId: anId, arbeitgeberId: agId, anfrageId: anfrageId || null,
          von: vorschlag.einstieg, nach: vorschlag.ausstieg,
          vonIndex: vorschlag.vonIndex, nachIndex: vorschlag.nachIndex,
          minuten: vorschlag.minuten, linienStart: vorschlag.linienStart,
          abfahrtDatum: vorschlag.abfahrtDatum, abfahrtZeit: vorschlag.abfahrtZeit,
          ankunftDatum: vorschlag.ankunftDatum, ankunftZeit: vorschlag.ankunftZeit,
          preis: vorschlag.preis, status: 'gebucht',
          gebucht: new Date().toISOString(),
          gesehenAG: false,           /* Benachrichtigung fuer den Arbeitgeber */
          /* Das Standardfahrzeug der Linie gilt sofort. Der Fahrer wird
             vom Unternehmen fuer den jeweiligen Tag eingeteilt - wer
             faehrt, steht oft erst kurz vorher fest. */
          fahrzeugId: (DB.linien.byId(vorschlag.linienId) || {}).fahrzeugId || null,
          fahrerId: null,
          einteilungGesehen: false    /* Benachrichtigung fuer den Fahrgast */
        };
        db.fahrten.push(f); speichern(db);
        SP.audit('Anreise gebucht', f.von + ' nach ' + f.nach + ' am ' + f.abfahrtDatum);
        return f;
      },

      stornieren: function (fid, kid) {
        var db = laden();
        db.fahrten.forEach(function (f) {
          if (f.id !== fid) return;
          if (f.arbeitnehmerId !== kid && f.arbeitgeberId !== kid && f.unternehmenId !== kid) return;
          f.status = 'storniert';
          f.storniert = new Date().toISOString();
        });
        speichern(db); SP.audit('Anreise storniert', fid);
      },

      fuerKonto: function (kid) {
        return laden().fahrten.filter(function (f) {
          return f.arbeitnehmerId === kid || f.arbeitgeberId === kid || f.unternehmenId === kid;
        });
      },

      zwischen: function (anId, agId) {
        return laden().fahrten.filter(function (f) {
          return f.arbeitnehmerId === anId && f.arbeitgeberId === agId && f.status === 'gebucht';
        })[0] || null;
      },

      /* ---------- Fahrzeug und Fahrer einteilen ----------
         Nur das Befoerderungsunternehmen selbst darf das - sonst
         koennte jeder fremde Fahrten umschreiben. */
      einteilen: function (fid, uid, fahrzeugId, fahrerId) {
        var db = laden();
        var geaendert = null;
        db.fahrten.forEach(function (f) {
          if (f.id !== fid || f.unternehmenId !== uid) return;
          var vorher = f.fahrzeugId + '|' + f.fahrerId;
          f.fahrzeugId = fahrzeugId || null;
          f.fahrerId = fahrerId || null;
          if (vorher !== f.fahrzeugId + '|' + f.fahrerId) f.einteilungGesehen = false;
          f.eingeteilt = new Date().toISOString();
          geaendert = f;
        });
        speichern(db);
        if (geaendert) SP.audit('Fahrt eingeteilt', fid);
        return geaendert;
      },

      /* Fahrzeug und Fahrer einer Fahrt - fuer den Fahrgast aufbereitet */
      einteilung: function (fahrt) {
        if (!fahrt) return null;
        var fz = fahrt.fahrzeugId ? DB.fahrzeuge.byId(fahrt.fahrzeugId) : null;
        var fr = fahrt.fahrerId ? DB.fahrer.byId(fahrt.fahrerId) : null;
        return { fahrzeug: fz, fahrer: fr, vollstaendig: !!(fz && fr) };
      },

      /* Der Fahrgast hat die Einteilung gesehen */
      einteilungGesehen: function (fid) {
        var db = laden();
        db.fahrten.forEach(function (f) { if (f.id === fid) f.einteilungGesehen = true; });
        speichern(db);
      },

      /* Der Arbeitgeber hat die Meldung gesehen */
      alsGesehen: function (fid) {
        var db = laden();
        db.fahrten.forEach(function (f) { if (f.id === fid) f.gesehenAG = true; });
        speichern(db);
      }
    },

    /* ================= KENNZAHLEN ================= */
    kennzahlen: function (kid) {
      var db = laden();
      var meine = db.anfragen.filter(function (a) {
        return a.arbeitgeberId === kid || a.arbeitnehmerId === kid;
      });
      return {
        profile: db.konten.filter(function (k) { return k.rolle === 'arbeitnehmer'; }).length,
        unternehmen: db.konten.filter(function (k) { return k.rolle === 'arbeitgeber'; }).length,
        stellen: db.stellen.filter(function (s) { return s.offen; }).length,
        anfragenOffen: meine.filter(function (a) { return DB.anfragen.status(a) === 'offen'; }).length,
        anfragenBeidseitig: meine.filter(function (a) { return DB.anfragen.status(a) === 'beidseitig'; }).length,
        anfragenGesamt: meine.length,
        gesperrt: db.sperren.filter(function (s) { return s.vonId === kid; }).length,
        transport: db.konten.filter(function (k) { return k.rolle === 'transport'; }).length,
        linien: db.linien.length,
        fahrten: db.fahrten.filter(function (f) {
          return (f.arbeitnehmerId === kid || f.arbeitgeberId === kid ||
                  f.unternehmenId === kid) && f.status === 'gebucht';
        }).length
      };
    },

    /* ================= EXPORT ================= */
    exportKonto: function (kid) {
      var db = laden();
      var konto = db.konten.filter(function (k) { return k.id === kid; })[0];
      if (!konto) return null;
      var kopie = Object.assign({}, konto);
      delete kopie.hash; delete kopie.salt;
      var profil = db.profile[kid] ? JSON.parse(JSON.stringify(db.profile[kid])) : null;
      if (profil) {
        (profil.nachweise || []).forEach(function (n) {
          n.inhalt = n.inhalt ? '[Dateiinhalt im Export ausgelassen]' : null;
        });
        (profil.bilder || []).forEach(function (b) { b.inhalt = '[Bild im Export ausgelassen]'; });
      }
      return {
        konto: kopie, profil: profil,
        stellen: db.stellen.filter(function (s) { return s.arbeitgeberId === kid; }),
        anfragen: db.anfragen.filter(function (a) {
          return a.arbeitgeberId === kid || a.arbeitnehmerId === kid;
        }),
        bewertungen_erhalten: db.bewertungen.filter(function (b) { return b.zuId === kid; }),
        bewertungen_abgegeben: db.bewertungen.filter(function (b) { return b.vonId === kid; }),
        sperrliste: db.sperren.filter(function (s) { return s.vonId === kid; }),
        interesse_bekundet: db.interessen.filter(function (x) { return x.vonId === kid; }),
        interesse_erhalten: db.interessen.filter(function (x) { return x.zuId === kid; }),
        ausgeblendete_vorschlaege: db.ausgeblendet.filter(function (x) { return x.vonId === kid; })
      };
    },
    alles: laden,
    zuruecksetzen: function () {
      try { w.localStorage.removeItem(KEY); } catch (e) {}
      SP.audit('Datenbestand zurückgesetzt', 'alle Daten gelöscht');
    },

    /* ================= BEISPIELDATEN ================= */
    seedLaden: function () {
      var db = laden();
      var jetzt = new Date().toISOString();

      /* Wer den Prototyp schon benutzt hat, hat Konten und Profile im
         Speicher, aber noch keine Befoerderungsunternehmen. Statt alles
         zu loeschen wird nur der fehlende Teil nachgetragen. */
      if (db.seed) {
        /* Nur die Beispieldaten nachtragen oder erneuern. Selbst
           angelegte Befoerderungsunternehmen bleiben unangetastet -
           sie zu loeschen waere ein Datenverlust. */
        var demoDa = db.konten.some(function (k) {
          return String(k.id).indexOf('k-demo-bus') === 0;
        });
        var demoFahrzeuge = db.fahrzeuge.some(function (f) {
          return String(f.unternehmenId).indexOf('k-demo-bus') === 0;
        });
        var demoFahrplan = db.linien.some(function (l) {
          return String(l.unternehmenId).indexOf('k-demo-bus') === 0 &&
                 Array.isArray(l.halte) && l.halte.length;
        });
        if (!demoDa || !demoFahrzeuge || !demoFahrplan) {
          var istDemoBus = function (kid) { return String(kid).indexOf('k-demo-bus') === 0; };
          db.konten = db.konten.filter(function (k) { return !istDemoBus(k.id); });
          db.linien = db.linien.filter(function (l) { return !istDemoBus(l.unternehmenId); });
          db.fahrzeuge = db.fahrzeuge.filter(function (f) { return !istDemoBus(f.unternehmenId); });
          db.fahrer = db.fahrer.filter(function (f) { return !istDemoBus(f.unternehmenId); });
          DB.seedTransport(db, jetzt);
          speichern(db);
        }
        return;
      }
      db.seed = true;

      var kandidaten = [
        { vorname: 'Maria', nachname: 'Kovács', geburtsjahr: 1988,
          staatsangehoerigkeit: 'rumänisch', land: 'RO', ort: 'Cluj', zielland: 'DE',
          beruf: 'Examinierte Pflegefachkraft', branche: 'pflege', erfahrung: '12',
          deutsch: 'B2', gehalt: '2800', verfuegbar: 'ab sofort', fuehrerschein: 'B',
          faehigkeiten: ['Intensivpflege', 'Notaufnahme', 'Beatmung'],
          ueberMich: 'Seit zwölf Jahren in der Intensivpflege, davon vier Jahre als stellvertretende Stationsleitung. Ich suche eine Klinik mit strukturierter Einarbeitung.',
          sprachen: [{ sprache: 'Rumänisch', niveau: 'Muttersprache' },
                     { sprache: 'Deutsch', niveau: 'B2' }, { sprache: 'Englisch', niveau: 'B1' }],
          stationen: [
            { id: 'st-d0a', arbeitgeber: 'Beispielklinik Cluj', position: 'Stellv. Stationsleitung Intensiv',
              ort: 'Cluj', land: 'RO', von: '2019', bis: 'heute',
              taetigkeit: 'Leitung eines Teams von 14 Pflegekräften auf der Intensivstation.' },
            { id: 'st-d0b', arbeitgeber: 'Beispielspital Cluj', position: 'Pflegefachkraft Notaufnahme',
              ort: 'Cluj', land: 'RO', von: '2014', bis: '2019',
              taetigkeit: 'Ersteinschätzung und Versorgung in der zentralen Notaufnahme.' }
          ],
          nachweise: [
            { titel: 'Diplom Krankenpflege', art: 'diplom', dateiname: 'diplom.pdf', geprueft: true },
            { titel: 'Anerkennungsbescheid der Bezirksregierung', art: 'anerkennung', dateiname: 'anerkennung.pdf', geprueft: true },
            { titel: 'Zertifikat Beatmungspflege', art: 'zertifikat', dateiname: 'beatmung.pdf', geprueft: false }
          ] },

        { vorname: 'Ion', nachname: 'Tudose', geburtsjahr: 1991,
          staatsangehoerigkeit: 'rumänisch', land: 'RO', ort: 'Timișoara', zielland: 'DE',
          beruf: 'Polier und Bauführer', branche: 'bau', erfahrung: '8',
          deutsch: 'B1', gehalt: '3200', verfuegbar: 'in 4 Wochen', fuehrerschein: 'B, C1',
          faehigkeiten: ['Rohbau', 'Stahlbeton', 'Kranschein', 'IOSH'],
          ueberMich: 'Acht Jahre Rohbau, zuletzt Hochhausprojekte. Null meldepflichtige Unfälle in meinen Kolonnen.',
          sprachen: [{ sprache: 'Rumänisch', niveau: 'Muttersprache' },
                     { sprache: 'Deutsch', niveau: 'B1' }, { sprache: 'Italienisch', niveau: 'B2' }],
          stationen: [
            { id: 'st-d1a', arbeitgeber: 'Exemplu Construct SA', position: 'Polier', ort: 'Cluj-Napoca', land: 'RO',
              von: '2020', bis: 'heute',
              taetigkeit: 'Wohnkomplex mit 18 Geschossen, Führung von 45 Mitarbeitenden, drei Wochen vor Termin fertiggestellt.' },
            { id: 'st-d1b', arbeitgeber: 'Exemplu Bau SRL', position: 'Vorarbeiter Stahlbeton', ort: 'Timișoara',
              land: 'RO', von: '2016', bis: '2020',
              taetigkeit: 'Schalungs- und Bewehrungsarbeiten, drei Brückenbauprojekte.' }
          ],
          nachweise: [
            { titel: 'Meisterbrief Bau', art: 'diplom', dateiname: 'meister.pdf', geprueft: true },
            { titel: 'IOSH Arbeitssicherheit', art: 'zertifikat', dateiname: 'iosh.pdf', geprueft: true },
            { titel: 'Kranführerschein', art: 'fuehrerschein', dateiname: 'kran.pdf', geprueft: true }
          ] },

        { vorname: 'Piotr', nachname: 'Wiśniewski', geburtsjahr: 1990,
          staatsangehoerigkeit: 'polnisch', land: 'PL', ort: 'Warschau', zielland: 'Remote',
          beruf: 'Full-Stack Entwickler', branche: 'it', erfahrung: '10',
          deutsch: 'A2', gehalt: '5500', verfuegbar: 'in 3 Monaten', fuehrerschein: 'B',
          faehigkeiten: ['React', 'Node.js', 'AWS', 'PostgreSQL'],
          ueberMich: 'Zehn Jahre Webentwicklung, überwiegend im Gesundheitsbereich. Erfahren in verteilten Teams.',
          sprachen: [{ sprache: 'Polnisch', niveau: 'Muttersprache' },
                     { sprache: 'Englisch', niveau: 'C2' }, { sprache: 'Deutsch', niveau: 'A2' }],
          stationen: [
            { id: 'st-d2a', arbeitgeber: 'Przykład Soft Sp. z o.o.', position: 'Senior Developer', ort: 'Warschau',
              land: 'PL', von: '2018', bis: 'heute',
              taetigkeit: 'Patientenportal mit 200.000 Nutzenden, Umstellung auf Microservices.' }
          ],
          nachweise: [
            { titel: 'Master Informatik', art: 'diplom', dateiname: 'master.pdf', geprueft: true },
            { titel: 'AWS Solutions Architect', art: 'zertifikat', dateiname: 'aws.pdf', geprueft: true }
          ] },

        { vorname: 'Andreea', nachname: 'Marin', geburtsjahr: 1993,
          staatsangehoerigkeit: 'rumänisch', land: 'RO', ort: 'Bukarest', zielland: 'AT',
          beruf: 'Sous Chef', branche: 'gastro', erfahrung: '7',
          deutsch: 'B2', gehalt: '2600', verfuegbar: 'ab sofort', fuehrerschein: 'B',
          faehigkeiten: ['Fine Dining', 'À la carte', 'Patisserie'],
          ueberMich: 'Sieben Jahre gehobene Küche, zuletzt Sous Chef in einem Haus mit 90 Plätzen.',
          sprachen: [{ sprache: 'Rumänisch', niveau: 'Muttersprache' },
                     { sprache: 'Deutsch', niveau: 'B2' }, { sprache: 'Französisch', niveau: 'B1' }],
          stationen: [
            { id: 'st-d3a', arbeitgeber: 'Restaurant Exemplu', position: 'Sous Chef', ort: 'Bukarest', land: 'RO',
              von: '2021', bis: 'heute', taetigkeit: 'Führung der Warmen Küche, Menüentwicklung.' }
          ],
          nachweise: [{ titel: 'Abschluss Koch', art: 'diplom', dateiname: 'koch.pdf', geprueft: true }] },

        { vorname: 'Luca', nachname: 'Esposito', geburtsjahr: 1994,
          staatsangehoerigkeit: 'italienisch', land: 'IT', ort: 'Mailand', zielland: 'DE',
          beruf: 'Elektroinstallateur', branche: 'bau', erfahrung: '6',
          deutsch: 'A2', gehalt: '3000', verfuegbar: 'in 6 Wochen', fuehrerschein: 'B',
          faehigkeiten: ['Industrieanlagen', 'SPS', 'Photovoltaik'],
          ueberMich: 'Schwerpunkt Industrieelektrik und Photovoltaik, VDE-zertifiziert.',
          sprachen: [{ sprache: 'Italienisch', niveau: 'Muttersprache' },
                     { sprache: 'Englisch', niveau: 'B2' }, { sprache: 'Deutsch', niveau: 'A2' }],
          stationen: [
            { id: 'st-d4a', arbeitgeber: 'Esempio Elettro SRL', position: 'Elektroinstallateur', ort: 'Mailand',
              land: 'IT', von: '2019', bis: 'heute', taetigkeit: 'Schaltanlagenbau und Inbetriebnahme.' }
          ],
          nachweise: [{ titel: 'VDE-Zertifizierung', art: 'zertifikat', dateiname: 'vde.pdf', geprueft: true }] },

        { vorname: 'Sofia', nachname: 'Dimitrova', geburtsjahr: 1986,
          staatsangehoerigkeit: 'bulgarisch', land: 'BG', ort: 'Sofia', zielland: 'DE',
          beruf: 'Altenpflegerin', branche: 'pflege', erfahrung: '9',
          deutsch: 'B1', gehalt: '2500', verfuegbar: 'ab sofort', fuehrerschein: 'B',
          faehigkeiten: ['Demenzpflege', 'Palliativpflege', 'Wundmanagement'],
          ueberMich: 'Neun Jahre stationäre Altenpflege mit Schwerpunkt Demenz.',
          sprachen: [{ sprache: 'Bulgarisch', niveau: 'Muttersprache' },
                     { sprache: 'Deutsch', niveau: 'B1' }, { sprache: 'Russisch', niveau: 'B2' }],
          stationen: [
            { id: 'st-d5a', arbeitgeber: 'Beispiel-Seniorenheim Sofia', position: 'Pflegefachkraft', ort: 'Sofia',
              land: 'BG', von: '2016', bis: 'heute', taetigkeit: 'Bezugspflege auf einem Demenzwohnbereich.' }
          ],
          nachweise: [
            { titel: 'Abschluss Altenpflege', art: 'diplom', dateiname: 'pflege.pdf', geprueft: true },
            { titel: 'Zertifikat Palliative Care', art: 'zertifikat', dateiname: 'palliativ.pdf', geprueft: false }
          ] },

        { vorname: 'Tomasz', nachname: 'Kowalski', geburtsjahr: 1984,
          staatsangehoerigkeit: 'polnisch', land: 'PL', ort: 'Krakau', zielland: 'DE',
          beruf: 'Berufskraftfahrer CE', branche: 'logistik', erfahrung: '11',
          deutsch: 'B1', gehalt: '2900', verfuegbar: 'in 2 Wochen', fuehrerschein: 'B, C, CE',
          faehigkeiten: ['Klasse CE', 'Gefahrgut ADR', 'Modul 95'],
          ueberMich: 'Elf Jahre Fernverkehr in Mittel- und Westeuropa, unfallfrei.',
          sprachen: [{ sprache: 'Polnisch', niveau: 'Muttersprache' },
                     { sprache: 'Deutsch', niveau: 'B1' }],
          stationen: [
            { id: 'st-d6a', arbeitgeber: 'Przykład Trans Sp. z o.o.', position: 'Berufskraftfahrer', ort: 'Krakau',
              land: 'PL', von: '2015', bis: 'heute', taetigkeit: 'Fernverkehr DE, NL, FR mit Planenauflieger.' }
          ],
          nachweise: [
            { titel: 'Führerschein CE', art: 'fuehrerschein', dateiname: 'ce.pdf', geprueft: true },
            { titel: 'ADR-Schein Gefahrgut', art: 'zertifikat', dateiname: 'adr.pdf', geprueft: true }
          ] },

        { vorname: 'Zsolt', nachname: 'Nagy', geburtsjahr: 1992,
          staatsangehoerigkeit: 'ungarisch', land: 'HU', ort: 'Budapest', zielland: 'DE',
          beruf: 'Systemadministrator', branche: 'it', erfahrung: '7',
          deutsch: 'B2', gehalt: '4200', verfuegbar: 'in 8 Wochen', fuehrerschein: 'B',
          faehigkeiten: ['Linux', 'Netzwerk', 'IT-Sicherheit'],
          ueberMich: 'Sieben Jahre Systembetrieb, Schwerpunkt Linux und Netzwerksicherheit.',
          sprachen: [{ sprache: 'Ungarisch', niveau: 'Muttersprache' },
                     { sprache: 'Deutsch', niveau: 'B2' }, { sprache: 'Englisch', niveau: 'C1' }],
          stationen: [
            { id: 'st-d7a', arbeitgeber: 'Példa Data Kft.', position: 'Systemadministrator', ort: 'Budapest',
              land: 'HU', von: '2019', bis: 'heute', taetigkeit: 'Betrieb von 200 Servern, Aufbau der Protokollierung.' }
          ],
          nachweise: [{ titel: 'BSc Informatik', art: 'diplom', dateiname: 'bsc.pdf', geprueft: true }] }
      ];

      kandidaten.forEach(function (b, i) {
        var kid = 'k-demo-' + i;
        db.konten.push({
          id: kid, rolle: 'arbeitnehmer', mail: 'demo' + i + '@beispiel.invalid',
          name: b.vorname + ' ' + b.nachname, salt: '', hash: 'demo',
          mfa: true, demo: true, angelegt: jetzt
        });
        var nachweise = (b.nachweise || []).map(function (n, k) {
          return Object.assign({ id: 'n-demo-' + i + '-' + k, typ: 'application/pdf',
            groesse: 180000, inhalt: null, hochgeladen: jetzt }, n);
        });
        db.profile[kid] = Object.assign({
          kontoId: kid, rolle: 'arbeitnehmer', sichtbar: true, umzugsbereit: true,
          telefon: '+40 700 000 0' + i, bilder: [], aktualisiert: jetzt
        }, b, { nachweise: nachweise });
      });

      var arbeitgeber = [
        { kid: 'k-demo-ag', mail: 'demo@unternehmen.invalid', name: 'Thomas Becker',
          firma: 'Musterbau AG', rechtsform: 'Aktiengesellschaft', branche: 'bau',
          ort: 'München', land: 'DE', groesse: '1000+', gegruendet: '1873',
          ansprechperson: 'Thomas Becker', position: 'Leitung Personal Bau',
          telefon: '+49 89 0000 100',
          beschreibung: 'Bauunternehmen mit Schwerpunkt Hoch- und Ingenieurbau. Wir besetzen laufend Positionen im Rohbau und in der Bauleitung, überwiegend in Bayern.',
          leistungen: ['Unterkunft in den ersten drei Monaten', 'Fahrtkostenzuschuss',
                       'Deutschkurs während der Arbeitszeit', 'Unbefristeter Vertrag nach der Probezeit'],
          standorte: [{ ort: 'München', land: 'DE' }, { ort: 'Nürnberg', land: 'DE' }],
          nachweise: [
            { titel: 'Handelsregisterauszug', art: 'gewerbe', dateiname: 'hr.pdf', geprueft: true },
            { titel: 'Erlaubnis nach AÜG', art: 'aueg', dateiname: 'aueg.pdf', geprueft: true }
          ] },
        { kid: 'k-demo-ag2', mail: 'klinik@unternehmen.invalid', name: 'Sabine Wagner',
          firma: 'Musterklinikum Berlin', rechtsform: 'gGmbH', branche: 'pflege',
          ort: 'Berlin', land: 'DE', groesse: '1000+', gegruendet: '1954',
          ansprechperson: 'Sabine Wagner', position: 'Pflegedirektion',
          telefon: '+49 30 0000 200',
          beschreibung: 'Krankenhaus der Schwerpunktversorgung mit 780 Betten. Wir stellen laufend examinierte Pflegekräfte ein und begleiten die Anerkennung ausländischer Abschlüsse.',
          leistungen: ['Begleitung des Anerkennungsverfahrens', 'Personalwohnung',
                       'Kostenfreier Fachsprachkurs bis B2', 'Kita-Plätze im Haus'],
          standorte: [{ ort: 'Berlin', land: 'DE' }],
          nachweise: [{ titel: 'Handelsregisterauszug', art: 'gewerbe', dateiname: 'hr.pdf', geprueft: true }] }
      ];

      arbeitgeber.forEach(function (a) {
        db.konten.push({
          id: a.kid, rolle: 'arbeitgeber', mail: a.mail, name: a.name,
          salt: '', hash: 'demo', mfa: true, demo: true, angelegt: jetzt
        });
        db.profile[a.kid] = {
          kontoId: a.kid, rolle: 'arbeitgeber', sichtbar: true,
          firma: a.firma, rechtsform: a.rechtsform, branche: a.branche, ort: a.ort,
          land: a.land, groesse: a.groesse, gegruendet: a.gegruendet,
          ansprechperson: a.ansprechperson, position: a.position, telefon: a.telefon,
          beschreibung: a.beschreibung, leistungen: a.leistungen, standorte: a.standorte,
          sprachen: [], bilder: [], aktualisiert: jetzt,
          nachweise: a.nachweise.map(function (n, k) {
            return Object.assign({ id: 'n-' + a.kid + '-' + k, typ: 'application/pdf',
              groesse: 120000, inhalt: null, hochgeladen: jetzt }, n);
          })
        };
      });

      db.stellen.push({
        id: 's-demo-1', arbeitgeberId: 'k-demo-ag', titel: 'Polier Rohbau (m/w/d)',
        branche: 'bau', ort: 'München', verguetung: '3.000 bis 3.400 EUR',
        beschreibung: 'Führung einer Kolonne im Rohbau, Hochhausprojekte ab 20 Geschossen.',
        angelegt: jetzt, offen: true
      });
      db.stellen.push({
        id: 's-demo-2', arbeitgeberId: 'k-demo-ag2', titel: 'Pflegefachkraft Intensiv (m/w/d)',
        branche: 'pflege', ort: 'Berlin', verguetung: '3.100 bis 3.600 EUR',
        beschreibung: 'Intensivstation mit 18 Betten, strukturierte Einarbeitung über sechs Monate.',
        angelegt: jetzt, offen: true
      });

      [{ zuId: 'k-demo-1', vonId: 'k-demo-ag', sterne: 5, zeitraum: '2024 bis 2025',
         taetigkeit: 'Rohbau Hochhausprojekt',
         text: 'Sehr zuverlässig, führt seine Kolonne ruhig und klar. Termine wurden eingehalten, Arbeitssicherheit vorbildlich.' },
       { zuId: 'k-demo-0', vonId: 'k-demo-ag2', sterne: 5, zeitraum: '2023 bis 2025',
         taetigkeit: 'Intensivpflege',
         text: 'Fachlich hervorragend und im Team sehr geschätzt. Hat sich schnell auf die deutschen Dokumentationsstandards eingestellt.' },
       { zuId: 'k-demo-ag', vonId: 'k-demo-1', sterne: 4, zeitraum: '2024 bis 2025',
         taetigkeit: 'Anstellung als Polier',
         text: 'Zusagen wurden eingehalten, die Unterkunft war ab dem ersten Tag organisiert. Der Deutschkurs hätte früher starten können.' },
       { zuId: 'k-demo-ag2', vonId: 'k-demo-0', sterne: 5, zeitraum: '2023 bis 2025',
         taetigkeit: 'Anstellung in der Intensivpflege',
         text: 'Das Anerkennungsverfahren wurde vollständig begleitet. Sehr faire und verlässliche Personalabteilung.' }
      ].forEach(function (b, i) {
        db.bewertungen.push(Object.assign({ id: 'bw-demo-' + i, datum: jetzt }, b));
      });

      /* Eine abgeschlossene Zusammenarbeit, damit die Vollansicht demonstrierbar ist */
      db.anfragen.push({
        id: 'a-demo-1', arbeitgeberId: 'k-demo-ag', arbeitnehmerId: 'k-demo-1',
        stelleId: 's-demo-1', freigabeAG: true, freigabeAN: true, abgelehnt: false,
        angelegt: jetzt, entschieden: jetzt
      });

      DB.seedTransport(db, jetzt);

      speichern(db);
    },

    /* Beispiel-Beförderungsunternehmen mit echten Linienverlaeufen */
    seedTransport: function (db, jetzt) {
      var busse = [
        { kid: 'k-demo-bus1', mail: 'bus@timisoara.invalid', name: 'Adrian Popescu',
          firma: 'Beispiel Reisen Timișoara SRL', rechtsform: 'SRL', ort: 'Timișoara', land: 'RO',
          gegruendet: '2009', ansprechperson: 'Adrian Popescu', position: 'Geschäftsführung',
          telefon: '+40 256 000 100',
          lizenz: 'RO-LC-0099142 · Gemeinschaftslizenz gültig bis 03/2029',
          versicherung: 'Haftpflichtversicherung · Personenbeförderung bis 60 Plätze',
          flotte: '6 Reisebusse, 49 bis 57 Plätze, WLAN und Steckdosen',
          beschreibung: 'Linienverkehr zwischen dem Banat und Süddeutschland. Seit 2009 dieselbe Strecke, feste Fahrer, Gepäck bis 2 Koffer inklusive.',
          leistungen: ['Gepäck bis 2 Koffer inklusive', 'Abholung an vereinbarten Haltepunkten',
                       'Fahrer spricht Deutsch und Rumänisch'],
          nachweise: [
            { titel: 'Gemeinschaftslizenz', art: 'gewerbe', dateiname: 'licenta.pdf', geprueft: true },
            { titel: 'Versicherungsnachweis', art: 'gewerbe', dateiname: 'asigurare.pdf', geprueft: true }
          ],
          fahrzeuge: [
            { kennzeichen: 'TM 14 VTR', art: 'reisebus', marke: 'Setra S 516 HD', plaetze: 52,
              baujahr: '2021', ausstattung: ['WLAN', 'Steckdose am Platz', 'Klimaanlage', 'Bordtoilette'] },
            { kennzeichen: 'TM 27 VTR', art: 'reisebus', marke: 'Mercedes Tourismo', plaetze: 49,
              baujahr: '2019', ausstattung: ['WLAN', 'Klimaanlage', 'Bordtoilette'] },
            { kennzeichen: 'TM 08 VTR', art: 'van9', marke: 'Mercedes Sprinter', plaetze: 9,
              baujahr: '2023', ausstattung: ['Klimaanlage', 'Anhängerkupplung', 'Großer Gepäckraum'] }
          ],
          fahrer: [
            { name: 'Mihai Dobre', telefon: '+40 740 000 111',
              sprachen: ['Rumänisch', 'Deutsch', 'Ungarisch'], seit: '2011' },
            { name: 'Ion Rusu', telefon: '+40 740 000 222',
              sprachen: ['Rumänisch', 'Deutsch'], seit: '2016' }
          ],
          linien: [
            { plan: 'Timișoara 17:30\nArad 19:00\nSzeged 20:45\nBudapest 23:30\nWien 04:15\nMünchen 11:00\nStuttgart 14:30',
              tage: [1, 3, 5, 0], preis: 95, plaetze: 52,
              hinweis: 'Halt in Stuttgart am Busbahnhof SBB, Gleis 4.' },
            { plan: 'Timișoara 16:00\nArad 17:30\nBudapest 22:00\nNürnberg 09:30\nFrankfurt am Main 13:00\nKöln 15:00',
              tage: [2, 6], preis: 105, plaetze: 49,
              hinweis: 'Nachtfahrt mit zwei Pausen.' }
          ] },
        { kid: 'k-demo-bus2', mail: 'bus@cluj.invalid', name: 'Elena Marin',
          firma: 'Beispiel Linien Cluj SRL', rechtsform: 'SRL', ort: 'Cluj-Napoca', land: 'RO',
          gegruendet: '2015', ansprechperson: 'Elena Marin', position: 'Disposition',
          telefon: '+40 264 000 200',
          lizenz: 'RO-LC-0124778 · Gemeinschaftslizenz gültig bis 11/2028',
          versicherung: 'Haftpflichtversicherung · Personenbeförderung bis 50 Plätze',
          flotte: '4 Reisebusse, 50 Plätze, behindertengerechter Einstieg auf zwei Fahrzeugen',
          beschreibung: 'Verbindungen aus Siebenbürgen nach Bayern und Baden-Württemberg, mit Halt in mehreren rumänischen Städten.',
          leistungen: ['Barrierefreier Einstieg auf Anfrage', 'Kindersitze vorhanden',
                       'Zustieg an allen Zwischenhalten möglich'],
          nachweise: [
            { titel: 'Gemeinschaftslizenz', art: 'gewerbe', dateiname: 'licenta.pdf', geprueft: true }
          ],
          fahrzeuge: [
            { kennzeichen: 'CJ 03 CPL', art: 'reisebus', marke: 'Neoplan Cityliner', plaetze: 50,
              baujahr: '2020', ausstattung: ['WLAN', 'Klimaanlage', 'Bordtoilette', 'Rollstuhllift'] },
            { kennzeichen: 'CJ 19 CPL', art: 'van7', marke: 'VW Caravelle', plaetze: 7,
              baujahr: '2022', ausstattung: ['Klimaanlage', 'Kindersitze vorhanden'] }
          ],
          fahrer: [
            { name: 'Elena Marin', telefon: '+40 741 000 333',
              sprachen: ['Rumänisch', 'Deutsch', 'Englisch'], seit: '2015' },
            { name: 'Vasile Pop', telefon: '+40 741 000 444',
              sprachen: ['Rumänisch', 'Deutsch'], seit: '2018' }
          ],
          linien: [
            { plan: 'Cluj-Napoca 19:00\nOradea 21:15\nBudapest 01:00\nWien 05:30\nMünchen 10:15\nAugsburg 11:30\nStuttgart 14:00',
              tage: [2, 4, 6], preis: 89, plaetze: 50,
              hinweis: 'Zustieg in Oradea nur nach Voranmeldung.' },
            { plan: 'Cluj-Napoca 06:00\nSibiu 09:30\nTimișoara 13:45\nWien 20:00\nMünchen 00:00',
              tage: [0, 4], preis: 79, plaetze: 50, hinweis: '' }
          ] }
      ];

      busse.forEach(function (b) {
        db.konten.push({
          id: b.kid, rolle: 'transport', mail: b.mail, name: b.name,
          salt: '', hash: 'demo', mfa: true, demo: true, angelegt: jetzt
        });
        db.profile[b.kid] = {
          kontoId: b.kid, rolle: 'transport', sichtbar: true, aktualisiert: jetzt,
          firma: b.firma, rechtsform: b.rechtsform, ort: b.ort, land: b.land,
          gegruendet: b.gegruendet, ansprechperson: b.ansprechperson, position: b.position,
          telefon: b.telefon, lizenz: b.lizenz, versicherung: b.versicherung,
          flotte: b.flotte, beschreibung: b.beschreibung, leistungen: b.leistungen,
          sprachen: [], bilder: [],
          nachweise: (b.nachweise || []).map(function (n, k) {
            return Object.assign({ id: 'n-' + b.kid + '-' + k, typ: 'application/pdf',
              groesse: 150000, inhalt: null, hochgeladen: jetzt }, n);
          })
        };
        (b.fahrzeuge || []).forEach(function (fz, k) {
          db.fahrzeuge.push(Object.assign({
            id: 'fz-' + b.kid + '-' + k, unternehmenId: b.kid, angelegt: jetzt
          }, fz));
        });
        (b.fahrer || []).forEach(function (fr, k) {
          db.fahrer.push(Object.assign({
            id: 'fr-' + b.kid + '-' + k, unternehmenId: b.kid, angelegt: jetzt
          }, fr));
        });
        b.linien.forEach(function (l, k) {
          var halte = DB.linien.planLesen(l.plan);
          var orte = halte.map(function (h) { return h.ort; });
          db.linien.push({
            id: 'l-' + b.kid + '-' + k, unternehmenId: b.kid,
            orte: orte, halte: halte,
            von: orte[0], nach: orte[orte.length - 1],
            tage: l.tage, abfahrt: halte[0].zeit,
            dauer: halte[halte.length - 1].minute / 60,
            preis: l.preis, plaetze: l.plaetze, hinweis: l.hinweis || '',
            /* Jede Linie bekommt das passende Fahrzeug als Standard */
            fahrzeugId: 'fz-' + b.kid + '-' + Math.min(k, (b.fahrzeuge || []).length - 1),
            angelegt: jetzt
          });
        });
      });
    }
  };

  DB.seedLaden();

})(window, document);
