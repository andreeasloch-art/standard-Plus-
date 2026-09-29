# Baut assets/sp-i18n-en.js und assets/sp-i18n-ro.js aus i18n/js_en.json und i18n/js_ro.json
# (deutscher Text -> Uebersetzung). Fehlt ein Eintrag, bleibt der deutsche Text stehen.
#   --aus-tsv   uebernimmt einmalig die nummerierten Tabellen js_XX*.tsv (passend zu js_quelle.tsv)
#   --pruefen   meldet fehlende Uebersetzungen, ohne zu schreiben
import io, os, re, sys, json, glob

WURZEL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
I = os.path.join(WURZEL, 'i18n')
PLATZ = re.compile(r'\{(\w+)\}')

def tsv(pfad):
    d = {}
    for z in io.open(pfad, encoding='utf-8').read().split('\n'):
        if not z.strip(): continue
        nr, text = z.split('\t', 1)
        d[nr] = text.replace('\\n', '\n').replace('\\t', '\t').replace('\\\\', '\\')
    return d

quelle = tsv(os.path.join(I, 'js_quelle.tsv'))
fehler = 0
for sprache in ('en', 'ro'):
    jpfad = os.path.join(I, 'js_%s.json' % sprache)
    woerter = json.load(io.open(jpfad, encoding='utf-8')) if os.path.exists(jpfad) else {}
    if '--aus-tsv' in sys.argv:
        for pfad in sorted(glob.glob(os.path.join(I, 'js_%s*.tsv' % sprache))):
            for nr, text in tsv(pfad).items():
                if nr not in quelle:
                    print('unbekannte Nummer', sprache, nr); fehler += 1; continue
                woerter[quelle[nr]] = text
    # Platzhalter pruefen ({de} ist die rumaenische Pluralregel und darf zusaetzlich stehen)
    for de, ueb in woerter.items():
        a = set(PLATZ.findall(de)); b = set(PLATZ.findall(ueb)) - {'de'}
        if a != b:
            print('Platzhalter', sprache, repr(de), '->', repr(ueb)); fehler += 1
    fehlt = [q for q in quelle.values() if q not in woerter]
    print(sprache, len(woerter), 'Einträge,', len(fehlt), 'ohne eigene Übersetzung')
    if '--pruefen' in sys.argv:
        continue
    json.dump(woerter, io.open(jpfad, 'w', encoding='utf-8'), ensure_ascii=False, indent=0, sort_keys=True)
    inhalt = ('/* Standard Plus - Wörterbuch %s (automatisch erzeugt aus i18n/js_%s.json) */\n'
              'window.SP = window.SP || {};\nwindow.SP.woerter = %s;\n') % (
              sprache.upper(), sprache, json.dumps(woerter, ensure_ascii=False, sort_keys=True, separators=(',', ':')))
    io.open(os.path.join(WURZEL, 'assets', 'sp-i18n-%s.js' % sprache), 'w', encoding='utf-8').write(inhalt)
sys.exit(1 if fehler else 0)
