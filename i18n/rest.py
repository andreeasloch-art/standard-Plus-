# Zeigt verbliebene, NICHT umhuellte Texte mit Buchstaben (zur Durchsicht).
import io, re, sys
for pfad in sys.argv[1:]:
    s = io.open(pfad, encoding='utf-8').read()
    s = re.sub(r'/\*.*?\*/', lambda m: re.sub(r'[^\n]', ' ', m.group(0)), s, flags=re.S)
    s = re.sub(r'(?m)^\s*//.*$', '', s)
    print('===', pfad)
    for m in re.finditer(r"(SP\.t\(|SP\.tInhalt\()?'((?:[^'\\\n]|\\.)*)'", s):
        if m.group(1): continue
        t = m.group(2)
        if not re.search(r'[A-Za-zÄÖÜäöü]{2}', t): continue
        if re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*(?: [a-z0-9]+(?:-[a-z0-9]+)*)*", t): continue   # Klassen, Schluessel
        if re.match(r"^(standardplus-|assets/|#|data-|sp\.|aria-|http|application/|text/|use strict|[a-z]+:|\.)", t): continue
        if re.fullmatch(r"[a-zA-Z]+", t) and t[0].islower(): continue
        if re.fullmatch(r"(DE|RO|EN|de|en|ro|[A-Z]{1,3}\d?|[a-z]{2}-[A-Z]{2})", t): continue
        z = s.count('\n', 0, m.start()) + 1
        zeile = io.open(pfad, encoding='utf-8').read().split('\n')[z-1].strip()
        if 'audit(' in zeile: continue
        print('%4d  %-40s | %s' % (z, t[:40], zeile[:110]))
