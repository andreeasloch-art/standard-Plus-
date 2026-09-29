# -*- coding: utf-8 -*-
"""
Standard Plus - Upload-Paket erstellen
======================================
    bash veroeffentlichen.sh

1. liest FIRMENDATEN.txt und bricht ab, solange Pflichtangaben fehlen
2. erzeugt alle Sprachfassungen neu (neu-stempeln.sh)
3. kopiert nur die oeffentlichen Dateien nach  upload/webspace/
4. setzt die Firmendaten in Impressum, Datenschutz, AGB (DE, EN, RO) ein,
   entfernt interne Entwurfshinweise und HTML-Kommentare
5. schreibt .htaccess (Apache), _headers (Netlify/Cloudflare), robots.txt,
   sitemap.xml und .well-known/security.txt
6. prueft: keine Platzhalter, keine toten Verweise
7. packt alles in StandardPlus-Upload.zip (Schreibtisch und Downloads)
"""
import datetime, glob, html, html.entities, io, os, re, shutil, subprocess, sys, zipfile

WURZEL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(WURZEL)
ZIEL = os.path.join('upload', 'webspace')


def abbruch(text):
    print('\n  ABBRUCH: ' + text + '\n')
    sys.exit(1)


# ---------- 1. Firmendaten ----------
def firmendaten():
    pfad = 'FIRMENDATEN.txt'
    if '--daten' in sys.argv:
        pfad = sys.argv[sys.argv.index('--daten') + 1]
    if not os.path.exists(pfad):
        abbruch(pfad + ' fehlt.')
    d = {}
    for zeile in io.open(pfad, encoding='utf-8'):
        zeile = zeile.strip()
        if not zeile or zeile.startswith('#') or ':' not in zeile:
            continue
        k, v = zeile.split(':', 1)
        d[k.strip()] = v.strip()
    pflicht = ['firmenname', 'strasse_hausnummer', 'plz_ort', 'land', 'telefon', 'geschaeftsfuehrung',
               'email_kontakt', 'email_datenschutz', 'email_sicherheit', 'domain',
               'aufsichtsbehoerde', 'gerichtsstand']
    fehlt = [k for k in pflicht if not d.get(k)]
    if fehlt:
        abbruch('In FIRMENDATEN.txt fehlen noch: ' + ', '.join(fehlt))
    for k in ('email_kontakt', 'email_datenschutz', 'email_sicherheit'):
        if not re.fullmatch(r'[^@\s]+@[^@\s]+\.[a-z]{2,}', d[k], re.I):
            abbruch('%s sieht nicht wie eine E-Mail-Adresse aus: %s' % (k, d[k]))
    d['domain'] = re.sub(r'^https?://', '', d['domain']).strip('/')
    if not re.fullmatch(r'[a-z0-9.-]+\.[a-z]{2,}', d['domain'], re.I):
        abbruch('domain bitte ohne https:// und ohne Pfad angeben, z. B. standardplus.de')
    if bool(d.get('registergericht')) != bool(d.get('registernummer')):
        abbruch('registergericht und registernummer bitte beide ausfuellen oder beide leer lassen.')
    aueg = d.get('aueg_erlaubnis', 'nein')
    if aueg.lower() != 'nein' and aueg.count('|') != 2:
        abbruch('aueg_erlaubnis: entweder "nein" oder "Behoerde | Datum | Aktenzeichen".')
    return d


# ---------- 2. Platzhalter je Sprache ----------
LAENDER = {'deutschland': ('Germany', 'Germania'), 'österreich': ('Austria', 'Austria'),
           'oesterreich': ('Austria', 'Austria'), 'schweiz': ('Switzerland', 'Elveția'),
           'rumänien': ('Romania', 'România'), 'rumaenien': ('Romania', 'România')}

PLATZHALTER = {
    'de': [
        ('[Firmenname, Rechtsform]', 'firma'), ('[Firmenname]', 'firma'),
        ('[Straße und Hausnummer]', 'strasse_hausnummer'), ('[Postleitzahl und Ort]', 'plz_ort'),
        ('[Land]', 'land'), ('[Telefonnummer]', 'telefon'),
        ('[Vor- und Nachname der Geschäftsführung]', 'geschaeftsfuehrung'),
        ('[Amtsgericht]', 'registergericht'), ('[HRB 000000]', 'registernummer'), ('[DE000000000]', 'ust_id'),
        ('[Bundesagentur für Arbeit, zuständige Regionaldirektion]', 'aueg_behoerde'),
        ('[Datum]', 'aueg_datum'), ('[Nummer]', 'aueg_az'),
        ('[Vor- und Nachname]', 'verantwortlich_name'), ('[Anschrift]', 'verantwortlich_anschrift'),
        ('[zuständige Landesdatenschutzbehörde eintragen]', 'aufsichtsbehoerde'),
        ('[Ort]', 'gerichtsstand'),
    ],
    'en': [
        ('[Company name, legal form]', 'firma'), ('[Company name]', 'firma'),
        ('[Street and number]', 'strasse_hausnummer'), ('[Postcode and town]', 'plz_ort'),
        ('[Country]', 'land'), ('[phone number]', 'telefon'),
        ('[First and last name of the management]', 'geschaeftsfuehrung'),
        ('[local court]', 'registergericht'), ('[HRB 000000]', 'registernummer'), ('[DE000000000]', 'ust_id'),
        ('[Federal Employment Agency, competent regional directorate]', 'aueg_behoerde'),
        ('[date]', 'aueg_datum'), ('[number]', 'aueg_az'),
        ('[First and last name]', 'verantwortlich_name'), ('[Address]', 'verantwortlich_anschrift'),
        ('[enter the competent state data protection authority]', 'aufsichtsbehoerde'),
        ('[place]', 'gerichtsstand'),
    ],
    'ro': [
        ('[Denumirea companiei, forma juridică]', 'firma'), ('[Denumirea companiei]', 'firma'),
        ('[Strada și numărul]', 'strasse_hausnummer'), ('[Cod poștal și localitate]', 'plz_ort'),
        ('[Țara]', 'land'), ('[număr de telefon]', 'telefon'),
        ('[Prenumele și numele conducerii]', 'geschaeftsfuehrung'),
        ('[judecătorie]', 'registergericht'), ('[HRB 000000]', 'registernummer'), ('[DE000000000]', 'ust_id'),
        ('[Agenția Federală pentru Ocuparea Forței de Muncă, direcția regională competentă]', 'aueg_behoerde'),
        ('[data]', 'aueg_datum'), ('[număr]', 'aueg_az'),
        ('[Prenume și nume]', 'verantwortlich_name'), ('[Adresă]', 'verantwortlich_anschrift'),
        ('[introduceți autoritatea regională competentă pentru protecția datelor]', 'aufsichtsbehoerde'),
        ('[localitate]', 'gerichtsstand'),
    ],
}
MAILS = [('[kontakt@ihre-domain.de]', 'email_kontakt'), ('[datenschutz@ihre-domain.de]', 'email_datenschutz'),
         ('[security@ihre-domain.de]', 'email_sicherheit')]


def werte_fuer(d, sprache):
    w = dict(d)
    w['firma'] = ' '.join(x for x in (d['firmenname'], d.get('rechtsform', '')) if x)
    land = LAENDER.get(d['land'].lower())
    if land and sprache != 'de':
        w['land'] = land[0] if sprache == 'en' else land[1]
    if not d.get('verantwortlich_name'):
        w['verantwortlich_name'] = d['geschaeftsfuehrung']
    if not d.get('verantwortlich_anschrift'):
        w['verantwortlich_anschrift'] = '%s, %s' % (d['strasse_hausnummer'], d['plz_ort'])
    aueg = d.get('aueg_erlaubnis', 'nein')
    if aueg.lower() != 'nein':
        w['aueg_behoerde'], w['aueg_datum'], w['aueg_az'] = [x.strip() for x in aueg.split('|')]
    return w


def als_muster(platzhalter):
    """Platzhalter als Suchmuster: HTML-Entitaeten und Zeilenumbrueche zulassen."""
    teile = []
    for zeichen in platzhalter:
        if zeichen == ' ':
            teile.append(r'\s+')
        else:
            varianten = {re.escape(zeichen)}
            ent = html.entities.codepoint2name.get(ord(zeichen))
            if ent:
                varianten.add(re.escape('&%s;' % ent))
            teile.append('(?:%s)' % '|'.join(sorted(varianten)))
    return re.compile(''.join(teile))


def entfernen(s, klasse):
    muster = re.compile(r'<(div|p|h2|section|li)\b[^>]*\bclass="[^"]*\b%s\b[^"]*"[^>]*>.*?</\1>\s*' % re.escape(klasse), re.S)
    return muster.sub('', s)


def seite_bearbeiten(s, sprache, d):
    w = werte_fuer(d, sprache)
    s = re.sub(r'<!--.*?-->\s*', '', s, flags=re.S)
    s = entfernen(s, 'nur-entwurf')
    if not d.get('registergericht'):
        s = entfernen(s, 'nur-register')
    if not d.get('ust_id'):
        s = entfernen(s, 'nur-ustid')
    if d.get('aueg_erlaubnis', 'nein').lower() == 'nein':
        s = entfernen(s, 'nur-aueg')
    # Schlichtung
    teilnahme = d.get('schlichtung', 'nein').lower() not in ('nein', 'no', '')
    if teilnahme:
        s = re.sub(r'\[nicht\]\s+', '', s)
        s = re.sub(r'\[not\]\s+', '', s)
        s = re.sub(r'\[Nu\]\s+suntem', 'Suntem', s)
    else:
        s = s.replace('[nicht]', 'nicht').replace('[not]', 'not').replace('[Nu]', 'Nu')
    for platzhalter, schluessel in PLATZHALTER[sprache] + MAILS:
        wert = html.escape(w.get(schluessel, ''), quote=False)
        s = als_muster(platzhalter).sub(lambda m: wert, s)
    # PGP-Schluessel ist optional - ohne Eintrag entfaellt die Zeile
    s = re.sub(r'<b>[^<]*</b>\s*\[(?:hier eintragen|enter here|introduceți aici)\]<br/>\s*', '', s)
    s = s.replace('ihre-domain.de', html.escape(d['domain']))
    return s


# ---------- 3. Server-Dateien ----------
CSP = ("default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; "
       "media-src 'self'; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'; "
       "object-src 'none'; upgrade-insecure-requests")
PERMISSIONS = "camera=(self), microphone=(self), display-capture=(self), geolocation=(), payment=(), usb=(), interest-cohort=()"

HTACCESS = r"""# Standard Plus - Einstellungen fuer Apache-Webspace (IONOS, Strato, All-Inkl, Hostinger ...)
# Wird automatisch erzeugt. Diese Datei muss mit hochgeladen werden (sie ist unsichtbar, weil
# ihr Name mit einem Punkt beginnt - im FTP-Programm "versteckte Dateien anzeigen" einschalten).

Options -Indexes
DirectoryIndex standardplus-main.html
AddDefaultCharset utf-8
AddType application/manifest+json .webmanifest
AddType text/javascript .js
ServerSignature Off

# --- Immer verschluesselt (https) ---
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{HTTPS} !=on
  RewriteCond %{HTTP:X-Forwarded-Proto} !https
  RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
  # Versteckte Dateien sperren - ausser .well-known (security.txt)
  RewriteRule "(^|/)\.(?!well-known(/|$))" - [F]
</IfModule>

# --- Sicherheits-Kopfzeilen ---
<IfModule mod_headers.c>
  Header always set Strict-Transport-Security "max-age=31536000"
  Header always set Content-Security-Policy "__CSP__"
  Header always set X-Frame-Options "DENY"
  Header always set X-Content-Type-Options "nosniff"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set Permissions-Policy "__PERM__"
  Header always set Cross-Origin-Opener-Policy "same-origin"
  Header always set Cross-Origin-Resource-Policy "same-origin"
  Header always unset X-Powered-By
</IfModule>

# --- Zwischenspeicher: erst die allgemeine Regel, danach die Ausnahmen ---
<IfModule mod_headers.c>
  <FilesMatch "\.(css|js|png)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>
  <FilesMatch "\.(html|webmanifest|txt|xml)$">
    Header set Cache-Control "no-cache"
  </FilesMatch>
  <FilesMatch "^(sw\.js|sp-audio-worklet\.js)$">
    Header set Cache-Control "no-cache"
  </FilesMatch>
</IfModule>
""".replace('__CSP__', CSP).replace('__PERM__', PERMISSIONS)

HEADERS = """# Standard Plus - Kopfzeilen fuer Netlify / Cloudflare Pages (automatisch erzeugt)
/*
  Strict-Transport-Security: max-age=31536000
  Content-Security-Policy: __CSP__
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: __PERM__
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Resource-Policy: same-origin

/sw.js
  Cache-Control: no-cache
""".replace('__CSP__', CSP).replace('__PERM__', PERMISSIONS)

NGINX = """# Standard Plus - Ausschnitt fuer nginx (in den server-Block einfuegen)
# Nur noetig, wenn Ihr Server nginx statt Apache verwendet.
index standardplus-main.html;
autoindex off;
server_tokens off;
location ~ /\\.(?!well-known) { deny all; }
add_header Strict-Transport-Security "max-age=31536000" always;
add_header Content-Security-Policy "__CSP__" always;
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "__PERM__" always;
add_header Cross-Origin-Opener-Policy "same-origin" always;
add_header Cross-Origin-Resource-Policy "same-origin" always;
""".replace('__CSP__', CSP).replace('__PERM__', PERMISSIONS)

GESCHUETZT = ['standardplus-dashboard.html', 'standardplus-profil.html', 'standardplus-login.html',
              'standardplus-datenschutz-center.html', 'standardplus-offline.html', 'standardplus-interview.html',
              'standardplus-profil-ansicht.html']
OEFFENTLICH = ['standardplus-main.html', 'standardplus-preise.html', 'standardplus-talente.html',
               'standardplus-unternehmen.html', 'standardplus-suche.html', 'standardplus-transport.html',
               'standardplus-dolmetscher.html', 'standardplus-musterprofile.html', 'standardplus-sicherheit.html',
               'standardplus-datenschutz.html', 'standardplus-impressum.html', 'standardplus-agb.html']


def main():
    d = firmendaten()
    print('Firmendaten vollständig.')

    print('Sprachfassungen werden erzeugt ...')
    if subprocess.call(['bash', 'neu-stempeln.sh']) != 0:
        abbruch('neu-stempeln.sh ist fehlgeschlagen.')

    if os.path.exists('upload'):
        shutil.rmtree('upload')
    os.makedirs(ZIEL)

    # Oeffentliche Dateien
    dateien = sorted(glob.glob('standardplus-*.html'))
    for sp in ('en', 'ro'):
        dateien += sorted(glob.glob(sp + '/standardplus-*.html')) + [sp + '/manifest.webmanifest']
    dateien += ['manifest.webmanifest', 'sw.js'] + sorted(glob.glob('assets/app/*.png'))
    dateien += [p for p in sorted(glob.glob('assets/sp-*.js')) + sorted(glob.glob('assets/sp-*.css'))]
    for q in dateien:
        z = os.path.join(ZIEL, q)
        os.makedirs(os.path.dirname(z), exist_ok=True)
        if q.endswith('.html'):
            sprache = q.split('/')[0] if '/' in q else 'de'
            s = io.open(q, encoding='utf-8').read()
            io.open(z, 'w', encoding='utf-8').write(seite_bearbeiten(s, sprache, d))
        else:
            shutil.copy2(q, z)

    domain = d['domain']
    heute = datetime.date.today()
    os.makedirs(os.path.join(ZIEL, '.well-known'), exist_ok=True)
    io.open(os.path.join(ZIEL, '.well-known', 'security.txt'), 'w', encoding='utf-8').write(
        'Contact: mailto:%s\nExpires: %sT00:00:00.000Z\nPreferred-Languages: de, en, ro\n'
        'Canonical: https://%s/.well-known/security.txt\nPolicy: https://%s/standardplus-sicherheit.html\n'
        % (d['email_sicherheit'], heute.replace(year=heute.year + 1).isoformat(), domain, domain))
    io.open(os.path.join(ZIEL, '.htaccess'), 'w', encoding='utf-8').write(HTACCESS)
    io.open(os.path.join(ZIEL, '_headers'), 'w', encoding='utf-8').write(HEADERS)

    robots = ['User-agent: *']
    for sp in ('', 'en/', 'ro/'):
        robots += ['Disallow: /%s%s' % (sp, p) for p in GESCHUETZT]
    robots += ['', 'Sitemap: https://%s/sitemap.xml' % domain, '']
    io.open(os.path.join(ZIEL, 'robots.txt'), 'w', encoding='utf-8').write('\n'.join(robots))

    eintraege = []
    for p in OEFFENTLICH:
        for sp in ('', 'en/', 'ro/'):
            eintraege.append('  <url><loc>https://%s/%s%s</loc><lastmod>%s</lastmod></url>' % (domain, sp, p, heute.isoformat()))
    io.open(os.path.join(ZIEL, 'sitemap.xml'), 'w', encoding='utf-8').write(
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + '\n'.join(eintraege) + '\n</urlset>\n')

    os.makedirs(os.path.join('upload', 'server-einstellungen'), exist_ok=True)
    io.open(os.path.join('upload', 'server-einstellungen', 'nginx.conf'), 'w', encoding='utf-8').write(NGINX)
    shutil.copy2(os.path.join('werkzeuge', 'ANLEITUNG-UPLOAD.txt'), os.path.join('upload', 'ANLEITUNG-UPLOAD.txt'))

    # ---------- Pruefung ----------
    probleme = []
    for p in glob.glob(os.path.join(ZIEL, '**', '*.html'), recursive=True):
        s = io.open(p, encoding='utf-8').read()
        ohne_code = re.sub(r'<(script|style)\b.*?</\1>', '', s, flags=re.S)
        ohne_code = re.sub(r'<[^>]+>', ' ', ohne_code)
        for m in re.finditer(r'\[[^\[\]<>\n]{1,160}\]', ohne_code):
            probleme.append('%s: Platzhalter %s' % (os.path.relpath(p, ZIEL), m.group(0)))
        for m in re.finditer(r'nur-entwurf|ihre-domain|Platzhalter', s):
            probleme.append('%s: interner Hinweis "%s"' % (os.path.relpath(p, ZIEL), m.group(0)))
        ordner = os.path.dirname(p)
        for ref in re.findall(r'(?:href|src)="([^"#?:]+)(?:[?#][^"]*)?"', s):
            if not os.path.exists(os.path.normpath(os.path.join(ordner, ref))):
                probleme.append('%s: toter Verweis %s' % (os.path.relpath(p, ZIEL), ref))
    if probleme:
        print('\n'.join(sorted(set(probleme))[:40]))
        abbruch('Das Paket wurde nicht erstellt, weil noch %d Probleme bestehen (siehe oben).' % len(set(probleme)))

    # ---------- Packen ----------
    zip_pfad = os.path.join('upload', 'StandardPlus-Upload.zip')
    with zipfile.ZipFile(zip_pfad, 'w', zipfile.ZIP_DEFLATED) as z:
        for ordner, _, namen in os.walk('upload'):
            for n in namen:
                voll = os.path.join(ordner, n)
                if voll == zip_pfad or n == '.DS_Store':
                    continue
                z.write(voll, os.path.join('StandardPlus-Upload', os.path.relpath(voll, 'upload')))
    if '--test' in sys.argv:
        print('Testlauf: Paket nur in upload/ erstellt.')
        return
    for ziel in ('~/Desktop', '~/Downloads'):
        ordner = os.path.expanduser(ziel)
        if os.path.isdir(ordner):
            shutil.copy2(zip_pfad, os.path.join(ordner, 'StandardPlus-Upload.zip'))
    anzahl = sum(len(n) for _, _, n in os.walk(ZIEL))
    print('\nFertig: StandardPlus-Upload.zip liegt auf dem Schreibtisch und in Downloads (%d Dateien).' % anzahl)
    print('Hochladen: den INHALT des Ordners "webspace" in das Hauptverzeichnis Ihres Webspace.')


if __name__ == '__main__':
    main()
