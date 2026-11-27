#!/usr/bin/env python3
"""Baut alle HTML-Seiten von Standard Plus.

Gemeinsame Teile (Kopfzeile, gelber Balken, Fußzeile, Icons, Daten für
Google) stehen nur einmal in dieser Datei. Die Inhalte der Rechtstexte liegen
in werkzeuge/inhalte/.

Aufruf (im Projektordner):  python3 werkzeuge/seiten_bauen.py
Danach liegen index.html, ueber-uns.html, branchen.html, ablauf.html,
pakete.html, fragen.html, kontakt.html, impressum.html, agb.html und
datenschutz.html fertig im Projektordner.
"""
import hashlib
import html
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INHALTE = os.path.join(ROOT, "werkzeuge", "inhalte")

DOMAIN = "https://www.standard-plus.net"
TEL = "0152 28986993"
TEL_LINK = "tel:+4915228986993"
# WhatsApp läuft über eine eigene Nummer; sie wird nirgends angezeigt, nur verlinkt.
WA_LINK = "https://wa.me/4917645258501?text=" + "Guten%20Tag%2C%20ich%20interessiere%20mich%20f%C3%BCr%20Personal%20von%20Standard%20Plus."
MAIL = "info@standard-plus.net"
WA_NUMMER = "0176 45258501"
STAND = "2026-11-03"

# ---------------------------------------------------------------------------
# Navigation
# ---------------------------------------------------------------------------
NAV = [
    ("ueber-uns.html", "Über uns"),
    ("branchen.html", "Branchen"),
    ("ablauf.html", "Ablauf"),
    ("pakete.html", "Pakete"),
    ("fragen.html", "Fragen"),
    ("kontakt.html", "Kontakt"),
]

# ---------------------------------------------------------------------------
# Branchen (Startseite und Branchen-Seite nutzen dieselben Angaben)
# ---------------------------------------------------------------------------
BRANCHEN = [
    {
        "id": "bau",
        "name": "Bau & Handwerk",
        "icon": "s-bau",
        "kurz": "Hilfs- und Fachkräfte für Baustelle, Handwerk und Straßenbau.",
        "alt": "Bauarbeiter mit Schutzhelm geben sich auf der Baustelle die Hand",
        "lead": "Ob Rohbau, Ausbau oder Straßenbau: Wir vermitteln zuverlässige Hilfs- und Fachkräfte für alle Gewerke – für einzelne Projekte oder für längere Zeit.",
        "wen": [
            "Bauhelfer und Helfer für alle Gewerke",
            "Fachkräfte, zum Beispiel für Maurer-, Beton-, Trockenbau-, Maler- oder Fliesenarbeiten",
            "Helfer für Straßen- und Tiefbau",
            "Mitarbeiter für Handwerksbetriebe",
        ],
        "einsatz": [
            "Zuarbeit auf der Baustelle, Materialtransport und Aufräumen",
            "Mitarbeit im Rohbau und Ausbau",
            "Unterstützung im Straßen- und Tiefbau",
            "Verstärkung für Handwerksbetriebe bei voller Auftragslage",
        ],
    },
    {
        "id": "landwirtschaft",
        "name": "Landwirtschaft & Milchvieh",
        "icon": "s-agrar",
        "kurz": "Erntehelfer, Stallhelfer und Mitarbeiter für den Melkbereich.",
        "alt": "Lächelnder Landwirt im Milchviehstall vor seinen Kühen",
        "lead": "Für landwirtschaftliche Betriebe vermitteln wir Erntehelfer und landwirtschaftliche Hilfskräfte sowie Mitarbeiter für Milchviehbetriebe – für Saisonspitzen oder längerfristig.",
        "wen": [
            "Erntehelfer",
            "Landwirtschaftliche Hilfskräfte",
            "Mitarbeiter für den Melkbereich",
            "Stallhelfer für Tierpflege und Fütterung",
        ],
        "einsatz": [
            "Ernte und Feldarbeit",
            "Melken und Arbeit im Melkstand",
            "Füttern, Stallpflege und Versorgung der Tiere",
            "Unterstützung in arbeitsreichen Zeiten",
        ],
    },
    {
        "id": "pferde",
        "name": "Pferdebetriebe",
        "icon": "s-pferd",
        "kurz": "Pferdepfleger und Stallhelfer für Reit-, Pensions- und Zuchtställe.",
        "alt": "Lächelnde Pferdepflegerin mit gesatteltem Pferd in der Stallgasse",
        "lead": "Pferde brauchen jeden Tag Zuverlässigkeit. Wir vermitteln Pferdepfleger und Stallhelfer für Reitställe, Pensionsställe und Zuchtbetriebe.",
        "wen": [
            "Pferdepfleger",
            "Stallhelfer",
            "Mitarbeiter für Pensions- und Reitställe",
        ],
        "einsatz": [
            "Füttern, Misten und Boxenpflege",
            "Putzen und Versorgen der Pferde",
            "Weide- und Paddockgang",
            "Mithilfe im täglichen Stallbetrieb",
        ],
    },
    {
        "id": "pflege",
        "name": "Pflege & Betreuung",
        "icon": "s-pflege",
        "kurz": "Betreuungskräfte für häusliche Pflege, Alltagshilfe und Einrichtungen.",
        "alt": "Pflegekraft hilft einer lächelnden Seniorin beim Gehen",
        "lead": "Wir vermitteln Pflege- und Betreuungskräfte für die häusliche Pflege, die Alltagshilfe und für Einrichtungen – damit pflegebedürftige Menschen gut versorgt und Angehörige entlastet sind.",
        "wen": [
            "Betreuungskräfte für die häusliche Pflege",
            "Alltagshelfer",
            "Pflegehilfskräfte für Einrichtungen",
        ],
        "einsatz": [
            "Unterstützung im Alltag: Haushalt, Einkaufen, Begleitung",
            "Gesellschaft und Betreuung",
            "Grundpflege nach Absprache",
            "Entlastung von Angehörigen",
        ],
    },
    {
        "id": "logistik",
        "name": "Lager & Logistik",
        "icon": "s-logistik",
        "kurz": "Lagerhelfer und Kommissionierer für Lager und Versand.",
        "alt": "Zwei Lagermitarbeiter mit Helm und Warnweste prüfen den Bestand im Regal",
        "lead": "Für Lager, Logistik und Versand vermitteln wir Lagerhelfer und Kommissionierer, die mit anpacken – bei Auftragsspitzen ebenso wie im laufenden Betrieb.",
        "wen": [
            "Lagerhelfer",
            "Kommissionierer",
            "Packer und Versandmitarbeiter",
            "Mitarbeiter für den Wareneingang",
        ],
        "einsatz": [
            "Kommissionierung nach Auftrag",
            "Verpacken und Versand",
            "Wareneingang und Einlagerung",
            "Unterstützung bei Inventur und Auftragsspitzen",
        ],
    },
    {
        "id": "gastronomie",
        "name": "Gastronomie",
        "icon": "s-gastro",
        "kurz": "Personal für Service und Küche.",
        "alt": "Restaurant-Team mit Köchen, Kellnern und Servicekräften",
        "lead": "In der Gastronomie zählt jede helfende Hand. Wir vermitteln Personal für Service, Küche und Ausschank – für Restaurants, Imbisse, Kantinen und Veranstaltungen.",
        "wen": [
            "Servicekräfte und Kellner",
            "Köche und Beiköche",
            "Küchenhilfen und Spülkräfte",
            "Thekenkräfte und Barkeeper",
        ],
        "einsatz": [
            "Service im Restaurant und bei Veranstaltungen",
            "Mithilfe in der Küche",
            "Ausschank, Theke und Buffet",
            "Unterstützung in der Saison",
        ],
    },
    {
        "id": "hotellerie",
        "name": "Hotellerie",
        "icon": "s-hotel",
        "kurz": "Rezeption, Housekeeping und Service im Hotel.",
        "alt": "Rezeptionistin und Rezeptionist an der Hotelrezeption",
        "lead": "Ein Hotel lebt von seinem Team. Wir vermitteln Personal für Rezeption, Housekeeping und Service – für Hotels, Pensionen und Ferienanlagen.",
        "wen": [
            "Rezeptionisten und Nachtportiers",
            "Zimmermädchen und Housekeeping-Kräfte",
            "Frühstücks- und Servicepersonal",
            "Hausmeister und Haustechnik",
        ],
        "einsatz": [
            "Empfang und Betreuung der Gäste",
            "Zimmerreinigung und Wäsche",
            "Frühstück und Bankett",
            "Unterstützung in der Saison",
        ],
    },
    {
        "id": "reinigung",
        "name": "Reinigung",
        "icon": "s-reinigung",
        "kurz": "Reinigungskräfte für Büro, Gebäude und Haushalt.",
        "alt": "Lächelndes Reinigungsteam mit Wischmopp, Eimer und Handschuhen",
        "lead": "Sauberkeit braucht Zuverlässigkeit. Wir vermitteln Reinigungskräfte für Gebäude, Büros, Praxen und Privathaushalte – für feste Einsätze oder zur Verstärkung.",
        "wen": [
            "Reinigungskräfte und Gebäudereiniger",
            "Unterhalts- und Büroreinigung",
            "Fensterputzer",
            "Haushaltshilfen",
        ],
        "einsatz": [
            "Büro-, Praxis- und Treppenhausreinigung",
            "Grund- und Bauendreinigung",
            "Reinigung in Hotels und Gastronomie",
            "Reinigung im Privathaushalt",
        ],
    },
    {
        "id": "industrie",
        "name": "Industrie",
        "icon": "s-industrie",
        "kurz": "Helfer und Fachkräfte für Werk und Halle.",
        "alt": "Lächelnder Industriearbeiter mit Schutzhelm in einer Werkshalle",
        "lead": "Wenn in der Halle Hände fehlen, steht die Arbeit. Wir vermitteln Industriehelfer und Fachkräfte für Metall, Montage und Instandhaltung.",
        "wen": [
            "Industriehelfer",
            "Schweißer und Schlosser",
            "Maschinen- und Anlagenführer",
            "Mitarbeiter für Montage und Instandhaltung",
        ],
        "einsatz": [
            "Mithilfe in Werk und Halle",
            "Metallbearbeitung und Schweißen",
            "Bedienen von Maschinen und Anlagen",
            "Verstärkung bei hoher Auslastung",
        ],
    },
    {
        "id": "produktion",
        "name": "Produktion",
        "icon": "s-produktion",
        "kurz": "Produktionshelfer für Fertigung und Verpackung.",
        "alt": "Mitarbeiterin an einer Produktionslinie in einer Großbäckerei",
        "lead": "Für eine laufende Produktion braucht es verlässliche Leute. Wir vermitteln Produktionshelfer für Fertigung, Lebensmittelherstellung und Verpackung.",
        "wen": [
            "Produktionshelfer",
            "Maschinenbediener",
            "Mitarbeiter für Verpackung und Kontrolle",
            "Helfer in der Lebensmittelproduktion",
        ],
        "einsatz": [
            "Arbeit an Produktionslinien",
            "Bestücken und Bedienen von Maschinen",
            "Verpacken, Etikettieren, Sichtkontrolle",
            "Schichtarbeit und Saisonspitzen",
        ],
    },
]


def esc(s: str) -> str:
    return html.escape(s, quote=True)


def srcset(name: str, gross: int, klein: int, ext: str) -> str:
    return f"assets/img/{name}-klein.{ext} {klein}w, assets/img/{name}.{ext} {gross}w"


def foto(name: str, alt: str, w: int, h: int, sizes: str, lazy: bool = True,
         gross: int = 1600, klein: int = 800) -> str:
    """Scharfes Foto: WebP mit JPG-Ersatz, je in Handy- und Bildschirmgröße."""
    laden = ' loading="lazy"' if lazy else ' fetchpriority="high"'
    return (
        f'<picture><source type="image/webp" srcset="{srcset(name, gross, klein, "webp")}" sizes="{sizes}">'
        f'<img src="assets/img/{name}.jpg" srcset="{srcset(name, gross, klein, "jpg")}" sizes="{sizes}" '
        f'width="{w}" height="{h}"{laden} decoding="async" alt="{esc(alt)}"></picture>'
    )


def picture(name: str, alt: str, lazy: bool = True, sizes: str = "(max-width: 860px) 100vw, 560px") -> str:
    return foto("branchen/" + name, alt, 1600, 1067, sizes, lazy)


# Team auf der Startseite: Bild-Datei (assets/img/team/), Name, Position
TEAM = [
    ("andreas-loch",        "Andreas Loch",        "Inhaber"),
    ("arif-oezen",          "Arif Özen",           "Vertrieb"),
    ("daniel-rusitschka",   "Daniel Rusitschka",   "Kundenservice"),
    ("jasmin-loch",         "Jasmin Loch",         "Buchhaltung & Finanzen"),
    ("patricia-rusitschka", "Patricia Rusitschka", "Recruiting"),
    ("bahar-mirau",         "Bahar Mirau",         "CTO"),
    ("tamara-doyle",        "Tamara Doyle",        "Vertrieb"),
    ("bianca-archire",      "Bianca Archire",      "Recruiting"),
    ("manuel-crenicianu",   "Manuel Crenicianu",   "Recruiting"),
    ("patrick-danes",       "Patrick Danes",       "Recruiting"),
]

BERATERIN = foto("beraterin", "Beraterin von Standard Plus begrüßt einen Kunden am Schreibtisch mit Handschlag",
                 1000, 1250, "(max-width: 900px) 92vw, 520px", gross=1000, klein=560)


def kontakt_link(paket: str = "", branche: str = "") -> str:
    """Link zum Anfrageformular; Paket oder Branche werden dort vorausgefüllt."""
    from urllib.parse import quote
    teile = [f"{k}={quote(v)}" for k, v in (("paket", paket), ("branche", branche)) if v]
    return "kontakt.html" + ("?" + "&".join(teile) if teile else "") + "#kontakt"


# Branchen der Unterseite → Auswahl im Anfrageformular
BRANCHEN_ALT = {b["id"]: b["alt"] for b in BRANCHEN}
FORM_BRANCHE = {"bau": "Bau", "landwirtschaft": "Landwirtschaft", "pferde": "Pferdebetriebe", "pflege": "Häusliche Pflege",
                "reinigung": "Reinigung", "hotellerie": "Hotellerie", "industrie": "Industrie", "produktion": "Produktion",
                "logistik": "Lager und Logistik", "gastronomie": "Gastronomie"}


# ---------------------------------------------------------------------------
# Wiederverwendete Bausteine
# ---------------------------------------------------------------------------
def branchen_teaser() -> str:
    cards = "\n".join(
        f'''        <a class="bcard reveal" href="branchen.html#{b["id"]}">
          <span class="bcard__img">{picture(b["id"], b["alt"], sizes="(max-width: 560px) 92vw, (max-width: 900px) 46vw, 360px")}</span>
          <span class="bcard__body"><strong>{esc(b["name"])}</strong><span>{esc(b["kurz"])}</span><em>Mehr erfahren<svg class="icon"><use href="#i-arrow"/></svg></em></span>
        </a>'''
        for b in BRANCHEN
    )
    return f'''<div class="bcards">
{cards}
      </div>'''


def branchen_detail() -> str:
    jump = "".join(f'<a href="#{b["id"]}">{esc(b["name"])}</a>' for b in BRANCHEN)
    out = [f'<nav class="jump reveal" aria-label="Branchen">{jump}</nav>']
    for b in BRANCHEN:
        wen = "".join(f'<li><svg class="icon"><use href="#i-check"/></svg>{esc(x)}</li>' for x in b["wen"])
        ein = "".join(f"<li>{esc(x)}</li>" for x in b["einsatz"])
        out.append(f'''
      <article class="branch reveal" id="{b["id"]}">
        <div class="branch__media">
          {picture(b["id"], b["alt"])}
          <span class="branch__badge"><svg class="icon"><use href="#{b["icon"]}"/></svg>{esc(b["name"])}</span>
        </div>
        <div class="branch__text">
          <h2>{esc(b["name"])}</h2>
          <p class="branch__lead">{esc(b["lead"])}</p>
          <div class="branch__cols">
            <div>
              <h3>Wen wir vermitteln</h3>
              <ul class="ticks ticks--tight">{wen}</ul>
            </div>
            <div>
              <h3>Typische Einsätze</h3>
              <ul class="dots">{ein}</ul>
            </div>
          </div>
          <a class="btn btn--primary" href="{kontakt_link(branche=FORM_BRANCHE[b["id"]])}">Personal für {esc(b["name"])} anfragen<svg class="icon" aria-hidden="true"><use href="#i-arrow"/></svg></a>
        </div>
      </article>''')
    return "\n".join(out)


STEPS = [
    ("i-chat", "Bedarf besprechen", "Wir klären Profil, Aufgaben und Einsatzbereich.",
     "Im ersten Gespräch – telefonisch oder per Nachricht – klären wir, wen Sie suchen: Aufgaben, Anzahl, Zeitraum, Einsatzort, Arbeitszeiten und was Ihnen besonders wichtig ist."),
    ("i-search", "Passende Kandidaten", "Wir suchen europaweit gezielt geeignete Mitarbeiter.",
     "Wir suchen gezielt nach Arbeitskräften, die zu Ihren Anforderungen passen, und wählen sorgfältig aus."),
    ("i-filecheck", "Auswahl & Vorstellung", "Sie erhalten passende Vorschläge und entscheiden.",
     "Sie bekommen passende Vorschläge. Die Entscheidung, wen Sie einstellen, treffen immer Sie."),
    ("i-handshake", "Betreuung danach", "Auch nach dem Start bleiben wir an Ihrer Seite.",
     "Nach dem Arbeitsbeginn bleiben wir Ihr fester Ansprechpartner – bei Fragen, Problemen oder wenn ein Austausch nötig ist."),
]


def steps(detail: bool = False) -> str:
    items = []
    for i, (ic, h, kurz, lang) in enumerate(STEPS, 1):
        text = lang if detail else kurz
        items.append(
            f'<li class="step reveal"><svg class="icon"><use href="#{ic}"/></svg><span class="step__no">0{i}</span>'
            f"<h3>{esc(h)}</h3><p>{esc(text)}</p></li>"
        )
    return '<ol class="steps">\n        ' + "\n        ".join(items) + "\n      </ol>"


def pakete(kompakt: bool = False) -> str:
    if kompakt:
        return f'''<div class="pricing">
        <article class="plan reveal">
          <span class="plan__icon"><svg class="icon"><use href="#i-users"/></svg></span>
          <h3>Abo-Paket</h3>
          <div class="plan__price"><strong>399&nbsp;€</strong><span>einmalig</span><em>+ 119&nbsp;€ / Monat</em><small class="plan__tax">alle Preise inkl. MwSt.</small></div>
          <ul class="plan__list">
            <li>Suche nach qualifizierten Arbeitskräften</li>
            <li>Fortlaufende Betreuung und Unterstützung</li>
            <li>Ersatz innerhalb von 84&nbsp;Stunden bei längeren Ausfällen</li>
          </ul>
          <a class="btn btn--glass btn--block" href="pakete.html#abo">Details ansehen</a>
        </article>
        <article class="plan plan--featured reveal">
          <span class="plan__icon"><svg class="icon"><use href="#i-file"/></svg></span>
          <h3>Paket für 899&nbsp;Euro</h3>
          <div class="plan__price"><strong>899&nbsp;€</strong><span>einmalig</span><small class="plan__tax">inkl. MwSt.</small></div>
          <ul class="plan__list">
            <li>Suche nach qualifizierten Arbeitskräften</li>
            <li>Austausch innerhalb von zwei Wochen, falls nötig</li>
          </ul>
          <a class="btn btn--glass btn--block" href="pakete.html#einmal">Details ansehen</a>
        </article>
      </div>
      <p class="swipe-hint">← Wischen, um beide Pakete zu sehen →</p>'''
    return f'''<div class="pricing">
        <article class="plan reveal" id="abo6">
          <span class="plan__icon"><svg class="icon"><use href="#i-users"/></svg></span>
          <h3>Betreuung 6&nbsp;Monate</h3>
          <div class="plan__price"><strong>399&nbsp;€</strong><span>einmalig</span><em style="flex-basis:100%">+ 119&nbsp;€ / Monat</em><small class="plan__tax">alle Preise inkl. MwSt.</small></div>
          <p class="plan__desc">Das Paket umfasst eine einmalige Vermittlungsgebühr von 399&nbsp;Euro sowie eine monatliche Betreuungsgebühr von 119&nbsp;Euro über eine Laufzeit von 6&nbsp;Monaten. Wir übernehmen die Suche nach qualifizierten Arbeitskräften sowie die fortlaufende Betreuung. Bei längeren Ausfällen sorgen wir innerhalb von 84&nbsp;Stunden für passenden Ersatz.</p>
          <ul class="plan__list">
            <li>Einmalige Vermittlungsgebühr: 399&nbsp;Euro</li>
            <li>Monatliche Betreuungsgebühr: 119&nbsp;Euro</li>
            <li>Laufzeit: 6&nbsp;Monate</li>
            <li>Suche nach qualifizierten Arbeitskräften</li>
            <li>Fortlaufende Betreuung und Unterstützung</li>
            <li>Ersatz innerhalb von 84&nbsp;Stunden bei längeren Ausfällen</li>
          </ul>
          <p class="plan__summary"><svg class="icon"><use href="#i-bulb"/></svg><span><b>Kurz zusammengefasst:</b> 6 Monate Betreuung mit schneller Ersatzlösung für Ihren Personalbedarf.</span></p>
          <a class="btn btn--yellow btn--block" href="kontakt.html?betreff=Anfrage%20Betreuung%206%20Monate%20%28399%20%E2%82%AC%20%2B%206%20%C3%97%20119%20%E2%82%AC%29">Betreuung 6 Monate anfragen</a>
        </article>

        <article class="plan reveal" id="abo12">
          <span class="plan__icon"><svg class="icon"><use href="#i-users"/></svg></span>
          <h3>Betreuung 12&nbsp;Monate</h3>
          <div class="plan__price"><strong>399&nbsp;€</strong><span>einmalig</span><em style="flex-basis:100%">+ 99&nbsp;€ / Monat</em><small class="plan__tax">alle Preise inkl. MwSt.</small></div>
          <p class="plan__desc">Das Paket umfasst eine einmalige Vermittlungsgebühr von 399&nbsp;Euro sowie eine monatliche Betreuungsgebühr von 99&nbsp;Euro über eine Laufzeit von 12&nbsp;Monaten. Wir übernehmen die Suche nach qualifizierten Arbeitskräften sowie die fortlaufende Betreuung. Bei längeren Ausfällen sorgen wir innerhalb von 84&nbsp;Stunden für passenden Ersatz.</p>
          <ul class="plan__list">
            <li>Einmalige Vermittlungsgebühr: 399&nbsp;Euro</li>
            <li>Monatliche Betreuungsgebühr: 99&nbsp;Euro</li>
            <li>Laufzeit: 12&nbsp;Monate</li>
            <li>Suche nach qualifizierten Arbeitskräften</li>
            <li>Fortlaufende Betreuung und Unterstützung</li>
            <li>Ersatz innerhalb von 84&nbsp;Stunden bei längeren Ausfällen</li>
          </ul>
          <p class="plan__summary"><svg class="icon"><use href="#i-bulb"/></svg><span><b>Kurz zusammengefasst:</b> 12 Monate Betreuung mit schneller Ersatzlösung für Ihren Personalbedarf.</span></p>
          <a class="btn btn--yellow btn--block" href="kontakt.html?betreff=Anfrage%20Betreuung%2012%20Monate%20%28399%20%E2%82%AC%20%2B%2012%20%C3%97%2099%20%E2%82%AC%29">Betreuung 12 Monate anfragen</a>
        </article>

        <article class="plan plan--featured reveal" id="einmal">
          <span class="plan__badge">Beliebteste Wahl</span>
          <span class="plan__icon"><svg class="icon"><use href="#i-file"/></svg></span>
          <h3>Übernahme-Paket</h3>
          <div class="plan__price"><strong>899&nbsp;€</strong><span>einmalig</span><em>3 Monate Betreuung kostenlos</em><small class="plan__tax">alle Preise inkl. MwSt.</small></div>
          <p class="plan__desc">Mit einer einmaligen Zahlung von 899&nbsp;Euro übernehmen wir die Suche nach qualifizierten Arbeitskräften, die Ihren Anforderungen entsprechen. Die ersten 3&nbsp;Monate betreuen wir kostenlos. Entspricht ein Mitarbeiter innerhalb von zwei Wochen nach Arbeitsbeginn nicht Ihren Erwartungen, bieten wir einen Austausch an. Danach fallen keine weiteren Gebühren an.</p>
          <ul class="plan__list">
            <li>Einmalige Zahlung: 899&nbsp;Euro</li>
            <li>Suche nach qualifizierten Arbeitskräften</li>
            <li>3 Monate Betreuung kostenlos</li>
            <li>Austausch innerhalb von zwei Wochen, falls nötig</li>
            <li>Danach keine weiteren Gebühren – der Mitarbeiter gehört ganz Ihnen</li>
          </ul>
          <p class="plan__summary"><svg class="icon"><use href="#i-bulb"/></svg><span><b>Kurz zusammengefasst:</b> Einmal zahlen, 3 Monate kostenlos betreut – danach gehört der Mitarbeiter ganz Ihnen.</span></p>
          <a class="btn btn--yellow btn--block" href="kontakt.html?betreff=Anfrage%20%C3%9Cbernahme-Paket%20%28899%20%E2%82%AC%20einmalig%29">Übernahme-Paket anfragen</a>
        </article>
      </div>
      <p class="swipe-hint">← Wischen, um alle Pakete zu sehen →</p>

      <p class="pricing-foot reveal"><svg class="icon"><use href="#i-bulb"/></svg><span><b style="color:#fff">Kurz zusammengefasst:</b> Drei transparente Pakete – individuell passend für Ihren Personalbedarf. Alle Preise sind Endpreise inkl. MwSt. Es gelten unsere <a href="agb.html">AGB</a>; Verbraucher haben ein <a href="widerruf.html">Widerrufsrecht</a>.</span></p>'''


FAQ = [
    ("Wie schnell sind Mitarbeiter verfügbar?",
     "Je nach Bedarf oft auch kurzfristig. Sprechen Sie uns an – wir sagen Ihnen ehrlich, was realistisch ist."),
    ("Woher kommen die Mitarbeiter?",
     "Wir vermitteln europaweit. Sie haben dabei immer einen festen, deutschsprachigen Ansprechpartner."),
    ("Wie läuft die Vermittlung ab?",
     "Anfrage, Auswahl, Vorstellung und Begleitung: Wir besprechen Ihren Bedarf, suchen gezielt passende Kandidaten, stellen Ihnen Vorschläge vor und betreuen Sie auch nach dem Start."),
    ("Was passiert, wenn ein Mitarbeiter nicht passt?",
     "Beim Übernahme-Paket für 899 Euro bieten wir innerhalb von zwei Wochen nach Arbeitsbeginn einen Austausch an. In den Betreuungspaketen (6 oder 12 Monate) sorgen wir bei längeren Ausfällen innerhalb von 84 Stunden für Ersatz."),
    ("Gibt es eine Probezeit?",
     "Das hängt vom Einsatz und der Vereinbarung zwischen Ihnen und dem Mitarbeiter ab."),
    ("Was kostet die Personalvermittlung bei Standard Plus?",
     "Es gibt drei Pakete, alle Preise inklusive MwSt.: Betreuung 6 Monate für 399 Euro einmalig + 119 Euro pro Monat, Betreuung 12 Monate für 399 Euro einmalig + 99 Euro pro Monat, jeweils inklusive Ersatz innerhalb von 84 Stunden bei längeren Ausfällen, sowie das Übernahme-Paket für 899 Euro einmalig mit 3 Monaten kostenloser Betreuung und Austausch innerhalb von zwei Wochen – danach fallen keine weiteren Gebühren an."),
    ("Für welche Branchen vermitteln Sie Personal?",
     "Für zehn Branchen: Landwirtschaft, Pferdebetriebe, häusliche Pflege, Bau & Handwerk, Gastronomie, Hotellerie, Reinigung, Lager & Logistik, Industrie und Produktion."),
    ("Muss ich Geld im Voraus bezahlen?",
     "Nein. Wir verlangen kein Geld im Voraus und arbeiten mit klaren Verträgen und Rechnungen."),
    ("Wo hat Standard Plus seinen Sitz?",
     "Unser Sitz ist in Ludwigsburg (Baden-Württemberg), Heilbronner Straße 142. Wir vermitteln Arbeitskräfte aus ganz Europa an Betriebe in Deutschland."),
    ("Wann erreiche ich Sie?",
     f"An 6 Tagen pro Woche – telefonisch unter {TEL} oder per E-Mail an {MAIL}."),
]


def faq_html() -> str:
    def answer(a: str) -> str:
        a = re.sub(r"(\d) Monat", r"\1&nbsp;Monat", esc(a).replace(" Euro", "&nbsp;Euro").replace(" Stunden", "&nbsp;Stunden"))
        a = a.replace(TEL, f'<a href="{TEL_LINK}">{TEL}</a>').replace(MAIL, f'<a href="mailto:{MAIL}">{MAIL}</a>')
        return a
    items = "\n".join(
        f'''        <details>
          <summary>{esc(q)}</summary>
          <div class="answer"><p>{answer(a)}</p></div>
        </details>'''
        for q, a in FAQ
    )
    return f'<div class="faq n-faq reveal">\n{items}\n      </div>'


def page_hero(kicker: str, h1: str, lead: str, crumb: str) -> str:
    return f'''  <section class="page-hero">
    <div class="container">
      <p class="crumb"><a href="index.html">Start</a> <span aria-hidden="true">›</span> <span aria-current="page">{esc(crumb)}</span></p>
      <p class="n-eyebrow">{esc(kicker)}</p>
      <h1>{h1}</h1>
      <p class="page-hero__lead">{lead}</p>
    </div>
  </section>'''


# ---------------------------------------------------------------------------
# Strukturierte Daten (schema.org)
# ---------------------------------------------------------------------------
ORG_ID = DOMAIN + "/#organisation"


def org_graph() -> list:
    org = {
        "@type": ["EmploymentAgency", "Organization"],
        "@id": ORG_ID,
        "name": "Standard Plus Personalvermittlung",
        "alternateName": ["Standard Plus", "Standard AAA+"],
        "description": "Personalvermittlung europaweit: Standard Plus vermittelt Hilfs- und Fachkräfte aus ganz Europa für zehn Branchen: Landwirtschaft, Pferdebetriebe, Pflege & Betreuung, Bau & Handwerk, Gastronomie, Hotellerie, Reinigung, Lager & Logistik, Industrie und Produktion – mit persönlicher Betreuung vor, während und nach dem Arbeitsbeginn.",
        "slogan": "Persönlich. Erreichbar. Zuverlässig.",
        "url": DOMAIN + "/",
        "logo": {"@type": "ImageObject", "url": DOMAIN + "/assets/img/logo.png", "width": 600, "height": 200},
        "image": DOMAIN + "/assets/img/og-image.jpg",
        "telephone": "+49 152 28986993",
        "email": MAIL,
        "address": {"@type": "PostalAddress", "streetAddress": "Heilbronner Straße 142", "postalCode": "71634",
                    "addressLocality": "Ludwigsburg", "addressRegion": "Baden-Württemberg", "addressCountry": "DE"},
        "areaServed": [{"@type": "City", "name": "Ludwigsburg"}, {"@type": "City", "name": "Stuttgart"},
                       {"@type": "State", "name": "Baden-Württemberg"}, {"@type": "Country", "name": "Deutschland"}],
        "knowsLanguage": ["de"],
        "knowsAbout": ["Personalvermittlung", "Arbeitsvermittlung", "Arbeitskräfte aus Europa", "Erntehelfer", "Pferdepfleger",
                       "Melker", "Bauhelfer", "Pflegekräfte", "Betreuungskräfte", "Lagerhelfer", "Kommissionierer",
                       "Servicekräfte", "Küchenhilfen", "Housekeeping",
                       "Reinigungskräfte", "Rezeptionisten", "Industriehelfer", "Produktionshelfer", "Maschinenbediener"],
        "contactPoint": {"@type": "ContactPoint", "telephone": "+49 152 28986993", "email": MAIL,
                         "contactType": "customer service", "availableLanguage": ["German"], "areaServed": "DE"},
        "hasOfferCatalog": {"@id": DOMAIN + "/pakete.html#pakete"},
    }
    website = {"@type": "WebSite", "@id": DOMAIN + "/#website", "url": DOMAIN + "/",
               "name": "Standard Plus Personalvermittlung", "inLanguage": "de-DE", "publisher": {"@id": ORG_ID}}
    return [org, website]


def webpage(url: str, name: str) -> dict:
    return {"@type": "WebPage", "@id": url + "#webseite", "url": url, "name": name,
            "isPartOf": {"@id": DOMAIN + "/#website"}, "about": {"@id": ORG_ID}, "inLanguage": "de-DE"}


def breadcrumb(url: str, name: str) -> dict:
    return {"@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Start", "item": DOMAIN + "/"},
        {"@type": "ListItem", "position": 2, "name": name, "item": url}]}


def catalog(gesamt: bool = False) -> dict:
    daten = {
        "@type": "OfferCatalog", "@id": DOMAIN + "/pakete.html#pakete", "name": "Pakete von Standard Plus",
        "itemListElement": [
            {"@type": "Offer", "name": "Betreuung 6 Monate", "url": DOMAIN + "/pakete.html#abo6",
             "description": "Suche nach qualifizierten Arbeitskräften, fortlaufende Betreuung über 6 Monate und Ersatz innerhalb von 84 Stunden bei längeren Ausfällen. 399 Euro einmalig + 119 Euro pro Monat.",
             "priceCurrency": "EUR", "seller": {"@id": ORG_ID},
             "priceSpecification": [
                 {"@type": "UnitPriceSpecification", "name": "Einmalige Vermittlungsgebühr", "price": "399", "priceCurrency": "EUR", "valueAddedTaxIncluded": True},
                 {"@type": "UnitPriceSpecification", "name": "Monatliche Betreuungsgebühr", "price": "119", "priceCurrency": "EUR", "valueAddedTaxIncluded": True,
                  "billingDuration": 6, "referenceQuantity": {"@type": "QuantitativeValue", "value": 1, "unitCode": "MON"}}]},
            {"@type": "Offer", "name": "Betreuung 12 Monate", "url": DOMAIN + "/pakete.html#abo12",
             "description": "Suche nach qualifizierten Arbeitskräften, fortlaufende Betreuung über 12 Monate und Ersatz innerhalb von 84 Stunden bei längeren Ausfällen. 399 Euro einmalig + 99 Euro pro Monat.",
             "priceCurrency": "EUR", "seller": {"@id": ORG_ID},
             "priceSpecification": [
                 {"@type": "UnitPriceSpecification", "name": "Einmalige Vermittlungsgebühr", "price": "399", "priceCurrency": "EUR", "valueAddedTaxIncluded": True},
                 {"@type": "UnitPriceSpecification", "name": "Monatliche Betreuungsgebühr", "price": "99", "priceCurrency": "EUR", "valueAddedTaxIncluded": True,
                  "billingDuration": 12, "referenceQuantity": {"@type": "QuantitativeValue", "value": 1, "unitCode": "MON"}}]},
            {"@type": "Offer", "name": "Übernahme-Paket", "url": DOMAIN + "/pakete.html#einmal",
             "description": "Einmalige Zahlung von 899 Euro: Suche nach qualifizierten Arbeitskräften, 3 Monate Betreuung kostenlos, Austausch innerhalb von zwei Wochen, falls nötig. Danach keine weiteren Gebühren.",
             "price": "899", "priceCurrency": "EUR", "seller": {"@id": ORG_ID},
             "priceSpecification": {"@type": "PriceSpecification", "price": "899", "priceCurrency": "EUR", "valueAddedTaxIncluded": True}},
        ],
    }
    if gesamt:
        for angebot, summe in zip(daten["itemListElement"], ("1113", "1587")):
            angebot["price"] = summe
            angebot["description"] += f" Gesamtpreis über die Laufzeit: {summe} Euro inkl. MwSt."
    return daten


def services() -> list:
    return [{"@type": "Service", "@id": f"{DOMAIN}/branchen.html#{b['id']}", "name": f"Personalvermittlung {b['name']}",
             "serviceType": "Personalvermittlung", "description": b["lead"], "provider": {"@id": ORG_ID},
             "areaServed": {"@type": "Country", "name": "Deutschland"}, "url": f"{DOMAIN}/branchen.html#{b['id']}"}
            for b in BRANCHEN]


def faq_page(url: str) -> dict:
    return {"@type": "FAQPage", "@id": url + "#faq", "url": url, "isPartOf": {"@id": DOMAIN + "/#website"},
            "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in FAQ]}


# ---------------------------------------------------------------------------
# Seitengerüst
# ---------------------------------------------------------------------------
def read(name: str) -> str:
    with open(os.path.join(ROOT, name), encoding="utf-8") as f:
        return f.read()


def version(path: str) -> str:
    """Kurzer Fingerabdruck einer Datei, damit Browser nach Änderungen
    die neue Fassung laden (Lovable speichert /assets/* ein Jahr zwischen)."""
    with open(os.path.join(ROOT, path), "rb") as f:
        return hashlib.sha1(f.read()).hexdigest()[:8]


def sprite() -> str:
    s = read("werkzeuge/inhalte/_icons.svg")
    return s.strip()


LOGO = '''<span class="logo__row">
        <span class="logo__word">STANDARD</span>
        <span class="logo__plus">PLUS<svg viewBox="0 0 36 30" aria-hidden="true"><path class="chev-a" d="M0 0h3l12 15L3 30H0z"/><path class="chev-c" d="M17 0h7l12 15-12 15h-7l12-15z"/><path class="chev-b" d="M9 0h7l12 15-12 15H9l12-15z"/></svg></span>
      </span>
      <span class="logo__sub">Personalvermittlung</span>'''


CUR = ' aria-current="page"'


def header(active: str, nav: list | None = None, cta: str = "kontakt.html#kontakt", ueber: bool = False) -> str:
    links = "\n".join(
        f'      <a href="{href}"{CUR if href == active else ""}>{label}</a>' for href, label in (nav or NAV)
    )
    return f'''<header class="site-header{' site-header--over' if ueber else ''}">
  <div class="container">
    <a class="logo" href="index.html" aria-label="Standard Plus Personalvermittlung – zur Startseite">
      {LOGO}
    </a>
    <nav class="nav" id="nav" aria-label="Hauptnavigation">
{links}
    </nav>
    <div class="header-cta">
      <a class="header-tel" href="{TEL_LINK}"><svg class="icon"><use href="#i-phone"/></svg>{TEL}</a>
      <a class="btn btn--primary" href="{cta}">Anfragen</a>
      <button class="nav-toggle" type="button" aria-controls="nav" aria-expanded="false" aria-label="Menü öffnen">
        <svg class="icon"><use href="#i-menu"/></svg>
      </button>
    </div>
  </div>
</header>'''


def cta_strip() -> str:
    return f'''<!-- ================= Abschluss (Balken unten) ================= -->
<section class="cta-strip" aria-labelledby="cta-titel">
  <div class="container">
    <div class="cta-strip__text">
      <h2 id="cta-titel">Personal gesucht?</h2>
      <p>Persönlich. Erreichbar. Zuverlässig. Wir melden uns schnellstmöglich bei Ihnen.</p>
    </div>
    <div class="cta-strip__actions">
      <a class="btn btn--yellow btn--lg" href="kontakt.html#kontakt" data-anfrage>Unverbindlich anfragen<svg class="icon"><use href="#i-arrow"/></svg></a>
      <a class="btn btn--line" href="{TEL_LINK}"><svg class="icon"><use href="#i-phone"/></svg>{TEL}</a>
      <a class="btn btn--wa" href="{WA_LINK}" target="_blank" rel="noopener"><svg class="icon"><use href="#i-whatsapp"/></svg>WhatsApp</a>
      <a class="btn btn--line" href="mailto:{MAIL}?subject=Anfrage%20Personal"><svg class="icon"><use href="#i-mail"/></svg>{MAIL}</a>
    </div>
  </div>
</section>'''


def footer() -> str:
    seiten = "\n".join(f'          <li><a href="{h}">{l}</a></li>' for h, l in NAV)
    return f'''<footer class="site-footer">
  <div class="container">
    <div class="footer__grid">
      <div>
        <a class="logo" href="index.html" aria-label="Standard Plus – zur Startseite">
      {LOGO}
        </a>
        <p class="footer__claim">Personalvermittlung europaweit. Qualifizierte Menschen. Starke Unternehmen. Persönliche Betreuung.</p>
      </div>
      <div>
        <h2 class="footer__h">Seiten</h2>
        <ul>
{seiten}
        </ul>
      </div>
      <div>
        <h2 class="footer__h">Kontakt</h2>
        <ul>
          <li><a href="{TEL_LINK}">{TEL}</a></li>
          <li><a href="mailto:{MAIL}">{MAIL}</a></li>
          <li>Heilbronner Straße 142<br>71634 Ludwigsburg</li>
        </ul>
      </div>
      <div>
        <h2 class="footer__h">Rechtliches</h2>
        <ul>
          <li><a href="impressum.html">Impressum</a></li>
          <li><a href="agb.html">AGB</a></li>
          <li><a href="datenschutz.html">Datenschutz</a></li>
          <li><a href="widerruf.html">Widerrufsbelehrung</a></li>
        </ul>
      </div>
    </div>
    <div class="footer__bottom">
      <span>© <span data-year>2026</span> Standard Plus Personalvermittlung</span>
      <nav aria-label="Rechtliches"><a href="impressum.html">Impressum</a><a href="agb.html">AGB</a><a href="datenschutz.html">Datenschutz</a><a href="widerruf.html">Widerruf</a></nav>
    </div>
  </div>
</footer>

<a class="fab" href="{TEL_LINK}" aria-label="Standard Plus anrufen"><svg class="icon"><use href="#i-phone"/></svg></a>'''


def head(file: str, title: str, desc: str, robots: str, ld: list, og_title: str | None = None, preload_hero: bool = False,
         css: tuple = ()) -> str:
    mehr_css = "".join(f'\n  <link rel="stylesheet" href="{c}?v={version(c)}">' for c in css)
    url = DOMAIN + "/" if file == "index.html" else f"{DOMAIN}/{file}"
    ld_json = json.dumps({"@context": "https://schema.org", "@graph": ld}, ensure_ascii=False, indent=2)
    preload = ('\n  <link rel="preload" as="image" type="image/webp" imagesrcset="assets/img/team-klein.webp 800w, assets/img/team.webp 1344w" imagesizes="100vw" fetchpriority="high">'
               if preload_hero else "")
    return f'''<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{esc(title)}</title>
  <meta name="description" content="{esc(desc)}">
  <meta name="robots" content="{robots}">
  <link rel="canonical" href="{url}">
  <link rel="alternate" hreflang="de" href="{url}">
  <link rel="alternate" hreflang="x-default" href="{url}">
  <meta name="theme-color" content="#13737b">
  <meta name="format-detection" content="telephone=no">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Standard Plus Personalvermittlung">
  <meta property="og:locale" content="de_DE">
  <meta property="og:url" content="{url}">
  <meta property="og:title" content="{esc(og_title or title)}">
  <meta property="og:description" content="{esc(desc)}">
  <meta property="og:image" content="{DOMAIN}/assets/img/og-image.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="{DOMAIN}/assets/img/og-image.jpg">
  <meta name="geo.region" content="DE-BW">
  <meta name="geo.placename" content="Ludwigsburg">
  <link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">
  <link rel="icon" href="assets/img/icon-192.png" type="image/png" sizes="192x192">
  <link rel="apple-touch-icon" href="assets/img/apple-touch-icon.png">
  <link rel="manifest" href="site.webmanifest">
  <link rel="alternate" type="text/markdown" href="llms.txt" title="Standard Plus – Zusammenfassung für KI-Assistenten">{preload}
  <link rel="preload" href="assets/fonts/inter-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="assets/fonts/montserrat-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="assets/css/style.css?v={version("assets/css/style.css")}">{mehr_css}
  <script>document.documentElement.classList.remove('no-js');</script>
  <!-- Strukturierte Daten (schema.org) – erzeugt von werkzeuge/seiten_bauen.py -->
  <script type="application/ld+json">
{ld_json}
  </script>
</head>'''


def build(file: str, title: str, desc: str, body: str, ld: list, robots: str = "index, follow, max-image-preview:large, max-snippet:-1",
          strip: bool = True, og_title: str | None = None, preload_hero: bool = False,
          nav: list | None = None, cta: str = "kontakt.html#kontakt", ueber: bool = False,
          css: tuple = ("assets/css/start.css", "assets/css/apple.css"), js: tuple = ("assets/js/start.js",)) -> None:
    mehr_js = "".join(f'\n<script src="{j}?v={version(j)}" defer></script>' for j in js)
    page = f'''<!doctype html>
<html lang="de" class="no-js">
{head(file, title, desc, robots, ld, og_title, preload_hero, css)}
<body class="{'is-start' if file == 'index.html' else 'is-sub'}">

{sprite()}

<a class="skip-link" href="#inhalt">Zum Inhalt springen</a>

{header(file, nav, cta, ueber)}

<main id="inhalt">
{body}
</main>

{cta_strip() if strip else ""}

{footer()}

{anfrage_dialog(cta)}
<script src="assets/js/main.js?v={version("assets/js/main.js")}" defer></script>{mehr_js}
</body>
</html>
'''
    page = re.sub(r"\n{3,}", "\n\n", page)
    with open(os.path.join(ROOT, file), "w", encoding="utf-8") as f:
        f.write(page)
    print("geschrieben:", file)


def sub(file: str, name: str) -> list:
    url = f"{DOMAIN}/{file}"
    return org_graph() + [webpage(url, name), breadcrumb(url, name)]


# ---------------------------------------------------------------------------
# Bausteine der neuen Gestaltung (Startseite und Unterseiten)
# ---------------------------------------------------------------------------
start_nav = [("#branchen", "Branchen"), ("#ablauf", "Ablauf"), ("#pakete", "Pakete"),
             ("#team", "Team"), ("#fragen", "Fragen"), ("#kontakt", "Kontakt")]

start_branchen = [
    ("landwirtschaft", "s-agrar", "Landwirtschaft", "Erntehelfer, Stallhelfer und Melker für Ihren Hof."),
    ("pflege", "s-pflege", "Häusliche Pflege", "Betreuungskräfte, die im Alltag zu Hause helfen."),
    ("bau", "s-bau", "Bau", "Helfer und Fachkräfte für Baustelle und Handwerk."),
    ("gastronomie", "s-gastro", "Gastronomie", "Personal für Küche, Service und Housekeeping."),
    ("logistik", "s-logistik", "Lager und Logistik", "Lagerhelfer und Kommissionierer für Lager und Versand."),
]
n_tiles = "\n".join(
    f'''        <li class="reveal" style="--i:{i}"><a class="n-tile" href="branchen.html#{bid}">
      <span class="n-tile__icon"><svg class="icon" aria-hidden="true"><use href="#{icon}"/></svg></span>
      <span class="n-tile__text"><strong>{esc(name)}</strong><span>{esc(satz)}</span></span>
      <svg class="icon n-tile__go" aria-hidden="true"><use href="#i-arrow"/></svg>
    </a></li>'''
    for i, (bid, icon, name, satz) in enumerate(start_branchen)
)

start_schritte = [
    ("Anfrage", "Sie rufen an oder schreiben uns. Ganz unverbindlich.",
     "Sie rufen an, schreiben per WhatsApp oder füllen das Formular aus. Das ist unverbindlich."),
    ("Bedarf klären", "Wir besprechen, wen Sie brauchen: Aufgaben, Anzahl, Zeitraum.",
     "Im ersten Gespräch klären wir, wen Sie suchen: Aufgaben, Anzahl, Zeitraum, Einsatzort, Arbeitszeiten und was Ihnen besonders wichtig ist."),
    ("Suchen und prüfen", "Wir suchen passende Kandidaten und prüfen sie selbst.",
     "Wir suchen gezielt nach Arbeitskräften, die zu Ihren Anforderungen passen, und wählen sorgfältig aus. Sie bekommen passende Vorschläge."),
    ("Arbeitskraft startet", "Sie entscheiden. Dann beginnt Ihr neuer Mitarbeiter.",
     "Die Entscheidung, wen Sie einstellen, treffen immer Sie. Danach beginnt Ihr neuer Mitarbeiter bei Ihnen."),
    ("Betreuung und Ersatz", "Wir bleiben für Sie da. Fällt jemand aus, kümmern wir uns um Ersatz.",
     "Nach dem Arbeitsbeginn bleiben wir Ihr fester Ansprechpartner – bei Fragen, Problemen oder wenn ein Austausch nötig ist."),
]


def n_schritte(lang: bool = False) -> str:
    return "\n".join(
        f'''        <li class="n-step" style="--i:{i}"><span class="n-step__no" aria-hidden="true">{i + 1}</span><div><h3>{esc(h)}</h3><p>{esc(ausf if lang else kurz)}</p></div></li>'''
        for i, (h, kurz, ausf) in enumerate(start_schritte)
    )


n_steps = n_schritte()


def n_checks(punkte: list) -> str:
    return "\n".join(f'            <li><svg class="icon" aria-hidden="true"><use href="#i-check"/></svg>{pkt}</li>' for pkt in punkte)

betreuung = ["Suche nach qualifizierten Arbeitskräften", "Fortlaufende Betreuung",
             "Ersatz innerhalb von 84&nbsp;Stunden bei längeren Ausfällen"]

PAKETE = [
    {"id": "abo6", "farbe": "petrol", "name": "Betreuung 6&nbsp;Monate", "preis": "399", "zusatz": "einmalig",
     "sub": "<b>+ 119&nbsp;€ / Monat</b><br>Laufzeit 6&nbsp;Monate", "punkte": betreuung, "knopf": "6 Monate anfragen",
     "paket": "Betreuung 6 Monate (399 € + 119 € / Monat)",
     "text": "Das Paket umfasst eine einmalige Vermittlungsgebühr von 399&nbsp;Euro sowie eine monatliche Betreuungsgebühr von 119&nbsp;Euro über eine Laufzeit von 6&nbsp;Monaten. Wir übernehmen die Suche nach qualifizierten Arbeitskräften sowie die fortlaufende Betreuung. Bei längeren Ausfällen sorgen wir innerhalb von 84&nbsp;Stunden für passenden Ersatz."},
    {"id": "abo12", "farbe": "petrol", "name": "Betreuung 12&nbsp;Monate", "preis": "399", "zusatz": "einmalig",
     "sub": "<b>+ 99&nbsp;€ / Monat</b><br>Laufzeit 12&nbsp;Monate", "punkte": betreuung, "knopf": "12 Monate anfragen",
     "paket": "Betreuung 12 Monate (399 € + 99 € / Monat)",
     "text": "Das Paket umfasst eine einmalige Vermittlungsgebühr von 399&nbsp;Euro sowie eine monatliche Betreuungsgebühr von 99&nbsp;Euro über eine Laufzeit von 12&nbsp;Monaten. Wir übernehmen die Suche nach qualifizierten Arbeitskräften sowie die fortlaufende Betreuung. Bei längeren Ausfällen sorgen wir innerhalb von 84&nbsp;Stunden für passenden Ersatz."},
    {"id": "einmal", "farbe": "gelb", "name": "Übernahme-Paket", "preis": "899", "zusatz": "einmalig", "badge": "Beliebteste Wahl",
     "sub": "3&nbsp;Monate Betreuung kostenlos<br>(im Wert von 357&nbsp;€)", "knopf": "Übernahme-Paket anfragen",
     "punkte": ["Suche nach qualifizierten Arbeitskräften", "3&nbsp;Monate Betreuung kostenlos",
                "Austausch innerhalb von zwei Wochen, falls nötig", "Danach keine weiteren Gebühren"],
     "paket": "Übernahme-Paket (899 € einmalig)",
     "text": "Mit einer einmaligen Zahlung von 899&nbsp;Euro übernehmen wir die Suche nach qualifizierten Arbeitskräften, die Ihren Anforderungen entsprechen. Die ersten 3&nbsp;Monate betreuen wir kostenlos. Entspricht ein Mitarbeiter innerhalb von zwei Wochen nach Arbeitsbeginn nicht Ihren Erwartungen, bieten wir einen Austausch an. Danach fallen keine weiteren Gebühren an."},
]


def paket_karten(seite: bool = False) -> str:
    """Drei farbige Paket-Karten. seite=True: Pakete-Seite (mit Beschreibung, Sprungmarken, Link zur Kontaktseite)."""
    karten = []
    for i, pk in enumerate(PAKETE):
        hid = f"n-plan-{pk['id']}"
        badge = f'\n          <p class="n-plan__badge">{pk["badge"]}</p>' if pk.get("badge") else ""
        text = f'\n          <p class="n-plan__text">{pk["text"]}</p>' if seite else ""
        ziel = kontakt_link(paket=pk["paket"]) if seite else "#kontakt"
        knopf = "btn--dark" if pk["farbe"] == "gelb" else "btn--white"
        anker = f' id="{pk["id"]}"' if seite else ""
        karten.append(f'''        <div class="n-plan-wrap reveal" style="--i:{i}"{anker}><article class="n-plan n-plan--{pk["farbe"]}" aria-labelledby="{hid}">{badge}
          <h3 id="{hid}">{pk["name"]}</h3>
          <p class="n-plan__price"><strong><span data-count="{pk["preis"]}">{pk["preis"]}</span>&nbsp;€</strong> <span>{pk["zusatz"]}</span></p>
          <p class="n-plan__sub">{pk["sub"]}</p>{text}
          <ul class="n-checks">
{n_checks(pk["punkte"])}
          </ul>
          <a class="btn {knopf} btn--block" href="{ziel}" data-paket="{pk["paket"]}">{pk["knopf"]}</a>
        </article></div>''')
    return '<div class="n-plans">\n' + "\n".join(karten) + "\n      </div>"


# Persönliche Sätze: vorläufig aus der Rolle abgeleitet – bitte durch eigene Sätze der Mitarbeiter ersetzen
team_saetze = {
    "andreas-loch": "Leitet Standard Plus und steht für jede Vermittlung persönlich ein.",
    "arif-oezen": "Berät Sie zu den Paketen und findet die passende Lösung für Ihren Betrieb.",
    "daniel-rusitschka": "Hilft Ihnen weiter, wenn im Alltag Fragen auftauchen.",
    "jasmin-loch": "Sorgt für klare Verträge und saubere Rechnungen.",
    "patricia-rusitschka": "Sucht Arbeitskräfte, die zu Ihren Aufgaben passen.",
    "bahar-mirau": "Verantwortet Technik und Abläufe im Hintergrund.",
    "tamara-doyle": "Nimmt Ihre Anfrage auf und klärt mit Ihnen den Bedarf.",
    "bianca-archire": "Spricht mit Bewerbern und prüft, wer wirklich passt.",
    "manuel-crenicianu": "Begleitet Bewerber von der ersten Nachricht bis zum Arbeitsbeginn.",
    "patrick-danes": "Hält Kontakt zu den Arbeitskräften, auch nach dem Start.",
}
n_team = "\n".join(
    f'''        <li class="n-member reveal" style="--i:{i % 5}"><figure>{foto("team/" + bild, f"{name}, {rolle} bei Standard Plus", 720, 900, "(max-width: 560px) 44vw, (max-width: 1000px) 30vw, 200px", gross=720, klein=400)}<figcaption><strong>{esc(name)}</strong><span class="n-member__rolle">{esc(rolle)}</span><span class="n-member__satz">{esc(team_saetze[bild])}</span></figcaption></figure></li>'''
    for i, (bild, name, rolle) in enumerate(TEAM)
)

start_faq = [
    ("Wie läuft eine Vermittlung ab?",
     "Sie fragen an, wir klären Ihren Bedarf. Dann suchen und prüfen wir passende Kandidaten. Sie entscheiden, wer bei Ihnen anfängt. Nach dem Start bleiben wir Ihr Ansprechpartner."),
    ("Was kostet die Vermittlung?",
     "Es gibt drei Pakete: Betreuung 6 Monate für 399 Euro einmalig plus 119 Euro pro Monat, Betreuung 12 Monate für 399 Euro einmalig plus 99 Euro pro Monat und das Übernahme-Paket für 899 Euro einmalig. Alle Preise sind inklusive MwSt."),
    ("Muss ich Geld im Voraus bezahlen?",
     "Nein. Wir verlangen kein Geld im Voraus und arbeiten mit klaren Verträgen und Rechnungen."),
    ("Was passiert, wenn ein Mitarbeiter ausfällt oder nicht passt?",
     "In den Betreuungspaketen sorgen wir bei längeren Ausfällen innerhalb von 84 Stunden für Ersatz. Beim Übernahme-Paket tauschen wir innerhalb von zwei Wochen nach Arbeitsbeginn aus, falls nötig."),
    ("Wie schnell sind Mitarbeiter verfügbar?",
     "Je nach Bedarf oft auch kurzfristig. Sprechen Sie uns an – wir sagen Ihnen ehrlich, was realistisch ist."),
    ("Wann erreiche ich Sie?",
     f"An 6 Tagen pro Woche – telefonisch unter {TEL} oder per E-Mail an {MAIL}."),
]

def n_antwort(a: str) -> str:
    a = re.sub(r"(\d) Monat", r"\1&nbsp;Monat", esc(a).replace(" Euro", "&nbsp;Euro").replace(" Stunden", "&nbsp;Stunden"))
    return a.replace(TEL, f'<a href="{TEL_LINK}">{TEL}</a>').replace(MAIL, f'<a href="mailto:{MAIL}">{MAIL}</a>')

n_faq = "\n".join(
    f'''        <details>
      <summary>{esc(q)}</summary>
      <div class="answer"><p>{n_antwort(a)}</p></div>
    </details>'''
    for q, a in start_faq
)
n_optionen = "\n".join(f'                <option>{esc(name)}</option>' for _b, _i, name, _s in start_branchen)



def kontakt_block(h: str = "h2", titel: str = "Jetzt anfragen", tuerkis: bool = False) -> str:
    """Anfrageformular mit Kontaktdaten – Startseite und Kontaktseite."""
    return f'''  <section class="n-sec n-contact{' a-contact--tuerkis' if tuerkis else ''}" id="kontakt" aria-labelledby="n-kontakt">
    <div class="container n-contact__grid">
      <div class="n-contact__info reveal">
        <{h} id="n-kontakt">{titel}</{h}>
        <p>Sagen Sie uns, wen Sie suchen. Wir senden Ihnen passende Profile an Ihre E-Mail-Adresse.</p>
        <ul class="n-ways">
          <li><a href="{TEL_LINK}"><svg class="icon" aria-hidden="true"><use href="#i-phone"/></svg><span><small>Telefon</small>{TEL}</span></a></li>
          <li><a href="{WA_LINK}" target="_blank" rel="noopener"><svg class="icon" aria-hidden="true"><use href="#i-whatsapp"/></svg><span><small>WhatsApp</small>Nachricht schreiben</span></a></li>
          <li><a href="mailto:{MAIL}"><svg class="icon" aria-hidden="true"><use href="#i-mail"/></svg><span><small>E-Mail</small>{MAIL}</span></a></li>
          <li><span class="n-ways__plain"><svg class="icon" aria-hidden="true"><use href="#i-pin"/></svg><span><small>Adresse</small>Heilbronner Straße 142, 71634 Ludwigsburg</span></span></li>
          <li><span class="n-ways__plain"><svg class="icon" aria-hidden="true"><use href="#i-clock"/></svg><span><small>Erreichbar</small>An 6 Tagen pro Woche</span></span></li>
        </ul>
      </div>
      <form class="n-form reveal" id="anfrage" novalidate data-mailto="{MAIL}">
        <div class="n-form__grid">
          <div class="field">
            <label for="a-name">Name <span class="req">*</span></label>
            <input id="a-name" name="name" type="text" autocomplete="name" required>
            <span class="field__error" aria-live="polite"></span>
          </div>
          <div class="field">
            <label for="a-firma">Firma</label>
            <input id="a-firma" name="firma" type="text" autocomplete="organization">
            <span class="field__error"></span>
          </div>
          <div class="field">
            <label for="a-tel">Telefon <span class="req">*</span></label>
            <input id="a-tel" name="telefon" type="tel" autocomplete="tel" inputmode="tel" required>
            <span class="field__error" aria-live="polite"></span>
          </div>
          <div class="field">
            <label for="a-email">E-Mail <span class="req">*</span></label>
            <input id="a-email" name="email" type="email" autocomplete="email" inputmode="email" required aria-describedby="a-email-hinweis">
            <span class="field__hint" id="a-email-hinweis">Hierhin senden wir Ihnen passende Profile.</span>
            <span class="field__error" aria-live="polite"></span>
          </div>
          <div class="field">
            <label for="a-branche">Branche <span class="req">*</span></label>
            <div class="n-combo">
              <input id="a-branche" name="branche" type="text" required autocomplete="off" placeholder="Tippen oder auswählen" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="a-branche-liste">
              <ul class="n-combo__list" id="a-branche-liste" role="listbox" aria-label="Branchen" hidden></ul>
            </div>
            <span class="field__error" aria-live="polite"></span>
          </div>
          <div class="field">
            <label for="a-gesucht">Wen suchen Sie? <span class="req">*</span></label>
            <div class="n-combo">
              <input id="a-gesucht" name="gesucht" type="text" required autocomplete="off" placeholder="z. B. Küchenhilfe, Bauhelfer" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="a-gesucht-liste">
              <ul class="n-combo__list" id="a-gesucht-liste" role="listbox" aria-label="Berufe" hidden></ul>
            </div>
            <span class="field__error" aria-live="polite"></span>
          </div>
          <div class="field field--full">
            <label for="a-nachricht">Nachricht</label>
            <textarea id="a-nachricht" name="nachricht" placeholder="Wie viele Personen? Ab wann und wie lange? Wo ist der Einsatzort? Welche Aufgaben?"></textarea>
            <span class="field__error"></span>
          </div>
          <div class="hp" aria-hidden="true">
            <label for="a-website">Bitte leer lassen</label>
            <input id="a-website" name="website" type="text" tabindex="-1" autocomplete="off">
          </div>
          <div class="field field--full">
            <label class="consent">
              <input type="checkbox" name="datenschutz" required>
              <span>Ich bin mit der Verarbeitung meiner Angaben gemäß <a href="datenschutz.html" target="_blank">Datenschutzerklärung</a> einverstanden. <span class="req">*</span></span>
            </label>
            <span class="field__error" aria-live="polite"></span>
          </div>
        </div>
        <button class="btn btn--primary btn--lg btn--block" type="submit">Anfrage senden<svg class="icon" aria-hidden="true"><use href="#i-send"/></svg></button>
        <div class="form-status" role="status" aria-live="polite"></div>
      </form>
    </div>
  </section>
'''


def anfrage_dialog(form_href: str) -> str:
    """Auswahl bei „Jetzt anfragen“: anrufen, WhatsApp oder Formular."""
    return f'''  <dialog class="n-ask" id="anfrage-wahl" aria-labelledby="n-ask-titel">
    <div class="n-ask__head">
      <h2 id="n-ask-titel">Wie möchten Sie uns erreichen?</h2>
      <button class="n-ask__close" type="button" data-ask-close aria-label="Schließen"><svg class="icon" aria-hidden="true"><use href="#i-x"/></svg></button>
    </div>
    <a class="n-ask__opt n-ask__opt--main" href="{TEL_LINK}"><svg class="icon" aria-hidden="true"><use href="#i-phone"/></svg><span><strong>Jetzt anrufen</strong><small>{TEL}</small></span></a>
    <a class="n-ask__opt" href="{WA_LINK}" target="_blank" rel="noopener"><svg class="icon" aria-hidden="true"><use href="#i-whatsapp"/></svg><span><strong>WhatsApp schreiben</strong><small>{WA_NUMMER}</small></span></a>
    <a class="n-ask__opt" href="{form_href}" data-ask-close><svg class="icon" aria-hidden="true"><use href="#i-mail"/></svg><span><strong>Formular ausfüllen</strong><small>Wir melden uns bei Ihnen</small></span></a>
  </dialog>
'''


# ---------------------------------------------------------------------------
# Seiten
# ---------------------------------------------------------------------------
def main() -> None:
    eu = "".join(
        f'<circle cx="{10 + 6.2 * __import__("math").sin(i * __import__("math").pi / 6):.2f}" '
        f'cy="{10 - 6.2 * __import__("math").cos(i * __import__("math").pi / 6):.2f}" r="1.05" fill="#ffcc00"/>'
        for i in range(12)
    )

    # ---------- Start (neue Fassung: alles auf einer Seite) ----------
    a_branchen = [
        ("landwirtschaft", "Landwirtschaft", "Erntehelfer. Stallhelfer. Melker."),
        ("pflege", "Häusliche Pflege", "Hilfe im Alltag. Zu Hause."),
        ("bau", "Bau", "Helfer und Fachkräfte für jede Baustelle."),
        ("gastronomie", "Gastronomie", "Küche. Service. Theke."),
        ("logistik", "Lager und Logistik", "Lagern. Packen. Versenden."),
        ("reinigung", "Reinigung", "Büro. Gebäude. Haushalt."),
        ("hotellerie", "Hotellerie", "Rezeption. Housekeeping. Service."),
        ("industrie", "Industrie", "Für Werk und Halle."),
        ("produktion", "Produktion", "Fertigen. Kontrollieren. Verpacken."),
        ("pferde", "Pferdebetriebe", "Pferdepfleger und Stallhelfer."),
    ]
    a_tiles = "\n".join(
        f'''      <article class="a-tile{' a-tile--unten' if bid == 'industrie' else ''} reveal" aria-labelledby="a-b-{bid}">
        {picture(bid, BRANCHEN_ALT[bid], sizes="(max-width: 734px) 100vw, 50vw")}
        <div class="a-tile__txt">
          <h3 id="a-b-{bid}">{esc(name)}</h3>
          <p>{esc(satz)}</p>
          <div class="a-links"><a class="a-btn a-btn--white" href="{kontakt_link(branche=FORM_BRANCHE[bid])}">Anfragen</a><a class="a-lnk a-lnk--white" href="branchen.html#{bid}">Mehr erfahren<span aria-hidden="true">&nbsp;›</span></a></div>
        </div>
      </article>'''
        for i, (bid, name, satz) in enumerate(a_branchen)
    )
    a_cards = "\n".join(
        f'''        <li class="a-card"><span class="a-card__no" aria-hidden="true">{i + 1}</span><h3>{esc(h)}.</h3><p>{esc(kurz)}</p></li>'''
        for i, (h, kurz, _l) in enumerate(start_schritte)
    )
    a_team = "\n".join(
        f'''        <li class="a-face reveal" style="--i:{i % 5}"><figure>{foto("team/" + bild, f"{name}, {rolle} bei Standard Plus", 720, 900, "(max-width: 734px) 42vw, 190px", gross=720, klein=400)}<figcaption><strong>{esc(name)}</strong><span class="a-face__rolle">{esc(rolle)}</span><span class="a-face__satz">{esc(team_saetze[bild])}</span></figcaption></figure></li>'''
        for i, (bild, name, rolle) in enumerate(TEAM)
    )

    def a_spalte(pk: dict, hi: bool = False) -> str:
        badge = '<p class="a-col__badge">Beliebteste Wahl</p>' if hi else ""
        liste = pk["punkte"] + ([f"Laufzeit {pk['id'][3:]}&nbsp;Monate"] if pk["id"].startswith("abo") else [])
        punkte = "".join(f"            <li>{x}</li>\n" for x in liste)
        if pk["id"] == "einmal":
            unter = "3&nbsp;Monate Betreuung gratis"
        else:
            unter = pk["sub"].split("<br>")[0].replace("<b>", "").replace("</b>", "")
        return f'''        <article class="a-col{' a-col--hi' if hi else ''} reveal" aria-labelledby="a-p-{pk["id"]}">{badge}
          <h3 id="a-p-{pk["id"]}">{pk["name"]}</h3>
          <p class="a-col__preis"><span data-count="{pk["preis"]}">{pk["preis"]}</span>&nbsp;€ <small>einmalig</small></p>
          <p class="a-col__monat">{unter}</p>
          <ul>
{punkte}          </ul>
          <a class="a-btn{' a-btn--gelb' if hi else ''}" href="#kontakt" data-paket="{pk["paket"]}">{pk["knopf"]}</a>
        </article>'''

    pk6, pk12, pku = PAKETE
    start = f'''
  <section class="a-hero" aria-labelledby="a-titel">
    {foto("team", "Arbeitskräfte aus verschiedenen Branchen stehen nebeneinander: Handwerk, Bau, Service, Küche, Landwirtschaft, Lager, Pflege und Reinigung", 1344, 640, "100vw", lazy=False, gross=1344, klein=800)}
    <div class="a-hero__txt">
      <p class="a-eye">Personalvermittlung europaweit</p>
      <h1 id="a-titel">Gute Leute.<br>Fester Preis.</h1>
      <p class="a-sub">Wir suchen, prüfen und betreuen Ihre neuen Mitarbeiter.</p>
      <div class="a-links"><a class="a-btn a-btn--white" href="#kontakt" data-anfrage>Jetzt anfragen</a><a class="a-lnk a-lnk--white" href="#pakete">Pakete ansehen<span aria-hidden="true">&nbsp;›</span></a></div>
    </div>
  </section>

  <section class="a-stats" aria-labelledby="a-einfach">
    <h2 id="a-einfach" class="reveal">Personal finden war noch nie so <span class="a-grad">einfach.</span></h2>
    <dl class="a-stats__row">
      <div class="reveal" style="--i:0"><dt><span data-count="0">0</span>&nbsp;€</dt><dd>Kein Geld<br>im Voraus</dd></div>
      <div class="reveal" style="--i:1"><dt><span data-count="84">84</span>&nbsp;h</dt><dd>Ersatz bei<br>längerem Ausfall</dd></div>
      <div class="reveal" style="--i:2"><dt><span data-count="6">6</span></dt><dd>Tage pro Woche<br>erreichbar</dd></div>
      <div class="reveal" style="--i:3"><dt><span data-count="10">10</span></dt><dd>Branchen,<br>ein Ansprechpartner</dd></div>
    </dl>
  </section>

  <section class="a-stage" aria-labelledby="a-uebernahme">
    <p class="a-eye reveal">Übernahme-Paket</p>
    <h2 id="a-uebernahme" class="reveal">Einmal zahlen.<br>Ganz Ihrer.</h2>
    <p class="a-sub reveal">3&nbsp;Monate Betreuung inklusive. Danach keine Gebühren.</p>
    <p class="a-stage__preis reveal"><span data-count="899">899</span>&nbsp;€<small>einmalig · inkl. MwSt.</small></p>
    <div class="a-links reveal"><a class="a-btn a-btn--gelb" href="#kontakt" data-paket="{pku["paket"]}">Übernahme-Paket anfragen</a><a class="a-lnk a-lnk--white" href="pakete.html#einmal">Mehr erfahren<span aria-hidden="true">&nbsp;›</span></a></div>
    <dl class="a-stage__band">
      <div><dt>3 Monate</dt><dd>Betreuung kostenlos (im Wert von 357&nbsp;€)</dd></div>
      <div><dt>2 Wochen</dt><dd>Austausch, falls nötig</dd></div>
      <div><dt>0&nbsp;€</dt><dd>Danach keine Gebühren</dd></div>
    </dl>
  </section>

  <section class="a-cmp" id="pakete" aria-labelledby="a-pakete">
    <h2 id="a-pakete" class="reveal">Welches Paket passt zu Ihnen?</h2>
    <p class="a-sub reveal">Drei Pakete. Feste Preise. Keine versteckten Kosten.</p>
    <div class="a-cmp__grid">
{a_spalte(pk6)}
{a_spalte(pku, hi=True)}
{a_spalte(pk12)}
    </div>
    <p class="a-cmp__note reveal">Alle Preise inkl. MwSt. Es gelten unsere <a href="agb.html">AGB</a>. <a href="pakete.html">Alle Details zu den Paketen<span aria-hidden="true">&nbsp;›</span></a></p>
  </section>

  <section class="a-tiles" id="branchen" aria-labelledby="a-branchen">
    <h2 id="a-branchen" class="a-visually">Branchen</h2>
{a_tiles}
  </section>

  <section class="a-gal" id="ablauf" aria-labelledby="a-ablauf">
    <div class="a-gal__head"><h2 id="a-ablauf" class="reveal">So läuft es ab.</h2><a class="a-lnk reveal" href="ablauf.html">Ablauf im Detail<span aria-hidden="true">&nbsp;›</span></a></div>
    <ol class="a-gal__row" data-galerie tabindex="0" aria-label="Fünf Schritte der Vermittlung">
{a_cards}
    </ol>
    <div class="a-dots" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
  </section>

  <section class="a-team" id="team" aria-labelledby="a-team">
    <h2 id="a-team" class="reveal">Die Menschen hinter Standard Plus.</h2>
    <p class="a-sub reveal">Zehn Ansprechpartner. Ein Ziel: Ihr Betrieb läuft.</p>
    <ul class="a-faces" role="list">
{a_team}
    </ul>
  </section>

  <section class="a-faq" id="fragen" aria-labelledby="a-fragen">
    <h2 id="a-fragen" class="reveal">Häufige Fragen.</h2>
    <div class="faq n-faq reveal">
{n_faq}
    </div>
  </section>

{kontakt_block(titel="Personal gesucht?", tuerkis=True)}
'''
    titel = "Standard Plus – Personalvermittlung europaweit"
    ld = org_graph() + [webpage(DOMAIN + "/", titel), catalog()]
    build("index.html", titel,
          "Standard Plus Personalvermittlung europaweit: Arbeitskräfte für Landwirtschaft, häusliche Pflege, Bau, Gastronomie, Lager und mehr. Feste Preise ab 899 €, Betreuung und Ersatz inklusive.",
          start, ld, strip=False, preload_hero=True, nav=start_nav, cta="#kontakt", ueber=True)

    # ---------- Über uns ----------
    body = page_hero("Über uns", "Mehr als Vermittlung.",
                     "Standard Plus ist eine Personalvermittlung aus Ludwigsburg. Wir vermitteln zuverlässige Arbeitskräfte aus ganz Europa – und begleiten Sie vor, während und nach dem Arbeitsbeginn.",
                     "Über uns") + '''

  <section class="section">
    <div class="container about">
      <div class="about__media reveal">
        ''' + BERATERIN + '''
        <div class="about__quote">Mit Standard Plus werden Sie auch nach der Vermittlung nicht allein gelassen.</div>
      </div>
      <div class="reveal">
        <span class="kicker">Wofür wir stehen</span>
        <h2>Persönlich. Erreichbar. Zuverlässig.</h2>
        <p class="about__lead">Bei Standard Plus endet unsere Arbeit nicht mit der Besetzung einer Stelle. Wir begleiten Sie <strong>vor, während und nach dem Arbeitsbeginn.</strong></p>
        <ul class="ticks">
          <li><svg class="icon"><use href="#i-check"/></svg>Sorgfältig ausgewählte Mitarbeiter – passend zu Ihrem Bedarf</li>
          <li><svg class="icon"><use href="#i-check"/></svg>Fester, deutschsprachiger Ansprechpartner</li>
          <li><svg class="icon"><use href="#i-check"/></svg>Betreuung auch im Arbeitsalltag</li>
          <li><svg class="icon"><use href="#i-check"/></svg>Service an 6 Tagen pro Woche – in der Regel Austausch innerhalb von 3 Werktagen</li>
          <li><svg class="icon"><use href="#i-check"/></svg>Transparente Abläufe und faire Bedingungen</li>
        </ul>
      </div>
    </div>
  </section>

  <section class="section section--alt">
    <div class="container trustbox">
      <div class="reveal">
        <span class="kicker">Seriös, transparent, persönlich</span>
        <h2>Seriöse Personalvermittler erkennen.</h2>
        <p class="about__lead">Worauf Sie bei einer professionellen Vermittlung achten sollten – und woran Sie uns messen können.</p>
      </div>
      <ul class="checklist">
        <li class="reveal"><span class="icon-wrap"><svg class="icon"><use href="#i-nomoney"/></svg></span>Kein Geld im Voraus</li>
        <li class="reveal"><span class="icon-wrap"><svg class="icon"><use href="#i-filecheck"/></svg></span>Arbeit mit Verträgen und Rechnungen</li>
        <li class="reveal"><span class="icon-wrap"><svg class="icon"><use href="#i-chat"/></svg></span>Klare und seriöse Kommunikation</li>
        <li class="reveal"><span class="icon-wrap"><svg class="icon"><use href="#i-user"/></svg></span>Deutschsprachiger Ansprechpartner</li>
        <li class="reveal"><span class="icon-wrap"><svg class="icon"><use href="#i-phone"/></svg></span>Erreichbare und nachvollziehbare Kontaktdaten</li>
        <li class="reveal"><span class="icon-wrap"><svg class="icon"><use href="#i-gear"/></svg></span>Transparente Abläufe und faire Bedingungen</li>
        <li class="warn reveal"><svg class="icon"><use href="#i-alert"/></svg>Vorsicht bei Vermittlern, die Vorkasse verlangen und keine klaren Verträge vorlegen.</li>
      </ul>
    </div>
  </section>

  <section class="n-sec" id="team" aria-labelledby="n-team">
    <div class="container">
      <div class="n-head reveal">
        <h2 id="n-team">Unser Team</h2>
        <p>Die Menschen, mit denen Sie bei Standard Plus sprechen.</p>
      </div>
      <ul class="n-crew" role="list" tabindex="0" aria-label="Team von Standard Plus">
''' + n_team + '''
      </ul>
      <p class="n-swipe" aria-hidden="true">← Wischen, um alle zu sehen →</p>
    </div>
  </section>

  <section class="section section--alt">
    <div class="container">
      <div class="section-head reveal">
        <span class="kicker">Auf einen Blick</span>
        <h2>Standard Plus in Kürze.</h2>
      </div>
      <dl class="facts reveal">
        <div><dt>Unternehmen</dt><dd>Standard Plus Personalvermittlung</dd></div>
        <div><dt>Leistung</dt><dd>Vermittlung von Hilfs- und Fachkräften aus ganz Europa – mit Betreuung vor, während und nach dem Arbeitsbeginn</dd></div>
        <div><dt>Branchen</dt><dd><a href="branchen.html">Bau &amp; Handwerk, Landwirtschaft &amp; Milchvieh, Pferdebetriebe, Pflege &amp; Betreuung, Lager &amp; Logistik, Gastronomie, Hotellerie, Reinigung, Industrie, Produktion</a></dd></div>
        <div><dt>Pakete</dt><dd><a href="pakete.html">Betreuung 6&nbsp;Monate 399&nbsp;€ + 119&nbsp;€/Monat · Betreuung 12&nbsp;Monate 399&nbsp;€ + 99&nbsp;€/Monat · Übernahme-Paket 899&nbsp;€ einmalig</a></dd></div>
        <div><dt>Service</dt><dd>Fester, deutschsprachiger Ansprechpartner · erreichbar an 6 Tagen pro Woche · kein Geld im Voraus</dd></div>
        <div><dt>Sitz</dt><dd>Heilbronner Straße 142, 71634 Ludwigsburg, Deutschland</dd></div>
        <div><dt>Kontakt</dt><dd><a href="tel:+4915228986993">0152 28986993</a> · <a href="mailto:info@standard-plus.net">info@standard-plus.net</a></dd></div>
      </dl>
    </div>
  </section>
'''
    build("ueber-uns.html", "Über uns – Personalvermittlung aus Ludwigsburg | Standard Plus",
          "Wer ist Standard Plus? Personalvermittlung aus Ludwigsburg für Arbeitskräfte aus ganz Europa – persönlich, erreichbar, zuverlässig. Kein Geld im Voraus.",
          body, sub("ueber-uns.html", "Über uns") + [{"@type": "AboutPage", "url": DOMAIN + "/ueber-uns.html", "about": {"@id": ORG_ID}}])

    # ---------- Branchen ----------
    body = page_hero("Branchen", "Was wir vermitteln.",
                     "Standard Plus vermittelt Hilfs- und Fachkräfte aus ganz Europa für zehn Branchen. Hier sehen Sie, wen wir in welcher Branche vermitteln und wofür unsere Mitarbeiter typischerweise eingesetzt werden.",
                     "Branchen") + f'''

  <section class="section section--tight">
    <div class="container">
      {branchen_detail()}
      <div class="note reveal">
        <svg class="icon"><use href="#i-bulb"/></svg>
        <p><strong>Ihre Branche ist nicht dabei?</strong> Sprechen Sie uns trotzdem an – wir sagen Ihnen ehrlich, ob wir helfen können. <a href="kontakt.html">Zur Anfrage</a></p>
      </div>
    </div>
  </section>
'''
    build("branchen.html", "Personal für 10 Branchen: Bau, Pflege, Gastro, Industrie & mehr | Standard Plus",
          "Welche Arbeitskräfte vermittelt Standard Plus? Zehn Branchen: Bau, Landwirtschaft, Pferdebetriebe, Pflege, Lager & Logistik, Gastronomie, Hotellerie, Reinigung, Industrie und Produktion.",
          body, sub("branchen.html", "Branchen") + services())

    # ---------- Ablauf ----------
    body = page_hero("Ablauf", "In 5 Schritten zum passenden Mitarbeiter.",
                     "Von Ihrer Anfrage bis zur laufenden Betreuung: So läuft eine Vermittlung bei Standard Plus ab – einfach, transparent und mit festem Ansprechpartner.",
                     "Ablauf") + f'''

  <section class="n-sec n-sec--first">
    <div class="container">
      <ol class="n-steps n-steps--lang" data-steps>
{n_schritte(lang=True)}
      </ol>
    </div>
  </section>

  <section class="n-sec n-sec--tint">
    <div class="container n-duo">
      <div class="n-card reveal" style="--i:0">
        <h2>Was wir von Ihnen wissen sollten</h2>
        <p>Damit es schnell geht, helfen uns diese Angaben:</p>
        <ul class="n-checks n-checks--plain">
{n_checks(["Branche und Aufgaben", "Anzahl der gesuchten Mitarbeiter", "Einsatzort und Startdatum", "Arbeitszeiten und Dauer des Einsatzes", "Besondere Anforderungen, zum Beispiel Führerschein oder Erfahrung"])}
        </ul>
      </div>
      <div class="n-card reveal" style="--i:1">
        <h2>Wir bleiben an Ihrer Seite</h2>
        <p>Auch nach dem Arbeitsbeginn sind wir für Sie da – bei Fragen, Problemen oder im Arbeitsalltag. Unser Team ist an sechs Tagen pro Woche erreichbar.</p>
        <p>Passt ein Mitarbeiter nicht, tauschen wir in der Regel innerhalb von 3&nbsp;Werktagen aus. Was genau gilt, hängt vom <a href="pakete.html">gewählten Paket</a> ab.</p>
      </div>
    </div>
  </section>
'''
    build("ablauf.html", "Ablauf der Personalvermittlung in 5 Schritten | Standard Plus",
          "So läuft die Vermittlung bei Standard Plus ab: Anfrage, Bedarf klären, suchen und prüfen, Arbeitskraft startet, Betreuung und Ersatz.",
          body, sub("ablauf.html", "Ablauf") + [{
              "@type": "HowTo", "name": "Personal über Standard Plus finden",
              "step": [{"@type": "HowToStep", "position": i, "name": h, "text": ausf} for i, (h, _k, ausf) in enumerate(start_schritte, 1)]}])

    # ---------- Pakete ----------
    body = page_hero("Pakete", "Drei transparente Pakete.",
                     "Qualifizierte Fachkräfte. Zuverlässig. Persönlich. Schnell. Wählen Sie das Paket, das zu Ihrem Personalbedarf passt.",
                     "Pakete") + f'''

  <section class="n-sec n-sec--first" id="pakete">
    <div class="container">
      {paket_karten(seite=True)}
      <p class="n-note reveal">Alle Preise sind Endpreise inkl. MwSt. Es gelten unsere <a href="agb.html">AGB</a>. Verbraucher haben ein <a href="widerruf.html">Widerrufsrecht</a>.</p>
    </div>
  </section>
'''
    build("pakete.html", "Pakete & Preise: 6 Monate, 12 Monate oder 899 € | Standard Plus",
          "Drei transparente Pakete: Betreuung 6 Monate (399 € + 119 €/Monat), Betreuung 12 Monate (399 € + 99 €/Monat) oder Übernahme-Paket 899 € einmalig inkl. 3 Monate Betreuung.",
          body, sub("pakete.html", "Pakete") + [catalog()])

    # ---------- Fragen ----------
    body = page_hero("Häufige Fragen", "Fragen zur Personalvermittlung.",
                     "Die wichtigsten Antworten zu Ablauf, Kosten, Branchen und Erreichbarkeit. Ihre Frage ist nicht dabei? Rufen Sie uns an oder schreiben Sie uns.",
                     "Fragen") + f'''

  <section class="section section--tight">
    <div class="container">
      {faq_html()}
    </div>
  </section>
'''
    build("fragen.html", "Häufige Fragen zur Personalvermittlung | Standard Plus",
          "Antworten zu Kosten, Ablauf, Branchen, Austausch und Erreichbarkeit bei Standard Plus Personalvermittlung.",
          body, sub("fragen.html", "Fragen") + [faq_page(DOMAIN + "/fragen.html")])

    # ---------- Kontakt ----------
    body = page_hero("Kontakt", "Sprechen Sie mit uns.",
                     "Unverbindlich und kostenlos – wir melden uns schnellstmöglich persönlich bei Ihnen.",
                     "Kontakt") + "\n\n" + kontakt_block(titel="Anfrage senden")
    build("kontakt.html", "Kontakt – Personal anfragen in Ludwigsburg | Standard Plus",
          "Personal anfragen bei Standard Plus: Telefon 0152 28986993, WhatsApp, E-Mail info@standard-plus.net oder Anfrageformular. Heilbronner Straße 142, Ludwigsburg.",
          body, sub("kontakt.html", "Kontakt") + [{"@type": "ContactPage", "url": DOMAIN + "/kontakt.html", "about": {"@id": ORG_ID}}],
          strip=False, cta="#kontakt")

    # ---------- Rechtstexte ----------
    for file, name, desc, robots in (
        ("impressum.html", "Impressum", "Impressum von Standard Plus Personalvermittlung, Heilbronner Straße 142, 71634 Ludwigsburg.", "index, follow"),
        ("agb.html", "Allgemeine Geschäftsbedingungen", "Allgemeine Geschäftsbedingungen von Standard Plus Personalvermittlung.", "index, follow"),
        ("datenschutz.html", "Datenschutzerklärung", "Datenschutzerklärung von Standard Plus Personalvermittlung.", "noindex, follow"),
        ("widerruf.html", "Widerrufsbelehrung", "Widerrufsbelehrung und Muster-Widerrufsformular für Verbraucher bei Standard Plus Personalvermittlung.", "index, follow"),
    ):
        build(file, f"{'AGB' if file == 'agb.html' else name} – Standard Plus Personalvermittlung", desc, read(f"werkzeuge/inhalte/{file}"),
              sub(file, name), robots=robots)


if __name__ == "__main__":
    main()
