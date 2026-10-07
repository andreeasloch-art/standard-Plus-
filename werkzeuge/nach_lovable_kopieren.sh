#!/usr/bin/env bash
# Kopiert die fertige Website in das Lovable-Projekt (Repository ready-set-code-76),
# das sie unter https://standard-plus.eu veröffentlicht.
# Aufruf: bash werkzeuge/nach_lovable_kopieren.sh /pfad/zu/ready-set-code-76
set -euo pipefail
QUELLE="$(cd "$(dirname "$0")/.." && pwd)"
ZIEL="${1:?Pfad zum Lovable-Repository angeben}"
python3 "$QUELLE/werkzeuge/seiten_bauen.py" >/dev/null
rm -rf "$ZIEL/public/assets"
cd "$QUELLE"
cp -r index.html ueber-uns.html branchen.html ablauf.html pakete.html fragen.html kontakt.html \
      impressum.html agb.html datenschutz.html widerruf.html assets robots.txt sitemap.xml \
      llms.txt llms-full.txt site.webmanifest 6e2f22d248a8d3948c7f6ffa8403d464.txt "$ZIEL/public/"
echo "Kopiert nach $ZIEL/public – dort committen und pushen, dann in Lovable veröffentlichen."
