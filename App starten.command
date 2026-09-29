#!/bin/bash
# Standard Plus als App oeffnen - im eigenen Fenster, ohne Browserleiste.
# Nimmt Chrome oder Edge, wenn vorhanden. Sonst den normalen Browser.
cd "$(dirname "$0")" || exit 1
PORT=8123
ADRESSE="http://localhost:$PORT/standardplus-main.html"

# Server nur starten, wenn er nicht schon laeuft
if ! curl -s -o /dev/null --max-time 1 "$ADRESSE"; then
  python3 -m http.server "$PORT" >/dev/null 2>&1 &
  SERVER=$!
  trap 'kill $SERVER 2>/dev/null' EXIT
  sleep 1
fi

if [ -d "/Applications/Google Chrome.app" ]; then
  open -na "Google Chrome" --args --app="$ADRESSE"
elif [ -d "/Applications/Microsoft Edge.app" ]; then
  open -na "Microsoft Edge" --args --app="$ADRESSE"
else
  open "$ADRESSE"
fi

echo "Standard Plus laeuft als App."
echo "In Chrome oder Edge oben rechts auf das Installations-Symbol klicken,"
echo "dann liegt Standard Plus dauerhaft bei Ihren Programmen."
echo ""
echo "Dieses Fenster offen lassen, solange Sie die App benutzen."
wait
