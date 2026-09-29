#!/bin/bash
# Setzt einen frischen Versionsstempel auf alle Asset-Verweise.
# Nach jeder Aenderung an CSS, JS oder Texten ausfuehren, damit Browser neu laden.
# Ablauf: 1. deutsche Seiten stempeln  2. Woerterbuecher der Skripte bauen
#         3. englische und rumaenische Seiten erzeugen (uebernehmen den Stempel)
#         4. Liste des Offline-Speichers (sw.js) neu schreiben - sonst
#            behielte die installierte App die alte Fassung.
cd "$(dirname "$0")" || exit 1
python3 - <<'PY'
import io, re, glob, time
V = time.strftime('%Y%m%d%H%M%S')
n = 0
for p in sorted(glob.glob('standardplus-*.html')):
    s = io.open(p, encoding='utf-8').read(); o = s
    s = re.sub(r'(assets/sp-[a-z0-9-]+\.(?:js|css))\?v=\d+', r'\1', s)
    s = re.sub(r'(assets/sp-[a-z0-9-]+\.(?:js|css))(["\'])', r'\1?v=' + V + r'\2', s)
    if s != o:
        io.open(p, 'w', encoding='utf-8').write(s); n += 1
io.open('.stempel', 'w').write(V)
print('Version', V, 'auf', n, 'deutschen Seiten gesetzt')
PY
python3 i18n/js_bauen.py || exit 1
python3 i18n/uebersetzen.py || exit 1
python3 - <<'PY'
import io, re, glob, os
V = io.open('.stempel').read().strip()
os.remove('.stempel')
if os.path.exists('sw.js'):
    alle = sorted(glob.glob('standardplus-*.html')) + sorted(glob.glob('en/standardplus-*.html')) + sorted(glob.glob('ro/standardplus-*.html'))
    seiten = [p for p in alle if not p.endswith('standardplus-offline.html')]
    # Welche Dateien laden die Seiten gestempelt?
    gestempelt = set()
    for p in alle:
        gestempelt.update(re.findall(r'assets/(sp-[a-z0-9-]+\.(?:js|css))\?v=', io.open(p, encoding='utf-8').read()))
    dateien = []
    for p in sorted(glob.glob('assets/sp-*.js')) + sorted(glob.glob('assets/sp-*.css')):
        name = os.path.basename(p)
        dateien.append(p + '?v=' + V if name in gestempelt else p)
    dateien += sorted(glob.glob('assets/app/*.png')) + ['manifest.webmanifest', 'en/manifest.webmanifest', 'ro/manifest.webmanifest',
                                                        'en/standardplus-offline.html', 'ro/standardplus-offline.html']

    def liste(xs):
        return '[\n  ' + ',\n  '.join("'%s'" % x for x in xs) + '\n]'

    block = ("/* ANFANG automatisch */\n"
             "const VERSION = '%s';\n"
             "const SEITEN = %s;\n"
             "const DATEIEN = %s;\n"
             "/* ENDE automatisch */") % (V, liste(seiten), liste(dateien))
    sw = io.open('sw.js', encoding='utf-8').read()
    sw = re.sub(r'/\* ANFANG automatisch \*/.*?/\* ENDE automatisch \*/', lambda m: block, sw, flags=re.S)
    io.open('sw.js', 'w', encoding='utf-8').write(sw)
    print('Offline-Speicher:', len(seiten), 'Seiten,', len(dateien), 'Dateien')
PY
