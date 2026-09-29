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
