# Test der SMS-Kostenbremse

Prüft `src/lib/sms.server.ts` und `src/lib/sms-regeln.ts` ohne echte Datenbank und ohne Twilio
(beides nachgebaut). Ausführen in einem Ordner mit `src/lib/` und `test/` (diese Dateien) sowie
`npm i esbuild libphonenumber-js zod`:

    node test/bauen.mjs && node test/out.mjs

Ergebnis am 06.10.2026: 21 von 21 Prüfungen bestanden.
