/* Standard Plus - Talentuebersicht
   Liest die Profile aus SP.db und zeichnet sie ueber die DOM-API.
   Kein innerHTML, keine Uebertragung von Suchbegriffen an einen Server. */
(function (w, d) {
  'use strict';
  var SP = w.SP;
  var $ = function (id) { return d.getElementById(id); };

  var BRANCHEN = {
    pflege: SP.t('Pflege und Gesundheit'), bau: SP.t('Bau und Handwerk'), it: SP.t('IT und Technologie'),
    gastro: SP.t('Gastronomie'), logistik: SP.t('Logistik'), produktion: SP.t('Industrie und Produktion'),
    buero: SP.t('Verwaltung und Büro')
  };
  var BRANCHEN_ICON = {
    pflege: 'health', bau: 'helmet', it: 'code', gastro: 'utensils',
    logistik: 'truck', produktion: 'factory', buero: 'office'
  };
  var STUFEN = { A1: 0, A2: 1, B1: 2, B2: 3, C1: 4, C2: 5 };

  var q = $('q'), fBranche = $('f-branche'), fLand = $('f-land'), fSprache = $('f-sprache');
  var zaehler = $('count'), leer = $('leer'), box = $('ergebnisse');

  function betrachterId() { var s = SP.session.get(); return s ? s.kontoId : null; }

  function sterne(wert, anzahl) {
    var wrap = SP.el('span', 'sterne');
    for (var i = 1; i <= 5; i++) wrap.appendChild(SP.icon('star', i <= Math.round(wert) ? 'voll' : ''));
    wrap.appendChild(SP.el('span', 'sterne-wert', wert.toFixed(1).replace('.', ',')));
    if (anzahl != null) wrap.appendChild(SP.el('span', 'sterne-anzahl', '(' + anzahl + ')'));
    return wrap;
  }

  var vorgabe = new URLSearchParams(w.location.search).get('q');
  if (vorgabe) q.value = SP.clean(vorgabe, 80);

  /* ---------- Bewertung: wie gut passt ein Profil ---------- */
  function bewerten(p) {
    var punkte = 55;
    if (p.erfahrung) punkte += Math.min(Number(p.erfahrung) || 0, 12) * 2;
    punkte += (STUFEN[p.deutsch] || 0) * 3;
    if ((p.faehigkeiten || []).length) punkte += Math.min(p.faehigkeiten.length, 4) * 2;
    if (p.verfuegbar === 'ab sofort') punkte += 4;
    return Math.max(50, Math.min(98, punkte));
  }

  /* ---------- Eine Profilkarte bauen ---------- */
  function karte(p) {
    var art = SP.el('article', 'card card-hover card-pad');
    var wert = bewerten(p);
    var gold = ['bau', 'gastro', 'logistik'].indexOf(p.branche) > -1;

    var kopf = SP.el('div', 'flex ai-s g14');
    var av = SP.el('span', 'ava ava-lg' + (gold ? ' gold' : ''));
    var sil = d.createElementNS('http://www.w3.org/2000/svg', 'svg');
    sil.setAttribute('class', 'silhouette');
    sil.setAttribute('viewBox', '0 0 24 24');
    sil.setAttribute('aria-hidden', 'true');
    var use = d.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', '#i-portrait');
    sil.appendChild(use);
    av.appendChild(sil);
    av.appendChild(SP.el('span', null, SP.initials(SP.db.profile.anzeigename(p))));
    if (BRANCHEN_ICON[p.branche]) {
      var rolle = SP.el('span', 'ava-role');
      rolle.appendChild(SP.icon(BRANCHEN_ICON[p.branche]));
      av.appendChild(rolle);
    }
    var abz = SP.el('span', 'ava-badge' + (gold ? ' gold' : ''));
    abz.appendChild(SP.icon('check'));
    av.appendChild(abz);
    kopf.appendChild(av);

    var text = SP.el('div');
    text.appendChild(SP.el('h2', 'h3', SP.db.profile.anzeigename(p)));
    text.appendChild(SP.el('p', 'small fw6 ' + (gold ? 't-gold-d' : 't-teal'), SP.tInhalt(p.beruf) || SP.t('Ohne Angabe')));
    var ort = SP.el('p', 'tiny muted flex g6 ai-c mt4');
    ort.appendChild(SP.icon('pin', 'ic-sm'));
    ort.appendChild(d.createTextNode(
      [SP.tInhalt(p.ort), p.land ? '(' + p.land + ')' : '', p.zielland ? '→ ' + SP.tInhalt(p.zielland) : '']
        .filter(Boolean).join(' ')));
    text.appendChild(ort);
    kopf.appendChild(text);
    art.appendChild(kopf);

    var bew = SP.db.bewertungen.schnitt(p.kontoId);
    var kopfzeile = SP.el('div', 'flex wrapf g8 ai-c mt12');
    if (bew) kopfzeile.appendChild(sterne(bew.wert, bew.anzahl));
    var gepr = (p.nachweise || []).filter(function (n) { return n.geprueft; }).length;
    if (gepr) {
      var gt = SP.el('span', 'tag tag-ok');
      gt.appendChild(SP.icon('verified', 'ic-sm'));
      gt.appendChild(SP.el('span', null, SP.anzahl(gepr, '{n} Nachweis', '{n} Nachweise')));
      kopfzeile.appendChild(gt);
    }
    if (bew || gepr) art.appendChild(kopfzeile);

    var tags = SP.el('div', 'flex wrapf g6 mt16');
    (p.faehigkeiten || []).slice(0, 3).forEach(function (f) {
      tags.appendChild(SP.el('span', 'tag ' + (gold ? 'tag-gold' : 'tag-teal'), SP.tInhalt(f)));
    });
    if (p.deutsch) tags.appendChild(SP.el('span', 'tag', SP.t('Deutsch {stufe}', { stufe: p.deutsch })));
    if ((p.sprachen || []).length > 1) {
      tags.appendChild(SP.el('span', 'tag', SP.anzahl(p.sprachen.length, '{n} Sprache', '{n} Sprachen')));
    }
    if (p.erfahrung) tags.appendChild(SP.el('span', 'tag', SP.anzahl(p.erfahrung, '{n} Jahr', '{n} Jahre')));
    art.appendChild(tags);

    var bar = SP.el('div', 'bar mt20');
    var bh = SP.el('div', 'bar-h');
    bh.appendChild(SP.el('span', 'muted small', SP.t('Übereinstimmung')));
    bh.appendChild(SP.el('b', null, wert + ' %'));
    bar.appendChild(bh);
    var track = SP.el('div', 'bar-t');
    track.appendChild(SP.el('div', 'bar-f ' + (gold ? 'gold ' : '') + 'pct-' + wert));
    bar.appendChild(track);
    art.appendChild(bar);

    if (p.verfuegbar) art.appendChild(SP.el('p', 'tiny muted mb12', SP.t('Verfügbar: {wann}', { wann: SP.tInhalt(p.verfuegbar) })));

    var knoepfe = SP.el('div', 'flex g8');
    var anfrage = SP.el('button', 'btn btn-primary btn-sm f1', SP.t('Anfrage senden'));
    anfrage.type = 'button';
    anfrage.addEventListener('click', function () { anfrageStellen(p, anfrage); });
    var detail = SP.el('a', 'btn btn-outline btn-sm f1', SP.t('Profil ansehen'));
    detail.href = 'standardplus-profil-ansicht.html?id=' + encodeURIComponent(p.kontoId);
    knoepfe.appendChild(anfrage);
    knoepfe.appendChild(detail);
    art.appendChild(knoepfe);

    /* Merkmale fuer den Filter */
    art.setAttribute('data-branche', p.branche || '');
    art.setAttribute('data-land', p.land || '');
    art.setAttribute('data-sprache', p.deutsch || '');
    /* Deutsche Fassung und Anzeigesprache, damit beide Suchbegriffe treffen */
    art.setAttribute('data-text', [p.beruf, SP.tInhalt(p.beruf), (p.faehigkeiten || []).join(' '),
      (p.faehigkeiten || []).map(SP.tInhalt).join(' '), p.ort, SP.tInhalt(p.ort)]
      .filter(Boolean).join(' ').toLowerCase());

    SP.klickbar(art, detail);
    return art;
  }

  /* ---------- Anfrage stellen ---------- */
  function anfrageStellen(p, btn) {
    var s = SP.session.get();
    if (!s) {
      SP.toast('warn', SP.t('Anmeldung erforderlich'),
        SP.t('Kontaktanfragen sind nur mit bestätigtem Konto möglich. Sie werden weitergeleitet.'));
      setTimeout(function () {
        w.location.href = 'standardplus-login.html?ziel=standardplus-talente.html';
      }, 1600);
      return;
    }
    if (s.role !== 'arbeitgeber') {
      SP.toast('info', SP.t('Nur für Arbeitgeber'),
        SP.t('Anfragen an andere Profile können nur Arbeitgeberkonten stellen.'));
      return;
    }
    var offene = SP.db.stellen.vonArbeitgeber(s.kontoId).filter(function (x) { return x.offen; });
    SP.db.anfragen.anlegen(s.kontoId, p.kontoId, offene.length ? offene[0].id : null);
    btn.disabled = true;
    btn.textContent = SP.t('Anfrage gesendet');
    SP.toast('ok', SP.t('Anfrage gesendet'),
      SP.t('{name} entscheidet über die Freigabe. Erst danach erhalten Sie Kontaktdaten.', { name: SP.db.profile.anzeigename(p) }));
  }

  /* ---------- Zeichnen und filtern ---------- */
  function zeichnen() {
    box.replaceChildren();
    SP.db.profile.arbeitnehmer(betrachterId()).forEach(function (p) { box.appendChild(karte(p)); });
    filtern();
  }

  function filtern() {
    var text = SP.clean(q.value, 80).toLowerCase();
    var branche = fBranche.value, land = fLand.value;
    var minStufe = STUFEN[fSprache.value];
    var sichtbar = 0;

    Array.prototype.forEach.call(box.children, function (k) {
      var passt =
        (!branche || k.getAttribute('data-branche') === branche) &&
        (!land || k.getAttribute('data-land') === land) &&
        (minStufe === undefined || (STUFEN[k.getAttribute('data-sprache')] || 0) >= minStufe) &&
        (!text || (k.getAttribute('data-text') || '').indexOf(text) > -1 ||
          k.textContent.toLowerCase().indexOf(text) > -1);
      k.hidden = !passt;
      if (passt) sichtbar++;
    });

    zaehler.textContent = SP.anzahl(sichtbar, '{n} Profil', '{n} Profile');
    leer.classList.toggle('hidden', sichtbar > 0);
  }

  /* Vorschlaege: erst was wirklich in der Datenbank steht, danach das
     gemeinsame Woerterbuch mit Orten, Laendern, Berufen und Kenntnissen. */
  SP.autocomplete(q, {
    quelle: SP.vok.quelle(['ort', 'region', 'land', 'beruf', 'branche', 'kenntnis', 'sprache'],
      SP.suchquellen.talente(betrachterId())),
    max: 9,
    aufAuswahl: function (eintrag) {
      /* Branche und Land setzen den Filter, nicht den Suchtext -
         sonst wuerde zweimal dasselbe gefiltert. */
      if (eintrag.typ === 'Branche') {
        var br = eintrag.wert || Object.keys(SP.db.BRANCHEN).filter(function (k) {
          return SP.db.BRANCHEN[k] === eintrag.text;
        })[0];
        if (br) { q.value = ''; fBranche.value = br; }
      }
      if (eintrag.typ === 'Land' && eintrag.wert) {
        var hat = Array.prototype.some.call(fLand.options, function (o) {
          return o.value === eintrag.wert;
        });
        if (hat) { q.value = ''; fLand.value = eintrag.wert; }
      }
      filtern();
    }
  });

  ['input', 'change'].forEach(function (ev) {
    [q, fBranche, fLand, fSprache].forEach(function (el) { el.addEventListener(ev, filtern); });
  });
  $('filter').addEventListener('submit', function (e) { e.preventDefault(); filtern(); });
  $('reset').addEventListener('click', function () {
    setTimeout(function () { q.value = ''; filtern(); }, 0);
  });

  zeichnen();

})(window, document);
