# -*- coding: utf-8 -*-
"""
Zerlegt eine HTML-Seite in uebersetzbare Abschnitte.

Ein Abschnitt ist Text zusammen mit den Auszeichnungen, die mitten im Satz
stehen (<b>, <a>, <br>, Symbole). So wird ein Satz als Ganzes uebersetzt
und nicht in Bruchstuecken - Wortstellung ist in jeder Sprache anders.

Die Auszeichnungen werden durch Platzhalter [[1]], [[2]] ersetzt. Die
Uebersetzung muss dieselben Platzhalter enthalten; das wird geprueft.
"""
import html, re

# Tags, die mitten im Text vorkommen und den Satz nicht beenden
INLINE = {'b', 'strong', 'em', 'i', 'small', 'code', 'mark', 'br', 'sup', 'sub', 'u', 'abbr', 'wbr'}
# Tags, die inline sind, wenn schon Text davor steht - sonst beginnen sie einen eigenen Abschnitt
HALB = {'a', 'span'}
LEER = {'br', 'wbr', 'img', 'input', 'meta', 'link', 'hr', 'use', 'source'}
ROH = {'script', 'style'}
ATTRIBUTE = ('placeholder', 'aria-label', 'title', 'alt')

TOKEN = re.compile(r'<!--.*?-->|<(script|style)\b.*?</\1\s*>|<svg\b.*?</svg\s*>|<[^>]+>|[^<]+', re.S | re.I)


def tagname(tok):
    m = re.match(r'</?\s*([a-zA-Z0-9-]+)', tok)
    return m.group(1).lower() if m else ''


def ist_text(kern):
    """Nur Abschnitte mit echten Woertern uebersetzen - keine Zahlen, Kuerzel, Preise."""
    ohne = re.sub(r'\[\[\d+\]\]', ' ', kern)
    woerter = re.findall(r'[A-Za-zÄÖÜäöüßĂÂÎȘȚăâîșț]{2,}', ohne)
    if not woerter:
        return False
    # Einzelne Laenderkuerzel, Kennzeichen und Einheiten bleiben stehen
    if all(re.fullmatch(r'[A-Z]{1,4}', w) for w in woerter):
        return False
    return True


def normal(text):
    return re.sub(r'\s+', ' ', html.unescape(text)).strip()


class Abschnitt:
    def __init__(self):
        self.teile = []   # Liste von ('t', text) oder ('x', tag)

    def hat_text(self):
        return any(k == 't' and re.search(r'\S', v) for k, v in self.teile)

    def leer(self):
        return not self.teile


def zerlegen(quelle):
    """Liefert eine Liste: ('roh', text) oder ('abschnitt', Abschnitt)."""
    ausgabe = []
    aktuell = Abschnitt()
    offen_als_grenze = []  # Stapel fuer <a>/<span>: True = Grenze, False = inline

    def abschliessen():
        nonlocal aktuell
        if not aktuell.leer():
            ausgabe.append(('abschnitt', aktuell))
        aktuell = Abschnitt()

    for m in TOKEN.finditer(quelle):
        tok = m.group(0)
        if tok.startswith('<!--') or re.match(r'<(script|style)\b', tok, re.I):
            abschliessen(); ausgabe.append(('roh', tok)); continue
        if tok.lower().startswith('<svg'):
            aktuell.teile.append(('x', tok)); continue
        if not tok.startswith('<'):
            aktuell.teile.append(('t', tok)); continue

        name = tagname(tok)
        schliessend = tok.startswith('</')
        if name in INLINE:
            aktuell.teile.append(('x', tok)); continue
        if name in HALB:
            if not schliessend:
                inline = aktuell.hat_text()
                offen_als_grenze.append(not inline)
                if inline:
                    aktuell.teile.append(('x', tok))
                else:
                    abschliessen(); ausgabe.append(('roh', tok))
            else:
                grenze = offen_als_grenze.pop() if offen_als_grenze else True
                if grenze:
                    abschliessen(); ausgabe.append(('roh', tok))
                else:
                    aktuell.teile.append(('x', tok))
            continue
        # Alle anderen Tags beenden den Abschnitt
        abschliessen()
        ausgabe.append(('roh', tok))
    abschliessen()
    return ausgabe


def kern_und_rahmen(abschnitt):
    """
    Trennt fuehrende/abschliessende Platzhalter und Leerraum ab.
    Liefert (vorne, kern_mit_platzhaltern, platzhalter_liste, hinten).
    """
    teile = abschnitt.teile
    a, e = 0, len(teile)
    while a < e and (teile[a][0] == 'x' or not teile[a][1].strip()):
        a += 1
    while e > a and (teile[e - 1][0] == 'x' or not teile[e - 1][1].strip()):
        e -= 1
    vorne = ''.join(v for _, v in teile[:a])
    hinten = ''.join(v for _, v in teile[e:])
    mitte = teile[a:e]
    platzhalter = []
    kern = ''
    for k, v in mitte:
        if k == 'x':
            platzhalter.append(v)
            kern += '[[%d]]' % len(platzhalter)
        else:
            kern += v
    # Leerraum am Rand des Kerns gehoert zum Rahmen
    roh_vorne = re.match(r'^\s*', kern).group(0)
    roh_hinten = re.search(r'\s*$', kern).group(0)
    return vorne + roh_vorne, normal(kern), platzhalter, roh_hinten + hinten


def attribut_texte(tag):
    for name in ATTRIBUTE:
        for m in re.finditer(r'\s%s="([^"]*)"' % name, tag):
            if ist_text(normal(m.group(1))):
                yield name, m.group(1)
