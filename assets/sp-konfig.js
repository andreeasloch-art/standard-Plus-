/* ============================================================
   Standard Plus - Einstellungen
   ------------------------------------------------------------
   Die einzige Datei, die Sie beim Umzug auf einen echten Server
   anfassen muessen.
   ============================================================ */
(function (w) {
  'use strict';
  w.SP = w.SP || {};

  w.SP.KONFIG = {

    /* Adresse des Dolmetscher-Servers (WebSocket).
       ------------------------------------------------------------
       Leer lassen = kein Live-Betrieb. Die Interviewseite zeigt
       dann nur das vorbereitete Beispielgespraech.

       Empfohlen: den Server hinter demselben Namen betreiben wie
       die Website, zum Beispiel als /dolmetscher/ws. Dann bleibt
       die Sicherheitsrichtlinie unveraendert, weil 'self' auch
       diese Verbindung abdeckt.

       Beispiele:
         ''                          kein Server, nur Demo
         '/dolmetscher/ws'           gleicher Server (empfohlen)
         'wss://dolmetscher.ihre-domain.de/ws'   eigener Name
                                     -> dann muss diese Adresse in
                                        connect-src der CSP ergaenzt
                                        werden, siehe LIESMICH. */
    dolmetscher: '',

    /* Wie lange nach der letzten Silbe abgeschickt wird (Millisekunden).
       Kleiner = schnellere Untertitel, mehr zerhackte Saetze. */
    sprechpause: 900,

    /* Uebersetztes soll zusaetzlich vorgelesen werden */
    stimmeAn: true
  };

})(window);
