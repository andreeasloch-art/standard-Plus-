# Sichtbarkeit bei Google, im Internet und bei KI-Assistenten

Diese Anleitung erklärt, was auf der Website bereits eingebaut ist und welche
Schritte **außerhalb der Website** nötig sind. Die Website allein reicht nicht:
Google und KI-Assistenten wie ChatGPT, Claude, Perplexity oder Gemini vertrauen
einem Unternehmen erst, wenn sie es an mehreren Stellen im Internet mit
**denselben Angaben** finden.

---

## 1. Was auf der Website schon erledigt ist

| Bereich | Umsetzung |
| --- | --- |
| Seitentitel & Beschreibung | Optimiert auf „Personalvermittlung europaweit“ und die Branchen |
| Eindeutige Adresse | `canonical`-Angabe, `.htaccess` leitet auf **https://www.** um |
| Strukturierte Daten (schema.org) | Unternehmen, Leistung, beide Pakete mit Preisen, 10 Fragen & Antworten, Navigationspfad |
| Vorschau beim Teilen | Eigenes Vorschaubild für Google, WhatsApp, Facebook, LinkedIn |
| Inhalte | Klare Überschriften, Berufsbezeichnungen (Erntehelfer, Melker, Pflegekräfte …), Abschnitt „Auf einen Blick“ |
| `robots.txt` | Erlaubt ausdrücklich alle Suchmaschinen **und** KI-Crawler (GPTBot, ClaudeBot, PerplexityBot, Google-Extended …) |
| `sitemap.xml` | Liste aller Seiten für Google & Bing |
| `llms.txt` / `llms-full.txt` | Zusammenfassung der Firma speziell für KI-Assistenten |
| Geschwindigkeit | Bilder im WebP-Format, Schriften lokal, Komprimierung & Browser-Cache per `.htaccess` |
| Handy & App-Icons | Icons für Handy-Startbildschirm, `site.webmanifest` |
| IndexNow | Schlüsseldatei `6e2f22d248a8d3948c7f6ffa8403d464.txt` für sofortige Meldung an Bing, Yandex u. a. |

---

## 2. Vor dem Hochladen: Domain prüfen

Alle Adressen sind auf **`https://standard-plus.eu`** eingestellt.
Läuft die Seite unter einer anderen Domain (z. B. `standard-plus.de`),
im Projektordner einmal ausführen:

```bash
grep -rl "https://standard-plus.eu" --include=*.html --include=*.txt --include=*.xml . \
  | xargs sed -i 's#https://standard-plus.eu#https://www.NEUE-DOMAIN.de#g'
```

---

## 3. Google (wichtigster Schritt)

1. **Google Search Console** – https://search.google.com/search-console
   - Domain hinzufügen und bestätigen (beim Domain-Anbieter einen TXT-Eintrag setzen).
   - Unter „Sitemaps“ eintragen: `sitemap.xml`
   - Unter „URL-Prüfung“ die Startseite eingeben → „Indexierung beantragen“.
2. **Google Unternehmensprofil** (früher „Google My Business“) – https://business.google.com
   - Kategorie: **Personalvermittlung** (zusätzlich: „Arbeitsvermittlung“).
   - Name, Adresse, Telefon **exakt wie auf der Website** (siehe Abschnitt 6).
   - Website-Link, Öffnungszeiten (6 Tage), Fotos, Leistungen (beide Pakete) eintragen.
   - Profil per Postkarte/Video bestätigen.
   - Kunden nach **Google-Bewertungen** fragen – das wirkt am stärksten bei Google und KI.
3. Test der strukturierten Daten: https://search.google.com/test/rich-results
   (Startseite eingeben → es sollten „Organisation“, „FAQ“ und „Navigationspfad“ erscheinen.)

---

## 4. Bing, Microsoft Copilot, DuckDuckGo, Ecosia, Yahoo

Diese Suchmaschinen und **ChatGPT-Suche/Copilot** nutzen den Bing-Index.

1. **Bing Webmaster Tools** – https://www.bing.com/webmasters
   - Über „Import aus Google Search Console“ in einer Minute fertig.
   - Sitemap `sitemap.xml` einreichen.
2. **Bing Places** – https://www.bingplaces.com (Unternehmensprofil, kann aus Google importiert werden).
3. **IndexNow** – nach jeder Änderung an der Website Bing sofort informieren:
   ```
   https://www.bing.com/indexnow?url=https://standard-plus.eu/&key=6e2f22d248a8d3948c7f6ffa8403d464
   ```
   (Adresse einfach im Browser öffnen.)

---

## 5. Apple (Siri, Apple Karten)

**Apple Business Connect** – https://businessconnect.apple.com
Gleiche Angaben wie bei Google eintragen.

---

## 6. Einheitliche Firmendaten überall (sehr wichtig für KI)

KI-Assistenten gleichen Angaben aus vielen Quellen ab. Bitte **überall exakt** so schreiben:

```
Standard Plus Personalvermittlung
Heilbronner Straße 142
71634 Ludwigsburg
Telefon: +49 152 28986993
E-Mail: info@standard-aaa.de
Website: https://standard-plus.eu
```

**Achtung:** Die alte Website und das alte Impressum laufen noch unter dem Namen
„Standard AAA+“. In den strukturierten Daten ist „Standard AAA+“ als früherer
Name hinterlegt, damit Google und KI beide Namen derselben Firma zuordnen.
Langfristig sollte überall „Standard Plus“ stehen. Ideal wäre auch eine E-Mail
unter der eigenen Domain der Website.

---

## 7. Branchenverzeichnisse & Plattformen (Einträge sind kostenlos)

Jeder Eintrag mit Link zur Website stärkt das Ranking und das Vertrauen von KI:

- **Gelbe Seiten** – gelbeseiten.de
- **Das Örtliche** – dasoertliche.de
- **11880** – 11880.com
- **Cylex** – cylex.de
- **Yelp** – yelp.de
- **WLW / Wer liefert was** – wlw.de (gut für Geschäftskunden)
- **Kununu** – kununu.com (Arbeitgeber-Bewertungen)
- **IHK-Firmenverzeichnis**, falls Mitglied
- **LinkedIn-Unternehmensseite** – wichtig für KI-Assistenten
- **Facebook- und Instagram-Seite** mit Link zur Website
- Landwirtschaftliche Portale, Pflege- und Bauverbände, Gastro-Netzwerke

Die Profil-Adressen (z. B. LinkedIn, Facebook) bitte melden – sie werden dann
in den strukturierten Daten als `sameAs` ergänzt. Das hilft Google und KI,
alle Profile eindeutig dem Unternehmen zuzuordnen.

---

## 8. Speziell für KI-Assistenten (ChatGPT, Claude, Perplexity, Gemini, Copilot)

- **Erledigt:** KI-Crawler sind in `robots.txt` erlaubt; `llms.txt` und
  `llms-full.txt` liefern eine klare, sachliche Zusammenfassung.
- **Bewertungen & Erwähnungen:** KI empfiehlt Firmen, über die an mehreren
  Stellen positiv berichtet wird (Google-Bewertungen, Kununu, Presse, Verbände).
- **Wikidata-Eintrag** (https://www.wikidata.org): Einen Eintrag für „Standard Plus
  Personalvermittlung“ anlegen (Name, Branche, Sitz, Website). Viele KI-Systeme
  nutzen Wikidata als Faktenquelle.
- **Fachbeiträge:** Gelegentliche Artikel (z. B. „Erntehelfer aus Europa finden“,
  „Pflegekräfte aus der EU einstellen – das ist zu beachten“) als eigene Unterseiten
  bringen zusätzliche Suchanfragen. Bei Interesse kann ich diese Seiten anlegen.
- **Selbsttest:** Alle paar Wochen ChatGPT, Perplexity oder Gemini fragen:
  „Welche Personalvermittlung vermittelt Erntehelfer aus Europa?“ oder
  „Was ist Standard Plus Personalvermittlung?“

---

## 9. Pflege nach Änderungen

- Neue Fragen im Bereich „Häufige Fragen“ auch im JSON-LD-Block (`FAQPage`) in
  `index.html` ergänzen – beide müssen übereinstimmen.
- Bei neuen Seiten: `sitemap.xml` und `llms.txt` erweitern, `lastmod` aktualisieren.
- Preise geändert? In `index.html` (sichtbar **und** JSON-LD), `llms.txt`,
  `llms-full.txt` und den AGB anpassen.
