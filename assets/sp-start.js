/* Standard Plus - Startseite
   Verkabelt das grosse Suchfeld im Kopfbereich mit dem gemeinsamen
   Woerterbuch. Die Startseite kommt bewusst ohne Datenbank aus, damit
   beim ersten Aufruf nichts gespeichert wird (TTDSG Paragraf 25). */
(function (w, d) {
  'use strict';
  var SP = w.SP;
  var feld = d.getElementById('hero-q');
  if (!feld || !SP.autocomplete || !SP.vok) return;

  SP.autocomplete(feld, {
    /* Wortmodus: der Satz bleibt stehen, nur das zuletzt getippte
       Wort wird ergaenzt. So laesst sich frei weiterschreiben. */
    wort: true, min: 2, max: 8,
    quelle: SP.vok.quelle(['beruf', 'branche', 'ort', 'region', 'land',
      'kenntnis', 'sprache', 'verfuegbar'])
  });
})(window, document);
