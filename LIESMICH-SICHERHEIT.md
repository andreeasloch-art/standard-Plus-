# Standard Plus – Überarbeitung, Sicherheit und offene Punkte

Stand: 2. September 2026

> **Umbenennung:** Die Plattform hieß im Entwurf „WorkBridge" und heißt jetzt durchgängig
> **Standard Plus**. Umbenannt wurden Marke, Wortmarke, Dateinamen (`standardplus-*.html`,
> `assets/sp-*`), CSS-Klassen (`.sp-*`) und die Speicherschlüssel im Browser (`sp.session`,
> `sp.consent.v1`). Ihre ursprünglichen Dateien liegen unverändert in `_backup_original/`.

## 1. Was geändert wurde

**Gestaltung**
- Durchgängige Farbwelt aus dem Logo: Grün (`#0a9296`, dunkler `#076d71` / `#05565a`)
  als Leitfarbe, Gelb (`#ffd84d`) als Akzent, Anthrazit für Text.
  Definiert als Farbwerte (Tokens) am Anfang von `assets/sp-theme.css` – eine Änderung
  dort wirkt auf allen 15 Seiten.
- Ein gemeinsames Wörterbuch (`assets/sp-vokabular.js`) versorgt **alle** Suchfelder
  und Eingabefelder mit denselben Vorschlägen: rund 320 Städte in 38 Ländern,
  Regionen, Berufe, Branchen, Sprachen, Kenntnisse und Nachweise, Führerscheinklassen,
  Rechtsformen und Arbeitgeberleistungen. Dadurch benutzen Profil und Suche
  dieselben Begriffe – wer sein Profil mit den Vorschlägen füllt, wird auch gefunden.
  Die Vorschläge liegen vollständig im Browser; es wird nichts nachgeladen und
  keine Eingabe übertragen.
- Die Suche ist tolerant gegenüber Umlauten und Umschreibungen: „Muenchen“ findet
  „München“, „Timisoara“ findet „Timișoara“.
- Bewegung (`assets/sp-effekte.js`): Inhalte blenden sich beim Scrollen ein, Zahlen
  zählen hoch, die Kopfleiste legt beim Scrollen einen Schatten an, oben läuft ein
  Lesefortschritt. Zwei Sicherungen: die Klassen werden erst vom Skript gesetzt
  (ohne JavaScript ist alles sofort sichtbar), und nach 2,5 Sekunden wird alles
  gezeigt, was der Beobachter nicht erfasst hat. Wer im Betriebssystem
  „Bewegung reduzieren“ eingestellt hat, bekommt die Seite ohne Animationen.
- Alle Effekte laufen über CSS-Klassen, nie über `style`-Attribute. Das ist
  Voraussetzung für die Content-Security-Policy ohne `unsafe-inline`.

## App-Fassung

Standard Plus ist eine **installierbare Web-App**: eigenes Symbol, eigenes
Fenster ohne Browserleiste, Start auch ohne Netz. Es ist dieselbe Anwendung
wie die Website, kein zweiter Programmstand, der gepflegt werden müsste.

**Installieren**
- Mac/Windows: Chrome oder Edge → gelber Knopf „App installieren" in der
  Kopfleiste oder das Symbol in der Adresszeile. Auf dem Mac öffnet
  `App starten.command` die Anwendung direkt im App-Fenster.
- iPhone: Safari → Teilen → „Zum Home-Bildschirm".
- Android: Chrome → Menü → „App installieren".
- **Telefone brauchen eine Adresse im Internet mit https.** Vom eigenen Rechner
  (localhost) aus ist die App für ein Handy nicht erreichbar.

**Dateien**
- `manifest.webmanifest` – Name, Farben, Symbole, Schnellzugriffe
  (Dashboard, Suche, Dolmetscher, Busverbindungen).
- `sw.js` – Offline-Speicher. Seiten zuerst aus dem Netz (immer aktuell),
  gestempelte Dateien zuerst aus dem Speicher (schnell).
- `standardplus-offline.html` – erscheint, wenn eine noch nie besuchte Seite
  ohne Netz aufgerufen wird.
- `assets/app/` – App-Symbole in 180, 192 und 512 Pixeln, eines davon
  maskierbar für Android.

**Datenschutz und Sicherheit**
- Der Offline-Speicher enthält ausschließlich die Programmdateien – keine
  Eingaben, keine Profile, keine Anfragen.
- Anfragen an fremde Adressen und die Dolmetscher-Verbindung laufen nie über
  ihn und werden nie zwischengespeichert.
- Die Sicherheitsrichtlinie bleibt unverändert auf `'self'`.
- **Nach jeder Änderung `./neu-stempeln.sh` ausführen.** Das schreibt auch die
  Liste des Offline-Speichers neu. Ohne das behielte die installierte App die
  alte Fassung.
- Auf dem Webserver müssen `sw.js`, `manifest.webmanifest` und die Seiten mit
  `Cache-Control: no-cache` ausgeliefert werden – die Einstellungen stehen in
  `assets/security-headers.conf` (nginx) und `security-headers-apache.conf`.

**Nicht enthalten:** eine Fassung für den App Store oder Google Play. Dafür
braucht es ein Apple-Entwicklerkonto (99 $ im Jahr), ein Google-Play-Konto
(25 $ einmalig), eine Adresse im Internet und einen Verpackungsschritt.

## Anreise per Bus

Dritte Kontoart **Beförderungsunternehmen**: Registrierung wie bei Arbeitgebern,
mit Pflichtangabe der Gemeinschaftslizenz nach VO (EG) 1073/2009.

**Linien mit Fahrplan.** Ein Unternehmen trägt den Verlauf als Fahrplan ein,
eine Zeile je Halt mit Uhrzeit:

```
Timișoara 17:30
Arad 19:00
Budapest 23:30
Wien 04:15
München 11:00
Stuttgart 14:30
```

Wird eine Uhrzeit kleiner als die vorherige, zählt das als nächster Tag – so
entstehen die Minutenabstände von selbst. Abfahrtszeit und Fahrtdauer werden
daraus gerechnet, nicht eingegeben. Während des Tippens zeigt das Formular an,
was daraus wird.

Daraus ergibt sich, welche Teilstrecken buchbar sind: Wien nach München ja,
München nach Wien auf derselben Linie nicht – die Reihenfolge zählt.

**Jede Teilstrecke hat ihre eigene Zeit.** Wer in Wien zusteigt, bekommt
Abfahrt 04:15 und 6 Std. 45 Min. Fahrt angezeigt – nicht die 17:30 und 21
Stunden der ganzen Linie. Auch das Datum stimmt: der Bus ist am Vortag in
Timișoara losgefahren.

**Der Reiseplan** zeigt den Verlauf als Zeitstrahl mit allen Halten und
Uhrzeiten. Die eigene Teilstrecke ist hervorgehoben, die Halte davor und
danach sind zurückgenommen und als „nicht Ihre Teilstrecke" beschriftet.
Zwischen den Halten steht die jeweilige Fahrtzeit, Tageswechsel als „+1 Tag".
Zu finden im Linienverzeichnis, bei jedem Reisevorschlag und bei der gebuchten
Fahrt. Linien ohne eigene Uhrzeiten bekommen gleichmäßig verteilte Schätzwerte,
die als solche gekennzeichnet sind.

**Der Auslöser ist die beidseitige Freigabe.** Sobald sich Arbeitgeber und
Arbeitnehmer einig sind, erscheint im Dashboard des Arbeitnehmers der Block
„Ihre Anreise": Wohnort aus dem Profil, Arbeitsort aus dem Unternehmensprofil,
daraus die nächsten Reisetage mit Abfahrt, Ankunft, Dauer, Preis und freien
Plätzen. Niemand tippt etwas ab, was schon im System steht.

**Nach der Auswahl** sieht der Arbeitgeber „Anreise steht fest" mit Abfahrts-
und Ankunftszeit und bekommt beim ersten Aufruf eine Meldung. Das
Beförderungsunternehmen sieht die Buchung in seinem Profil und im Dashboard.

**Fahrzeuge und Fahrer.** Jedes Unternehmen hinterlegt seine Wagen mit
Kennzeichen, Art (Reisebus, Kleinbus, Neunsitzer, Siebensitzer, PKW), Marke,
Sitzplätzen, Baujahr und Ausstattung. Eine Linie bekommt ein Standardfahrzeug;
für die einzelne Fahrt lassen sich Wagen und Fahrer noch ändern.

Nach der Buchung sieht der Reisende, womit er fährt – Kennzeichen im
europäischen Schnitt, Fahrzeugart, Ausstattung – und wer fährt, sobald das
Unternehmen eingeteilt hat. Er bekommt dafür eine Meldung.

**Fahrerdaten sind nicht öffentlich.** Name und Telefonnummer sind
personenbezogene Daten und werden ausschließlich den Fahrgästen der jeweiligen
Fahrt gezeigt, nicht im Linienverzeichnis (Art. 5 Abs. 1 lit. c DSGVO). Das
Kennzeichen dagegen gehört dem Unternehmen und steht offen. Die Einwilligung
der Fahrer muss das Unternehmen selbst einholen – der Hinweis dazu steht im
Formular.

Ortsnamen werden umlaut- und akzenttolerant verglichen: „Timisoara" findet
„Timișoara", „Muenchen" findet „München".

Öffentliche Übersicht: `standardplus-transport.html`, mit Filter nach Strecke
und Wochentag.

**Noch offen vor dem Echtbetrieb** – die Liste steht ausführlich in der
Entscheidungsgrundlage, die wichtigsten Punkte: Prüfung auf Pauschalreise nach
§ 651a BGB, sobald Beförderung und Unterkunft zusammen vermittelt werden;
echte Lizenzprüfung statt Upload; Zahlungsabwicklung ohne eigenes Halten von
Fremdgeld; Fahrgastrechte nach VO (EU) 181/2011 ab 250 km; Empfänger der
Reisedaten in der Datenschutzerklärung.

## Wortmarke

Das Logo ist **die Originaldatei**, kein Nachbau:

- `assets/app/logo-marke.png` – Wortmarke für helle Flächen
- `assets/app/logo-marke-hell.png` – für grüne und dunkle Flächen: STANDARD weiß,
  PLUS petrol im weißen Balken, der goldene Pfeil bleibt gold. Form, Balken und Pfeile
  sind unverändert, nur die Farben sind getauscht.

Beide Dateien sind aus der gelieferten Vorlage freigestellt (Hintergrund transparent).
Die Zeile darunter („Personalvermittlung", „Recruitment", „Recrutare de personal",
„Videointerview", „Datenschutz-Center") bleibt **echter Text**: so ist sie auch bei
kleiner Darstellung scharf und lässt sich übersetzen.

Im Quelltext bleibt „Standard Plus" als Text stehen, er ist nur optisch ausgeblendet –
Vorleseprogramme und Suchmaschinen lesen ihn weiterhin.

Die Größe steuert eine einzige Zahl: `--wort` (Standard 1.18rem, kompakt 1rem,
in der schmalen Kopfleiste 0.92rem). Soll das Logo einmal ausgetauscht werden,
genügt es, die beiden PNG-Dateien zu ersetzen.

## Alles greift ineinander

- **„Weiter zu"**: Jede öffentliche Seite endet mit zwei bis drei Verweisen auf die Bereiche,
  die dazugehören (z. B. Busverbindungen → Fachkräfte, Live-Dolmetscher, Registrierung).
  Gepflegt wird das an einer einzigen Stelle: `WEITER` und `ZIELE` in `assets/sp-app.js`.
- **Keine toten Knöpfe mehr**: Die Platzhalter im Dashboard (Pipeline, Verträge, Nachrichten,
  Transport, Auswertungen, Einstellungen, Vertragserstellung) sind durch echte Ziele ersetzt
  oder entfernt. Jeder Knopf führt jetzt irgendwohin.
- **Live-Dolmetscher ohne Server**: Statt eines grauen, nicht benutzbaren Knopfes erscheint
  der Weg zum vorbereiteten Beispielgespräch im Videointerview.
- **Sprungmarken**: Verweise wie `standardplus-profil.html#anfragen` landen jetzt wirklich beim
  Abschnitt. Vorher sprang der Browser, bevor das Skript den Inhalt gezeichnet hatte – die Marke
  wird deshalb bis zu zwei Sekunden nachgeführt und hört sofort auf, sobald jemand selbst scrollt.

## Veröffentlichen

`bash veroeffentlichen.sh` (oder Doppelklick auf „Upload-Paket erstellen.command") erzeugt
`StandardPlus-Upload.zip` auf dem Schreibtisch:

- **Firmendaten** aus `FIRMENDATEN.txt` werden in Impressum, Datenschutzerklärung, AGB und
  `security.txt` eingesetzt – in Deutsch, Englisch und Rumänisch. Fehlt eine Pflichtangabe,
  wird **kein** Paket erstellt.
- **Interne Hinweise** (Entwurfskästen, „Vor dem Produktivbetrieb", HTML-Kommentare) werden entfernt.
  Optionale Abschnitte (Registereintrag, USt-ID, AÜG-Erlaubnis) entfallen, wenn leer bzw. „nein".
- **Server-Dateien:** `.htaccess` (Apache: HTTPS-Umleitung, Sicherheits-Kopfzeilen, kein
  Verzeichnislisting, versteckte Dateien gesperrt), `_headers` (Netlify/Cloudflare),
  `server-einstellungen/nginx.conf`, `robots.txt` (geschützte Bereiche nicht indexieren), `sitemap.xml`.
- **Prüfung** vor dem Packen: keine Platzhalter, keine internen Hinweise, keine toten Verweise.
- Nicht im Paket: Werkzeuge, Übersetzungstabellen, Dolmetscher-Server, Anleitungen.

**Hinweis auf den Aufbau:** Der gelbe Balken auf jeder Seite ist entfernt
(`var VORSCHAU = false;` in `assets/sp-app.js`). Der Hinweis steht weiterhin dort, wo er
rechtlich zählt: auf der Anmeldeseite direkt über dem Formular („Konten werden wirklich
angelegt, aber ausschließlich in diesem Browser gespeichert"). Solange es keinen Server gibt,
sollte dieser Satz stehen bleiben – sonst glaubt jemand, er sei bei uns registriert.

**Beispieldaten** nennen keine echten Unternehmen mehr (z. B. „Musterbau AG" statt eines realen
Konzerns) – ältere Speicherstände im Browser werden automatisch umgestellt.

## Wischansicht in der Suche

Nach einer Suche erscheinen die Vorschläge als **Kartenstapel** – eine Karte
mit Kurzinfos (Kurzname, Beruf bzw. Branche, Ort, Übereinstimmung, Erfahrung,
Deutschniveau, Verfügbarkeit, Bewertung, bis zu drei Gründe).

- **Nach rechts wischen oder ✓** = interessiert
- **Nach links wischen oder ✕** = ausblenden, die Karte verschwindet
- **↶ Rückgängig** holt die letzte Karte zurück (auch die Anfrage wird zurückgenommen,
  solange die Gegenseite noch nicht entschieden hat)
- Am Computer: Pfeiltasten ← →. Oben lässt sich jederzeit auf **Liste** umschalten.

**Was der Haken bewirkt**
| Wer wischt | Wonach | Haken bedeutet |
|---|---|---|
| Arbeitgeber | Fachkräfte | Anfrage – die Fachkraft entscheidet über die Freigabe |
| Fachkraft | Unternehmen | Interesse – das Unternehmen sieht im Dashboard unter „Interesse an Ihrem Unternehmen" das Kurzprofil und kann mit einem Klick anfragen |
| ohne Anmeldung | beides | nur vorgemerkt für diese Sitzung, am Ende Hinweis zur Anmeldung |

**Datenschutz**
- Ein Interesse gibt nur preis, was ohnehin ohne Freigabe sichtbar ist
  (Kurzname, Beruf, Ort). Name und Kontaktdaten weiterhin erst nach beidseitiger Freigabe.
- Ausgeblendete Vorschläge und bekundetes Interesse gehören zum Konto: Sie stehen
  im Datenexport (Art. 20 DSGVO) und werden beim Löschen des Kontos entfernt.
  Am Ende des Stapels lassen sich Ausgeblendete wieder anzeigen.
- Gesperrte Konten erscheinen nicht und können kein Interesse erhalten.
- Ob Liste oder Wischen gemerkt wird, speichert der Browser nur mit Einwilligung „Funktional".
- Die Bewegung läuft über die Web Animations API, ohne `style`-Attribute – die
  Content-Security-Policy bleibt unverändert streng.

Dateien: `assets/sp-wischen.js`, Abschnitt 42 in `assets/sp-theme.css`,
`SP.db.wischen` in `assets/sp-db.js`.

## Drei Sprachen: Deutsch, Englisch, Rumänisch

Die ganze Seite gibt es in drei Fassungen. Deutsch ist die Quelle, die beiden
anderen werden daraus erzeugt:

- `standardplus-*.html` – Deutsch
- `en/standardplus-*.html` – Englisch (britische Schreibweise)
- `ro/standardplus-*.html` – Rumänisch (Sie-Form, ș und ț mit Komma)

Oben rechts in der Kopfleiste wechselt **DE · EN · RO** auf dieselbe Seite in
der anderen Sprache; ein geöffnetes Profil bleibt geöffnet. Gespeichert wird
dabei nichts – die Sprache ergibt sich allein aus dem Ordner.

**Was übersetzt wird**
- Alle Seitentexte, Beschriftungen, Platzhalter und Hinweise.
- Alle Meldungen aus den Skripten (Wörterbücher `assets/sp-i18n-en.js` und
  `assets/sp-i18n-ro.js`).
- Wörterbuch der Suchfelder: Länder, Städte (München → Munich), Berufe,
  Kenntnisse, Sprachen, Leistungen, Wochentage.
- Die Beispielprofile, Firmenbeschreibungen, Linien und Fahrzeuge.
- Die Freitextsuche versteht auch englische und rumänische Sätze
  („Site foreman for Munich…“, „Caut un electrician din România…“).
  Englische und rumänische Ortsnamen werden auf die deutschen zurückgeführt.
- Rumänische Zahlwörter folgen der Grammatik: „3 ani“, aber „20 de ani“.

**Was bewusst nicht übersetzt wird**
- Texte, die Nutzende selbst eingeben. Sie erscheinen so, wie sie geschrieben
  wurden.
- Das Beispielgespräch im Videointerview: Es zeigt ja gerade Deutsch ↔ Rumänisch.
- Das Sitzungsprotokoll im Datenschutz-Center bleibt deutsch (Nachweiszweck).

**Rechtstexte:** AGB, Datenschutzerklärung und Impressum tragen in EN und RO
den Hinweis, dass nur die deutsche Fassung verbindlich ist. Die Übersetzungen
der Rechtstexte bitte vor dem Livegang von einer Fachübersetzung prüfen lassen.

**Texte ändern**
1. Deutschen Text in der HTML-Datei oder im Skript ändern.
2. `bash neu-stempeln.sh` ausführen. Das erzeugt `en/` und `ro/` neu.
3. Neue Seitentexte stehen danach in `i18n/quelle.tsv` und werden in
   `i18n/en.tsv` bzw. `i18n/ro.tsv` unter derselben Nummer ergänzt.
   Neue Skripttexte (`python3 i18n/js_schluessel.py`) kommen in
   `i18n/js_en.json` bzw. `i18n/js_ro.json`. Fehlt eine Übersetzung, erscheint
   der deutsche Text – die Seite bricht nie.

## Live-Dolmetscher

Wie ein Übersetzungs-Ohrhörer: Sie sprechen Ihre Sprache, die Gegenseite hört
Ihre Worte in ihrer Sprache – und umgekehrt. Beide Seiten geben dasselbe
Kennwort ein, jede wählt nur die **eigene** Sprache. Die Zielsprache ergibt
sich aus der Gegenseite; niemand stellt ein Sprachpaar ein.

Eigene Seite: `standardplus-dolmetscher.html` (zwei Geräte genügen, auch zwei
Handys). Im Videointerview steckt dieselbe Funktion hinter „Live-Dolmetscher".

**Kopfhörer sind nicht nötig.** Mikrofon und Lautsprecher genügen: Während die
Übersetzung vorgelesen wird, pausiert das Mikrofon (plus 400 ms Nachlauf gegen
den Nachhall). Ohne das nähme es die eigene Ausgabe wieder auf und übersetzte
sie erneut. Wer Kopfhörer benutzt, schaltet die Pause per Haken ab und kann
dann auch während der Ausgabe sprechen.

**Verzögerung 1 bis 3 Sekunden.** Der Server wartet eine Sprechpause ab und
übersetzt dann den ganzen Satz – wie die Ohrhörer, die es zu kaufen gibt.
Kein Simultandolmetschen über die sprechende Person hinweg.

Alles dazu liegt in `dolmetscher-server/`, die Einrichtung steht in
`dolmetscher-server/LIESMICH.md`.

- `assets/sp-konfig.js` – die **einzige** Datei, die Sie dafür anfassen müssen.
  Solange dort keine Adresse steht, zeigt die Interviewseite offen an, dass
  nur das vorbereitete Beispielgespräch läuft, und öffnet kein Mikrofon.
- `assets/sp-dolmetscher.js` – Client: Mikrofon, Raum, Text, Stimme. Der Ton
  geht ausschließlich an die konfigurierte Adresse. Kein zweiter Empfänger,
  keine Zwischenspeicherung im Browser. Die eingehenden Stimmen werden über
  die Web-Audio-Schnittstelle abgespielt, nicht über `blob:`-Adressen – so
  bleibt die Sicherheitsrichtlinie auf `'self'`.
- `assets/sp-dolmetscherseite.js` – Bedienung der eigenen Dolmetscherseite.
- `assets/sp-audio-worklet.js` – Tonaufnahme im eigenen Audio-Thread,
  16 kHz / 16 Bit, genau das Format der Spracherkennung.
- Empfohlen wird der Betrieb unter demselben Namen wie die Website
  (`/dolmetscher/ws`). Dann bleibt `connect-src 'self'` unverändert und es
  muss kein Loch in die Sicherheitsrichtlinie geschnitten werden.

**Noch offen, bevor echte Bewerber damit sprechen:** Verzeichnis der
Verarbeitungstätigkeiten, Datenschutz-Folgenabschätzung, Ergänzung der
Datenschutzerklärung, Beteiligung des Betriebsrats und eine Genauigkeitsprüfung
an echten Gesprächen. Die Liste steht vollständig in
`dolmetscher-server/LIESMICH.md`, Abschnitt 5.
- **Alle Emojis entfernt** (vorher 180+). Ersetzt durch 82 handgezeichnete Vektor-Icons
  in `assets/sp-icons.js` – ein SVG-Sprite, das jede Seite lädt.
- Personen werden nicht mehr durch Emoji-Figuren dargestellt, sondern durch
  Initialen-Avatare mit dezenter Silhouette und einem Berufs-Icon. Bewusst keine
  Stockfotos: erfundene Gesichter auf echten Kandidatenprofilen wären irreführend.
- Länderflaggen-Emojis wurden durch ISO-Ländercodes in typografischen Chips ersetzt.
- Wortmarke nach Vorbild des Logos in reinem CSS nachgebaut: „STANDARD" in Petrol,
  „PLUS" weiß im Petrol-Block mit angeschrägter rechter Kante, dahinter der goldene
  Doppelpfeil. Auf dunklem Grund kehrt sich der Block um (weiß mit Petrol-Schrift).
  Damit ist kein Bilddatei-Logo nötig – die Marke bleibt bei jeder Größe scharf.
- **Preise getrennt dargestellt:** Einmalzahlung und Abo stehen als zwei eigenständige
  Blöcke nebeneinander. Beim Abo ist jede Position einzeln aufgeführt (Startgebühr,
  Monatsbeitrag, Mindestlaufzeit) samt Gesamtkosten nach 6 und nach 12 Monaten. Eine
  Vergleichstabelle beantwortet die eigentliche Frage: ab wann lohnt sich was.
- Systemschriften statt Google Fonts (siehe Datenschutz).

**Struktur und Verknüpfung**
Alle Module sind jetzt miteinander verbunden:

```
standardplus-main.html ──► standardplus-login.html ──► 2FA ──► standardplus-dashboard.html
        │                                                          │
        ├──► standardplus-talente.html ◄─────── Suche/Filter ────────┤
        │            │                                             │
        │            └──► Anfrage (nur angemeldet)                 ├──► standardplus-interview.html
        │                                                          │
        └──► standardplus-sicherheit.html                            └──► standardplus-datenschutz-center.html
             standardplus-datenschutz.html
             standardplus-impressum.html
             standardplus-agb.html
```

- Die frühere Grün-Variante (`workbridge-green.html`) ist entfallen. Zwei konkurrierende
  Startseiten wären inhaltlich und für die Suchmaschine schädlich gewesen; ihre Inhalte
  stecken jetzt in Startseite und Talentübersicht.
- Neu: `standardplus-talente.html`, `standardplus-datenschutz-center.html`,
  `standardplus-datenschutz.html`, `standardplus-sicherheit.html`,
  `standardplus-impressum.html`, `standardplus-agb.html`.

## 1b. Datenbank und verbundene Profile

Registrierung, Profile, Stellen und Anfragen laufen jetzt über eine echte Datenschicht
(`assets/sp-db.js`). Der vollständige Ablauf funktioniert durchgängig:

```
Arbeitgeber registriert sich ──► Profil ausfüllen ──► Stelle ausschreiben
                                                          │
                                                          ▼
                                          Talentübersicht ──► Anfrage senden
                                                          │
Arbeitnehmer registriert sich ──► Profil ausfüllen ◄──────┘
                                        │
                                        ▼
                          Anfrage freigeben oder ablehnen
                                        │
                    beidseitige Freigabe ──► Kontaktdaten werden ausgetauscht
                                        └──► Videointerview buchbar
```

**Tabellen** (1:1 auf eine SQL-Datenbank übertragbar):

| Tabelle | Inhalt | Besonderheit |
|---|---|---|
| `konten` | Rolle, E-Mail, Salt, Passwort-Hash, 2FA-Kennzeichen | Passwort nie im Klartext |
| `profile` | je Konto ein Profil, rollenabhängige Felder | Feld `sichtbar` steuert die Auffindbarkeit |
| `stellen` | Ausschreibungen eines Arbeitgebers | schließbar statt löschbar |
| `anfragen` | Verbindung Arbeitgeber ↔ Arbeitnehmer | zwei Freigabe-Kennzeichen, erst beide zusammen geben Kontaktdaten frei |

**Datenschutz ist in die Struktur eingebaut:** Die Funktion `profile.arbeitnehmer()` liefert
grundsätzlich nur die pseudonymisierte Sicht (Vorname plus Initial). Kontaktdaten gibt
ausschließlich `anfragen.kontakt()` heraus – und nur, wenn der Status `beidseitig` ist.
Es gibt keinen anderen Weg an diese Daten.

**Zum Ausprobieren** sind Beispielkonten hinterlegt (Passwort jeweils `Demo!2026`):
`demo@unternehmen.invalid` als Arbeitgeber, `demo1@beispiel.invalid` (Ion Tudose) und
`demo0@beispiel.invalid` (Maria Kovács) als Arbeitnehmer. So lässt sich die beidseitige
Freigabe von beiden Seiten durchspielen. Solche Sammelzugänge gibt es nur im Prototyp.

> **Grenze des Prototyps:** Alles liegt im `localStorage` dieses Browsers. Andere Geräte
> sehen nichts davon, und für echte Bewerberdaten ist das nicht zulässig. Für den Betrieb
> gehört dieselbe Struktur in eine Datenbank auf einem EU-Server, mit serverseitiger
> Rechteprüfung bei **jedem** Zugriff. Der Browser darf dann nur noch anzeigen, was der
> Server für dieses Konto freigibt.

## 1c. Profile im Detail

Beide Seiten haben jetzt ein vollständiges Profil, und es gibt eine eigene **Profilansicht**
(`standardplus-profil-ansicht.html?id=…`), die genau das zeigt, was der Gegenseite zusteht.

**Arbeitnehmerprofil**

| Bereich | Inhalt |
|---|---|
| Person | Vorname, Nachname, Geburtsjahr (daraus das Alter), Staatsangehörigkeit, Wohnort, Telefon |
| Beruf | Beruf, Branche, Berufserfahrung, Gehaltsvorstellung, Verfügbarkeit, Führerscheinklassen, Umzugsbereitschaft |
| Sprachen | beliebig viele, mit Stufe A1 bis C2 oder Muttersprache, als Balken dargestellt |
| Werdegang | Stationen mit Arbeitgeber, Position, Ort, Zeitraum und Tätigkeit — als Zeitleiste |
| Nachweise | Zeugnisse, Diplome, Zertifikate, Anerkennungsbescheide, Führerscheine, Gesundheitsnachweise; hochladbar, mit Kennzeichen „geprüft" |
| Bilder | bis zu acht Fotos früherer Arbeiten, beim Hochladen automatisch auf 900 Pixel verkleinert |
| Bewertungen | Sterne und Text von Unternehmen, mit denen zusammengearbeitet wurde |
| Über mich | Freitext |

**Arbeitgeberprofil**

| Bereich | Inhalt |
|---|---|
| Unternehmen | Firma, Rechtsform, Branche, Sitz, Gründungsjahr, Größe, Standorte |
| Kontakt | Ansprechperson mit Position und Telefon (erst nach Freigabe sichtbar) |
| Leistungen | was Mitarbeitenden geboten wird — Unterkunft, Fahrtkosten, Sprachkurs und so weiter |
| Stellen | eigene Ausschreibungen, offen oder geschlossen |
| Nachweise | Handelsregisterauszug, Erlaubnis nach AÜG, Zertifikate |
| Bewertungen | Sterne und Text **von früheren Beschäftigten** |

### Vier Sichtbarkeitsstufen

Wie viel jemand sieht, entscheidet `profile.sichtRecht()`:

| Stufe | Wer | Was sichtbar ist |
|---|---|---|
| `anonym` | nicht angemeldet | nur ein Kurzprofil ohne Werdegang, Nachweise und Bewertungen |
| `pseudonym` | angemeldet, keine Freigabe | alles fachliche, aber: Name gekürzt („Ion T."), keine Kontaktdaten, **Namen früherer Arbeitgeber ausgeblendet**, Dokumente nur als Eintrag ohne Inhalt |
| `voll` | beidseitige Freigabe | vollständiger Name, Kontaktdaten, Arbeitgebernamen im Werdegang, Dokumente herunterladbar |
| `gesperrt` | eine Seite hat gesperrt | nichts |

### Bewertungssystem

Bewerten kann **nur, wer nachweislich zusammengearbeitet hat** — technisch: wer eine
beidseitige Freigabe mit dem bewerteten Konto hat. Jedes Konto kann ein anderes genau einmal
bewerten. Beide Richtungen sind möglich: Unternehmen bewerten Arbeitskräfte, Arbeitskräfte
bewerten Unternehmen. Damit sind erfundene Bewertungen technisch ausgeschlossen.

### Sperrliste statt schwarzer Liste

Sie können jedes Gegenüber auf Ihre **persönliche** Sperrliste setzen: Das Profil verschwindet
für Sie aus der Suche, und Anfragen sind in beide Richtungen blockiert.

> **Bewusste Entscheidung:** Es gibt **keine** gemeinsame, unternehmensübergreifende schwarze
> Liste von Arbeitskräften. Eine solche Liste wäre nach DSGVO kaum zu rechtfertigen, verstößt
> schnell gegen das Allgemeine Gleichbehandlungsgesetz und hat in Deutschland bereits zu
> Schadenersatzurteilen geführt. Die Sperre wirkt daher ausschließlich für Ihr eigenes Konto,
> und der Grund ist nur für Sie sichtbar. Falls Sie doch eine geteilte Liste möchten, lassen
> Sie das vorher anwaltlich prüfen — ich habe es bewusst nicht so gebaut.

### Dateiuploads

Nachweise bis 500 KB werden im Prototyp mitgespeichert, größere nur als Eintrag vermerkt.
Bilder werden vor dem Speichern im Browser auf 900 Pixel verkleinert (ein 1600×1000-Foto
schrumpft so auf etwa 10 KB). Für den Echtbetrieb gehören Dateien in einen Objektspeicher mit
Virenprüfung, Ablage außerhalb des Webverzeichnisses und signierten, kurzlebigen Links.

## 1d. Autovervollständigung in der Suche

Alle drei Suchfelder haben eine Autovervollständigung (`assets/sp-suche.js`), die aus der
Datenbank gespeist wird:

| Suchfeld | Schlägt vor | Beim Auswählen |
|---|---|---|
| Dashboard (Kopfzeile) | Profile, Unternehmen, offene Stellen, Berufe, Kenntnisse, Branchen | springt direkt zum Profil oder zur gefilterten Talentsuche |
| Talentübersicht | Berufe, Kenntnisse, Orte, Branchen | setzt Suchtext oder Branchenfilter, Liste filtert sofort |
| Unternehmensübersicht | Firmen, Orte, Branchen | wie oben |

Eigenschaften:

- **Akzent- und umlauttolerant** — „timisoara" findet „Timișoara", „kovacs" findet „Kovács"
- **Treffer am Wortanfang zuerst**, danach Treffer im Wort
- **Übereinstimmung wird hervorgehoben** (gold unterlegt), mit Typ-Kennzeichnung und Zusatzzeile
- **Tastaturbedienung**: Pfeiltasten, Enter zum Übernehmen, Escape zum Schließen
- **Barrierefrei** nach dem ARIA-Combobox-Muster (`role="combobox"`, `aria-expanded`,
  `aria-activedescendant`, Statusmeldung für Screenreader)
- **Kein XSS-Weg**: Vorschläge werden über `textContent` erzeugt, nie über `innerHTML` —
  auch die Hervorhebung des Treffers nicht
- Alles läuft lokal, es geht **kein Suchbegriff** an einen Server

## 1e. Freitextsuche mit Empfehlungen

Neue Seite `standardplus-suche.html`: Sie schreiben in eigenen Worten, was Sie suchen, und
bekommen sofort sortierte Vorschläge — **in beide Richtungen**.

| Richtung | Beispieleingabe | Ergebnis |
|---|---|---|
| Arbeitgeber sucht Personal | „Polier für München, mindestens 5 Jahre Erfahrung, gutes Deutsch, sofort verfügbar" | Ion T. mit 83 % |
| Arbeitnehmer sucht Firma | „Pflegefachkraft, suche Klinik in Berlin mit Unterkunft und Anerkennungshilfe" | Musterklinikum Berlin mit 96 % |

**Was der Text ausgewertet bekommt:** Berufe und Branchen, Städte und Bundesländer,
Herkunftsländer, Sprachniveau (auch umschrieben: „gutes Deutsch" → B2), Verfügbarkeit
(„sofort", „dringend"), Berufserfahrung („5 Jahre", „erfahren"), Gehaltsgrenze („bis 3000 Euro"),
Führerscheinklassen, Bewertungswunsch, Unternehmensgröße und Leistungen (Unterkunft,
Sprachkurs, Fahrtkosten, Anerkennungsbegleitung).

### Warum das kein Sprachmodell ist — und warum das gut so ist

Die Auswertung ist **regelbasiert mit festem Wörterbuch**, kein LLM. Das hat drei Vorteile,
die hier schwerer wiegen als „versteht alles":

1. **Jeder Vorschlag ist begründet.** Unter jedem Treffer stehen die erfüllten Kriterien als
   grüne Chips und die nicht erfüllten als graue. Das ist bei Personalauswahl kein Luxus,
   sondern die Voraussetzung dafür, dass eine Vorsortierung nach Art. 22 DSGVO überhaupt
   zulässig bleibt.
2. **Nichts verlässt den Browser.** Kein Suchtext geht an einen Dienst, kein Profil wird an
   ein Modell übertragen. Bei Bewerberdaten ist das ein erheblicher Unterschied.
3. **Nachvollziehbar und korrigierbar.** Über den Ergebnissen steht „Das haben wir verstanden"
   mit allen erkannten Kriterien. Stimmt etwas nicht, ergänzen Sie den Satz.

Die Grenze ist ebenso klar: Die Suche versteht, was im Wörterbuch steht. Neue Berufsbilder
müssen dort ergänzt werden (`assets/sp-empfehlung.js`, Abschnitt `BERUFE`).

Die Prozentzahl sagt, **wie viele Ihrer Kriterien erfüllt sind** — sie ist keine Bewertung
eines Menschen. Dieser Hinweis steht auch unter den Ergebnissen.

### Erreichbar über

- Suchfeld direkt im Kopfbereich der Startseite (funktioniert als reines Formular, ohne JavaScript)
- Verweis auf der Arbeitnehmer- und der Unternehmensübersicht
- Seitenleiste im Dashboard

## 2. Was im Browser tatsächlich umgesetzt ist

| Maßnahme | Umsetzung |
|---|---|
| Keine externen Verbindungen | Google Fonts entfernt, keine CDNs, keine Tracker. Beim Seitenaufruf verlässt kein Byte die eigene Domain. |
| Content-Security-Policy | Auf jeder Seite als Meta-Tag, ohne `unsafe-inline`. Dafür wurde **sämtliches** Inline-CSS in Utility-Klassen überführt (0 `style="…"`-Attribute im gesamten Projekt). |
| Keine Inline-Eventhandler | 0 `onclick=` im Projekt; alles über `addEventListener`. |
| XSS-Schutz | Kein `innerHTML` mit Daten. Jede Ausgabe über `textContent` (`SP.el`). Eingaben werden über `SP.clean()` von Steuerzeichen befreit und längenbegrenzt. |
| Offene Weiterleitungen | `SP.safeHref()` lässt nur projektinterne `.html`-Ziele zu – der `?ziel=`-Parameter nach dem Login kann nicht auf fremde Domains zeigen. |
| Einwilligung (DSGVO/TTDSG) | Granulares Banner mit vier Kategorien, Ablehnen genauso leicht wie Annehmen, Widerruf jederzeit, Speicherung mit Zeitstempel und Version. |
| Speicherung nach Einwilligung | `SP.store` schreibt nur, wenn „funktional" freigegeben ist. Widerruf löscht alle `sp.f.*`-Einträge. |
| Zugriffsschutz | Geschützte Seiten tragen `data-protected` und leiten ohne Sitzung zum Login. |
| Automatische Sperre | Abmeldung nach 15 Minuten Inaktivität, Warnung 60 Sekunden vorher. |
| Zwei-Faktor-Authentifizierung | Eigener Schritt nach der Anmeldung mit 6-stelligem Code. |
| Passwortprüfung | Vier Kriterien, Prüfung ausschließlich lokal. |
| Bot-Schutz | Unsichtbares Honeypot-Feld im Anmeldeformular. |
| Datenminimierung | Profile pseudonymisiert (Vorname + Initial), Klarname und Kontaktdaten erst nach beidseitiger Freigabe. Für Bewerber entfällt das Firmenfeld. |
| Einwilligung im Interview | Übersetzung, Aufzeichnung und Protokoll werden einzeln abgefragt. Ohne Zustimmung ist die Aufnahmetaste gesperrt. |
| Art. 22 DSGVO | Der Matching-Wert ist ausdrücklich Entscheidungshilfe; Hinweis auf menschliche Letztentscheidung an drei Stellen. |
| Betroffenenrechte | Im Datenschutz-Center ausführbar: Auskunft, **echter JSON-Export**, Berichtigung, Löschung mit Bestätigungsdialog, Geräteverwaltung, Sitzungsprotokoll. |
| Barrierefreiheit | Sprungmarke, `aria`-Attribute, Tastaturbedienung, sichtbarer Fokus, `prefers-reduced-motion`. |

## 3. Was zwingend noch fehlt (nicht im Browser lösbar)

Diese Punkte sind **keine Feinschliff-Aufgaben**, ohne sie ist der Betrieb nicht sicher:

1. **Sicherheits-Kopfzeilen ausliefern.** Fertige Dateien liegen bei:
   `assets/security-headers.conf` (nginx) und `assets/security-headers-apache.conf`.
   Vier Direktiven wirken **nur** als HTTP-Header und nicht im Meta-Tag:
   `frame-ancestors` (Clickjacking), `Strict-Transport-Security`,
   `X-Content-Type-Options`, `Permissions-Policy`.
2. **HTTPS mit gültigem Zertifikat**, HTTP-Weiterleitung, HSTS erst danach aktivieren.
3. **Sitzungscookies serverseitig** mit `HttpOnly`, `Secure`, `SameSite=Strict`.
   Die aktuelle Sitzung im `sessionStorage` ist eine reine Prototyp-Lösung.
4. **Alle Prüfungen serverseitig wiederholen** – Passwortrichtlinie, TOTP-Verifikation,
   Ratenbegrenzung, CSRF-Token, Dateiuploads. Clientseitige Prüfungen sind Komfort,
   kein Schutz.
5. **Uploads**: Virenprüfung, Ablage außerhalb des Webverzeichnisses, Zugriff nur
   über signierte, kurzlebige Links.
6. `.well-known/security.txt` mit echten Kontaktdaten ausliefern.

## 4. Rechtliche Punkte, die Sie prüfen lassen müssen

- **Platzhalter ersetzen.** Alle Angaben in eckigen Klammern in Impressum,
  Datenschutzerklärung und AGB. Ein unvollständiges Impressum ist abmahnfähig.
- **Keine unbelegten Siegel.** Angaben wie ISO 27001 oder TISAX dürfen erst auf die
  Seite, wenn ein gültiges Zertifikat vorliegt. Deshalb steht auf der Sicherheitsseite
  bewusst kein einziges Zertifizierungslogo.
- **Vergütung von Arbeitsuchenden.** §§ 296 ff. SGB III begrenzen, was Arbeitsuchenden
  in Rechnung gestellt werden darf. Die AGB sind entsprechend formuliert – bitte gegen
  Ihr tatsächliches Geschäftsmodell prüfen.
- **Erlaubnis nach AÜG**, falls Arbeitnehmerüberlassung stattfindet.
- **Datenschutz-Folgenabschätzung** für das Bewerbermatching (Art. 35 DSGVO) sowie
  ein **Verzeichnis der Verarbeitungstätigkeiten** (Art. 30 DSGVO).
- **Auftragsverarbeitungsverträge** mit Hosting und Übersetzungsdienst.
- Die **EU-Streitschlichtungsplattform wurde im Juli 2025 eingestellt** – der früher
  übliche Link gehört nicht mehr ins Impressum und wurde weggelassen.
- Die genannten Zahlen (147 Vorschläge, 42.800 € Umsatz, 27 Länder, „12.000 Talente")
  sind Beispielwerte. Vor dem Livegang durch echte ersetzen oder entfernen –
  erfundene Kennzahlen sind irreführende Werbung.

## 5. Dateien

```
standardplus-main.html                 Startseite
standardplus-talente.html              Talentübersicht mit Filter
standardplus-login.html                Anmeldung, Registrierung, 2FA
standardplus-dashboard.html            Arbeitsbereich (geschützt)
standardplus-profil.html               Profil bearbeiten: Werdegang, Sprachen, Uploads (geschützt)
standardplus-profil-ansicht.html       ausführliche Profilansicht mit Sichtbarkeitsstufen
standardplus-unternehmen.html          Unternehmensübersicht mit Bewertungen
standardplus-suche.html                Freitextsuche mit begründeten Empfehlungen
standardplus-interview.html            Videointerview (geschützt)
standardplus-datenschutz-center.html   Betroffenenrechte (geschützt)
standardplus-datenschutz.html          Datenschutzerklärung
standardplus-sicherheit.html           Sicherheitsmaßnahmen
standardplus-impressum.html            Impressum
standardplus-agb.html                  AGB

assets/sp-theme.css                  Design-System und Utilities
assets/sp-icons.js                   82 Vektor-Icons
assets/sp-app.js                     Einwilligung, Sitzung, Sicherheit
assets/sp-db.js                      Datenbank: Konten, Profile, Stellen, Anfragen
assets/sp-login.js  wb-dashboard.js  wb-talente.js  wb-interview.js  wb-center.js
assets/security-headers.conf         nginx
assets/security-headers-apache.conf  Apache
.well-known/security.txt             Meldeweg für Schwachstellen
Website starten.command              Doppelklick-Starter für die lokale Vorschau
LIESMICH-SICHERHEIT.md               diese Datei
_backup_original/                    Ihre ursprünglichen Dateien
```

## 6. Lokal ansehen

Am einfachsten: **`Website starten.command` doppelklicken.** Das Skript startet einen
lokalen Webserver und öffnet die Startseite im Browser.

Alternativ im Terminal:

```bash
cd ~/Downloads/files && python3 -m http.server 8123
```

Danach `http://localhost:8123/standardplus-main.html` aufrufen.

**Warum kein direkter Doppelklick auf die HTML-Datei?** Die strenge CSP erlaubt Skripte
nur von der eigenen Herkunft (`'self'`). Bei `file://` haben Seiten keine echte Herkunft;
Chrome und Safari blockieren die Skripte dann, Firefox ist toleranter. Über `localhost`
verhält sich alles genau wie später auf dem Server – das ist ohnehin die aussagekräftigere
Vorschau.
