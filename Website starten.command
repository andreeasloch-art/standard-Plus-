#!/bin/bash
# Standard Plus lokal ansehen.
# Startet einen kleinen Webserver im Ordner dieser Datei und oeffnet den Browser.
# Grund: Die strenge Content-Security-Policy verlangt eine echte Herkunft (origin);
# beim direkten Oeffnen per file:// koennen Browser die Skripte blockieren.
cd "$(dirname "$0")" || exit 1
PORT=8123
echo "Standard Plus laeuft auf http://localhost:$PORT"
echo "Zum Beenden dieses Fenster schliessen oder Strg+C druecken."
(sleep 1 && open "http://localhost:$PORT/standardplus-main.html") &
python3 -m http.server "$PORT"
