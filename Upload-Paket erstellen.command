#!/bin/bash
cd "$(dirname "$0")" || exit 1
bash veroeffentlichen.sh
echo
read -n 1 -s -r -p "Taste druecken zum Schliessen ..."
