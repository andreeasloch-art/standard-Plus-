# Sammelt alle Texte, die im JavaScript uebersetzt werden:
#  - Literale in SP.t(...) und SP.anzahl(...) (oberste Ebene der Argumente)
#  - Anzeigewerte aus sp-vokabular.js, sp-empfehlung.js und den Beispieldaten in sp-db.js
# Ergebnis: i18n/js_quelle.tsv  (Nummer TAB deutscher Text, \n als \\n)
import io, os, re, json, subprocess

WURZEL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = os.path.join(WURZEL, 'assets')
LIT = r"'((?:[^'\\\n]|\\.)*)'"

def entkommen(t):
    return t.encode('latin-1', 'backslashreplace').decode('unicode_escape') if '\\' in t else t

def ohne_kommentare(s):
    s = re.sub(r'/\*.*?\*/', lambda m: re.sub(r'[^\n]', ' ', m.group(0)), s, flags=re.S)
    return re.sub(r'(?m)^\s*//.*$', '', s)

def aufrufe(s, schluessel):
    for m in re.finditer(r'SP\.(t|anzahl|tInhalt)\(', s):
        i = m.end(); tiefe = 0; j = i; buf = []
        while j < len(s):
            c = s[j]
            if c == "'":
                k = j + 1
                while s[k] != "'":
                    k += 2 if s[k] == '\\' else 1
                if tiefe == 0: buf.append(s[j+1:k])
                j = k + 1; continue
            if c in '([{': tiefe += 1
            elif c in ')]}':
                if tiefe == 0: break
                tiefe -= 1
            j += 1
        for t in buf: schluessel.append(entkommen(t))

def buchstaben(t):
    return re.search(r'[A-Za-zÄÖÜäöüßăâîșțĂÂÎȘȚ]{2}', t)

keys = []
for name in sorted(os.listdir(A)):
    if not name.startswith('sp-') or not name.endswith('.js') or name.startswith('sp-i18n'): continue
    aufrufe(ohne_kommentare(io.open(os.path.join(A, name), encoding='utf-8').read()), keys)

# Woerterbuch: im Node auswerten
js = r"""
global.window = global; global.SP = { t: function(x){return x;}, tInhalt: function(x){return x;} };
require(process.argv[1]);
var v = SP.vok, raus = [];
v.LAENDER.forEach(function(l){ raus.push(l[1]); });
Object.keys(v.STAEDTE).forEach(function(k){ raus = raus.concat(v.STAEDTE[k]); });
Object.keys(v.BERUFE).forEach(function(k){ raus = raus.concat(v.BERUFE[k]); });
raus = raus.concat(v.REGIONEN, v.SPRACHEN, v.FAEHIGKEITEN, v.RECHTSFORMEN, v.STAATEN, v.VERFUEGBAR, v.LEISTUNGEN);
v.FUEHRERSCHEIN.forEach(function(f){ raus.push(f[1]); });
console.log(JSON.stringify(raus));
"""
aus = subprocess.run(['node', '-e', js, os.path.join(A, 'sp-vokabular.js')], capture_output=True, text=True, check=True).stdout
keys += json.loads(aus)
vok = io.open(os.path.join(A, 'sp-vokabular.js'), encoding='utf-8').read()
m = re.search(r'BRANCHEN_FALLBACK = \{(.*?)\};', vok, re.S)
keys += [entkommen(x) for x in re.findall(r"\w+: " + LIT, m.group(1))]
keys += ['Ort', 'Region', 'Land', 'Beruf', 'Branche', 'Sprache', 'Kenntnis', 'Rechtsform',
         'Verfügbar', 'Staatsangehörigkeit', 'Führerschein', 'Leistung', 'Unternehmen']

# Empfehlung: Kriterientypen und Anzeigeformen
emp = ohne_kommentare(io.open(os.path.join(A, 'sp-empfehlung.js'), encoding='utf-8').read())
keys += re.findall(r"typ: " + LIT, emp)
for blk in re.findall(r'ORT_NAME = \{(.*?)\};|LEIST_TEXT = \{(.*?)\};|return SP\.t\(\{(.*?)\}\[l\]', emp, re.S):
    for teil in blk:
        keys += [entkommen(x) for x in re.findall(r"[\w'-]+: " + LIT, teil)]

# Datenbank: Wochentage und Beispielinhalte
db = ohne_kommentare(io.open(os.path.join(A, 'sp-db.js'), encoding='utf-8').read())
for blk in re.findall(r'WOCHENTAGE: \[(.*?)\]|KURZ: \[(.*?)\]|NIVEAUS: \[(.*?)\]', db, re.S):
    for teil in blk: keys += re.findall(LIT, teil)
FELDER = ('ort|sprache|niveau|titel|position|taetigkeit|bis|staatsangehoerigkeit|zielland|beruf|'
          'verfuegbar|ueberMich|beschreibung|zeitraum|text|hinweis|flotte|verguetung|ausstattung|'
          'rechtsform|seit|lizenz|versicherung')
keys += [entkommen(x) for x in re.findall(r'\b(?:%s): %s' % (FELDER, LIT), db)]
for feld in ('faehigkeiten', 'leistungen', 'ausstattung', 'sprachen'):
    for blk in re.findall(r'\b%s: \[(.*?)\]' % feld, db, re.S):
        keys += [entkommen(x) for x in re.findall(LIT, blk)]

gesehen = set(); liste = []
for k in keys:
    if not k or k in gesehen or not buchstaben(k): continue
    if re.fullmatch(r'[A-Z]{1,3}\d?', k) or k in ('use strict',): continue
    gesehen.add(k); liste.append(k)

with io.open(os.path.join(WURZEL, 'i18n', 'js_quelle.tsv'), 'w', encoding='utf-8') as f:
    for i, k in enumerate(liste, 1):
        f.write('%04d\t%s\n' % (i, k.replace('\\', '\\\\').replace('\n', '\\n').replace('\t', '\\t')))
print(len(liste), 'Texte')
