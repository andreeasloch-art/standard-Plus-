#!/bin/bash
# Erstellt das fertige Upload-Paket mit Ihren Firmendaten (siehe FIRMENDATEN.txt).
cd "$(dirname "$0")" || exit 1
python3 werkzeuge/veroeffentlichen.py "$@"
