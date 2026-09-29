# Überarbeitung für das Lovable-Projekt „Standard Plus“

Lovable-Projekt: https://lovable.dev/projects/7f5c0b23-7ff9-4e39-893f-85248fc880d6

Diese Dateien ersetzen bzw. ergänzen die gleichnamigen Dateien im Lovable-Projekt
(Pfade ab `src/` identisch):

| Datei | Inhalt |
| --- | --- |
| `src/components/site/SuchFeld.tsx` | neu – Suchfeld mit Autovervollständigung (Beruf, Skill, Ort, Branche), per Tastatur bedienbar |
| `src/lib/use-mehr-laden.ts` | neu – lädt beim Runterscrollen weitere Einträge nach |
| `src/components/site/ProfilListe.tsx` | neu – Profile zu zweit nebeneinander, mit Nachladen |
| `src/components/site/ProfileCard.tsx` | aufgeräumt; Prozentwert nur noch bei Beispielprofilen |
| `src/components/site/Schritte.tsx` | Texte gekürzt |
| `src/routes/index.tsx` | Startseite: kaum Text, großes Suchfeld, Schnellsuchen, Profilliste |
| `src/routes/talente.tsx` | Suche mit `?q=`, eingeklappte Filter, zwei Spalten |

## Übernehmen

Sobald wieder Lovable-Guthaben vorhanden ist, den Inhalt der Dateien an Lovable geben
mit der Bitte, sie genau so zu übernehmen. Danach zusätzlich:

1. Cookie-Banner-Text auf einen Satz kürzen.
2. Übrige Seiten (Preise, Arbeitnehmer, Unternehmen, Ablauf, Dashboard …) straffen –
   Rechtstexte nicht kürzen.
3. Beim Konto-Löschen Kündigungen als Nachweis behalten (`user_id` auf NULL), wie in
   der Datenschutzerklärung beschrieben.
4. Storage-Löschung in `kontoLoeschen` rekursiv und mit Paginierung.
5. Im Browser prüfen: Autocomplete, zwei Spalten, Nachladen, keine Konsolenfehler.
