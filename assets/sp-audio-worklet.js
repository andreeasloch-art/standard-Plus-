/* ============================================================
   Standard Plus - Tonaufnahme im Audio-Thread
   ------------------------------------------------------------
   Laeuft im eigenen Audio-Thread, damit die Aufnahme nicht
   stockt, wenn die Seite gerade anderweitig beschaeftigt ist.

   Aufgabe: die Gleitkommawerte des Mikrofons in 16-Bit-Ganzzahlen
   umrechnen und in Paketen von 1024 Werten weiterreichen. Der
   Audiokontext laeuft bereits mit 16 kHz, deshalb muss hier nicht
   zusaetzlich umgerechnet werden - genau das Format, das die
   Spracherkennung auf dem Server erwartet.
   ============================================================ */
class SPAufnahme extends AudioWorkletProcessor {
  constructor() {
    super();
    this.puffer = new Int16Array(1024);
    this.stand = 0;
  }

  process(eingaenge) {
    const kanal = eingaenge[0] && eingaenge[0][0];
    if (!kanal) return true;

    for (let i = 0; i < kanal.length; i++) {
      /* Begrenzen, damit Uebersteuerung nicht umschlaegt */
      const wert = Math.max(-1, Math.min(1, kanal[i]));
      this.puffer[this.stand++] = wert < 0 ? wert * 0x8000 : wert * 0x7fff;

      if (this.stand === this.puffer.length) {
        const paket = this.puffer.slice();
        this.port.postMessage(paket, [paket.buffer]);
        this.stand = 0;
      }
    }
    return true;
  }
}

registerProcessor('sp-aufnahme', SPAufnahme);
