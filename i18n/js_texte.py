# Listet sichtbare deutsche Texte in den Skripten auf (ohne Kommentare).
import re, sys, io
UMLAUT = re.compile(r'[äöüÄÖÜß]')
def texte(pfad):
    s = io.open(pfad, encoding='utf-8').read()
    # Kommentare ausblenden, Zeilennummern erhalten
    def leer(m): return re.sub(r'[^\n]', ' ', m.group(0))
    s = re.sub(r'/\*.*?\*/', leer, s, flags=re.S)
    s = re.sub(r"(?m)^\s*//[^\n]*", leer, s)
    raus = []
    for m in re.finditer(r"'((?:[^'\\\n]|\\.)*)'", s):
        t = m.group(1)
        if len(t) < 2 or not re.search(r'[A-Za-zÄÖÜäöü]', t): continue
        if t in ('use strict',): continue
        sprache = (UMLAUT.search(t) or re.search(r'[A-ZÄÖÜ][a-zäöüß]+ [A-Za-zÄÖÜäöüß]', t)
                   or re.fullmatch(r'[A-ZÄÖÜ][a-zäöüß]{3,}[.!?]?', t) or re.search(r'[a-zäöü]{3,} [a-zäöü]{3,}', t))
        if re.fullmatch(r'[\w.#:\-\[\]=*> ,()"/?&%+]*', t) and not sprache:
            continue
        if re.match(r'^(standardplus-|assets/|#i-|data-|sp\.|aria-|http|ws:|wss:)', t): continue
        if re.fullmatch(r'[a-z]+(-[a-z]+)+', t): continue       # css-klassen
        if re.fullmatch(r'(de|en|ro|DE|RO|EN)(-[A-Z]{2})?', t): continue
        zeile = s.count('\n', 0, m.start()) + 1
        raus.append((zeile, t))
    return raus
if __name__ == '__main__':
  for pfad in sys.argv[1:]:
    t = texte(pfad)
    print('=== %s (%d)' % (pfad, len(t)))
    for z, x in t: print('%4d  %s' % (z, x))
