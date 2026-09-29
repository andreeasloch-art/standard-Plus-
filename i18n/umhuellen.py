# -*- coding: utf-8 -*-
"""
Setzt SP.t(...) um sichtbare deutsche Texte in einem Skript.
    python3 i18n/umhuellen.py datei.js [--ohne "Text1|Text2"] [--zeilen-ohne 12,40]
Ausgenommen sind automatisch: Protokolleintraege (SP.audit), Vergleiche,
Objektschluessel und bereits umhuellte Texte.
"""
import io, re, sys
sys.path.insert(0, 'i18n')
from js_texte import texte

pfad = sys.argv[1]
ohne = set()
zeilen_ohne = set()
if '--ohne' in sys.argv:
    ohne = set(sys.argv[sys.argv.index('--ohne') + 1].split('|'))
if '--zeilen-ohne' in sys.argv:
    zeilen_ohne = {int(z) for z in sys.argv[sys.argv.index('--zeilen-ohne') + 1].split(',') if z}

zeilen = io.open(pfad, encoding='utf-8').read().split('\n')
kandidaten = texte(pfad)
geaendert = 0
for nr, text in kandidaten:
    if text in ohne or nr in zeilen_ohne:
        continue
    z = zeilen[nr - 1]
    if 'audit(' in z:
        continue
    literal = "'" + text + "'"
    # Nicht anfassen: schon umhuellt, Vergleich, Objektschluessel
    muster = re.compile(r"(?<![\w.])(SP\.t\(|SP\.tInhalt\()?" + re.escape(literal) + r"(\s*:(?!:))?")
    def ersetzen(m):
        global geaendert
        vorher = z[:m.start()]
        if m.group(1):
            return m.group(0)
        # Objektschluessel nur, wenn der Text an Schluesselposition steht
        # ({ oder , davor) - ein ":" nach "? 'Text'" gehoert zur Bedingung.
        if m.group(2) and (re.search(r"[{,]\s*$", vorher) or not vorher.strip()):
            return m.group(0)
        if re.search(r"(===|!==|==|!=)\s*$", vorher) or re.search(r"(case)\s*$", vorher):
            return m.group(0)
        geaendert += 1
        return 'SP.t(' + literal + ')' + (m.group(2) or '')
    zeilen[nr - 1] = muster.sub(ersetzen, z)
io.open(pfad, 'w', encoding='utf-8').write('\n'.join(zeilen))
print('%s: %d Texte umhuellt' % (pfad, geaendert))
