# Dolmetscher-Server – Einrichtung

Übersetzt gesprochene Sprache in Echtzeit, **vollständig auf Ihrem eigenen
Server**. Es wird kein fremder Dienst aufgerufen. Steht der Server in der EU,
bleibt die Zusage auf Ihrer Website wörtlich richtig.

---

## 1. Was hier passiert

Wie ein Dolmetscher im Ohr: Sie sprechen Ihre Sprache, die Gegenseite hört
Ihre Worte in ihrer Sprache – und umgekehrt.

```
Person A spricht Deutsch                 Person B hört Rumänisch
   Mikrofon ──► 16 kHz ──► WebSocket ──►  Ihr Server  ──► Kopfhörer B
                                             ├─ Sprechpause erkennen
                                             ├─ mitschreiben  (Whisper, de)
                                             ├─ übersetzen    (NLLB, de→ro)
                                             └─ vorlesen      (Piper, ro)

Person B spricht Rumänisch  ──►  derselbe Weg rückwärts  ──► Kopfhörer A
```

Beide Seiten geben dasselbe **Kennwort** ein und landen damit im selben Raum.
Jede Seite wählt nur die **eigene** Sprache; die Zielsprache ergibt sich aus
dem, was die Gegenseite angegeben hat. Niemand stellt ein Sprachpaar ein.

**Die sprechende Person hört ihre eigene Übersetzung nicht.** Sie bekommt nur
den Text zurück, den der Server verstanden hat – zur Kontrolle. Die gesprochene
Fassung geht ausschließlich an die Gegenseite.

### Ohne Kopfhörer – so wird die Rückkopplung verhindert

Spielt der Lautsprecher die übersetzte Stimme ab, würde das eigene Mikrofon sie
wieder aufnehmen und erneut zur Übersetzung schicken – eine Schleife, die sich
selbst übersetzt.

Deshalb **schaltet der Client das Mikrofon ab, solange der Lautsprecher spricht**,
plus 400 ms Nachlauf für den Nachhall des Raums. Der Server bekommt dabei ein
`pause` und verwirft seinen angefangenen Satz, damit nicht zwei halbe Sätze
zusammenkleben. Genau so arbeiten die Übersetzungsgeräte im Lautsprecherbetrieb:
man spricht abwechselnd.

Kopfhörer sind damit **nicht nötig**. Wer sie trotzdem benutzt, setzt in der
Oberfläche den Haken „Ich benutze Kopfhörer“ – dann entfällt die Pause und beide
Seiten können auch während der Ausgabe sprechen. In lauter Umgebung (Baustelle,
Werkshalle) ist das die bessere Wahl.

Der Nachlauf lässt sich anpassen: `nachlauf` beim Anlegen des Clients, Standard
400 ms. Zu kurz, und der Nachhall kommt als vermeintliche Eingabe zurück; zu
lang, und man wartet unnötig auf sein Stichwort.

### Was das nicht ist

Kein Simultandolmetschen, wie es ein Mensch in der Kabine macht. Der Server
wartet eine Sprechpause ab und übersetzt dann den ganzen Satz. Das ergibt
**1 bis 3 Sekunden Verzögerung** – genau wie bei den Übersetzungs-Ohrhörern,
die es zu kaufen gibt. Man spricht abwechselnd, nicht übereinander.

**Nichts wird gespeichert.** Der Ton lebt im Arbeitsspeicher und wird nach
jedem Satz verworfen. Es gibt keinen Schreibzugriff auf die Festplatte,
keine Protokolldatei mit Gesprächsinhalten, keine Datenbank.

---

## 2. Was Sie brauchen

| | Empfehlung | Notfalls |
|---|---|---|
| Server | EU-Standort, Ubuntu 22.04 | – |
| Grafikkarte | NVIDIA, 16 GB (z. B. RTX 4000 Ada, L4) | keine, siehe unten |
| Arbeitsspeicher | 32 GB | 16 GB |
| Platte | 60 GB (Modelle) | 40 GB |

**Kosten:** GPU-Server bei einem deutschen Anbieter etwa **150–400 € im Monat**,
je nach Karte. Holen Sie zwei, drei Angebote ein – die Spanne ist groß.

**Ohne Grafikkarte** läuft alles auch auf der CPU (`SP_GERAET=cpu`,
`SP_RECHENTYP=int8`, `SP_WHISPER=medium`). Rechnen Sie dann mit **4–8 Sekunden**
Verzögerung statt 1–3. Für ein Bewerbungsgespräch ist das spürbar zäh, zum
Ausprobieren reicht es.

---

## 3. Einrichten

```bash
# 1. Ordner für Modelle und Stimmen anlegen
mkdir -p modelle/stimmen

# 2. Piper-Stimmen herunterladen (Deutsch und Rumänisch)
#    Übersicht: https://github.com/rhasspy/piper/blob/master/VOICES.md
#    Je Stimme werden ZWEI Dateien gebraucht: .onnx und .onnx.json
cd modelle/stimmen
wget https://huggingface.co/rhasspy/piper-voices/resolve/main/de/de_DE/thorsten/medium/de_DE-thorsten-medium.onnx
wget https://huggingface.co/rhasspy/piper-voices/resolve/main/de/de_DE/thorsten/medium/de_DE-thorsten-medium.onnx.json
wget https://huggingface.co/rhasspy/piper-voices/resolve/main/ro/ro_RO/mihai/medium/ro_RO-mihai-medium.onnx
wget https://huggingface.co/rhasspy/piper-voices/resolve/main/ro/ro_RO/mihai/medium/ro_RO-mihai-medium.onnx.json
cd ../..

# 3. Starten. Der erste Start dauert lange – Whisper und NLLB
#    werden heruntergeladen (zusammen rund 6 GB).
docker compose up -d --build

# 4. Nachsehen, ob er bereit ist
curl http://localhost:8080/gesundheit
```

Antwort bei Erfolg:

```json
{"bereit": true, "whisper": "large-v3", "geraet": "cuda", "sprachen": ["bg","cs","de", …]}
```

---

## 4. An die Website anschließen

**Empfohlen: gleicher Name, kein Loch in der Sicherheitsrichtlinie.**

Inhalt von `nginx-dolmetscher.conf` in den Server-Block Ihrer Website
übernehmen. Danach in `assets/sp-konfig.js`:

```js
dolmetscher: '/dolmetscher/ws',
```

Fertig. An der Content-Security-Policy ändert sich **nichts**, weil
`connect-src 'self'` diese Verbindung bereits abdeckt.

**Falls Sie doch einen eigenen Namen wollen** (`wss://dolmetscher.ihre-domain.de/ws`),
muss er in **allen 15 HTML-Dateien** in der CSP ergänzt werden:

```
connect-src 'self' wss://dolmetscher.ihre-domain.de;
```

Der erste Weg ist der bessere. Weniger Angriffsfläche, weniger Pflege.

---

## 5. Bevor echte Bewerber damit sprechen

Diese Punkte sind **nicht** erledigt, nur weil der Server läuft:

- [ ] **Verzeichnis der Verarbeitungstätigkeiten** um „Sprachverarbeitung im
      Videointerview" ergänzen (Art. 30 DSGVO)
- [ ] **Datenschutz-Folgenabschätzung** – bei Stimmdaten in einem
      Bewerbungsverfahren liegt sie nahe (Art. 35 DSGVO)
- [ ] **Datenschutzerklärung** ergänzen: was verarbeitet wird, wie lange
      (hier: gar nicht gespeichert), auf welcher Grundlage (Einwilligung)
- [ ] **Einwilligung beider Seiten** vor Öffnen des Mikrofons – die
      Interviewseite fragt sie bereits ab, die Abfrage muss aber
      protokolliert und nachweisbar sein
- [ ] **Betriebsrat** beteiligen, falls vorhanden (§ 87 BetrVG)
- [ ] **Genauigkeit prüfen**: Lassen Sie zehn echte Gespräche von einem
      Menschen gegenlesen, bevor Sie sich darauf verlassen. Whisper versteht
      Akzente gut, aber nicht fehlerfrei – und Baustellenlärm ist hart.
- [ ] **Haftung klären**: Eine Maschinenübersetzung ist keine verbindliche
      Erklärung. Für Gehalt, Arbeitszeit und Sicherheitszusagen gehört ein
      menschlicher Dolmetscher dazu oder eine schriftliche Bestätigung.

---

## 6. Was ich nicht prüfen konnte

Ich habe diesen Server geschrieben, aber **nicht laufen lassen** – hier gibt
es weder Grafikkarte noch Modelle noch Internetzugang. Erwarten Sie beim
ersten Start Nacharbeit. Am ehesten an diesen Stellen:

- **Modellnamen**: Prüfen Sie, ob `facebook/nllb-200-distilled-600M` und die
  genannten Piper-Stimmen unter diesen Namen noch verfügbar sind. Namen
  ändern sich. Alternativen für die Übersetzung: `nllb-200-distilled-1.3B`
  (besser, langsamer) oder ein spezialisiertes Opus-MT-Paar für Deutsch und
  Rumänisch (kleiner, schneller).
- **Piper-Version**: Die Adresse im Dockerfile zeigt auf eine feste Fassung.
  Stimmt sie nicht mehr, sehen Sie auf der Veröffentlichungsseite nach.
- **Sprechpausen**: `SP_STILLE_MS` ist der wichtigste Regler. Zu klein
  zerhackt Sätze, zu groß lässt die Gegenseite warten. 900 ms ist ein
  Startwert, kein Ergebnis.
- **VAD-Strenge**: In `server.py` steht `webrtcvad.Vad(2)`. Bei lauter
  Umgebung 3 probieren, bei leisen Sprechenden 1.

---

## 7. Was noch fehlt

**Für die Dolmetscher-Funktion brauchen Sie keine Videoverbindung.** Zwei
Geräte, beide auf `standardplus-dolmetscher.html`, dasselbe Kennwort –
das genügt. Das funktioniert auch auf zwei Handys, die nebeneinander auf
dem Tisch liegen.

Wollen Sie **zusätzlich Bild**, braucht es:

- einen Signalisierungsdienst, der beide Seiten zusammenführt
- einen TURN-Server, damit die Verbindung auch durch Firmennetze kommt
  (`coturn`, ebenfalls selbst betreibbar)

Das ist ein eigener Schritt und für den Dolmetscher nicht nötig.

**Allein ausprobieren:** Sind Sie als Einziger im Raum, übersetzt der Server
Ihre Sätze trotzdem und spricht sie zurück – markiert als „Probe". So lässt
sich die Einrichtung prüfen, ohne dass jemand auf der anderen Seite sitzt.
