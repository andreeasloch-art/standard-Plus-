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

DOMAIN = "https://www.standard-plus.eu"
TEL = "0152 28986993"
TEL_LINK = "tel:+4915228986993"
MAIL = "info@standard-aaa.de"
STAND = "2026-10-07"

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
        "alt": "Handwerker mit Schutzhelm und Akkuschrauber bei der Arbeit an einem Holzbalken",
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
        "alt": "Milchkühe fressen im Laufstall eines landwirtschaftlichen Betriebs",
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
        "alt": "Stallgasse eines Pferdebetriebs mit Pferdeboxen und einem Pferd",
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
        "alt": "Betreuerin und ältere Dame lachen gemeinsam",
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
        "alt": "Mitarbeiter in Arbeitskleidung gehen durch die Gänge eines großen Lagers",
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
        "name": "Gastronomie & Hotellerie",
        "icon": "s-gastro",
        "kurz": "Personal für Service, Küche, Housekeeping und Reinigung.",
        "alt": "Koch in weißer Jacke schneidet Gemüse in einer Restaurantküche",
        "lead": "In Gastronomie und Hotellerie zählt jede helfende Hand. Wir vermitteln Personal für Service, Küche, Housekeeping und Reinigung.",
        "wen": [
            "Servicekräfte",
            "Küchenhilfen und Spülkräfte",
            "Housekeeping-Kräfte",
            "Reinigungskräfte",
        ],
        "einsatz": [
            "Service im Restaurant und bei Veranstaltungen",
            "Mithilfe in der Küche",
            "Zimmerreinigung im Hotel",
            "Unterstützung in der Saison",
        ],
    },
]


def esc(s: str) -> str:
    return html.escape(s, quote=True)


def picture(name: str, alt: str, lazy: bool = True, sizes: str = "(max-width: 760px) 100vw, 50vw") -> str:
    loading = ' loading="lazy"' if lazy else ""
    return (
        f'<picture><source srcset="assets/img/branchen/{name}.webp" type="image/webp">'
        f'<img src="assets/img/branchen/{name}.jpg" width="1200" height="800"{loading} decoding="async" '
        f'sizes="{sizes}" alt="{esc(alt)}"></picture>'
    )


def kontakt_link(betreff: str) -> str:
    from urllib.parse import quote
    return "kontakt.html?betreff=" + quote(betreff)


# ---------------------------------------------------------------------------
# Wiederverwendete Bausteine
# ---------------------------------------------------------------------------
def branchen_teaser() -> str:
    cards = "\n".join(
        f'''        <a class="bcard reveal" href="branchen.html#{b["id"]}">
          <span class="bcard__img">{picture(b["id"], b["alt"], sizes="(max-width: 600px) 100vw, 33vw")}</span>
          <span class="bcard__body"><strong>{esc(b["name"])}</strong><span>{esc(b["kurz"])}</span></span>
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
          <a class="btn btn--primary" href="{kontakt_link("Personal für " + b["name"])}">Personal für {esc(b["name"])} anfragen<svg class="icon"><use href="#i-arrow"/></svg></a>
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
        <article class="plan reveal" id="abo">
          <span class="plan__icon"><svg class="icon"><use href="#i-users"/></svg></span>
          <h3>Abo-Paket</h3>
          <div class="plan__price"><strong>399&nbsp;€</strong><span>einmalig</span><em>+ 119&nbsp;€ / Monat</em><small class="plan__tax">alle Preise inkl. MwSt.</small></div>
          <p class="plan__desc">Das Abo-Paket umfasst eine einmalige Zahlung von 399&nbsp;Euro sowie eine monatliche Betreuungsgebühr von 119&nbsp;Euro. Mit diesem Paket übernehmen wir die Suche nach qualifizierten Arbeitskräften sowie die fortlaufende Betreuung. Ein wesentlicher Vorteil ist, dass Sie auch bei längeren Ausfällen nicht ohne Mitarbeiter dastehen. Innerhalb von 84&nbsp;Stunden sorgen wir für passenden Ersatz, der Ihre Anforderungen erfüllt.</p>
          <ul class="plan__list">
            <li>Einmalige Zahlung: 399&nbsp;Euro</li>
            <li>Monatliche Betreuungsgebühr: 119&nbsp;Euro</li>
            <li>Suche nach qualifizierten Arbeitskräften</li>
            <li>Fortlaufende Betreuung und Unterstützung</li>
            <li>Ersatz innerhalb von 84&nbsp;Stunden bei längeren Ausfällen</li>
          </ul>
          <p class="plan__summary"><svg class="icon"><use href="#i-bulb"/></svg><span><b>Kurz zusammengefasst:</b> Transparente Betreuung mit schneller Ersatzlösung für Ihren Personalbedarf.</span></p>
          <a class="btn btn--yellow btn--block" href="{kontakt_link("Anfrage Abo-Paket (399 € + 119 €/Monat)")}">Abo-Paket anfragen</a>
        </article>

        <article class="plan plan--featured reveal" id="einmal">
          <span class="plan__icon"><svg class="icon"><use href="#i-file"/></svg></span>
          <h3>Paket für 899&nbsp;Euro</h3>
          <div class="plan__price"><strong>899&nbsp;€</strong><span>einmalig</span><small class="plan__tax">inkl. MwSt.</small></div>
          <p class="plan__desc">Dieses Paket beinhaltet ebenfalls die Suche nach qualifizierten Arbeitskräften, die Ihren Anforderungen entsprechen. Sollten die ausgewählten Mitarbeiter innerhalb von zwei Wochen nach Beginn ihrer Tätigkeit nicht Ihren Erwartungen entsprechen, bieten wir Ihnen einen Austausch an und suchen passende Ersatzkräfte für Sie.</p>
          <ul class="plan__list">
            <li>Einmalige Zahlung: 899&nbsp;Euro</li>
            <li>Suche nach qualifizierten Arbeitskräften</li>
            <li>Austausch innerhalb von zwei Wochen, falls nötig</li>
          </ul>
          <p class="plan__summary"><svg class="icon"><use href="#i-bulb"/></svg><span><b>Kurz zusammengefasst:</b> Einmaliges Paket mit passgenauer Suche und Austauschoption in den ersten zwei Wochen.</span></p>
          <a class="btn btn--yellow btn--block" href="{kontakt_link("Anfrage Paket für 899 Euro")}">Paket für 899 € anfragen</a>
        </article>
      </div>
      <p class="swipe-hint">← Wischen, um beide Pakete zu sehen →</p>

      <p class="pricing-foot reveal"><svg class="icon"><use href="#i-bulb"/></svg><span><b style="color:#fff">Kurz zusammengefasst:</b> Zwei transparente Pakete – individuell passend für Ihren Personalbedarf. Alle Preise sind Endpreise inkl. MwSt. Es gelten unsere <a href="agb.html">AGB</a>; Verbraucher haben ein <a href="widerruf.html">Widerrufsrecht</a>.</span></p>'''


FAQ = [
    ("Wie schnell sind Mitarbeiter verfügbar?",
     "Je nach Bedarf oft auch kurzfristig. Sprechen Sie uns an – wir sagen Ihnen ehrlich, was realistisch ist."),
    ("Woher kommen die Mitarbeiter?",
     "Wir vermitteln europaweit. Sie haben dabei immer einen festen, deutschsprachigen Ansprechpartner."),
    ("Wie läuft die Vermittlung ab?",
     "Anfrage, Auswahl, Vorstellung und Begleitung: Wir besprechen Ihren Bedarf, suchen gezielt passende Kandidaten, stellen Ihnen Vorschläge vor und betreuen Sie auch nach dem Start."),
    ("Was passiert, wenn ein Mitarbeiter nicht passt?",
     "Beim Paket für 899 Euro bieten wir innerhalb von zwei Wochen nach Arbeitsbeginn einen Austausch an. Im Abo-Paket sorgen wir bei längeren Ausfällen innerhalb von 84 Stunden für Ersatz."),
    ("Gibt es eine Probezeit?",
     "Das hängt vom Einsatz und der Vereinbarung zwischen Ihnen und dem Mitarbeiter ab."),
    ("Was kostet die Personalvermittlung bei Standard Plus?",
     "Es gibt zwei Pakete, alle Preise inklusive MwSt.: das Paket für 899 Euro (einmalige Zahlung, inklusive Austausch innerhalb von zwei Wochen) und das Abo-Paket mit einer einmaligen Zahlung von 399 Euro plus 119 Euro Betreuungsgebühr im Monat (inklusive Ersatz innerhalb von 84 Stunden bei längeren Ausfällen)."),
    ("Für welche Branchen vermitteln Sie Personal?",
     "Für Bau & Handwerk, Landwirtschaft (auch Milchvieh- und Pferdebetriebe), Pflege & Betreuung, Lager & Logistik sowie Gastronomie & Hotellerie."),
    ("Muss ich Geld im Voraus bezahlen?",
     "Nein. Wir verlangen kein Geld im Voraus und arbeiten mit klaren Verträgen und Rechnungen."),
    ("Wo hat Standard Plus seinen Sitz?",
     "Unser Sitz ist in Ludwigsburg (Baden-Württemberg), Heilbronner Straße 142. Wir vermitteln Arbeitskräfte aus ganz Europa an Betriebe in Deutschland."),
    ("Wann erreiche ich Sie?",
     f"An 6 Tagen pro Woche – telefonisch unter {TEL} oder per E-Mail an {MAIL}."),
]


def faq_html() -> str:
    def answer(a: str) -> str:
        a = esc(a).replace(" Euro", "&nbsp;Euro").replace(" Stunden", "&nbsp;Stunden")
        a = a.replace(TEL, f'<a href="{TEL_LINK}">{TEL}</a>').replace(MAIL, f'<a href="mailto:{MAIL}">{MAIL}</a>')
        return a
    items = "\n".join(
        f'''        <details>
          <summary>{esc(q)}</summary>
          <div class="answer"><p>{answer(a)}</p></div>
        </details>'''
        for q, a in FAQ
    )
    return f'<div class="faq reveal">\n{items}\n      </div>'


def page_hero(kicker: str, h1: str, lead: str, crumb: str) -> str:
    return f'''  <section class="page-hero">
    <div class="container">
      <p class="crumb"><a href="index.html">Start</a> <span aria-hidden="true">›</span> <span aria-current="page">{esc(crumb)}</span></p>
      <span class="kicker">{esc(kicker)}</span>
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
        "description": "Personalvermittlung europaweit: Standard Plus vermittelt Hilfs- und Fachkräfte aus ganz Europa für Bau & Handwerk, Landwirtschaft (Milchvieh- und Pferdebetriebe), Pflege & Betreuung, Lager & Logistik sowie Gastronomie & Hotellerie – mit persönlicher Betreuung vor, während und nach dem Arbeitsbeginn.",
        "slogan": "Persönlich. Erreichbar. Zuverlässig.",
        "url": DOMAIN + "/",
        "logo": {"@type": "ImageObject", "url": DOMAIN + "/assets/img/logo.png", "width": 600, "height": 200},
        "image": DOMAIN + "/assets/img/og-image.jpg",
        "telephone": "+49 152 28986993",
        "email": MAIL,
        "address": {"@type": "PostalAddress", "streetAddress": "Heilbronner Straße 142", "postalCode": "71634",
                    "addressLocality": "Ludwigsburg", "addressRegion": "Baden-Württemberg", "addressCountry": "DE"},
        "areaServed": [{"@type": "Place", "name": "Europa"}, {"@type": "Country", "name": "Deutschland"}],
        "knowsLanguage": ["de"],
        "knowsAbout": ["Personalvermittlung", "Arbeitsvermittlung", "Arbeitskräfte aus Europa", "Erntehelfer", "Pferdepfleger",
                       "Melker", "Bauhelfer", "Pflegekräfte", "Betreuungskräfte", "Lagerhelfer", "Kommissionierer",
                       "Servicekräfte", "Küchenhilfen", "Housekeeping"],
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


def catalog() -> dict:
    return {
        "@type": "OfferCatalog", "@id": DOMAIN + "/pakete.html#pakete", "name": "Pakete von Standard Plus",
        "itemListElement": [
            {"@type": "Offer", "name": "Paket für 899 Euro", "url": DOMAIN + "/pakete.html#einmal",
             "description": "Suche nach qualifizierten Arbeitskräften; Austausch innerhalb von zwei Wochen nach Arbeitsbeginn, falls nötig.",
             "price": "899", "priceCurrency": "EUR", "seller": {"@id": ORG_ID},
             "priceSpecification": {"@type": "PriceSpecification", "price": "899", "priceCurrency": "EUR", "valueAddedTaxIncluded": True}},
            {"@type": "Offer", "name": "Abo-Paket", "url": DOMAIN + "/pakete.html#abo",
             "description": "Suche nach qualifizierten Arbeitskräften, fortlaufende Betreuung und Ersatz innerhalb von 84 Stunden bei längeren Ausfällen.",
             "priceCurrency": "EUR", "seller": {"@id": ORG_ID},
             "priceSpecification": [
                 {"@type": "UnitPriceSpecification", "name": "Einmalige Zahlung", "price": "399", "priceCurrency": "EUR", "valueAddedTaxIncluded": True},
                 {"@type": "UnitPriceSpecification", "name": "Monatliche Betreuungsgebühr", "price": "119", "priceCurrency": "EUR", "valueAddedTaxIncluded": True,
                  "referenceQuantity": {"@type": "QuantitativeValue", "value": 1, "unitCode": "MON"}}]},
        ],
    }


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


def header(active: str) -> str:
    links = "\n".join(
        f'      <a href="{href}"{CUR if href == active else ""}>{label}</a>' for href, label in NAV
    )
    return f'''<header class="site-header">
  <div class="container">
    <a class="logo" href="index.html" aria-label="Standard Plus Personalvermittlung – zur Startseite">
      {LOGO}
    </a>
    <nav class="nav" id="nav" aria-label="Hauptnavigation">
{links}
    </nav>
    <div class="header-cta">
      <a class="header-tel" href="{TEL_LINK}"><svg class="icon"><use href="#i-phone"/></svg>{TEL}</a>
      <a class="btn btn--primary" href="kontakt.html">Anfragen</a>
      <button class="nav-toggle" type="button" aria-controls="nav" aria-expanded="false" aria-label="Menü öffnen">
        <svg class="icon"><use href="#i-menu"/></svg>
      </button>
    </div>
  </div>
</header>'''


def cta_strip() -> str:
    return f'''<!-- ================= Balken unten ================= -->
<section class="cta-strip" aria-label="Kontakt">
  <div class="container">
    <p class="cta-strip__text"><strong>Personal gesucht?</strong> <span>Persönlich. Erreichbar. Zuverlässig.</span></p>
    <div class="cta-strip__actions">
      <a class="btn btn--dark" href="{TEL_LINK}"><svg class="icon"><use href="#i-phone"/></svg>{TEL}</a>
      <a class="btn btn--white" href="kontakt.html">Jetzt anfragen<svg class="icon"><use href="#i-arrow"/></svg></a>
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
        <h4>Seiten</h4>
        <ul>
{seiten}
        </ul>
      </div>
      <div>
        <h4>Kontakt</h4>
        <ul>
          <li><a href="{TEL_LINK}">{TEL}</a></li>
          <li><a href="mailto:{MAIL}">{MAIL}</a></li>
          <li>Heilbronner Straße 142<br>71634 Ludwigsburg</li>
        </ul>
      </div>
      <div>
        <h4>Rechtliches</h4>
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


def head(file: str, title: str, desc: str, robots: str, ld: list, og_title: str | None = None, preload_hero: bool = False) -> str:
    url = DOMAIN + "/" if file == "index.html" else f"{DOMAIN}/{file}"
    ld_json = json.dumps({"@context": "https://schema.org", "@graph": ld}, ensure_ascii=False, indent=2)
    preload = ('\n  <link rel="preload" href="assets/img/beratung-gross.webp" as="image" type="image/webp" fetchpriority="high">'
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
  <link rel="stylesheet" href="assets/css/style.css?v={version("assets/css/style.css")}">
  <script>document.documentElement.classList.remove('no-js');</script>
  <!-- Strukturierte Daten (schema.org) – erzeugt von werkzeuge/seiten_bauen.py -->
  <script type="application/ld+json">
{ld_json}
  </script>
</head>'''


def build(file: str, title: str, desc: str, body: str, ld: list, robots: str = "index, follow, max-image-preview:large, max-snippet:-1",
          strip: bool = True, og_title: str | None = None, preload_hero: bool = False) -> None:
    page = f'''<!doctype html>
<html lang="de" class="no-js">
{head(file, title, desc, robots, ld, og_title, preload_hero)}
<body>

{sprite()}

<a class="skip-link" href="#inhalt">Zum Inhalt springen</a>

{header(file)}

<main id="inhalt">
{body}
</main>

{cta_strip() if strip else ""}

{footer()}

<script src="assets/js/main.js?v={version("assets/js/main.js")}" defer></script>
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
# Seiten
# ---------------------------------------------------------------------------
def main() -> None:
    eu = "".join(
        f'<circle cx="{10 + 6.2 * __import__("math").sin(i * __import__("math").pi / 6):.2f}" '
        f'cy="{10 - 6.2 * __import__("math").cos(i * __import__("math").pi / 6):.2f}" r="1.05" fill="#ffcc00"/>'
        for i in range(12)
    )

    # ---------- Start ----------
    start = f'''
  <section class="hero">
    <div class="container">
      <p class="pill reveal"><span class="pill__eu"><svg viewBox="0 0 20 20" aria-hidden="true">{eu}</svg></span>Personalvermittlung europaweit</p>
      <h1 class="reveal">Passende Mitarbeiter.<span class="grad">Persönlich vermittelt.</span></h1>
      <p class="hero__lead reveal">Standard Plus ist Ihre Personalvermittlung für zuverlässige Arbeitskräfte aus ganz Europa – und wir bleiben auch nach dem Arbeitsbeginn an Ihrer Seite.</p>
      <div class="hero__actions reveal">
        <a class="btn btn--primary" href="kontakt.html">Unverbindlich anfragen<svg class="icon"><use href="#i-arrow"/></svg></a>
        <a class="btn btn--plain" href="branchen.html">Branchen ansehen<svg class="icon"><use href="#i-arrow"/></svg></a>
      </div>
      <div class="hero__stage reveal">
        <div class="hero__photo">
          <picture><source srcset="assets/img/beratung-gross.webp" type="image/webp"><img src="assets/img/beratung-gross.jpg" width="1228" height="870" fetchpriority="high" decoding="async" alt="Persönliche Beratung bei Standard Plus Personalvermittlung: Beraterin im Gespräch mit einem Kunden"></picture>
        </div>
        <div class="glass-chip glass-chip--a">
          <span class="glass-chip__icon"><svg class="icon"><use href="#i-user"/></svg></span>
          <div><strong>Fester Ansprechpartner</strong><span>deutschsprachig &amp; persönlich</span></div>
        </div>
        <div class="glass-chip glass-chip--b">
          <span class="glass-chip__icon glass-chip__icon--y"><svg class="icon"><use href="#i-calendar"/></svg></span>
          <div><strong>6 Tage pro Woche</strong><span>für Sie erreichbar</span></div>
        </div>
      </div>
    </div>
  </section>

  <div class="values-bar">
    <div class="container">
      <ul>
        <li class="reveal"><svg class="icon"><use href="#i-globe"/></svg><strong>Europaweit</strong><span>Arbeitskräfte aus ganz Europa</span></li>
        <li class="reveal"><svg class="icon"><use href="#i-user"/></svg><strong>Persönlich</strong><span>Fester, deutschsprachiger Ansprechpartner</span></li>
        <li class="reveal"><svg class="icon"><use href="#i-chat"/></svg><strong>Erreichbar</strong><span>Service an 6 Tagen pro Woche</span></li>
        <li class="reveal"><svg class="icon"><use href="#i-shield"/></svg><strong>Zuverlässig</strong><span>Kein Geld im Voraus, klare Verträge</span></li>
      </ul>
    </div>
  </div>

  <section class="section section--alt">
    <div class="container">
      <div class="section-head reveal">
        <span class="kicker">Branchen</span>
        <h2>Arbeitskräfte für Ihre Branche.</h2>
        <p>Wir vermitteln Hilfs- und Fachkräfte aus ganz Europa – tippen Sie auf eine Branche, um mehr zu erfahren.</p>
      </div>
      {branchen_teaser()}
      <p class="more reveal"><a class="btn btn--primary" href="branchen.html">Alle Branchen im Detail<svg class="icon"><use href="#i-arrow"/></svg></a></p>
    </div>
  </section>

  <section class="section">
    <div class="container about">
      <div class="about__media reveal">
        <picture><source srcset="assets/img/gespraech.webp" type="image/webp"><img src="assets/img/gespraech.jpg" width="489" height="675" loading="lazy" decoding="async" alt="Beraterin von Standard Plus bespricht mit einem Arbeitgeber den Personalbedarf"></picture>
        <div class="about__quote">Mit Standard Plus werden Sie auch nach der Vermittlung nicht allein gelassen.</div>
      </div>
      <div class="reveal">
        <span class="kicker">Über uns</span>
        <h2>Mehr als Vermittlung.</h2>
        <p class="about__lead">Bei Standard Plus endet unsere Arbeit nicht mit der Besetzung einer Stelle. Wir begleiten Sie <strong>vor, während und nach dem Arbeitsbeginn.</strong></p>
        <p class="more more--left"><a class="btn btn--plain" href="ueber-uns.html">Mehr über uns<svg class="icon"><use href="#i-arrow"/></svg></a></p>
      </div>
    </div>
  </section>

  <section class="section section--alt">
    <div class="container">
      <div class="section-head reveal">
        <span class="kicker">Ablauf</span>
        <h2>In 4 Schritten zum passenden Mitarbeiter.</h2>
      </div>
      {steps()}
      <p class="more reveal"><a class="btn btn--plain" href="ablauf.html">Ablauf im Detail<svg class="icon"><use href="#i-arrow"/></svg></a></p>
    </div>
  </section>

  <section class="section section--dark">
    <div class="container">
      <div class="section-head reveal">
        <span class="kicker">Pakete</span>
        <h2>Zwei transparente Pakete.</h2>
        <p>Qualifizierte Fachkräfte. Zuverlässig. Persönlich. Schnell.</p>
      </div>
      {pakete(kompakt=True)}
    </div>
  </section>
'''
    ld = org_graph() + [webpage(DOMAIN + "/", "Personalvermittlung europaweit | Standard Plus")]
    build("index.html", "Personalvermittlung europaweit | Standard Plus",
          "Standard Plus vermittelt zuverlässige Arbeitskräfte aus ganz Europa – für Bau, Landwirtschaft, Pflege, Logistik & Gastronomie. Kein Geld im Voraus.",
          start, ld, preload_hero=True)

    # ---------- Über uns ----------
    body = page_hero("Über uns", "Mehr als Vermittlung.",
                     "Standard Plus ist eine Personalvermittlung aus Ludwigsburg. Wir vermitteln zuverlässige Arbeitskräfte aus ganz Europa – und begleiten Sie vor, während und nach dem Arbeitsbeginn.",
                     "Über uns") + '''

  <section class="section">
    <div class="container about">
      <div class="about__media reveal">
        <picture><source srcset="assets/img/gespraech.webp" type="image/webp"><img src="assets/img/gespraech.jpg" width="489" height="675" loading="lazy" decoding="async" alt="Beraterin von Standard Plus bespricht mit einem Arbeitgeber den Personalbedarf"></picture>
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

  <section class="section">
    <div class="container">
      <div class="section-head reveal">
        <span class="kicker">Auf einen Blick</span>
        <h2>Standard Plus in Kürze.</h2>
      </div>
      <dl class="facts reveal">
        <div><dt>Unternehmen</dt><dd>Standard Plus Personalvermittlung</dd></div>
        <div><dt>Leistung</dt><dd>Vermittlung von Hilfs- und Fachkräften aus ganz Europa – mit Betreuung vor, während und nach dem Arbeitsbeginn</dd></div>
        <div><dt>Branchen</dt><dd><a href="branchen.html">Bau &amp; Handwerk, Landwirtschaft &amp; Milchvieh, Pferdebetriebe, Pflege &amp; Betreuung, Lager &amp; Logistik, Gastronomie &amp; Hotellerie</a></dd></div>
        <div><dt>Pakete</dt><dd><a href="pakete.html">Paket für 899&nbsp;€ einmalig · Abo-Paket 399&nbsp;€ einmalig + 119&nbsp;€ monatlich</a></dd></div>
        <div><dt>Service</dt><dd>Fester, deutschsprachiger Ansprechpartner · erreichbar an 6 Tagen pro Woche · kein Geld im Voraus</dd></div>
        <div><dt>Sitz</dt><dd>Heilbronner Straße 142, 71634 Ludwigsburg, Deutschland</dd></div>
        <div><dt>Kontakt</dt><dd><a href="tel:+4915228986993">0152 28986993</a> · <a href="mailto:info@standard-aaa.de">info@standard-aaa.de</a></dd></div>
      </dl>
    </div>
  </section>
'''
    build("ueber-uns.html", "Über uns – Personalvermittlung aus Ludwigsburg | Standard Plus",
          "Wer ist Standard Plus? Personalvermittlung aus Ludwigsburg für Arbeitskräfte aus ganz Europa – persönlich, erreichbar, zuverlässig. Kein Geld im Voraus.",
          body, sub("ueber-uns.html", "Über uns") + [{"@type": "AboutPage", "url": DOMAIN + "/ueber-uns.html", "about": {"@id": ORG_ID}}])

    # ---------- Branchen ----------
    body = page_hero("Branchen", "Was wir vermitteln.",
                     "Standard Plus vermittelt Hilfs- und Fachkräfte aus ganz Europa für sechs Bereiche. Hier sehen Sie, wen wir in welcher Branche vermitteln und wofür unsere Mitarbeiter typischerweise eingesetzt werden.",
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
    build("branchen.html", "Branchen: Bau, Landwirtschaft, Pflege & mehr | Standard Plus",
          "Welche Arbeitskräfte vermittelt Standard Plus? Bau & Handwerk, Landwirtschaft & Milchvieh, Pferdebetriebe, Pflege, Lager & Logistik, Gastronomie & Hotellerie.",
          body, sub("branchen.html", "Branchen") + services())

    # ---------- Ablauf ----------
    body = page_hero("Ablauf", "In 4 Schritten zum passenden Mitarbeiter.",
                     "Anfrage, Auswahl, Vorstellung und Begleitung: So läuft eine Vermittlung bei Standard Plus ab – einfach, transparent und mit festem Ansprechpartner.",
                     "Ablauf") + f'''

  <section class="section section--tight">
    <div class="container">
      {steps(detail=True)}
    </div>
  </section>

  <section class="section section--alt">
    <div class="container two-col">
      <div class="reveal">
        <span class="kicker">Damit es schnell geht</span>
        <h2>Was wir von Ihnen wissen sollten.</h2>
        <ul class="ticks">
          <li><svg class="icon"><use href="#i-check"/></svg>Branche und Aufgaben</li>
          <li><svg class="icon"><use href="#i-check"/></svg>Anzahl der gesuchten Mitarbeiter</li>
          <li><svg class="icon"><use href="#i-check"/></svg>Einsatzort und Startdatum</li>
          <li><svg class="icon"><use href="#i-check"/></svg>Arbeitszeiten und Dauer des Einsatzes</li>
          <li><svg class="icon"><use href="#i-check"/></svg>Besondere Anforderungen, zum Beispiel Führerschein oder Erfahrung</li>
        </ul>
      </div>
      <div class="reveal">
        <span class="kicker">Nach dem Start</span>
        <h2>Wir bleiben an Ihrer Seite.</h2>
        <p class="about__lead">Auch nach dem Arbeitsbeginn sind wir für Sie da – bei Fragen, Problemen oder im Arbeitsalltag. Unser Team ist an sechs Tagen pro Woche erreichbar. Passt ein Mitarbeiter nicht, tauschen wir in der Regel innerhalb von 3&nbsp;Werktagen aus; was genau gilt, hängt vom <a href="pakete.html">gewählten Paket</a> ab.</p>
      </div>
    </div>
  </section>
'''
    build("ablauf.html", "Ablauf der Personalvermittlung in 4 Schritten | Standard Plus",
          "So läuft die Vermittlung bei Standard Plus ab: Bedarf besprechen, passende Kandidaten, Auswahl & Vorstellung, Betreuung nach dem Start.",
          body, sub("ablauf.html", "Ablauf") + [{
              "@type": "HowTo", "name": "Personal über Standard Plus finden",
              "step": [{"@type": "HowToStep", "position": i, "name": h, "text": lang} for i, (_, h, _k, lang) in enumerate(STEPS, 1)]}])

    # ---------- Pakete ----------
    body = page_hero("Pakete", "Zwei transparente Pakete.",
                     "Qualifizierte Fachkräfte. Zuverlässig. Persönlich. Schnell. Wählen Sie das Paket, das zu Ihrem Personalbedarf passt.",
                     "Pakete") + f'''

  <section class="section section--dark">
    <div class="container">
      {pakete()}
    </div>
  </section>
'''
    build("pakete.html", "Pakete & Preise: 899 € oder Abo | Standard Plus",
          "Zwei transparente Pakete: einmalig 899 € inkl. Austausch in zwei Wochen oder Abo mit 399 € + 119 € monatlich inkl. Ersatz in 84 Stunden.",
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
                     "Kontakt") + "\n\n" + read("werkzeuge/inhalte/kontakt.html")
    build("kontakt.html", "Kontakt – Personal anfragen | Standard Plus",
          "Personal anfragen bei Standard Plus: Telefon 0152 28986993, WhatsApp, E-Mail info@standard-aaa.de oder Kontaktformular. Heilbronner Straße 142, Ludwigsburg.",
          body, sub("kontakt.html", "Kontakt") + [{"@type": "ContactPage", "url": DOMAIN + "/kontakt.html", "about": {"@id": ORG_ID}}],
          strip=True)

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
