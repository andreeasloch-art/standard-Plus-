/* Standard Plus - Unternehmensuebersicht
   Zeigt Arbeitgeberprofile mit Bewertung, Leistungen und offenen Stellen. */
(function (w, d) {
  'use strict';
  var SP = w.SP;
  var $ = function (id) { return d.getElementById(id); };

  var sitzung = SP.session.get();
  var betrachterId = sitzung ? sitzung.kontoId : null;
  var box = $('ergebnisse'), zaehler = $('count'), leer = $('leer');
  var q = $('q'), fBranche = $('f-branche'), fBewertung = $('f-bewertung');

  function sterne(wert, anzahl) {
    var wrap = SP.el('span', 'sterne');
    for (var i = 1; i <= 5; i++) wrap.appendChild(SP.icon('star', i <= Math.round(wert) ? 'voll' : ''));
    wrap.appendChild(SP.el('span', 'sterne-wert', wert.toFixed(1).replace('.', ',')));
    if (anzahl != null) wrap.appendChild(SP.el('span', 'sterne-anzahl', '(' + anzahl + ')'));
    return wrap;
  }

  function karte(p) {
    var art = SP.el('article', 'card card-hover card-pad');
    var schnitt = SP.db.bewertungen.schnitt(p.kontoId);
    var stellen = SP.db.stellen.vonArbeitgeber(p.kontoId).filter(function (s) { return s.offen; });

    var kopf = SP.el('div', 'flex ai-s g14');
    var av = SP.el('span', 'ava ava-lg gold');
    av.appendChild(SP.el('span', null, SP.initials(p.firma)));
    var rolle = SP.el('span', 'ava-role');
    rolle.appendChild(SP.icon('building'));
    av.appendChild(rolle);
    kopf.appendChild(av);

    var text = SP.el('div');
    text.appendChild(SP.el('h2', 'h3', p.firma));
    text.appendChild(SP.el('p', 'small t-gold-d fw6',
      [SP.db.BRANCHEN[p.branche] || '', p.rechtsform].filter(Boolean).join(' · ')));
    var ort = SP.el('p', 'tiny muted flex g6 ai-c mt4');
    ort.appendChild(SP.icon('pin', 'ic-sm'));
    ort.appendChild(d.createTextNode([SP.tInhalt(p.ort), p.land].filter(Boolean).join(', ')));
    text.appendChild(ort);
    kopf.appendChild(text);
    art.appendChild(kopf);

    var marken = SP.el('div', 'flex wrapf g8 mt16');
    if (schnitt) marken.appendChild(sterne(schnitt.wert, schnitt.anzahl));
    else marken.appendChild(SP.el('span', 'tag', SP.t('Noch keine Bewertung')));
    if (p.groesse) marken.appendChild(SP.el('span', 'tag', SP.t('{n} Mitarbeitende', { n: p.groesse })));
    var geprueft = (p.nachweise || []).filter(function (n) { return n.geprueft; }).length;
    if (geprueft) {
      var g = SP.el('span', 'tag tag-ok');
      g.appendChild(SP.icon('verified', 'ic-sm'));
      g.appendChild(SP.el('span', null, SP.t('geprüft')));
      marken.appendChild(g);
    }
    art.appendChild(marken);

    if (p.beschreibung) {
      var beschr = SP.tInhalt(p.beschreibung);
      art.appendChild(SP.el('p', 'small muted mt12',
        beschr.slice(0, 150) + (beschr.length > 150 ? '…' : '')));
    }

    art.appendChild(SP.el('p', 'tiny fw7 t-teal mt16',
      stellen.length ? SP.anzahl(stellen.length, '{n} offene Stelle', '{n} offene Stellen')
                     : SP.t('Aktuell keine offene Stelle')));

    var knoepfe = SP.el('div', 'flex g8 mt12');
    var ansehen = SP.el('a', 'btn btn-primary btn-sm f1', SP.t('Profil ansehen'));
    ansehen.href = 'standardplus-profil-ansicht.html?id=' + encodeURIComponent(p.kontoId);
    knoepfe.appendChild(ansehen);
    art.appendChild(knoepfe);

    art.setAttribute('data-branche', p.branche || '');
    art.setAttribute('data-bewertung', schnitt ? schnitt.wert : 0);
    art.setAttribute('data-text',
      [p.firma, p.ort, SP.tInhalt(p.ort), p.beschreibung, SP.tInhalt(p.beschreibung)].filter(Boolean).join(' ').toLowerCase());

    SP.klickbar(art, ansehen);
    return art;
  }

  function filtern() {
    var text = SP.clean(q.value, 80).toLowerCase();
    var branche = fBranche.value;
    var min = parseFloat(fBewertung.value) || 0;
    var sichtbar = 0;
    Array.prototype.forEach.call(box.children, function (k) {
      var passt = (!branche || k.getAttribute('data-branche') === branche) &&
                  (parseFloat(k.getAttribute('data-bewertung')) >= min) &&
                  (!text || (k.getAttribute('data-text') || '').indexOf(text) > -1);
      k.hidden = !passt;
      if (passt) sichtbar++;
    });
    zaehler.textContent = SP.anzahl(sichtbar, '1 Unternehmen', '{n} Unternehmen');
    leer.classList.toggle('hidden', sichtbar > 0);
  }

  box.replaceChildren();
  SP.db.profile.arbeitgeber(betrachterId).forEach(function (p) { box.appendChild(karte(p)); });
  SP.autocomplete(q, {
    quelle: SP.vok.quelle(['ort', 'region', 'land', 'branche', 'rechtsform', 'leistung'],
      SP.suchquellen.unternehmen(betrachterId)),
    max: 9,
    aufAuswahl: function (eintrag) {
      if (eintrag.typ === 'Branche') {
        var br = eintrag.wert || Object.keys(SP.db.BRANCHEN).filter(function (k) {
          return SP.db.BRANCHEN[k] === eintrag.text;
        })[0];
        if (br) { q.value = ''; fBranche.value = br; }
      }
      filtern();
    }
  });

  ['input', 'change'].forEach(function (ev) {
    [q, fBranche, fBewertung].forEach(function (el) { el.addEventListener(ev, filtern); });
  });
  $('filter').addEventListener('submit', function (e) { e.preventDefault(); filtern(); });
  filtern();

})(window, document);
