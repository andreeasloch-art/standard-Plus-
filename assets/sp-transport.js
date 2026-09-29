/* ============================================================
   Standard Plus - Busverbindungen
   ------------------------------------------------------------
   Zeigt die Linien der gepruefen Befoerderungsunternehmen und
   filtert nach Strecke und Wochentag. Eine Linie passt auch dann,
   wenn Start und Ziel nur Zwischenhalte sind - solange die
   Reihenfolge stimmt.
   Ausgabe ausschliesslich ueber die DOM-API, kein innerHTML.
   ============================================================ */
(function (w, d) {
  'use strict';
  var SP = w.SP;
  var $ = function (id) { return d.getElementById(id); };

  var box = $('ergebnisse'), zaehler = $('count'), leer = $('leer');
  var fVon = $('f-von'), fNach = $('f-nach'), fTag = $('f-tag');

  /* Vorbelegung aus der Adresszeile, etwa aus dem Dashboard */
  var params = new URLSearchParams(w.location.search);
  if (params.get('von')) fVon.value = SP.clean(params.get('von'), 80);
  if (params.get('nach')) fNach.value = SP.clean(params.get('nach'), 80);

  function vergleich(s) {
    return String(s == null ? '' : s).toLowerCase().trim()
      .replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 'ss')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/ae/g, 'a').replace(/oe/g, 'o').replace(/ue/g, 'u');
  }

  /* ---------- Eine Linienkarte ---------- */
  function karte(l) {
    var unternehmen = SP.db.profile.holen(l.unternehmenId);
    var art = SP.el('article', 'card card-pad card-hover linienkarte');

    art.appendChild(SP.el('h2', 'h3', SP.t('{von} nach {nach}', { von: SP.tInhalt(l.von), nach: SP.tInhalt(l.nach) })));
    art.appendChild(SP.el('p', 'small t-teal fw6 mt4',
      (unternehmen && unternehmen.firma) || SP.t('Beförderungsunternehmen')));

    /* Der Linienverlauf ist die wichtigste Angabe - jeder Halt ist
       Ein- und Ausstieg, daran haengt die ganze Buchbarkeit. */
    var halte = SP.db.linien.halte(l);
    var weg = SP.el('p', 'small muted mt12 flex g6 ai-s');
    weg.appendChild(SP.icon('pin', 'ic-sm'));
    weg.appendChild(d.createTextNode(l.orte.map(SP.tInhalt).join(' · ')));
    art.appendChild(weg);

    var tage = SP.el('div', 'tagestreifen mt16');
    [1, 2, 3, 4, 5, 6, 0].forEach(function (t) {
      var an = l.tage.indexOf(t) > -1;
      var punkt = SP.el('span', 'tag-punkt' + (an ? ' an' : ''), SP.t(SP.db.linien.KURZ[t]));
      punkt.setAttribute('title', an
        ? SP.t('{tag}: Abfahrt {zeit} Uhr', { tag: SP.t(SP.db.linien.WOCHENTAGE[t]), zeit: l.abfahrt })
        : SP.t('{tag}: keine Fahrt', { tag: SP.t(SP.db.linien.WOCHENTAGE[t]) }));
      tage.appendChild(punkt);
    });
    art.appendChild(tage);

    var werte = SP.el('div', 'flex wrapf g8 mt16');
    werte.appendChild(SP.el('span', 'tag tag-teal', SP.t('ab {zeit} Uhr', { zeit: l.abfahrt })));
    werte.appendChild(SP.el('span', 'tag',
      SP.reiseplan.dauerText(halte.length ? halte[halte.length - 1].minute : l.dauer * 60)));
    werte.appendChild(SP.el('span', 'tag tag-gold', SP.t('{preis} € je Platz', { preis: l.preis })));
    werte.appendChild(SP.el('span', 'tag', SP.t('{n} Plätze', { n: l.plaetze })));
    art.appendChild(werte);

    /* Welches Fahrzeug faehrt - Kennzeichen und Groesse gehoeren dem
       Unternehmen und duerfen offen stehen. Fahrernamen nicht. */
    var fz = l.fahrzeugId ? SP.db.fahrzeuge.byId(l.fahrzeugId) : null;
    var wagen = SP.el('div', 'flex g10 ai-c mt16 wrapf');
    if (fz) {
      var schild = SP.el('span', 'kennzeichen');
      schild.appendChild(SP.el('span', 'kz-eu', 'EU'));
      schild.appendChild(SP.el('span', 'kz-text', fz.kennzeichen));
      wagen.appendChild(schild);
      wagen.appendChild(SP.el('span', 'small',
        SP.db.fahrzeuge.ARTEN[fz.art] + (fz.marke ? ' · ' + fz.marke : '') +
        ' · ' + SP.anzahl(fz.plaetze, '{n} Platz', '{n} Plätze')));
    } else {
      var offen = SP.el('span', 'small muted flex g6 ai-c');
      offen.appendChild(SP.icon('bus', 'ic-sm'));
      offen.appendChild(d.createTextNode(SP.t('Fahrzeug wird je Fahrt eingeteilt')));
      wagen.appendChild(offen);
    }
    art.appendChild(wagen);

    if (fz && (fz.ausstattung || []).length) {
      var aus = SP.el('div', 'flex wrapf g6 mt12');
      fz.ausstattung.slice(0, 5).forEach(function (a) {
        aus.appendChild(SP.el('span', 'tag', SP.tInhalt(a)));
      });
      art.appendChild(aus);
    }

    if (l.hinweis) art.appendChild(SP.el('p', 'tiny muted mt12', SP.tInhalt(l.hinweis)));

    var geprueft = ((unternehmen && unternehmen.nachweise) || [])
      .filter(function (n) { return n.geprueft; }).length;
    if (geprueft) {
      var marke = SP.el('p', 'tiny fw7 t-ok mt12 flex g6 ai-c');
      marke.appendChild(SP.icon('verified', 'ic-sm'));
      marke.appendChild(d.createTextNode(SP.t('{n} geprüfte Nachweise', { n: geprueft })));
      art.appendChild(marke);
    }

    /* Der ganze Verlauf mit Uhrzeiten - aufklappbar, damit die
       Uebersicht nicht in Fahrplaenen untergeht. */
    art.appendChild(SP.reiseplan.klappbar(l, {}, SP.t('Reiseplan mit allen Halten')));

    var ansehen = SP.el('a', 'btn btn-outline btn-sm mt16', SP.t('Unternehmen ansehen'));
    ansehen.href = 'standardplus-profil-ansicht.html?id=' + encodeURIComponent(l.unternehmenId);
    art.appendChild(ansehen);


    /* Merkmale fuer den Filter */
    /* Deutscher Name und Name in der Seitensprache: "Wien" und "Vienna" finden dieselbe Linie */
    art.setAttribute('data-orte', l.orte.map(function (o) {
      return vergleich(o) + ' ' + vergleich(SP.tInhalt(o));
    }).join('|'));
    art.setAttribute('data-tage', l.tage.join(','));
    return art;
  }

  /* ---------- Filtern ---------- */
  function filtern() {
    var von = vergleich(fVon.value), nach = vergleich(fNach.value);
    var tag = fTag.value;
    var sichtbar = 0;

    Array.prototype.forEach.call(box.children, function (k) {
      var orte = (k.getAttribute('data-orte') || '').split('|');
      var passt = true;

      if (von) {
        var i = orte.findIndex(function (o) { return o.indexOf(von) > -1; });
        if (i < 0) passt = false;
        else if (nach) {
          /* Reihenfolge zaehlt: Einstieg muss vor dem Ausstieg liegen */
          var j = orte.findIndex(function (o, k2) {
            return k2 > i && o.indexOf(nach) > -1;
          });
          if (j < 0) passt = false;
        }
      } else if (nach) {
        passt = orte.some(function (o) { return o.indexOf(nach) > -1; });
      }

      if (passt && tag !== '') {
        passt = (k.getAttribute('data-tage') || '').split(',').indexOf(tag) > -1;
      }

      k.hidden = !passt;
      if (passt) sichtbar++;
    });

    zaehler.textContent = SP.anzahl(sichtbar, '{n} Linie', '{n} Linien');
    leer.classList.toggle('hidden', sichtbar > 0);
  }

  /* ---------- Start ---------- */
  box.replaceChildren();
  SP.db.linien.liste().forEach(function (l) { box.appendChild(karte(l)); });

  /* Orte aus den Linien selbst vorschlagen - das sind die, die
     tatsaechlich angefahren werden. */
  function orteQuelle() {
    var gesehen = {}, raus = [];
    SP.db.linien.liste().forEach(function (l) {
      l.orte.forEach(function (o) {
        if (gesehen[o]) return;
        gesehen[o] = true;
        raus.push({ typ: SP.t('Halt'), text: SP.tInhalt(o), icon: 'pin' });
      });
    });
    return raus;
  }
  if (SP.vok) {
    SP.vok.feld(fVon, ['ort'], { zusatz: orteQuelle, aufAuswahl: filtern });
    SP.vok.feld(fNach, ['ort'], { zusatz: orteQuelle, aufAuswahl: filtern });
  }

  ['input', 'change'].forEach(function (ev) {
    [fVon, fNach, fTag].forEach(function (el) { el.addEventListener(ev, filtern); });
  });
  $('filter').addEventListener('submit', function (e) { e.preventDefault(); filtern(); });
  $('reset').addEventListener('click', function () {
    fVon.value = ''; fNach.value = ''; fTag.value = '';
    filtern();
  });

  filtern();

})(window, document);
