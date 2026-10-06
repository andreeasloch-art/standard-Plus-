# Standard Plus – Landingpage

Statische Website (reines HTML, CSS und JavaScript – kein Baukasten, keine Abhängigkeiten).

| Datei | Inhalt |
| --- | --- |
| `index.html` | Landingpage: Über uns, Vorteile, Ablauf, Branchen, Pakete, FAQ, Kontaktformular |
| `impressum.html` | Impressum (Daten von standard-aaa.com übernommen) |
| `agb.html` | Allgemeine Geschäftsbedingungen |
| `datenschutz.html` | Datenschutzerklärung |
| `assets/css/style.css` | Gestaltung (Farben oben unter „Design-Tokens“) |
| `assets/js/main.js` | Menü, Animationen, Kontaktformular |
| `assets/fonts/` | Schriften lokal (keine Verbindung zu Google – DSGVO) |
| `assets/img/` | Fotos, Favicon |

## Ansehen

`index.html` im Browser öffnen – oder im Ordner `python3 -m http.server` starten
und http://localhost:8000 aufrufen.

## Online stellen

Den gesamten Ordner (ohne `StandardPlus-App.zip`) auf den Webspace laden.

## Kontaktformular

Ohne Server öffnet das Formular das E-Mail-Programm der Besucher mit einer fertig
ausgefüllten Nachricht an `info@standard-aaa.de`.
Für direkten Versand ohne E-Mail-Programm die Adresse eines Formular-Dienstes
(z. B. Formspree) oder eines PHP-Skripts beim Hoster in `index.html` bei
`data-endpoint=""` eintragen und den Dienst in der Datenschutzerklärung nennen.

## Vor dem Start bitte prüfen

- **Impressum:** Rechtsform, ggf. Handelsregister und USt-IdNr. ergänzen.
- **Datenschutz:** Name und Anschrift des Webhosters ergänzen.
- **AGB:** Entwurf – Fälligkeit (§ 6), Kündigung des Abos (§ 7) und Gerichtsstand (§ 12)
  anwaltlich prüfen lassen. Die AGB gelten für Unternehmen; werden auch Privathaushalte
  (z. B. häusliche Pflege) bedient, ist zusätzlich eine Widerrufsbelehrung nötig.
