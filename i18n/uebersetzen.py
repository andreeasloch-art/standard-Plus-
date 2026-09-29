# -*- coding: utf-8 -*-
"""
Erzeugt die englische und die rumaenische Fassung aus den deutschen Seiten.

    python3 i18n/uebersetzen.py            alle Sprachen erzeugen
    python3 i18n/uebersetzen.py --pruefen  nur fehlende Uebersetzungen melden

Deutsch bleibt die Quelle. Aendern Sie nur die deutschen Seiten und die
Uebersetzungstabellen i18n/en.tsv und i18n/ro.tsv - die Ordner en/ und ro/
werden bei jedem Lauf neu geschrieben.

Die Tabellen haben eine Zeile je Abschnitt:   Nummer <TAB> Uebersetzung
Welche Nummer zu welchem deutschen Text gehoert, steht in i18n/quelle.tsv.
"""
import glob, html, io, json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from abschnitte import zerlegen, kern_und_rahmen, ist_text, attribut_texte, normal

WURZEL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(WURZEL)
SPRACHEN = {'en': 'English', 'ro': 'Română'}


def seiten():
    return sorted(glob.glob('standardplus-*.html'))


# ---------- 1. Quelltexte sammeln und nummerieren ----------
def quelle_aufbauen():
    """Vergibt stabile Nummern: bekannte Texte behalten ihre Nummer."""
    bekannt = {}
    if os.path.exists('i18n/quelle.tsv'):
        for zeile in io.open('i18n/quelle.tsv', encoding='utf-8'):
            if '\t' in zeile:
                nr, text = zeile.rstrip('\n').split('\t', 1)
                bekannt[text] = nr
    reihenfolge = []
    def merken(text):
        if text and ist_text(text) and text not in reihenfolge:
            reihenfolge.append(text)
    for f in seiten():
        quelle = io.open(f, encoding='utf-8').read()
        for art, x in zerlegen(quelle):
            if art == 'roh':
                if x.startswith('<') and not x.startswith('<!--'):
                    for _, wert in attribut_texte(x):
                        merken(normal(wert))
                    m = re.search(r'<meta name="description" content="([^"]+)"', x)
                    if m:
                        merken(normal(m.group(1)))
                continue
            merken(kern_und_rahmen(x)[1])
    # Auch Nummern aus den Uebersetzungstabellen beruecksichtigen: eine Nummer, deren
    # Text entfernt wurde, darf nie fuer einen neuen Text wiederverwendet werden.
    belegt = [int(n) for n in bekannt.values()]
    for sp in SPRACHEN:
        belegt += [int(n) for n in tabelle_laden(sp)]
    naechste = max(belegt + [0]) + 1
    tabelle = {}
    for text in reihenfolge:
        if text in bekannt:
            tabelle[text] = bekannt[text]
        else:
            tabelle[text] = '%04d' % naechste
            naechste += 1
    with io.open('i18n/quelle.tsv', 'w', encoding='utf-8') as aus:
        for text, nr in sorted(tabelle.items(), key=lambda kv: kv[1]):
            aus.write('%s\t%s\n' % (nr, text))
    return tabelle


def tabelle_laden(sprache):
    pfad = 'i18n/%s.tsv' % sprache
    daten = {}
    if not os.path.exists(pfad):
        return daten
    for n, zeile in enumerate(io.open(pfad, encoding='utf-8'), 1):
        zeile = zeile.rstrip('\n')
        if not zeile.strip() or zeile.startswith('#'):
            continue
        if '\t' not in zeile:
            raise SystemExit('%s Zeile %d: Tabulator fehlt' % (pfad, n))
        nr, text = zeile.split('\t', 1)
        daten[nr.strip()] = text
    return daten


PH = re.compile(r'\[\[(\d+)\]\]')


def pruefen(quelle, sprache, nummern, tabelle):
    fehler, fehlt = [], []
    for text, nr in nummern.items():
        if nr not in tabelle:
            fehlt.append((nr, text))
            continue
        a = sorted(PH.findall(text))
        b = sorted(PH.findall(tabelle[nr]))
        if a != b:
            fehler.append('%s %s: Platzhalter %s statt %s' % (sprache, nr, b, a))
    return fehler, fehlt


# ---------- 2. Eine Seite uebersetzen ----------
def html_sicher(text):
    """Uebersetzten Text wieder in HTML schreiben - nur < > & maskieren."""
    return text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def attr_sicher(text):
    return html_sicher(text).replace('"', '&quot;')


RECHTSTEXTE = ('standardplus-agb.html', 'standardplus-datenschutz.html', 'standardplus-impressum.html')
VERBINDLICH = {
    'en': '  <div class="notice notice-info mb24"><span>This is a translation for your convenience. '
          'Only the <a href="%s" hreflang="de" lang="de">German version</a> is legally binding.</span></div>',
    'ro': '  <div class="notice notice-info mb24"><span>Aceasta este o traducere pentru informarea dumneavoastră. '
          'Doar <a href="%s" hreflang="de" lang="de">versiunea în limba germană</a> este obligatorie din punct de vedere juridic.</span></div>',
}


def seite_uebersetzen(pfad, sprache, nummern, tabelle, fehlend):
    quelle = io.open(pfad, encoding='utf-8').read()
    teile = []

    def wort(text):
        nr = nummern.get(text)
        if nr and nr in tabelle:
            return tabelle[nr]
        if nr:
            fehlend.add(nr)
        return text

    for art, x in zerlegen(quelle):
        if art == 'roh':
            if x.startswith('<') and not x.startswith('<!--') and not re.match(r'<(script|style)', x, re.I):
                def attr(m):
                    wert = normal(html.unescape(m.group(2)))
                    if ist_text(wert):
                        return ' %s="%s"' % (m.group(1), attr_sicher(wort(wert)).replace('\\n', '&#10;'))
                    return m.group(0)
                x = re.sub(r'\s(placeholder|aria-label|title|alt)="([^"]*)"', attr, x)
                x = re.sub(r'(<meta name="description" content=")([^"]+)(")',
                           lambda m: m.group(1) + attr_sicher(wort(normal(m.group(2)))) + m.group(3), x)
            teile.append(x)
            continue
        vorne, kern, platzhalter, hinten = kern_und_rahmen(x)
        if not ist_text(kern):
            teile.append(''.join(v for _, v in x.teile))
            continue
        uebersetzt = html_sicher(wort(kern))
        uebersetzt = PH.sub(lambda m: platzhalter[int(m.group(1)) - 1], uebersetzt)
        teile.append(vorne + uebersetzt + hinten)

    s = ''.join(teile)
    name = os.path.basename(pfad)

    # Rechtstexte: Hinweis, dass die deutsche Fassung verbindlich ist
    if name in RECHTSTEXTE:
        hinweis = VERBINDLICH[sprache] % ('../' + name)
        s = re.sub(r'(<main class="legal" id="main">\s*<h1>.*?</h1>)', lambda m: m.group(1) + '\n' + hinweis, s, count=1, flags=re.S)
    # Sprache der Seite
    s = s.replace('<html lang="de">', '<html lang="%s">' % sprache, 1)
    # Pfade: die Seiten liegen eine Ebene tiefer
    s = re.sub(r'(href|src)="(assets/|manifest\.webmanifest)', r'\1="../\2', s)
    s = s.replace('href="../manifest.webmanifest"', 'href="manifest.webmanifest"')
    # Woerterbuch fuer Texte aus den Skripten, vor allen anderen Skripten laden
    erstes = re.search(r'<script src="\.\./assets/sp-[a-z0-9-]+\.js(\?v=\d+)?"></script>', s)
    if erstes:
        stempel = erstes.group(1) or ''
        s = (s[:erstes.start()] + '<script src="../assets/sp-i18n-%s.js%s"></script>\n' % (sprache, stempel)
             + s[erstes.start():])
    return s


# ---------- 3. Sprachverweise in allen Fassungen ----------
def verweise(s, name, eigene):
    s = re.sub(r'\n?<link rel="alternate" hreflang="[a-z-]+" href="[^"]*"/>', '', s)
    zeilen = []
    for code in ['de'] + list(SPRACHEN):
        if code == eigene:
            ziel = name
        elif eigene == 'de':
            ziel = '%s/%s' % (code, name)
        else:
            ziel = ('../%s' % name) if code == 'de' else ('../%s/%s' % (code, name))
        zeilen.append('<link rel="alternate" hreflang="%s" href="%s"/>' % (code, ziel))
    return s.replace('</head>', '\n'.join(zeilen) + '\n</head>', 1)


def manifest(sprache, tabelle, nummern):
    daten = json.load(io.open('manifest.webmanifest', encoding='utf-8'))
    namen = {
        'en': ('Standard Plus Recruitment', 'Find vetted skilled workers across the EU, hold interviews with live translation and organise the journey.',
               ['Dashboard', 'Find workers', 'Interpreter', 'Bus connections']),
        'ro': ('Standard Plus Recrutare', 'Găsiți specialiști verificați din UE, purtați interviuri cu traducere live și organizați călătoria.',
               ['Panou', 'Caută specialiști', 'Interpret', 'Curse de autocar']),
    }[sprache]
    daten['name'], daten['description'] = namen[0], namen[1]
    daten['lang'] = sprache
    daten['id'] = './%s/' % sprache
    daten['start_url'] = './standardplus-main.html'
    daten['scope'] = './'
    for i, eintrag in enumerate(daten.get('icons', [])):
        eintrag['src'] = '../' + eintrag['src']
    for i, k in enumerate(daten.get('shortcuts', [])):
        k['name'] = namen[2][i]
        for sym in k.get('icons', []):
            sym['src'] = '../' + sym['src']
    with io.open('%s/manifest.webmanifest' % sprache, 'w', encoding='utf-8') as aus:
        json.dump(daten, aus, ensure_ascii=False, indent=2)


def main():
    nur_pruefen = '--pruefen' in sys.argv
    nummern = quelle_aufbauen()
    gesamt_fehlt = 0
    for sprache in SPRACHEN:
        tabelle = tabelle_laden(sprache)
        fehler, fehlt = pruefen(None, sprache, nummern, tabelle)
        for f in fehler:
            print('FEHLER', f)
        print('%s: %d von %d Abschnitten uebersetzt' % (sprache, len(nummern) - len(fehlt), len(nummern)))
        gesamt_fehlt += len(fehlt)
        if fehler:
            raise SystemExit(1)
        if nur_pruefen:
            continue
        os.makedirs(sprache, exist_ok=True)
        fehlend = set()
        for pfad in seiten():
            s = seite_uebersetzen(pfad, sprache, nummern, tabelle, fehlend)
            s = verweise(s, os.path.basename(pfad), sprache)
            io.open(os.path.join(sprache, os.path.basename(pfad)), 'w', encoding='utf-8').write(s)
        manifest(sprache, tabelle, nummern)
    if not nur_pruefen:
        # Deutsche Seiten bekommen die Verweise auf die anderen Sprachen
        for pfad in seiten():
            s = io.open(pfad, encoding='utf-8').read()
            neu = verweise(s, os.path.basename(pfad), 'de')
            if neu != s:
                io.open(pfad, 'w', encoding='utf-8').write(neu)
        print('Seiten geschrieben nach en/ und ro/')
    return gesamt_fehlt

if __name__ == '__main__':
    main()
