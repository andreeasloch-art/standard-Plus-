# Hilfsskript: haengt Uebersetzungen an die Tabellen an (Nummer <TAB> Text).
import io, sys
def schreiben(sprache, eintraege):
    pfad = 'i18n/%s.tsv' % sprache
    vorhanden = {}
    try:
        for z in io.open(pfad, encoding='utf-8'):
            if '\t' in z: vorhanden[z.split('\t', 1)[0]] = z.rstrip('\n')
    except FileNotFoundError:
        pass
    for nr, text in eintraege:
        assert '\t' not in text and '\n' not in text, nr
        vorhanden[nr] = '%s\t%s' % (nr, text)
    with io.open(pfad, 'w', encoding='utf-8') as aus:
        for nr in sorted(vorhanden):
            aus.write(vorhanden[nr] + '\n')
    print(sprache, len(eintraege), 'Eintraege, Tabelle jetzt', len(vorhanden))
