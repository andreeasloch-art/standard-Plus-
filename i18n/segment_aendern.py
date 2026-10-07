# Aendert einen Seitentext in Deutsch, Englisch und Rumaenisch zugleich - die Nummer bleibt.
#   from segment_aendern import aendern; aendern('0567', de, en, ro)
import io, os
I = os.path.dirname(os.path.abspath(__file__))

def _setzen(datei, nr, text):
    pfad = os.path.join(I, datei)
    zeilen = io.open(pfad, encoding='utf-8').read().split('\n')
    for i, z in enumerate(zeilen):
        if z.startswith(nr + '\t'):
            zeilen[i] = nr + '\t' + text
            break
    else:
        zeilen.insert(-1 if zeilen and zeilen[-1] == '' else len(zeilen), nr + '\t' + text)
    io.open(pfad, 'w', encoding='utf-8').write('\n'.join(zeilen))

def aendern(nr, de, en, ro):
    _setzen('quelle.tsv', nr, de)
    _setzen('en.tsv', nr, en)
    _setzen('ro.tsv', nr, ro)
