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
  zusage-gruen: "oklch(0.5 0.1 168)"
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
  button-tint:
    backgroundColor: "{colors.tint}"
    textColor: "{colors.tint-foreground}"
    rounded: "{rounded.lg}"
    typography: "{typography.label}"
    padding: "0 24px"
    height: "44px"
  button-tint-hover:
    backgroundColor: "{colors.tuerkis-100}"
  button-zusage:
    backgroundColor: "{colors.zusage-gruen}"
    textColor: "{colors.karte}"
    rounded: "{rounded.full}"
    size: "64px"
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
  card-wisch:
    backgroundColor: "{colors.karte}"
    textColor: "{colors.karte}"
    rounded: "{rounded.3xl}"
    padding: "20px"
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

Die Dichte ist luftig, aber nicht leer. Große Barlow-Überschriften tragen die Seite, kurze Inter-Sätze erklären, und der Kartenstapel ist das lebendige Zentrum: Er wischt sich selbst vor, mischt sich bei jedem Beispiel, das sich ins Suchfeld tippt, und bei jeder eigenen Eingabe neu ein und zählt seine Treffer mit Klappziffern wie eine Abfahrtstafel. Bei reduzierter Bewegung steht alles still und bleibt vollständig lesbar.

Abgelehnt sind dunkle Farbflächen im oberen Bereich und große grüne oder türkise Flächen. Die einzige dunkle Fläche ist der Schlussaufruf, und sie ist neutral graphit, nicht grün; dunkle Verläufe gibt es sonst nur als Lesegrund auf Fotos.

**Key Characteristics:**
- Heller Modus als Standard, Dunkelmodus zuschaltbar.
- Glas nur für Bedienelemente und schwebende Leisten; Inhalte liegen auf festen weißen Karten.
- Gold = Hauptaktion, Türkis = Wegeleitung (Text, Linien, Schilder), nie Fläche.
- Barlow Condensed mit gleich breiten Ziffern für alles, was nach Fahrplan aussieht.
- Bewegung mit Bedeutung: Klappen, Einmischen, Wischen.

## Colors

Ein kühles Hallenweiß mit zwei Markenfarben aus dem Logo, beide sparsam: Gold für die Handlung, Türkis für die Orientierung.

### Primary
- **Abfahrtsgold** (`gold`): genau drei Hauptaktionen: „Kostenlos Profil anlegen“ auf der Startseite, der Knopf im Schlussaufruf und „Einladen“ in einer aufgeklappten Wischkarte. Dazu Favoriten-Zähler, Zielhalt im Linienplan, Textauswahl. Als Knopf immer mit Glanzverlauf von oben (70 % Gold mit Weiß gemischt → reines Gold bei 55 %) und Graphit-Schrift. Hover: leicht heller (brightness 1.03) und 1px angehoben; `gold-deep` steht als dunklere Stufe bereit.

### Secondary
- **Wegeleit-Türkis** (`tuerkis-500` bis `tuerkis-800`, Logo-Ton #448C92 = `tuerkis-500`): Gleisschilder (`tuerkis-700`), Linien und Halte-Ringe (`tuerkis-600`), Verbindungspfeile (`tuerkis-500`/`-600`), Berufsbezeichnungen und Zielorte (`tuerkis-700`, dunkel `tuerkis-300`), aktive Navigation (`tuerkis-800`).
- **Türkis-Hauch** (`tint` / `tint-foreground`): der Knopf „Suchen“ im Suchfeld (mit `tuerkis-300`-Rand), Skill-Etiketten, aktiver Branchen-Chip, markierter Vorschlag in der Suchliste.
- **Foto-Platzhalter** (warmer Verlauf: Goldschein 38 % oben links über Creme #fdf7e6 → `tuerkis-100`, kein Punktraster): Profil ohne Foto. In der Mitte ein weißer Avatar-Kreis (80 % Weiß, 4px Ring 50 % Weiß, Soft-Schatten) mit Initial in `tuerkis-700`; liegt Text unten auf dem Bild, rückt der Kreis ins obere Drittel.

### Tertiary
- **Zusage-Grün** (`zusage-gruen`): ausschließlich die positive Wisch-Entscheidung auf /talente: der runde „Gefällt mir“-Knopf mit Haken, der Stempel „GEFÄLLT MIR“, das Etikett „Gefällt mir“ auf dem Foto und die Bestätigungszeile in der aufgeklappten Karte. Keine Flächen, keine Sektionen.

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
**The Gold-ist-Abfahrt Rule.** Gold trägt pro Bereich genau eine Hauptaktion, dazu Zähler und Ziele. Suchen ist Türkis-Hauch, Anmelden ist Glas; alles, was nicht die eine Handlung ist, ist nicht gold.

**The Türkis-ist-Wegweiser Rule.** Türkis erscheint als Schrift, Linie, Schild oder kleiner Knopf, nie als große Fläche oder Sektionshintergrund.

**The Grün-heißt-Ja Rule.** Grün bedeutet nur „gefällt mir“ und erscheint nur auf runden Knöpfen, Stempeln und kleinen Etiketten, nie als Fläche.

**The Eine-dunkle-Tafel Rule.** Die einzige dunkle Fläche im hellen Modus ist der Schlussaufruf in neutralem Graphit (`tafel`). Keine dunklen Flächen oberhalb der Falz.

## Typography

**Display Font:** Barlow 600/700 (mit Inter, ui-sans-serif)
**Body Font:** Inter 400–700 (mit ui-sans-serif, system-ui)
**Label/Mono Font:** Barlow Condensed 600/700, gleich breite Ziffern (Tafelschrift)

**Character:** Barlow hat die Sachlichkeit von Verkehrsbeschilderung und wirkt freundlich-kräftig in großen Größen; Inter ist ruhig und gut lesbar für Menschen mit Deutsch als Zweitsprache. Barlow Condensed ist die Stimme der Abfahrtstafel. Alle Schriften werden lokal geladen.

### Hierarchy
- **Display** (700, 2.4rem → 3.75rem → 4.5rem, Zeilenhöhe 1.02, -0.02em, ausbalanciert umbrochen): nur die H1 der Startseite. Der Schlussteil darf in `tuerkis-700` stehen.
- **Headline** (700, 1.875rem → 2.25rem, 1.2, -0.015em): Abschnittstitel. Seitenköpfe nutzen 2.25rem → 3.75rem.
- **Title** (700, 1.25rem bis 2.25rem, 1.2): Haltenamen, Namen auf Profil- und Wischkarten (auf der Vollbild-Wischkarte 1.875rem → 2.25rem, weiß, mit Alter „Maria K., 38“).
- **Body** (400, 1rem, 1.65): Fließtext, max. 70ch. **Lead** (1.125rem) für den einen Einleitungssatz unter Überschriften.
- **Label** (600, 0.875rem): Knöpfe, Tabs, Chips; Knöpfe der Größe sm 0.75rem.
- **Tafel** (Barlow Condensed 600/700, 1rem, tabular-nums, +0.01em): Verbindungen „Von → Nach“, Gleisschilder, Halte-Nummern, Trefferzähler (1.5rem, 700, mit Klappanimation).

### Named Rules
**The Tafelschrift Rule.** Alles, was Ort, Ziel, Niveau oder Zahl ist, steht in Barlow Condensed mit gleich breiten Ziffern. Fließtext nie.

**The Ein-Satz Rule.** Unter jeder Überschrift höchstens ein Satz in Lead-Größe; mehr Text gehört in Listen.

## Layout

Eine zentrierte Spalte von max. 72rem mit 16px Rand auf dem Handy und 24px ab 640px. Abschnitte atmen mit 64px Abstand unten (96px ab 640px). Die Startseite folgt fest der Reihenfolge Suche → Ablauf → Profile → Dolmetscher → App → Aufruf.

Der erste Bildschirm ist ab 1024px zweispaltig (1.1fr : 0.9fr, 64px Spaltenabstand): links Überschrift, Satz, Suchfeld, Branchen-Chips und Knöpfe; rechts der Wischstapel (max. 22rem breit). Auf dem Handy rückt der Stapel direkt unter die Chips, die Knöpfe folgen darunter. Profile stehen immer zu zweit nebeneinander; die Profilkarte legt ab 768px das Foto links (11rem) statt oben. Der Linienplan läuft auf dem Handy senkrecht, ab 1024px waagerecht über vier Spalten.

Auf dem Handy ersetzt ein schwebendes Glas-Dock unten (Start, Wischen, Favoriten, Konto) die Kopfnavigation; auf /talente füllt die Wischkarte die Höhe bis knapp über dem Dock (100dvh − 22.5rem, mindestens 24rem; ab 640px bis 46rem) bei max. 28rem Breite. Sichere Bereiche (`safe-area-inset-bottom`) werden berücksichtigt.

## Elevation & Depth

Tiefe entsteht aus Glas und weichen, kühlen Schatten, nicht aus Linien. Schwebende Leisten und Knöpfe (Kopfzeile, App-Dock, Suchfeld, die runden Knöpfe auf der Wischkarte) sind dichtes Glas mit 24px Unschärfe, kleine Bedienelemente leichteres Glas mit 14px Unschärfe. Beide tragen eine weiße Lichtkante oben (`inset 0 1px 0`). Inhaltskarten sind dagegen fest und weiß; gestapelte Wischkarten und Dialoge verzichten bewusst auf Glas, damit nichts durchscheint.

### Shadow Vocabulary
- **Soft** (`--shadow-soft`: 1px Haarlinie 5 % + 1–2px Kontakt + 12/32px weicher Schatten, -16px gespreizt, kühl getönt): Karten in Ruhe, Chips, aktive Tabs.
- **Lift** (`--shadow-lift`: 1px Haarlinie 6 % + 2/6px + 28/56px, -24px gespreizt): schwebende Glasleisten, Vorschlagslisten, Dialoge, Karten-Hover, Schlussaufruf.
- **Goldglanz** (Innenkante weiß 70 % oben, 6 % dunkel unten, warmer Schatten 8/20px): ausschließlich goldene Knöpfe.
- **Farbschein** (Innenkante weiß 35 %, `0 10px 24px -8px` in der Knopffarbe): runde Vollfarb-Knöpfe (Grün für „gefällt mir“ – auf der Startseite und auf /talente).
- **Fotoverlauf** (von unten Schwarz 80 % über 20 % zu transparent): Lesegrund für weiße Schrift auf der Vollbild-Wischkarte. Die einzige Schwarzfläche, und nur auf Fotos.

### Named Rules
**The Glas-nur-zum-Bedienen Rule.** Glas bekommen Leisten, Knöpfe, Chips und das Suchfeld. Inhalte, die gelesen werden (Profile, Dialoge), liegen auf fester weißer Karte.

## Shapes

Sanft gerundete, ruhige Rechtecke auf Basis von 10px (`--radius: 0.625rem`). Knöpfe und Formularfelder nutzen 10px, Chips und Etiketten 8px, Gleisschilder 6px (fast quadratisch wie ein echtes Schild), Karten, Leisten und das Suchfeld 14px, der Schlussaufruf 18px, die Vollbild-Wischkarte samt Stapel 22px. Kreisrund sind nur die Wisch-Knöpfe (Weiter, Gefällt mir/Favorit, Rückgängig, Einladen), der Avatar-Kreis im Foto-Platzhalter, die Halte im Linienplan (30px, 3px Ring) und Zähler-Badges. Fotos sind im Hochformat 4:5 beschnitten, Bildausschnitt im oberen Drittel (50 % 28 %), damit Gesichter sichtbar bleiben.

## Components

### Buttons
Satt und greifbar: Gold mit Glanzkante für die eine Handlung, Glas oder Türkis-Hauch für alles Weitere.
- **Shape:** sanft gerundet (10px), Höhe 44px (sm 36px, lg 48px), Abstand Symbol–Text 8px.
- **Primary (Gold):** Goldverlauf, Graphit-Schrift 600, Polster 20px (lg 28px). Hover: brightness 1.03 und -1px; Active: +1px.
- **Glas (outline/secondary):** leichtes Glas, Graphit-Schrift; Hover: dichteres Glas und -1px. Auch „Anmelden“ in der Kopfzeile.
- **Türkis-Hauch:** `tint`-Fläche, 1px `tuerkis-300`-Rand, Schrift `tint-foreground` 600, 10px Radius. Hover: Rand `tuerkis-500`, Fläche `tuerkis-100`. Für den Suchknopf im Suchfeld.
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
- **Suchfeld (Signatur):** dichte Glasleiste, 14px Radius, Lupe links, eingebetteter Türkis-Hauch-Knopf „Suchen“ rechts (44px hoch, 24px Polster). Im leeren Zustand tippt sich ein Beispiel („z. B. Pflegekraft in Wien“) Zeichen für Zeichen ein (70–130ms pro Zeichen, 1.6s Pause); jedes fertig getippte Beispiel steuert den Stapel daneben. Fokus: 2px Ring. Vorschläge als feste Karte mit Lift, aktive Zeile `tint`, Treffer fett.
- **Formularfelder / Auswahllisten:** 44px hoch, 10px Radius, Rand `feldrand`, Hintergrund dichtes Glas. Fokus: Rand `tuerkis-600` plus 3px Halo mit 25 % Deckkraft. Schreibmarke `tuerkis-600`.

### Navigation
- **Kopfzeile:** schwebende Glasleiste (56px, ab 640px 64px, 14px Radius) im Seitenrahmen, darunter ein Verlauf vom Hintergrund ins Transparente. Links Logo, mittig Links in 0.875rem 500 `leise-schrift`, rechts Favoriten-Stern mit Gold-Zähler, Hell/Dunkel-Schalter und Glasknopf „Anmelden“ (sm). Aktiver Link: dichtes Glas, Soft-Schatten, `tuerkis-800`.
- **Mobil:** Menü klappt als zweite Glasleiste auf (Escape schließt). Unten ein Glas-Dock mit vier Punkten (24px-Symbole, 11px Beschriftung 600), aktiv wie in der Kopfzeile.
- **Umschalter (Tabs):** Glasschale mit 4px Innenabstand; aktiver Teil weiß mit Soft-Schatten und `tuerkis-800`.

### Wischstapel – Startseite (Signatur)
Drei Karten übereinander; die hinteren liegen je 16px tiefer, 4 % kleiner und abwechselnd um +2.5° / −2.5° gedreht wie ein lockerer Stapel. Oben ein Trefferzähler mit Klappziffern und rechts ein kleiner Glasknopf (36px, 10px Radius) zum Anhalten/Fortsetzen der Animation. Der Stapel wischt sich alle 2.6s selbst (zwei Mal rechts, einmal links), bis jemand selbst wischt; er ruht bei Maus darüber, Fokus darin oder außerhalb des Bildschirms. Jedes getippte Beispiel und jede eigene Eingabe mischt die Karten neu ein (520ms, von oben gedreht, 90ms versetzt). Ziehen dreht die Karte mit (dx/20 Grad); ab 90px fällt die Entscheidung, Stempel „GEFÄLLT MIR“ (grüner Rand) oder „WEITER“ (Graphit-Rand). Darunter: Glasknopf Weiter und runder grüner Haken-Knopf „gefällt mir“ (56px), dazu der Link „Alle wischen“.

### Wischkarte – /talente (Signatur)
Eine Karte wie bei Tinder, die fast die ganze Bildschirmhöhe füllt (22px Radius, feste Karte, zwei Karten dahinter um 10px versetzt). Das Foto füllt die Karte; ein Verlauf von unten (Schwarz 80 %) trägt weiße Schrift: Name mit Alter (Title, weiß), Beruf (1.125rem 500), Berufsfeld, Erfahrung und das Gleisschild „Deutsch“ (hier weiß mit `tuerkis-800`-Ziffer), darunter die Verbindung „Von → Nach“ in Tafelschrift. Oben links das Beispiel-Etikett, oben rechts nach Zusage ein grünes Etikett „Gefällt mir“.

Die Knöpfe schweben unten auf der Karte: Rückgängig (44px, Glas), Weiter (64px, Glas), Gefällt mir (64px, `zusage-gruen`, weißer Haken, Farbschein) und Einladen (44px, Glas, Kalender in `tuerkis-700`). Ziehen nach rechts über 28 % der Breite oder Pfeil → bedeutet „gefällt mir“ und blendet den Stempel „GEFÄLLT MIR“ (grüner Rand und Schrift) ein; links bzw. ← zeigt „WEITER“ (Graphit).

„Gefällt mir“ merkt den Favoriten und klappt die Karte auf: Das Foto schrumpft auf 48 % der Höhe (300ms), darunter blendet ein Detailbereich ein (karte-rein) mit grüner Bestätigungszeile, einem zweispaltigen Faktenraster (Symbol in `tuerkis-600`, kleines Label, Wert 600), „Über mich“, „Fähigkeiten“ als Tint-Etiketten und einem gestrichelten Hinweiskasten mit Schloss: Kontaktdaten erst bei Vertragsabschluss. In der offenen Karte wird der Gefällt-mir-Knopf zum goldenen Knopf „Einladen“ (56px hoch, rund, Kalender-Symbol); die Knopfleiste bekommt einen Verlauf aus der Kartenfarbe. Unter der Karte: „← weiter · 1 von 14 · gefällt mir →“ in 0.75rem.

### Profilfoto-Platzhalter
Warmer Verlauf (siehe Colors) mit weißem Avatar-Kreis und Initial (Barlow 700): 96px auf großen Karten, sonst 56–64px. Darunter klein „kein Foto“ mit Personensymbol in `tuerkis-800` 70 %. Mit `kopfOben` sitzt der Kreis bei 16 % Höhe, damit unten Text über dem Bild Platz hat.

### Linienplan
Vier nummerierte Halte auf einer 4px-Linie in `tuerkis-600`. Halte sind 30px-Kreise mit 3px Ring und Tafelziffer; der letzte Halt (Ziel) ist gefüllt in Gold mit Graphit-Ziffer.

### Klappziffern
Jedes Zeichen klappt von oben herunter (perspektivisch -92°, 520ms, `cubic-bezier(0.16, 1, 0.3, 1)`, 22ms Versatz je Zeichen). Für Zähler, nicht für Fließtext.

### Schlussaufruf
Graphit-Tafel mit 18px Radius, Polster 32px → 48px, Lift-Schatten und einem weichen Türkis-Schein (15 %) oben rechts. Überschrift in `tafel-text`, ein Satz in `tafel-leise`, Gold-Knopf plus Ghost-Knopf.

## Do's and Don'ts

### Do:
- **Do** eine Hauptaktion pro Bereich in Gold mit Glanzkante setzen und alles Weitere als Glasknopf oder Türkis-Hauch-Knopf.
- **Do** die positive Wisch-Entscheidung in `zusage-gruen` zeigen (runder Haken-Knopf, Stempel „GEFÄLLT MIR“), sonst nirgends Grün.
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
- **Don't** Grün als Fläche, Hintergrund oder für etwas anderes als „gefällt mir“ einsetzen.
- **Don't** Kennzahlen, Bewertungen oder Logos erfinden.
