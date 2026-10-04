# Überarbeitung für das Lovable-Projekt „Standard Plus“

Lovable-Projekt: https://lovable.dev/projects/7f5c0b23-7ff9-4e39-893f-85248fc880d6

Alles in diesem Ordner ist fertig geschrieben, lokal gebaut, typgeprüft und im Browser
getestet (Desktop 1280 px, Handy 390 px). Es muss nur noch ins Lovable-Projekt übernommen
werden – dafür braucht Lovable Guthaben. Die Pfade entsprechen 1:1 denen im Lovable-Projekt.

Vorschau-Screenshots: [`vorschau/`](vorschau/)

## Dateien

| Datei | Was sich ändert |
| --- | --- |
| `src/routes/index.tsx` | Startseite: kaum Text, großes Suchfeld, Schnellsuchen, Profilliste, kurze Schritte |
| `src/components/site/SuchFeld.tsx` | **neu** – Suche mit Autovervollständigung (Beruf, Skill, Ort, Branche), Tastatur & Screenreader |
| `src/lib/use-mehr-laden.ts` | **neu** – lädt beim Runterscrollen weitere Profile nach |
| `src/components/site/ProfilListe.tsx` | **neu** – immer zwei Profile nebeneinander (Handy: eins) |
| `src/components/site/ProfileCard.tsx` | aufgeräumt; Prozentwert nur bei Beispielprofilen (bei echten wäre er erfunden) |
| `src/components/site/Schritte.tsx` | Texte auf einen Halbsatz gekürzt |
| `src/components/site/Vorteile.tsx` | **neu** – kurze Vorteilsliste mit Badge „in Vorbereitung“ |
| `src/routes/talente.tsx` | Suchfeld mit `?q=`, Filter eingeklappt, zwei Spalten |
| `src/routes/preise.tsx` | zwei Modelle nebeneinander, Stufentabelle, Beispiele aufklappbar |
| `src/routes/arbeitnehmer.tsx`, `unternehmen.tsx`, `ablauf.tsx` | gekürzt; nicht vorhandene Funktionen als „in Vorbereitung“ markiert |
| `src/components/site/Header.tsx` | Navigation: Talente finden · Unternehmen · Arbeitnehmer · Preise |
| `src/components/site/CookieBanner.tsx` | ein Satz statt Absatz, Buttons weiterhin gleichwertig |
| `src/lib/konto.functions.ts` | Konto löschen: Dateien rekursiv + seitenweise löschen; Kündigungen als Nachweis behalten |
| `supabase/migrations/20261001120000_kuendigungen_aufbewahren.sql` | `kuendigungen.user_id` darf leer sein, Zeitpunkt der Kontolöschung wird vermerkt |
| `src/routes/datenschutz.tsx` | Abschnitte 9 und 13 passend zur Aufbewahrung von Kündigungen |

### Türkis und Profilfotos (Runde 2)

| Datei | Was sich ändert |
| --- | --- |
| `src/styles.css` | Türkis-Palette aus dem Logo (`tuerkis-50` … `tuerkis-950`, Basis `#448C92`), Tönung `tint`, Flächen `flaeche-tuerkis` und `foto-platzhalter` |
| `src/components/site/PageHeader.tsx` | Seitenköpfe auf Türkisfläche |
| `src/components/site/ProfilFoto.tsx` | **neu** – Foto im Hochformat, Ausschnitt auf das Gesicht; Platzhalter ohne Foto |
| `src/components/site/FotoUpload.tsx` | **neu** – Foto hochladen/ersetzen/löschen, eigene Einwilligung für die Anzeige |
| `src/lib/profile-data.ts` | Foto-Pfad aus der Datenbank, signierte Links aus dem privaten Speicher |
| `supabase/migrations/20261001130000_profilbilder.sql` | privater Bucket `profilbilder`, Zugriffsregeln, Foto-Spalten, Einwilligungsprotokoll, `oeffentliche_profile()` mit Foto |
| `src/routes/datenschutz.tsx` | Abschnitt 8 „Profilfoto“, Speicherdauer |

Profile stehen jetzt **immer zu zweit nebeneinander**, auch auf dem Handy.

In Lovable noch einbauen:
- `src/routes/_authenticated/profil-bearbeiten.tsx`: für Arbeitnehmer direkt unter der Überschrift
  `<FotoUpload uid={uid} name={p.vorname} fotoPfad={p.foto_pfad} fotoSichtbar={p.foto_sichtbar} refresh={refresh} />`.
- `src/routes/profil.$id.tsx`: den runden Buchstaben-Kreis durch
  `<ProfilFoto url={p.foto_url} name={p.anzeigename} gross className="w-40 rounded-2xl sm:w-56" />` ersetzen (Foto links, Angaben rechts).

### Wischen, Favoriten, Interview-Einladung, Dolmetscher (Runde 3)

Weniger Grün: Seitenköpfe wieder hell (`flaeche-hell`), Türkis nur als Akzent, Abschlussbanner dunkel.

| Datei | Was sich ändert |
| --- | --- |
| `src/components/site/WischStapel.tsx` | **neu** – Kartenstapel: nach rechts = Favorit, nach links = weiter, Rückgängig, „Einladen“; Maus, Finger und Pfeiltasten |
| `src/components/site/EinladenDialog.tsx` | **neu** – Interview-Einladung: Video oder Telefon, Wunschtermin, Dolmetscher zuschalten, Nachricht |
| `src/components/site/Modal.tsx` | **neu** – Dialogfenster (Escape, Fokus bleibt im Fenster) |
| `src/components/site/DolmetscherDemo.tsx` | **neu** – Beispielgespräch Deutsch ↔ Rumänisch, klar als Beispiel gekennzeichnet |
| `src/lib/favoriten.ts` | **neu** – Favoriten (angemeldet: Datenbank, sonst nur Sitzung) und Einladungen (als Anfrage mit Interviewwunsch) |
| `src/lib/merkliste-lokal.ts` | **neu** – Merkliste im Browser für nicht angemeldete Besucher |
| `src/routes/favoriten.tsx` | **neu** – Favoriten-Seite mit „Einladen“ |
| `src/routes/talente.tsx` | Umschalter **Wischen / Liste** (Standard: Wischen), Favoriten-Zähler |
| `src/routes/index.tsx` | Ablauf zuerst erklärt (Suchen → Wischen → Einladen → Dolmetscher), Dolmetscher-Abschnitt |
| `src/components/site/Schritte.tsx` | vier Schritte mit Symbolen |
| `src/components/site/Header.tsx` | Stern mit Anzahl der Favoriten |
| `supabase/migrations/20261001140000_favoriten_interview.sql` | Tabelle `favoriten` (nur das Unternehmen sieht sie), Interview-Spalten an `anfragen` |

Noch zu tun in Lovable:
- Dashboard der Fachkraft: Einladungen mit Art, Termin, Dolmetscher-Wunsch und Nachricht anzeigen; Zusagen/Absagen.
- Datenexport und Datenschutzerklärung um Favoriten und Interview-Einladungen ergänzen.
- Echten Dolmetscher anbinden: Server aus `dolmetscher-server/` (Whisper, NLLB, Piper) auf einem EU-Server
  betreiben und den Client aus `assets/sp-dolmetscher.js` in React übernehmen. Bis dahin bleibt „in Vorbereitung“ stehen.

### App-Version (Runde 4)

Installierbare Web-App (PWA) für iPhone und Android – ohne App-Store, jede Website-Änderung ist sofort in der App.

| Datei | Was sich ändert |
| --- | --- |
| `public/manifest.webmanifest` | App-Name, Symbole, Vollbild, Farbe, Schnellzugriffe (Wischen, Favoriten, Dashboard) |
| `public/sw.js` | Service Worker: speichert nur Dateien (JS, CSS, Schriften, Symbole), **keine Seiten und keine Daten**; fremde Adressen (Datenbank, Fotos) laufen unberührt durch |
| `public/offline.html` | Offline-Seite |
| `public/app/*.png` | App-Symbole (aus dem Original übernommen) |
| `src/lib/pwa.ts` | **neu** – Registrierung (nur auf der veröffentlichten Seite, nicht in der Lovable-Vorschau), Installationsknopf |
| `src/components/site/AppNavigation.tsx` | **neu** – untere Leiste auf dem Handy: Start · Wischen · Favoriten · Konto |
| `src/components/site/AppInstallieren.tsx` | **neu** – „App installieren“ (Android/Chrome) bzw. Anleitung fürs iPhone |
| `src/routes/__root.tsx` | Manifest, App-Symbole und Meta-Angaben im Seitenkopf; App-Leiste; Abstand unten |

Getestet: Chrome meldet die Seite als installierbar (keine Manifest-Fehler), Service Worker aktiv, Offline-Seite
erscheint ohne Netz, Zwischenspeicher enthält nur Dateien, App-Leiste nur auf dem Handy, Wisch-Knöpfe über der Leiste,
iPhone zeigt die Anleitung.

Später möglich: echte Store-Apps (App Store / Google Play) mit Capacitor aus demselben Code. Dafür braucht es ein
Apple-Entwicklerkonto (99 $/Jahr), ein Google-Play-Konto (einmalig 25 $) und zum Bauen für iOS einen Mac.

## Beim Übernehmen in Lovable zusätzlich

1. Migration ausführen; danach die Supabase-Typen neu erzeugen lassen (sonst meldet
   `update({ user_id: null })` einen Typfehler).
2. In `src/routes/auth.tsx` `DATENSCHUTZ_VERSION` auf `"2026-10-01"` setzen.
3. Dashboard-Vorschläge ebenfalls über `ProfilListe` (max. 2 Spalten) anzeigen.
4. Danach im Browser prüfen: Konto löschen mit Testkonto, keine Konsolenfehler.

## Getestet (lokal, mit Testdaten statt Datenbank)

- Build und TypeScript-Prüfung ohne Fehler
- „pf“ → Pflegefachkraft, Pflegehelferin, Altenpflegerin …; Pfeiltasten, Enter, Escape, Mausklick
- Schnellsuche „IT & Software“ → passender Treffer
- 2 Spalten am Computer, 1 Spalte am Handy; 6 Profile, beim Scrollen alle 14
- Keine horizontale Scrollleiste am Handy, mobiles Menü mit Escape schließbar
- Keine Konsolenfehler, keine Anfragen an fremde Server

## Stand in Lovable (01.10.2026)

Die drei Migrationen (`kuendigungen_aufbewahren`, `profilbilder`, `favoriten_interview`) sind in Lovable ausgeführt,
Typen neu erzeugt, Build fehlerfrei, Sicherheitsscan ohne neue Befunde. Abweichungen gegenüber den Dateien hier:

- Speicherbereich `profilbilder` wurde über Lovables Werkzeug angelegt (privat, 5 MB). Dateitypen werden über die
  Zugriffsregel auf die Endung `.jpg/.jpeg/.png/.webp` begrenzt (prüft nur die Endung).
- `foto_freigegeben` liegt im nicht öffentlichen Schema `intern` statt in `public`.
- `anfragen_guard` sperrt für die Fachkraft zusätzlich `stelle_id`.
- Konto löschen (Kündigungen behalten, Dateien rekursiv löschen) und Datenexport mit Favoriten sind in Lovable umgesetzt.

Noch offen: die Oberfläche aus diesem Ordner (Wischen, Favoriten, Einladen, Fotos, App-Version, Türkis-Design) und
7 ältere Hinweise des Sicherheitsscans zu öffentlich aufrufbaren Prüffunktionen (`has_role`, `hat_beidseitig` …).

## Runde 5 – Glas-Design (03.10.2026)

Ziel: moderner, aufgeräumter, professioneller – mit gläsernen Bedienelementen.

| Entscheidung | Umsetzung | Warum |
|---|---|---|
| Ruhiger Farbverlauf hinter der Seite | `body::before` (fest stehend): Türkis oben links, Gold oben rechts, helles Türkis unten | Glas braucht Farbe dahinter; Markenfarben bleiben dezent |
| Glas nur für Bedienelemente und Karten | Utilities `glas-leiste` (Kopfzeile, App-Dock, Suchfeld, Wisch-Knöpfe), `glas-knopf` (Chips, Zweitknöpfe), `card-base` jetzt gläsern | Klare Rolle, kein „alles verschwommen“ |
| Schwebende Kopfzeile | Glas-Pille mit Abstand zum Rand, aktive Seite als helle Glas-Pille | Wirkt leichter und moderner |
| Schwebendes App-Dock (Handy) | Glas-Dock mit Abstand unten, aktiver Punkt hervorgehoben | Wie moderne iOS/Android-Apps |
| Knöpfe als Pillen | `rounded-full`; Hauptknopf `knopf-gold` mit Glanzkante, Zweitknöpfe gläsern | Gold bleibt nur für die Hauptaktion |
| Gestapelte Wischkarten fest | Klasse `karte-fest` | Glas über Glas wäre unruhig/unleserlich |
| Keine Trennlinien zwischen Abschnitten | `border-b`/`border-y` an Abschnitten entfernt | Aufgeräumter, ein durchgehender Hintergrund |
| Überschriften enger, größer | `letter-spacing -0.035em`, `text-wrap: balance`, Hero bis `text-7xl` | Professioneller, ruhiger Zeilenfall |

Geänderte Dateien: `src/styles.css`, `src/components/ui/button.tsx` (neu im Paket), `Header`, `AppNavigation`, `SuchFeld`, `WischStapel`, `ProfileCard`, `Schritte`, `PageHeader`, `Modal`, `CookieBanner`, `routes/index`, `routes/talente`, `routes/__root` (Abstand unten 5.5rem für das schwebende Dock).
Tests: `test.mjs` 35/35 bestanden; App-Test bestanden (Installierbarkeit mit festem Profil geprüft).

## Runde 6 – Neues Design „Wisch-Startseite“ (03.10.2026)

Mit dem Design-Skill „Impeccable“ erarbeitet (Produktprofil `PRODUCT.md`, Richtungsvertrag `.impeccable/surfaces/`, unabhängige Endprüfung).

- **Weltweit:** Texte nicht mehr auf Deutschland beschränkt („Arbeit finden. Überall. Einfach wischen.“).
- **Wischen im Mittelpunkt:** neue Komponente `WischBuehne.tsx` direkt oben auf der Startseite. Der Stapel wischt sich selbst vor, lässt sich mit Maus/Finger oder ✕/★ selbst wischen (rechts = echter Favorit) und mischt sich bei jeder Sucheingabe neu (Trefferzahl mit Klappziffern).
- **Lebendige Suche:** `SuchFeld` hat die neue Option `beispiele` – im leeren Feld tippen sich Beispiele von selbst („Pflegekraft in Wien“, „Koch in Paris“ …). Bei „reduzierter Bewegung“ statisch.
- **Weniger Grün:** keine großen türkisen Flächen mehr; Türkis nur für Text, Linien, Schilder. Der Schlussaufruf ist neutral graphit (`--tafel`).
- **Schilder-Details:** Verbindung „Von ──→ Nach“ in Barlow Condensed, Sprachniveau als Gleisschild, Ablauf als Linienplan mit nummerierten Halten und Umschalter „Für Fachkräfte / Für Unternehmen“.
- **Schriften:** Überschriften jetzt **Barlow** / **Barlow Condensed** (lokal über `@fontsource/barlow` und `@fontsource/barlow-condensed` – in Lovable installieren). Plus Jakarta Sans entfällt.
- Knöpfe mit Schild-Ecken (`rounded-lg`) statt Pillen; Karten wieder fest (weiß), Glas nur für Leisten, Suchfeld und Knöpfe.
- Neu: `WischBuehne.tsx`, `KlappText.tsx`. Geändert: `styles.css`, `button.tsx`, `SuchFeld`, `Schritte`, `ProfileCard`, `WischStapel`, `Header`, `AppNavigation`, `PageHeader`, `DolmetscherDemo`, `Vorteile`, `routes/index`, `routes/talente`, `routes/__root`.
- Tests: `test.mjs` alle Prüfungen bestanden (inkl. neuer Prüfungen für Wisch-Vorschau, Tipp-Animation und Neumischen bei Suche).

## Runde 7 – Wischen wie bei Tinder (03.10.2026)

- **`WischStapel.tsx` neu:** Die Karte füllt den Bildschirm. Großes Foto, unten darauf Name (+ Alter, falls freigegeben), Beruf, Berufsfeld, Erfahrung, Deutschniveau, Verbindung „Von → Nach“. Knöpfe liegen auf der Karte: Rückgängig, Kreuz (weiter), **grüner Haken** (gefällt mir), Einladen.
- **Haken / nach rechts wischen** = gefällt mir → Favorit gespeichert **und die Karte klappt auf**: mehr Infos (Berufsfeld, Erfahrung, verfügbar ab, Von → Nach, Deutsch, Herkunft, Über mich, Fähigkeiten) und großer Knopf „Einladen“. Kreuz oder Wischen führt danach zur nächsten Karte.
- Talente-Seite im Wisch-Modus kompakter (Überschrift auf dem Handy nur für Screenreader), damit die Karte möglichst groß ist.
- **Kontaktdaten erst bei Vertragsabschluss** (vorher: beim Match). Texte angepasst in Einladen-Dialog, Foto-Upload, Ablauf, Unternehmen, Startseite und Datenschutzerklärung (Abschnitt 6).

### ⚠ Für Lovable / Datenbank – noch umzusetzen
1. **Kontaktfreigabe umstellen:** Bisher gibt die Datenbank Nachname/Telefon/E-Mail beim Match frei. Neu: erst wenn **beide Seiten den Vertragsabschluss bestätigt** haben. Vorschlag: Spalten `anfragen.vertrag_unternehmen_am` und `anfragen.vertrag_fachkraft_am` (timestamptz), Freigabe-Funktion/RLS prüft beide statt Status „angenommen“. Knöpfe „Vertrag abgeschlossen bestätigen“ im Dashboard beider Seiten. **Bis das umgesetzt ist, stimmen die neuen Texte nicht mit dem Verhalten überein.**
2. **Alter (optional):** Feld `alter` im Typ `OeffentlichesProfil` ist vorbereitet. Die Datenbank liefert es nur, wenn die Fachkraft es im Profil einschaltet (neue Spalte z. B. `profiles.alter_sichtbar boolean default false`; RPC `oeffentliche_profile` gibt `alter` = Jahre aus `geburtsjahr` nur bei `alter_sichtbar`). **Rechtlich prüfen lassen:** Alter in Bewerberprofilen kann Altersdiskriminierung nach AGG begünstigen.

## Runde 8 – Handynummer-Registrierung, Vertragsabschluss, Anreise (04.10.2026)

Alles im Testaufbau durchgeklickt (`konto.mjs`: 23 Prüfungen bestanden; `test.mjs` weiter grün).

### Neu / geändert
| Datei | Was |
|---|---|
| `src/lib/laender.ts` | Alle Länder der Welt mit Vorwahl (256 Einträge, Namen aus dem Browser), Umwandlung in internationale Nummer (+49…; führende 0, Leerzeichen, „00“ werden korrigiert) |
| `src/components/site/TelefonFeld.tsx` | Länder-Auswahl („Häufig“ oben: DE, AT, CH, RO, PL, BG …) + Handynummer; Code-Feld (füllt sich auf dem Handy automatisch aus der SMS) |
| `src/routes/auth.tsx` | Anmelden/Registrieren **mit Handynummer** (Standard) oder E-Mail. SMS-Code → erst nach Bestätigung angemeldet. „Code erneut senden“ nach 60 s. Land wird aus der Browsersprache vorgewählt. `DATENSCHUTZ_VERSION = "2026-10-04"` |
| `src/components/site/AnfrageDetails.tsx` | Status „Einladung offen → Match – Interview → Vertrag abgeschlossen“, Interview-Details, Knopf **„Vertragsabschluss bestätigen“**, Kontaktdaten erst wenn beide bestätigt |
| `src/routes/_authenticated/dashboard.tsx` | nutzt das; Fachkraft: „Zusagen/Ablehnen“, Karte „Anreise anfragen“; Sterne ohne Zeichen-Glyphen |
| `src/routes/_authenticated/anreise.tsx` | **Anreise anfragen** (von, nach, Datum, Personen, Hinweis) mit Stand „Angefragt → In Planung → Gebucht → Angekommen“, Infos vom Team, Stornieren |
| `supabase/migrations/20261004120000_telefon_vertrag_anreise.sql` | siehe unten |
| `src/routes/datenschutz.tsx` | Abschnitte SMS-Versand, Anreise, Empfänger, Konto per Handynummer |

### Datenbank (Migration `20261004120000_telefon_vertrag_anreise.sql`)
1. **Handy-Registrierung:** `handle_new_user` speichert die Handynummer; das Profil wird erst **sichtbar, wenn Code oder E-Mail-Link bestätigt** ist (neuer Trigger `on_auth_user_bestaetigt`). Supabase legt das Konto schon beim SMS-Versand an – ohne Bestätigung gibt es aber keine Anmeldung und keine Sichtbarkeit.
2. **Kontaktdaten erst bei Vertragsabschluss:** neue Spalten `anfragen.vertrag_arbeitgeber_at / vertrag_arbeitnehmer_at`; jede Seite kann nur ihr eigenes Feld setzen, erst nach dem Match, und nicht zurücknehmen. Die Regel „Vollprofil nach beidseitiger Freigabe“ wird ersetzt durch **„Vollprofil nach Vertragsabschluss“** (`hat_vertrag`).
3. **Anreise:** Tabelle `anreise_anfragen` mit RLS. Fachkraft legt an und kann nur stornieren; Status und „Infos vom Team“ setzt nur die Rolle `admin`.

### ⚠ Das musst du (bzw. Lovable) einrichten
1. **SMS-Anbieter** – ohne den kommt keine SMS an:
   - In Lovable Cloud → Authentifizierung den **Anbieter „Phone“ aktivieren** und einen SMS-Dienst eintragen (z. B. **Twilio Verify**, MessageBird oder Vonage). Dafür brauchst du ein Konto beim Anbieter (Kosten pro SMS, je nach Land ca. 0,01–0,20 €).
   - Für Tests „Test-Telefonnummern“ mit festem Code anlegen.
   - **Schutz vor SMS-Betrug** (teure Nummern in Massen): Länder-Sperre beim Anbieter und Begrenzung der Versuche einschalten; ggf. CAPTCHA (dann im Cookie-Banner/Datenschutz ergänzen).
2. **AV-Vertrag** mit dem SMS-Anbieter abschließen und den Namen in der Datenschutzerklärung (Abschnitt 4) eintragen.
3. **Unbestätigte Registrierungen löschen** (z. B. täglicher Job: Konten ohne bestätigte E-Mail/Nummer, älter als 7 Tage). Frist in Datenschutzerklärung eintragen.
4. **Anreisen bearbeiten:** bis es einen Admin-Bereich gibt, im Lovable-Cloud-Tabellen-Editor (`anreise_anfragen`: `status`, `team_info`). Busunternehmen/Partner in der Datenschutzerklärung benennen. **Rechtlich prüfen**, ob ihr als Reisevermittler/Veranstalter auftretet (Pauschalreiserecht) oder selbst befördert (Personenbeförderungsgesetz).
5. **Datenexport** (`KontoBereich.tsx`): Tabelle `anreise_anfragen` und die neuen Vertrags-Spalten mit exportieren.
6. Typen neu erzeugen lassen (`src/integrations/supabase/types.ts`), Pakete `@fontsource/barlow` und `@fontsource/barlow-condensed` installieren.

### Noch nicht gebaut (braucht Entscheidung + Anbieter-Konto)
- **E-Mail-/SMS-Benachrichtigungen** bei Einladung, Zusage, Vertrag, Anreise-Status (Vorschlag: Resend über Lovable, Edge Function auf Datenbank-Änderungen).
- **Videoanruf** im Browser (Vorschlag: Daily mit EU-Servern; Raum entsteht beim Match, Link nur für die beiden Beteiligten, keine Telefonnummern nötig).
- **Live-Übersetzung** im Anruf (Sprache → Text → Übersetzung → Sprache; Einwilligung beider Seiten, AV-Vertrag).

## Runde 9 – Busunternehmen (04.10.2026)

Getestet: `tests/bus.mjs` (27 Prüfungen), `konto.mjs` und `test.mjs` weiter grün.

### Was es kann
- **Rolle „Busunternehmen“**: Registrierung (Handy oder E-Mail) mit Unternehmer-Bestätigung; Link „Als Busunternehmen registrieren“ auf /busreisen (`/auth?modus=registrieren&rolle=busunternehmen`).
- **Bereich für Busunternehmen** (`BusDashboard.tsx`, erscheint im Dashboard je nach Rolle):
  - Firmendaten (öffentlich: Name, Sitz, Telefon, E-Mail; dazu Konzession, Fahrten bisher, „Über uns“)
  - **Bilder** hochladen (bis 12, verkleinert, Metadaten entfernt, privater Speicher, erst nach Bestätigung der Bildrechte)
  - **Fahrten anbieten**: von, nach, **alle Zwischenhalte in Reihenfolge**, Abfahrt („jeden Freitag 18:00“), Dauer, **Preis**, Plätze, Hinweise; online/offline, löschen
  - **Buchungsanfragen**: Name + Handynummer der Fachkraft (nur das), Bestätigen/Ablehnen, „Fahrt durchgeführt“
- **Öffentliche Seite /busreisen**: Suche „von → nach“ (Zwischenhalte zählen, Richtung muss stimmen, Akzente egal: Timisoara = Timișoara), Karte mit Foto, Route als Linie mit allen Halten, Preis, Bewertung (aufklappbar), „x Fahrten über Standard Plus“ und – gekennzeichnet – „insgesamt ca. … (Angabe des Unternehmens)“, Kontakt.
- **Verknüpfung mit dem Deal**: Sobald beide Seiten den Vertragsabschluss bestätigt haben, zeigt das Dashboard beiden **passende Fahrten vom Wohnort der Fachkraft zum Arbeitsort** (Ort der Stelle, sonst Wunschziel). Die Fachkraft fragt mit einem Klick an (Einwilligung zur Weitergabe von Name + Nummer), der Arbeitgeber sieht den Stand. Sortierung offen angezeigt: Strecke, Bewertung, Preis.
- **Echte Bewertungen**: nur nach einer vom Busunternehmen als durchgeführt markierten Buchung, je Buchung und Person einmal (Fachkraft und Arbeitgeber des Deals).

### Dateien
`supabase/migrations/20261004130000_rolle_busunternehmen.sql` (neue Rolle, eigene Migration!), `20261004130100_busfahrten.sql` (Tabellen `busfahrten`, `bus_bilder`, `bus_buchungen`, `bus_bewertungen`, Speicher `busbilder`, Funktionen `oeffentliche_busfahrten`, `fahrt_vorschlaege`, `buchung_reisender`, `bus_bewertungen_oeffentlich`), `src/lib/bus.ts`, `src/components/site/{FahrtKarte,FahrtVorschlaege,BusDashboard}.tsx`, `src/routes/busreisen.tsx`; geändert: `auth.tsx` (3 Rollen), `_authenticated/dashboard.tsx`, `AnfrageDetails.tsx`, `Header.tsx` (Menüpunkt „Busreisen“), `datenschutz.tsx` (Abschnitt 9b).

### ⚠ Offen / zu klären
1. **AGB für Busunternehmen** fehlen – Registrierung verlinkt bisher die AGB für Unternehmen (Personalvermittlung). Eigene Bedingungen für Busunternehmen (Plattformnutzung, Pflichten, Gebühren) erstellen lassen.
2. **Prüfung vor Freischaltung (eingebaut)**: Fahrten eines Busunternehmens sind erst öffentlich, wenn euer Team `profiles.bus_freigegeben_at` setzt (nur Rolle admin darf das; bis zum Admin-Bereich im Lovable-Cloud-Tabellen-Editor). Vorher prüfen: Firmenname, Anschrift, Konzession/Registernummer (Pflicht für Plattformen nach Digital Services Act Art. 30). Das Busunternehmen sieht im Bereich „In Prüfung“ bzw. „Geprüft und freigegeben“.
3. **Bezahlung** läuft direkt zwischen Fachkraft und Busunternehmen – so steht es auch auf der Seite. Falls Standard Plus mitkassieren soll: Zahlungsanbieter + Rechtsprüfung nötig.
4. **Benachrichtigungen** (neue Buchungsanfrage, Bestätigung) per E-Mail/SMS gibt es noch nicht – Busunternehmen sehen Anfragen im Dashboard.

## Runde 10 – Ein Konto pro Person bzw. Firma (04.10.2026)

- **Registrierung verlangt jetzt:**
  - Fachkraft: Vorname, Nachname, **Geburtsdatum** (mind. 18)
  - Arbeitgeber/Busunternehmen: **Firmenname, Handelsregister- oder USt-Nummer**, Ansprechpartner (Vor- und Nachname)
- **Datenbank** (`20261004140000_ein_konto_pro_person.sql`):
  - Spalten `geburtsdatum`, `register_nr`, `identitaet`, `identitaet_bestaetigt`
  - Eindeutiger Index auf `identitaet`: Person = Vorname + Nachname + Geburtsdatum (Akzente, Groß/klein, Bindestriche egal); Firma = Registernummer (nur Buchstaben/Ziffern)
  - Gesperrt wird schon beim SMS-Versand bzw. Absenden, wenn es die Person/Firma **bestätigt** gibt; zusätzlich schlägt die Bestätigung fehl, falls zwei Versuche parallel laufen. Unbestätigte Versuche blockieren niemanden.
  - Name, Geburtsdatum und Registernummer kann danach nur noch das Team (admin) ändern – sonst ließe sich die Sperre durch Umbenennen umgehen.
  - Handynummer und E-Mail sind in Supabase ohnehin je Konto eindeutig.
- **Für Lovable:** In `profil-bearbeiten.tsx` Vorname, Nachname, Geburtsdatum und Registernummer **nur anzeigen** (nicht bearbeitbar) und Hinweis „Änderung über den Support“. Datenexport um die neuen Felder ergänzen.
- Tests: `tests/konto.mjs` jetzt 30 Prüfungen (u. a. unter 18 abgelehnt, gleiche Person mit anderer Nummer/Schreibweise abgelehnt, gleiche Firma abgelehnt).

### Grenzen – bitte bewusst entscheiden
- Wer **falsche Angaben** macht (anderer Name/anderes Geburtsdatum), kommt so noch durch. Wirklich sicher ist nur eine **Ausweisprüfung** (z. B. IDnow, Veriff, Video-Ident; kostet pro Prüfung, ca. 1–5 €). Lässt sich später vor dem Vertragsabschluss einbauen.
- Zwei verschiedene Menschen mit gleichem Namen **und** gleichem Geburtsdatum würden sich blockieren – sehr selten; dann hilft der Support (admin ändert Daten).
