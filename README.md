# Standard Plus

Personalvermittlung in Europa – Website und Prototyp der Plattform.

Die Seite ist in **drei Sprachen** vorhanden: Deutsch (Hauptordner), Englisch (`en/`) und Rumänisch (`ro/`).

## Seite ansehen

Doppelklick auf **„Website starten.command"** (Mac) bzw. **„Website starten (Windows).bat"**.
Danach öffnet sich die Startseite im Browser.

## Wichtig zu wissen

Dies ist ein **Prototyp ohne Server**. Konten, Profile, Anfragen und Buchungen werden
ausschließlich im Browser der Besucherin oder des Besuchers gespeichert (localStorage).
Für den echten Betrieb sind ein Server mit Anmeldung und eine Datenbank nötig.

Alle Firmen, Profile und Lebensläufe auf der Seite sind **erfunden** und dienen nur der Vorführung.

## Vor dem Hochladen auf einen Webspace

1. `FIRMENDATEN.txt` ausfüllen (Firmenname, Anschrift, E-Mail-Adressen, Domain …).
2. Doppelklick auf **„Upload-Paket erstellen.command"**.
   Es entsteht `StandardPlus-Upload.zip` mit fertigem Impressum, Datenschutzerklärung,
   AGB, Sicherheits-Kopfzeilen, `robots.txt` und `sitemap.xml`.
3. Den Inhalt des Pakets auf den Webspace laden.

Solange ein Pflichtfeld leer ist, wird kein Paket erstellt – so kann kein
unvollständiges Impressum online gehen.

> Die Rechtstexte sind sorgfältig vorbereitet, ersetzen aber keine Rechtsberatung.
> Vor dem Start bitte von einer Anwältin oder einem Anwalt prüfen lassen.

## Aufbau

| Ordner / Datei | Inhalt |
| --- | --- |
| `standardplus-*.html` | die deutschen Seiten |
| `en/`, `ro/` | die übersetzten Seiten (werden erzeugt, nicht von Hand bearbeitet) |
| `assets/` | Stylesheet, Skripte, Bilder, Logo |
| `i18n/` | Übersetzungstabellen und die Skripte, die `en/` und `ro/` erzeugen |
| `werkzeuge/` | Skript für das Upload-Paket |
| `dolmetscher-server/` | optionaler Zusatzdienst für die Live-Dolmetscherfunktion |
| `LIESMICH-SICHERHEIT.md` | ausführliche Beschreibung von Technik, Datenschutz und Sicherheit |

## Nach Änderungen an den deutschen Seiten

```
bash neu-stempeln.sh
```

Das setzt neue Versionsnummern, baut die Sprachdateien und erzeugt `en/` und `ro/` neu.
