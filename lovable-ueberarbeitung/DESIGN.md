---
name: Standard Plus
description: Internationale Personalvermittlung per Wisch – helle Bahnhofshalle unter Glasdach.
colors:
  gold: "oklch(0.89 0.16 93)"
  gold-deep: "oklch(0.83 0.16 90)"
  tuerkis-50: "#eef7f7"
  tuerkis-100: "#d9eeef"
  tuerkis-200: "#b3dcde"
  tuerkis-300: "#84c2c5"
  tuerkis-500: "#448c92"
  tuerkis-600: "#2f767c"
  tuerkis-700: "#1f6166"
  tuerkis-800: "#164d52"
  hallenweiss: "#f3f7f7"
  bahnsteig: "oklch(0.96 0.008 197)"
  karte: "oklch(1 0 0)"
  graphit-ink: "oklch(0.25 0.012 210)"
  leise-schrift: "oklch(0.43 0.014 205)"
  linie: "oklch(0.9 0.012 205)"
  feldrand: "oklch(0.6 0.014 205)"
  tint: "#eef7f7"
  tint-foreground: "#164d52"
  tafel: "#1d2426"
  tafel-zeile: "#283133"
  tafel-text: "#f4f6f6"
  tafel-leise: "#b4c0c1"
  glas: "rgb(255 255 255 / 0.62)"
  glas-stark: "rgb(255 255 255 / 0.86)"
  glas-rand: "rgb(255 255 255 / 0.75)"
  destructive: "oklch(0.52 0.16 25)"
typography:
  display:
    fontFamily: "Barlow, Inter, ui-sans-serif, sans-serif"
    fontSize: "clamp(2.4rem, 6vw, 4.5rem)"
    fontWeight: 700
    lineHeight: 1.02
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Barlow, Inter, ui-sans-serif, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Barlow, Inter, ui-sans-serif, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.65
  body-lead:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.4
  tafel:
    fontFamily: "Barlow Condensed, Barlow, ui-sans-serif, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.01em"
    fontFeature: "tnum"
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "14px"
  2xl: "18px"
  3xl: "22px"
  full: "9999px"
spacing:
  gutter-mobile: "16px"
  gutter: "24px"
  card-sm: "16px"
  card: "20px"
  stack: "32px"
  section-mobile: "64px"
  section: "96px"
  container: "72rem"
components:
  button-primary:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.graphit-ink}"
    rounded: "{rounded.lg}"
    typography: "{typography.label}"
    padding: "0 20px"
    height: "44px"
  button-primary-lg:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.graphit-ink}"
    rounded: "{rounded.lg}"
    padding: "0 28px"
    height: "48px"
  button-glass:
    backgroundColor: "{colors.glas}"
    textColor: "{colors.graphit-ink}"
    rounded: "{rounded.lg}"
    typography: "{typography.label}"
    padding: "0 20px"
    height: "44px"
  button-glass-hover:
    backgroundColor: "{colors.glas-stark}"
  button-ghost-hover:
    backgroundColor: "{colors.glas}"
  search-field:
    backgroundColor: "{colors.glas-stark}"
    textColor: "{colors.graphit-ink}"
    rounded: "{rounded.xl}"
    padding: "8px 8px 8px 20px"
  chip-branche:
    backgroundColor: "{colors.glas}"
    textColor: "{colors.tint-foreground}"
    rounded: "{rounded.md}"
    padding: "4px 12px"
  chip-branche-active:
    backgroundColor: "{colors.tint}"
    textColor: "{colors.tint-foreground}"
  gleisschild:
    backgroundColor: "{colors.tuerkis-700}"
    textColor: "{colors.karte}"
    typography: "{typography.tafel}"
    rounded: "{rounded.sm}"
    height: "28px"
    padding: "0 6px"
  skill-tag:
    backgroundColor: "{colors.tint}"
    textColor: "{colors.tint-foreground}"
    rounded: "{rounded.md}"
    padding: "2px 8px"
  card-profil:
    backgroundColor: "{colors.karte}"
    textColor: "{colors.graphit-ink}"
    rounded: "{rounded.xl}"
    padding: "20px"
  nav-leiste:
    backgroundColor: "{colors.glas-stark}"
    rounded: "{rounded.xl}"
    height: "64px"
  nav-link-active:
    backgroundColor: "{colors.glas-stark}"
    textColor: "{colors.tuerkis-800}"
    rounded: "{rounded.md}"
  tafel-aufruf:
    backgroundColor: "{colors.tafel}"
    textColor: "{colors.tafel-text}"
    rounded: "{rounded.2xl}"
    padding: "48px"
---

# Design System: Standard Plus

## Overview

**Creative North Star: "Die helle Bahnhofshalle"**

Standard Plus sieht aus wie eine lichte Bahnhofshalle unter einem Glasdach: kühles, fast weißes Licht, gläserne Leisten und Knöpfe, die über einem ruhigen Farbschimmer schweben, und eine Wegeleitung, die einem sagt, wohin die Reise geht. Jede Fachkraft ist eine Verbindung „Von ──→ Nach“, ihr Deutschniveau ein türkises Gleisschild, der Ablauf ein Linienplan mit nummerierten Halten. Gold ist der gelbe Abfahrtsplan: Es markiert die eine Handlung, die zählt.

Die Dichte ist luftig, aber nicht leer. Große Barlow-Überschriften tragen die Seite, kurze Inter-Sätze erklären, und der Kartenstapel ist das lebendige Zentrum: Er wischt sich selbst vor, mischt sich bei jeder Sucheingabe neu ein und zählt seine Treffer mit Klappziffern wie eine Abfahrtstafel. Bei reduzierter Bewegung steht alles still und bleibt vollständig lesbar.

Abgelehnt sind dunkle Farbflächen im oberen Bereich und große grüne oder türkise Flächen. Die einzige dunkle Fläche ist der Schlussaufruf, und sie ist neutral graphit, nicht grün.

**Key Characteristics:**
- Heller Modus als Standard, Dunkelmodus zuschaltbar.
- Glas nur für Bedienelemente und schwebende Leisten; Inhalte liegen auf festen weißen Karten.
- Gold = Hauptaktion, Türkis = Wegeleitung (Text, Linien, Schilder), nie Fläche.
- Barlow Condensed mit gleich breiten Ziffern für alles, was nach Fahrplan aussieht.
- Bewegung mit Bedeutung: Klappen, Einmischen, Wischen.

## Colors

Ein kühles Hallenweiß mit zwei Markenfarben aus dem Logo, beide sparsam: Gold für die Handlung, Türkis für die Orientierung.

### Primary
- **Abfahrtsgold** (`gold`): Hauptknöpfe („Kostenlos Profil anlegen“, „Suchen“, „Einladen“, „Anmelden“), Favoriten-Zähler, Zielhalt im Linienplan, Textauswahl. Als Knopf immer mit Glanzverlauf von oben (70 % Gold mit Weiß gemischt → reines Gold bei 55 %) und Graphit-Schrift. Hover: leicht heller (brightness 1.03) und 1px angehoben; `gold-deep` steht als dunklere Stufe bereit.

### Secondary
- **Wegeleit-Türkis** (`tuerkis-500` bis `tuerkis-800`, Logo-Ton #448C92 = `tuerkis-500`): Gleisschilder (`tuerkis-700`), Linien und Halte-Ringe (`tuerkis-600`), Verbindungspfeile (`tuerkis-500`/`-600`), Berufsbezeichnungen und Zielorte (`tuerkis-700`, dunkel `tuerkis-300`), aktive Navigation (`tuerkis-800`). Der Favoriten-Wischknopf ist die einzige türkise Vollfläche: ein runder Knopf mit Verlauf `tuerkis-500` → `tuerkis-700`.
- **Türkis-Hauch** (`tint` / `tint-foreground`): Skill-Etiketten, aktiver Branchen-Chip, markierter Vorschlag in der Suchliste.
- **Foto-Platzhalter** (`tuerkis-50` → `tuerkis-200` mit Punktraster 14px): Profil ohne Foto, großes Initial in `tuerkis-700`.

### Neutral
- **Hallenweiß** (`hallenweiss`): Seitenhintergrund. Dahinter liegt fest ein Aurora-Schimmer aus drei weichen Kreisverläufen (Türkis-300 oben links, Gold oben rechts, Türkis-200 unten), bei 60 % Deckkraft.
- **Bahnsteig** (`bahnsteig`): Skelett-Platzhalter, ruhige Flächen.
- **Karte** (`karte`): Profilkarten, Wischkarten, Dialoge, Suchvorschläge.
- **Graphit** (`graphit-ink`): Fließtext, Überschriften, Schrift auf Gold.
- **Leise Schrift** (`leise-schrift`): Untertitel, Hilfetexte, inaktive Navigation.
- **Linie** (`linie`): Kartenränder und Trennlinien. **Feldrand** (`feldrand`): Rand von Formularfeldern.
- **Tafel-Graphit** (`tafel`, `tafel-zeile`, `tafel-text`, `tafel-leise`): ausschließlich der Schlussaufruf.
- **Fehler** (`destructive`): Fehlermeldungen, nur als 10-%-Fläche mit 40-%-Rand.

### Named Rules
**The Gold-ist-Abfahrt Rule.** Gold trägt pro Bereich genau eine Hauptaktion, dazu Zähler und Ziele. Erlaubte Begleiter sind nur der ins Suchfeld eingebettete Knopf „Suchen“ und „Anmelden“ in der Kopfzeile.

**The Türkis-ist-Wegweiser Rule.** Türkis erscheint als Schrift, Linie, Schild oder kleiner Knopf, nie als große Fläche oder Sektionshintergrund.

**The Eine-dunkle-Tafel Rule.** Die einzige dunkle Fläche im hellen Modus ist der Schlussaufruf in neutralem Graphit (`tafel`). Keine dunklen Flächen oberhalb der Falz.

## Typography

**Display Font:** Barlow 600/700 (mit Inter, ui-sans-serif)
**Body Font:** Inter 400–700 (mit ui-sans-serif, system-ui)
**Label/Mono Font:** Barlow Condensed 600/700, gleich breite Ziffern (Tafelschrift)

**Character:** Barlow hat die Sachlichkeit von Verkehrsbeschilderung und wirkt freundlich-kräftig in großen Größen; Inter ist ruhig und gut lesbar für Menschen mit Deutsch als Zweitsprache. Barlow Condensed ist die Stimme der Abfahrtstafel. Alle Schriften werden lokal geladen.

### Hierarchy
- **Display** (700, 2.4rem → 3.75rem → 4.5rem, Zeilenhöhe 1.02, -0.02em, ausbalanciert umbrochen): nur die H1 der Startseite. Der Schlussteil darf in `tuerkis-700` stehen.
- **Headline** (700, 1.875rem → 2.25rem, 1.2, -0.015em): Abschnittstitel. Seitenköpfe nutzen 2.25rem → 3.75rem.
- **Title** (700, 1.25rem bis 1.875rem, 1.2): Haltenamen, Namen auf Profil- und Wischkarten.
- **Body** (400, 1rem, 1.65): Fließtext, max. 70ch. **Lead** (1.125rem) für den einen Einleitungssatz unter Überschriften.
- **Label** (600, 0.875rem): Knöpfe, Tabs, Chips; Knöpfe der Größe sm 0.75rem.
- **Tafel** (Barlow Condensed 600/700, 1rem, tabular-nums, +0.01em): Verbindungen „Von → Nach“, Gleisschilder, Halte-Nummern, Trefferzähler (1.5rem, 700, mit Klappanimation).

### Named Rules
**The Tafelschrift Rule.** Alles, was Ort, Ziel, Niveau oder Zahl ist, steht in Barlow Condensed mit gleich breiten Ziffern. Fließtext nie.

**The Ein-Satz Rule.** Unter jeder Überschrift höchstens ein Satz in Lead-Größe; mehr Text gehört in Listen.

## Layout

Eine zentrierte Spalte von max. 72rem mit 16px Rand auf dem Handy und 24px ab 640px. Abschnitte atmen mit 64px Abstand unten (96px ab 640px). Die Startseite folgt fest der Reihenfolge Suche → Ablauf → Profile → Dolmetscher → App → Aufruf.

Der erste Bildschirm ist ab 1024px zweispaltig (1.1fr : 0.9fr, 64px Spaltenabstand): links Überschrift, Satz, Suchfeld, Branchen-Chips und Knöpfe; rechts der Wischstapel (max. 22rem breit). Auf dem Handy rückt der Stapel direkt unter die Chips, die Knöpfe folgen darunter. Profile stehen immer zu zweit nebeneinander; die Profilkarte legt ab 768px das Foto links (11rem) statt oben. Der Linienplan läuft auf dem Handy senkrecht, ab 1024px waagerecht über vier Spalten.

Auf dem Handy ersetzt ein schwebendes Glas-Dock unten (Start, Wischen, Favoriten, Konto) die Kopfnavigation; die Wischknöpfe auf /talente kleben darüber. Sichere Bereiche (`safe-area-inset-bottom`) werden berücksichtigt.

## Elevation & Depth

Tiefe entsteht aus Glas und weichen, kühlen Schatten, nicht aus Linien. Schwebende Leisten (Kopfzeile, App-Dock, Suchfeld, Wisch-Knopfleiste) sind dichtes Glas mit 24px Unschärfe, kleine Bedienelemente leichteres Glas mit 14px Unschärfe. Beide tragen eine weiße Lichtkante oben (`inset 0 1px 0`). Inhaltskarten sind dagegen fest und weiß; gestapelte Wischkarten und Dialoge verzichten bewusst auf Glas, damit nichts durchscheint.

### Shadow Vocabulary
- **Soft** (`--shadow-soft`: 1px Haarlinie 5 % + 1–2px Kontakt + 12/32px weicher Schatten, -16px gespreizt, kühl getönt): Karten in Ruhe, Chips, aktive Tabs.
- **Lift** (`--shadow-lift`: 1px Haarlinie 6 % + 2/6px + 28/56px, -24px gespreizt): schwebende Glasleisten, Vorschlagslisten, Dialoge, Karten-Hover, Schlussaufruf.
- **Goldglanz** (Innenkante weiß 70 % oben, 6 % dunkel unten, warmer Schatten 8/20px): ausschließlich goldene Knöpfe.

### Named Rules
**The Glas-nur-zum-Bedienen Rule.** Glas bekommen Leisten, Knöpfe, Chips und das Suchfeld. Inhalte, die gelesen werden (Profile, Dialoge), liegen auf fester weißer Karte.

## Shapes

Sanft gerundete, ruhige Rechtecke auf Basis von 10px (`--radius: 0.625rem`). Knöpfe und Formularfelder nutzen 10px, Chips und Etiketten 8px, Gleisschilder 6px (fast quadratisch wie ein echtes Schild), Karten, Leisten und das Suchfeld 14px, der Schlussaufruf 18px, der Wischstapel-Fokusrahmen 22px. Kreisrund sind nur die Wisch-Knöpfe (✕, Favorit, Rückgängig), die Halte im Linienplan (30px, 3px Ring) und Zähler-Badges. Fotos sind im Hochformat 4:5 beschnitten, Bildausschnitt im oberen Drittel (50 % 28 %), damit Gesichter sichtbar bleiben.

## Components

### Buttons
Satt und greifbar: Gold mit Glanzkante für die Handlung, Glas für alles Weitere.
- **Shape:** sanft gerundet (10px), Höhe 44px (sm 36px, lg 48px), Abstand Symbol–Text 8px.
- **Primary (Gold):** Goldverlauf, Graphit-Schrift 600, Polster 20px (lg 28px). Hover: brightness 1.03 und -1px; Active: +1px.
- **Glas (outline/secondary):** leichtes Glas, Graphit-Schrift; Hover: dichteres Glas und -1px.
- **Ghost:** transparent, Hover leichtes Glas. Auf der Tafel mit `tafel-text` und 10 % Weiß als Hover.
- **Focus:** 2px Ring in `tuerkis-600` mit 2px Abstand (im Dunkelmodus Gold). Disabled: 50 % Deckkraft.

### Chips
- **Branchen-Chips:** leichtes Glas, 8px Radius, 4px/12px Polster, Schrift `tint-foreground`. Aktiv (`aria-pressed`): `tint`-Fläche mit `tuerkis-300`-Rand.
- **Skill-Etiketten:** `tint`-Fläche, 0.75rem, 8px Radius.
- **Gleisschild:** `tuerkis-700`-Quadrat (min. 28px, auf Karten 24px), weiße Barlow-Condensed-Ziffer 700, 6px Radius. Zeigt das Deutschniveau.
- **Beispiel-Etikett:** Weiß 70–75 % mit Unschärfe auf dem Foto, `tuerkis-800`, kennzeichnet fiktive Profile.

### Cards / Containers
- **Corner Style:** 14px.
- **Background:** `karte` (fest weiß), Rand `linie` 1px.
- **Shadow Strategy:** Soft in Ruhe, Lift beim Hover (mit -2px und `tuerkis-300`-Rand).
- **Internal Padding:** 12px → 20px (Profilkarte), 16px → 20px (Wischkarte).
- **Inhalt einer Profilkarte:** Foto, Name (Title), Beruf in `tuerkis-700`, Verbindungszeile in Tafelschrift, bis zu drei Skills, Fußzeile mit Gleisschild „Deutsch“ und Erfahrungsjahren, getrennt durch eine Glaslinie.

### Inputs / Fields
- **Suchfeld (Signatur):** dichte Glasleiste, 14px Radius, Lupe links, eingebetteter Gold-Knopf „Suchen“ rechts. Im leeren Zustand tippt sich ein Beispiel („z. B. Pflegekraft in Wien“) Zeichen für Zeichen ein (70–130ms pro Zeichen, 1.6s Pause). Fokus: 2px Ring. Vorschläge als feste Karte mit Lift, aktive Zeile `tint`, Treffer fett.
- **Formularfelder / Auswahllisten:** 44px hoch, 10px Radius, Rand `feldrand`, Hintergrund dichtes Glas. Fokus: Rand `tuerkis-600` plus 3px Halo mit 25 % Deckkraft. Schreibmarke `tuerkis-600`.

### Navigation
- **Kopfzeile:** schwebende Glasleiste (56px, ab 640px 64px, 14px Radius) im Seitenrahmen, darunter ein Verlauf vom Hintergrund ins Transparente. Links Logo, mittig Links in 0.875rem 500 `leise-schrift`, rechts Favoriten-Stern mit Gold-Zähler, Hell/Dunkel-Schalter und Gold-Knopf „Anmelden“. Aktiver Link: dichtes Glas, Soft-Schatten, `tuerkis-800`.
- **Mobil:** Menü klappt als zweite Glasleiste auf (Escape schließt). Unten ein Glas-Dock mit vier Punkten (24px-Symbole, 11px Beschriftung 600), aktiv wie in der Kopfzeile.
- **Umschalter (Tabs):** Glasschale mit 4px Innenabstand; aktiver Teil weiß mit Soft-Schatten und `tuerkis-800`.

### Wischstapel (Signatur)
Drei Karten übereinander, hintere um 10px versetzt und 5 % kleiner. Oben ein Trefferzähler mit Klappziffern. Auf der Startseite wischt sich der Stapel alle 2.6s selbst (zwei Mal rechts, einmal links), bis jemand selbst wischt; jede Sucheingabe mischt die Karten neu ein (520ms, von oben gedreht, 90ms versetzt). Ziehen dreht die Karte mit (dx/20 Grad); ab 90px (bzw. 28 % der Kartenbreite auf /talente) fällt die Entscheidung, und ein schräger Stempel „FAVORIT“ (Türkis-Rand) oder „WEITER“ (Graphit-Rand) blendet ein. Darunter: Glasknopf ✕ und runder Türkis-Favoritknopf (56px, auf /talente 64px), Tastatur ← / →, Rückgängig.

### Linienplan
Vier nummerierte Halte auf einer 4px-Linie in `tuerkis-600`. Halte sind 30px-Kreise mit 3px Ring und Tafelziffer; der letzte Halt (Ziel) ist gefüllt in Gold mit Graphit-Ziffer.

### Klappziffern
Jedes Zeichen klappt von oben herunter (perspektivisch -92°, 520ms, `cubic-bezier(0.16, 1, 0.3, 1)`, 22ms Versatz je Zeichen). Für Zähler, nicht für Fließtext.

### Schlussaufruf
Graphit-Tafel mit 18px Radius, Polster 32px → 48px, Lift-Schatten und einem weichen Türkis-Schein (15 %) oben rechts. Überschrift in `tafel-text`, ein Satz in `tafel-leise`, Gold-Knopf plus Ghost-Knopf.

## Do's and Don'ts

### Do:
- **Do** eine Hauptaktion pro Bereich in Gold mit Glanzkante setzen und alles Weitere als Glasknopf.
- **Do** Orte, Ziele, Sprachniveaus und Zähler in Barlow Condensed mit gleich breiten Ziffern setzen: Verbindung als „Von ──→ Nach“, Niveau als türkises Gleisschild.
- **Do** Inhalte auf feste weiße Karten (14px, Soft-Schatten) legen und Glas nur für Leisten, Knöpfe, Chips und Suchfeld verwenden.
- **Do** fiktive Profile sichtbar als „Beispiel“ kennzeichnen.
- **Do** jede Bewegung bei `prefers-reduced-motion` abschalten (Stapel steht, Suchfeld zeigt das erste Beispiel statisch).
- **Do** Fotos im 4:5-Hochformat mit Ausschnitt im oberen Drittel zeigen.

### Don't:
- **Don't** Türkis als große Fläche oder Sektionshintergrund einsetzen; keine dunkelgrünen oder dunkeltürkisen Flächen.
- **Don't** dunkle Flächen oberhalb der Falz oder im Seitenkopf verwenden; die einzige dunkle Fläche ist der graphitfarbene Schlussaufruf.
- **Don't** Gold für Dekoration oder Flächen verwenden oder zwei goldene Hauptknöpfe in denselben Bereich setzen.
- **Don't** Profil- oder Wischkarten in Glas setzen; dort scheint nichts durch.
- **Don't** Kennzahlen, Bewertungen oder Logos erfinden.
