# Nimmt SP.t(...) dort wieder weg, wo CSS-Klassen stehen: zweites Argument von
# SP.el(...) und Zuweisungen an className. Ausserdem reine Steuerzeichen.
import io, re, sys, glob
KLASSE = r"[a-z0-9]+(?:-[a-z0-9]+)*(?: [a-z0-9]+(?:-[a-z0-9]+)*)*"
for pfad in sys.argv[1:] or glob.glob('assets/sp-*.js'):
    s = io.open(pfad, encoding='utf-8').read(); o = s
    s = re.sub(r"(SP\.el\('[a-z0-9]+',\s*)SP\.t\(('" + KLASSE + r"')\)", r"\1\2", s)
    s = re.sub(r"(\.className\s*=\s*)SP\.t\(('" + KLASSE + r"')\)", r"\1\2", s)
    s = s.replace("SP.t('\\n\\n')", "'\\n\\n'").replace("SP.t('\\n')", "'\\n'")
    if s != o:
        io.open(pfad, 'w', encoding='utf-8').write(s)
        print('bereinigt:', pfad)
