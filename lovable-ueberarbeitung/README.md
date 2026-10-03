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
