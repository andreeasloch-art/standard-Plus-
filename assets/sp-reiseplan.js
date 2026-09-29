/* ============================================================
   Standard Plus - Reiseplan
   ------------------------------------------------------------
   Zeichnet den Verlauf einer Linie als Zeitstrahl: jeder Halt mit
   Uhrzeit, die eigene Teilstrecke hervorgehoben, die Halte davor
   und danach zurueckgenommen.

   Der Zweck ist Nachvollziehbarkeit: Wer in Wien zusteigt, soll
   sehen, dass der Bus schon seit Timisoara unterwegs ist - und
   wie lange SEINE Fahrt dauert, nicht die der ganzen Linie.

   Ausgabe ausschliesslich ueber die DOM-API, kein innerHTML.
   ============================================================ */
(function (w, d) {
  'use strict';
  var SP = w.SP;

  /* Minuten als "6 Std. 45 Min." - Stunden allein sind zu grob,
     Minuten allein zu unhandlich. */
  function dauerText(minuten) {
    var st = Math.floor(minuten / 60), mi = Math.round(minuten % 60);
    if (st && mi) return SP.t('{st} Std. {mi} Min.', { st: st, mi: mi });
    if (st) return SP.anzahl(st, '{n} Stunde', '{n} Stunden');
    return SP.anzahl(mi, '{n} Minute', '{n} Minuten');
  }

  /* Tagesversatz eines Halts gegenueber der Abfahrt des Fahrgasts */
  function tagVersatz(minuteHalt, minuteStart, startZeit) {
    var absolut = SP.db.linien.minutenAus(startZeit) + (minuteHalt - minuteStart);
    return Math.floor(absolut / 1440);
  }

  SP.reiseplan = {
    dauerText: dauerText,

    /* ----------------------------------------------------------
       zeichnen(linie, optionen)
         vonIndex, nachIndex  eigene Teilstrecke (optional)
         datum                Abfahrtstag des Fahrgasts (optional)
       ---------------------------------------------------------- */
    zeichnen: function (linie, optionen) {
      var o = optionen || {};
      var halte = SP.db.linien.halte(linie);
      if (!halte.length) return SP.el('p', 'leerhinweis', SP.t('Für diese Linie liegt kein Fahrplan vor.'));

      var von = typeof o.vonIndex === 'number' ? o.vonIndex : 0;
      var nach = typeof o.nachIndex === 'number' ? o.nachIndex : halte.length - 1;
      var eigeneStrecke = (von !== 0 || nach !== halte.length - 1);

      var liste = SP.el('ol', 'reiseplan');

      halte.forEach(function (h, i) {
        var dabei = i >= von && i <= nach;
        var li = SP.el('li', 'rp-halt' +
          (dabei ? '' : ' aussen') +
          (i === von ? ' start' : '') +
          (i === nach ? ' ziel' : ''));

        var zeit = SP.el('span', 'rp-zeit');
        zeit.appendChild(SP.el('b', null, h.zeit));
        var versatz = tagVersatz(h.minute, halte[von].minute, halte[von].zeit);
        if (versatz > 0) zeit.appendChild(SP.el('span', 'rp-tag', SP.anzahl(versatz, '+{n} Tag', '+{n} Tage')));
        li.appendChild(zeit);

        var punkt = SP.el('span', 'rp-punkt');
        punkt.setAttribute('aria-hidden', 'true');
        li.appendChild(punkt);

        var text = SP.el('span', 'rp-ort');
        text.appendChild(SP.el('strong', null, SP.tInhalt(h.ort)));
        if (i === von && eigeneStrecke) text.appendChild(SP.el('span', 'rp-marke', SP.t('Sie steigen ein')));
        else if (i === nach && eigeneStrecke) text.appendChild(SP.el('span', 'rp-marke', SP.t('Sie steigen aus')));
        else if (!dabei) text.appendChild(SP.el('span', 'rp-hinweis', SP.t('nicht Ihre Teilstrecke')));
        else if (i > von && i < nach) {
          var stand = h.minute - halte[i - 1].minute;
          text.appendChild(SP.el('span', 'rp-hinweis', SP.t('{dauer} ab {ort}', { dauer: dauerText(stand), ort: SP.tInhalt(halte[i - 1].ort) })));
        }
        li.appendChild(text);
        liste.appendChild(li);
      });

      var rahmen = SP.el('div', 'reiseplan-rahmen');

      var kopf = SP.el('p', 'rp-kopf');
      kopf.appendChild(SP.icon('bus', 'ic-sm'));
      kopf.appendChild(SP.el('span', null,
        SP.t('{von} nach {nach}', { von: SP.tInhalt(halte[von].ort), nach: SP.tInhalt(halte[nach].ort) }) + ' · ' +
        dauerText(halte[nach].minute - halte[von].minute) +
        (eigeneStrecke ? ' (' + SP.t('Ihre Teilstrecke') + ')' : '')));
      rahmen.appendChild(kopf);
      rahmen.appendChild(liste);

      if (halte[0].geschaetzt) {
        var hinweis = SP.el('p', 'hint mt12 mb0');
        hinweis.appendChild(SP.icon('info', 'ic-sm'));
        hinweis.appendChild(d.createTextNode(
          SP.t('Die Zwischenzeiten sind geschätzt – das Unternehmen hat für diese Linie noch keinen Fahrplan mit Uhrzeiten hinterlegt.')));
        rahmen.appendChild(hinweis);
      }

      return rahmen;
    },

    /* Aufklappbarer Reiseplan, damit Listen nicht zu lang werden */
    klappbar: function (linie, optionen, beschriftung) {
      var box = SP.el('details', 'reiseplan-klapp');
      var kopf = SP.el('summary', null, beschriftung || SP.t('Reiseplan mit allen Halten'));
      box.appendChild(kopf);
      box.appendChild(SP.reiseplan.zeichnen(linie, optionen));
      return box;
    }
  };

})(window, document);
