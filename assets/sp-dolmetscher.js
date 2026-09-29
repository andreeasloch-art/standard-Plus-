/* ============================================================
   Standard Plus - Dolmetscher im Ohr (Client)
   ------------------------------------------------------------
   So wie ein Ohrhoerer, der uebersetzt: Sie sprechen Ihre
   Sprache, die Gegenseite hoert Ihre Worte in ihrer Sprache -
   und umgekehrt.

   Wer was hoert:
     Sie sprechen Deutsch
       -> Ihr Ton geht an Ihren eigenen Server
       -> dort: mitschreiben, uebersetzen, vorlesen
       -> die rumaenische Stimme landet im Ohr der GEGENSEITE
     Sie selbst bekommen nur den Text zurueck, den der Server
     verstanden hat. So sehen Sie sofort, wenn etwas schiefgeht,
     ohne sich selbst doppelt zu hoeren.

   Ohne Kopfhoerer - so wird die Rueckkopplung verhindert:
   Spielt der Lautsprecher die uebersetzte Stimme ab, wuerde das
   eigene Mikrofon sie wieder aufnehmen und erneut zur Uebersetzung
   schicken. Deshalb wird das Mikrofon abgeschaltet, solange der
   Lautsprecher spricht, plus ein kurzer Nachlauf fuer den Nachhall
   des Raums. Genau so arbeiten die Uebersetzungsgeraete im
   Lautsprecherbetrieb: man spricht abwechselnd.

   Wer Kopfhoerer benutzt, schaltet das ueber lautsprecher:false ab
   und kann dann auch waehrend der Ausgabe sprechen.

   Datenschutz: Der Ton geht ausschliesslich an die Adresse aus
   sp-konfig.js. Kein zweiter Empfaenger, keine Zwischenspeicherung
   im Browser. Ohne hinterlegte Adresse wird das Mikrofon nicht
   geoeffnet.
   ============================================================ */
(function (w, d) {
  'use strict';
  var SP = w.SP;

  var ZUSTAND = {
    aus: 'aus', verbinde: 'verbinde', wartet: 'wartet',
    hoert: 'hoert', spricht: 'spricht', fehler: 'fehler'
  };

  function konfig() { return (SP.KONFIG || {}); }

  function adresse() {
    var a = konfig().dolmetscher || '';
    if (!a) return '';
    if (a.indexOf('ws://') === 0 || a.indexOf('wss://') === 0) return a;
    var schema = w.location.protocol === 'https:' ? 'wss://' : 'ws://';
    return schema + w.location.host + (a.charAt(0) === '/' ? a : '/' + a);
  }

  /* ============================================================
     SP.dolmetscher.neu({
       sprache    eigene Sprache, z. B. 'de'
       raum       Kennwort - beide Seiten geben dasselbe ein
       name       Anzeigename fuer die Gegenseite
       aufEigen(t)        was der Server bei Ihnen verstanden hat
       aufGegenseite(e)   was die Gegenseite gesagt hat, uebersetzt
       aufLage(l)         wer sonst im Raum ist
       aufStatus(z, text) Zustandsmeldungen fuer die Anzeige
     })
     ============================================================ */
  function Dolmetscher(optionen) {
    var o = optionen || {};
    this.sprache = o.sprache || 'de';
    this.raum = o.raum || '';
    this.name = o.name || SP.t('Teilnehmer');
    this.mitStimme = o.mitStimme !== false && konfig().stimmeAn !== false;
    /* Lautsprecherbetrieb: Mikrofon pausiert waehrend der Ausgabe.
       Mit Kopfhoerern ist das unnoetig - dann darf durchgesprochen werden. */
    this.lautsprecher = o.lautsprecher !== false;
    this.nachlauf = o.nachlauf || 400;

    this.aufStatus = o.aufStatus || function () {};
    this.aufEigen = o.aufEigen || function () {};
    this.aufGegenseite = o.aufGegenseite || function () {};
    this.aufLage = o.aufLage || function () {};
    this.aufFehler = o.aufFehler || function () {};

    this.dose = null;
    this.kontext = null;
    this.strom = null;
    this.knoten = null;
    this.laeuft = false;

    /* Eingehende Stimmen nacheinander abspielen, nicht uebereinander */
    this.warteschlange = [];
    this.spieltGerade = false;
    this.wartetAufTon = false;
    this.ausgabe = null;          /* eigener Kontext fuer die Wiedergabe */
    this.stumm = false;           /* Mikrofon pausiert, weil der Lautsprecher spricht */
    this.stummUhr = null;
  }

  Dolmetscher.prototype.melde = function (zustand, text) {
    this.aufStatus(zustand, text || '');
  };

  /* ---------- Starten ---------- */
  Dolmetscher.prototype.starten = function () {
    var ich = this;
    var ziel = adresse();

    if (!ziel) {
      ich.melde(ZUSTAND.fehler, SP.t('Es ist kein Dolmetscher-Server hinterlegt. Tragen Sie die Adresse in assets/sp-konfig.js ein.'));
      return Promise.reject(new Error('keine-adresse'));
    }
    if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
      ich.melde(ZUSTAND.fehler, SP.t('Dieser Browser gibt kein Mikrofon frei.'));
      return Promise.reject(new Error('kein-mikrofon'));
    }

    ich.melde(ZUSTAND.verbinde, SP.t('Verbindung wird aufgebaut …'));

    return ich.verbinden(ziel)
      .then(function () { return ich.mikrofonOeffnen(); })
      .then(function () {
        ich.laeuft = true;
        ich.melde(ZUSTAND.wartet, SP.t('Mikrofon offen. Sprechen Sie einfach los.'));
        if (SP.audit) SP.audit('Dolmetscher gestartet', ich.sprache + ' · Raum ' + ich.raum);
      })
      .catch(function (fehler) {
        ich.stoppen();
        var text = fehler && fehler.name === 'NotAllowedError'
          ? SP.t('Das Mikrofon wurde nicht freigegeben. Ohne Mikrofon kann nicht übersetzt werden.')
          : SP.t('Verbindung oder Mikrofon nicht verfügbar: {grund}', { grund: fehler && fehler.message || fehler });
        ich.melde(ZUSTAND.fehler, text);
        ich.aufFehler(fehler);
        throw fehler;
      });
  };

  Dolmetscher.prototype.verbinden = function (ziel) {
    var ich = this;
    return new Promise(function (fertig, daneben) {
      var dose;
      try { dose = new WebSocket(ziel); } catch (e) { daneben(e); return; }
      dose.binaryType = 'arraybuffer';

      var zeit = setTimeout(function () {
        daneben(new Error(SP.t('Zeitüberschreitung beim Verbinden')));
        try { dose.close(); } catch (e) { /* egal */ }
      }, 8000);

      dose.onopen = function () {
        clearTimeout(zeit);
        dose.send(JSON.stringify({
          typ: 'start',
          sprache: ich.sprache,
          raum: ich.raum,
          name: ich.name,
          stimme: ich.mitStimme,
          pause: konfig().sprechpause || 900
        }));
        ich.dose = dose;
        fertig();
      };
      dose.onerror = function () {
        clearTimeout(zeit);
        daneben(new Error(SP.t('Der Dolmetscher-Server ist nicht erreichbar')));
      };
      dose.onclose = function () {
        if (ich.laeuft) ich.melde(ZUSTAND.aus, SP.t('Verbindung beendet.'));
        ich.laeuft = false;
      };
      dose.onmessage = function (ereignis) { ich.nachricht(ereignis.data); };
    });
  };

  /* ---------- Antworten des Servers ---------- */
  Dolmetscher.prototype.nachricht = function (daten) {
    var ich = this;

    if (daten instanceof ArrayBuffer) {
      if (ich.wartetAufTon) { ich.einreihen(daten); ich.wartetAufTon = false; }
      return;
    }

    var n;
    try { n = JSON.parse(daten); } catch (e) { return; }

    if (n.typ === 'eigen') {
      /* Was der Server bei mir verstanden hat - zur Kontrolle */
      ich.aufEigen({
        text: SP.clean(n.text, 1000),
        sprache: n.sprache,
        sicherheit: typeof n.sicherheit === 'number' ? n.sicherheit : null
      });
      return;
    }
    if (n.typ === 'gegenseite' || n.typ === 'probe') {
      ich.aufGegenseite({
        von: SP.clean(n.von || SP.t('Probe'), 60),
        original: SP.clean(n.original, 1000),
        uebersetzt: SP.clean(n.uebersetzt, 1000),
        quelle: n.quelle, ziel: n.ziel,
        probe: n.typ === 'probe',
        sicherheit: typeof n.sicherheit === 'number' ? n.sicherheit : null
      });
      return;
    }
    if (n.typ === 'lage') {
      var liste = Array.isArray(n.gegenueber) ? n.gegenueber : [];
      ich.aufLage(liste);
      ich.melde(liste.length ? ZUSTAND.hoert : ZUSTAND.wartet,
        liste.length
          ? SP.t('Verbunden mit {namen}', { namen: liste.map(function (g) {
              return SP.clean(g.name, 60) + ' (' + String(g.sprache).toUpperCase() + ')';
            }).join(', ') })
          : SP.t('Warten auf die Gegenseite. Geben Sie ihr das Kennwort „{raum}“.', { raum: ich.raum }));
      return;
    }
    if (n.typ === 'stimme') { ich.wartetAufTon = true; return; }
    if (n.typ === 'fehler') {
      ich.melde(ZUSTAND.fehler, SP.clean(n.text, 300) || SP.t('Der Server meldet einen Fehler.'));
    }
  };

  /* ---------- Mikrofon waehrend der Ausgabe pausieren ----------
     Der Server bekommt Bescheid, damit er seinen angefangenen Satz
     verwirft - sonst klebte das Stueck vor der Pause am Stueck danach. */
  Dolmetscher.prototype.mikrofonPause = function () {
    if (!this.lautsprecher || this.stumm) return;
    this.stumm = true;
    clearTimeout(this.stummUhr);
    if (this.dose && this.dose.readyState === 1) {
      try { this.dose.send(JSON.stringify({ typ: 'pause' })); } catch (e) {}
    }
    this.melde(ZUSTAND.spricht, SP.t('Übersetzung wird vorgelesen …'));
  };

  Dolmetscher.prototype.mikrofonWeiter = function () {
    var ich = this;
    if (!ich.lautsprecher || !ich.stumm) return;
    clearTimeout(ich.stummUhr);
    /* Nachlauf gegen den Nachhall des Raums - ohne ihn kaeme das
       Ende des Satzes als vermeintliche Spracheingabe zurueck. */
    ich.stummUhr = setTimeout(function () {
      ich.stumm = false;
      if (ich.dose && ich.dose.readyState === 1) {
        try { ich.dose.send(JSON.stringify({ typ: 'weiter' })); } catch (e) {}
      }
      ich.melde(ZUSTAND.hoert, SP.t('Sie sind dran.'));
    }, ich.nachlauf);
  };

  /* ---------- Stimmen nacheinander abspielen ----------
     Zwei Saetze duerfen sich nicht ueberlagern, sonst versteht
     niemand mehr etwas. Neue Stimmen warten, bis die vorige durch ist. */
  Dolmetscher.prototype.einreihen = function (rohdaten) {
    this.warteschlange.push(rohdaten);
    this.mikrofonPause();
    if (!this.spieltGerade) this.naechsteStimme();
  };

  Dolmetscher.prototype.naechsteStimme = function () {
    var ich = this;
    var rohdaten = ich.warteschlange.shift();
    if (!rohdaten) {
      ich.spieltGerade = false;
      ich.mikrofonWeiter();          /* alles vorgelesen - Mikrofon wieder auf */
      return;
    }
    ich.spieltGerade = true;

    /* Abspielen ueber die Web-Audio-Schnittstelle statt ueber eine
       blob:-Adresse. Das erspart es, media-src in der Sicherheits-
       richtlinie zu oeffnen - die bleibt damit auf 'self'. */
    try {
      if (!ich.ausgabe) ich.ausgabe = new (w.AudioContext || w.webkitAudioContext)();
      if (ich.ausgabe.state === 'suspended') ich.ausgabe.resume();

      var weiter = function () { ich.naechsteStimme(); };

      ich.ausgabe.decodeAudioData(
        rohdaten.slice(0),
        function (puffer) {
          var stimme = ich.ausgabe.createBufferSource();
          stimme.buffer = puffer;
          stimme.connect(ich.ausgabe.destination);
          stimme.onended = weiter;
          stimme.start();
        },
        function () {
          ich.melde(ZUSTAND.fehler, SP.t('Eine gesprochene Antwort war nicht abspielbar.'));
          weiter();
        }
      );
    } catch (e) {
      ich.spieltGerade = false;
      ich.mikrofonWeiter();
    }
  };

  /* ---------- Mikrofon ---------- */
  Dolmetscher.prototype.mikrofonOeffnen = function () {
    var ich = this;
    return navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,    /* zusaetzliche Absicherung neben der Pause */
        noiseSuppression: true,
        autoGainControl: true
      }
    }).then(function (strom) {
      ich.strom = strom;
      ich.kontext = new (w.AudioContext || w.webkitAudioContext)({ sampleRate: 16000 });
      return ich.kontext.audioWorklet.addModule((SP.basis || '') + 'assets/sp-audio-worklet.js').then(function () {
        var quelle = ich.kontext.createMediaStreamSource(strom);
        ich.knoten = new w.AudioWorkletNode(ich.kontext, 'sp-aufnahme');
        ich.knoten.port.onmessage = function (ereignis) {
          /* Waehrend der Lautsprecher spricht, wird nichts gesendet.
             Das ist der eigentliche Schutz gegen die Rueckkopplung. */
          if (ich.stumm) return;
          if (ich.dose && ich.dose.readyState === 1) ich.dose.send(ereignis.data.buffer);
        };
        quelle.connect(ich.knoten);
        /* Bewusst nicht auf die Lautsprecher legen - man soll sich
           nicht selbst hoeren. */
      });
    });
  };

  /* ---------- Beenden ---------- */
  Dolmetscher.prototype.stoppen = function () {
    this.laeuft = false;
    clearTimeout(this.stummUhr);
    this.stumm = false;
    this.warteschlange = [];
    if (this.knoten) { try { this.knoten.port.onmessage = null; this.knoten.disconnect(); } catch (e) {} }
    if (this.strom) { this.strom.getTracks().forEach(function (s) { s.stop(); }); }
    if (this.kontext) { try { this.kontext.close(); } catch (e) {} }
    if (this.ausgabe) { try { this.ausgabe.close(); } catch (e) {} this.ausgabe = null; }
    if (this.dose) {
      try {
        if (this.dose.readyState === 1) this.dose.send(JSON.stringify({ typ: 'ende' }));
        this.dose.close();
      } catch (e) {}
    }
    this.knoten = null; this.strom = null; this.kontext = null; this.dose = null;
    this.melde(ZUSTAND.aus, SP.t('Mikrofon geschlossen.'));
    if (SP.audit) SP.audit('Dolmetscher beendet', '');
  };

  SP.dolmetscher = {
    ZUSTAND: ZUSTAND,
    eingerichtet: function () { return !!adresse(); },
    adresse: adresse,
    neu: function (optionen) { return new Dolmetscher(optionen); },

    /* Kennwort fuer einen Raum: kurz genug zum Vorlesen am Telefon */
    raumVorschlag: function () {
      var zeichen = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   /* ohne I/O/0/1 */
      var werte = new Uint8Array(6);
      (w.crypto || w.msCrypto).getRandomValues(werte);
      var raus = '';
      for (var i = 0; i < werte.length; i++) raus += zeichen.charAt(werte[i] % zeichen.length);
      return raus.slice(0, 3) + '-' + raus.slice(3);
    }
  };

})(window, document);
