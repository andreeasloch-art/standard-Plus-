# Übertragung in Lovable – fertige Aufträge zum Kopieren

Stand: 06.10.2026 · Code-Stand (fester Commit): `c9189a0f9bdc9457122e5a55a719d726bf4130ba`

Alles hier ist **außerhalb von Lovable gebaut und getestet**. Lovable muss die Dateien nur noch
herunterladen und einbauen. Dafür gibt es zwei Wege.

---

## Weg A (empfohlen, kostet keine Credits): Lovable mit GitHub verbinden

1. In Lovable im Projekt „Europa Talente“ oben rechts **GitHub → Connect** wählen und ein neues Repository anlegen lassen.
2. Claude Bescheid geben, wie das neue Repository heißt.
3. Claude spielt alle Dateien direkt dort ein. Lovable übernimmt sie automatisch – **ohne Credits**.
4. Nur die Datenbank-Migrationen müssen danach einmal laufen (Lovable führt Dateien unter
   `supabase/migrations/` beim Synchronisieren aus bzw. fragt nach; sonst Auftrag 4 unten, ca. 1 Credit).

---

## Weg B: Aufträge an den Lovable-Chat (ca. 3–5 Credits)

**Wichtig:** Auftrag 4 und 5 **direkt nacheinander** schicken. Nach Auftrag 4 verlangt die Datenbank bei der
Registrierung Geburtsdatum bzw. Registernummer – das alte Anmeldeformular kennt diese Felder nicht.
Bis Auftrag 5 fertig ist, kann sich also niemand neu registrieren.

### Auftrag 4 – Datenbank

```
Paket 4 „Datenbank“ – EIN Auftrag, bitte komplett erledigen.

1. Diese Migrationen aus dem öffentlichen Repo GENAU so und in dieser Reihenfolge ausführen
   (jede einzeln, die Enum-Erweiterung muss eine eigene Migration bleiben):
   B=https://raw.githubusercontent.com/andreeasloch-art/standard-Plus-/c9189a0f9bdc9457122e5a55a719d726bf4130ba/lovable-ueberarbeitung/supabase/migrations
   $B/20261004120000_telefon_vertrag_anreise.sql
   $B/20261004130000_rolle_busunternehmen.sql
   $B/20261004130100_busfahrten.sql
   $B/20261004140000_ein_konto_pro_person.sql
   $B/20261004150000_ausweis_pruefung.sql
   $B/20261006120000_benachrichtigungen.sql
   $B/20261006130000_alter_freiwillig.sql
   $B/20261006140000_sms_kostenbremse.sql
2. Falls das direkte Anlegen der Speicherbereiche (INSERT INTO storage.buckets) abgelehnt wird: die Buckets
   „busbilder“ (öffentlich lesbar, 5 MB, nur Bilder) und „ausweise“ (PRIVAT, 10 MB, nur Bilder) mit dem
   Speicher-Werkzeug anlegen und den Rest der Migration ohne diesen Teil ausführen. Die Zugriffsregeln
   (Policies) aus der Migration trotzdem anlegen.
3. Edge Function anlegen: supabase/functions/benachrichtigungen-mailen/index.ts von
   https://raw.githubusercontent.com/andreeasloch-art/standard-Plus-/c9189a0f9bdc9457122e5a55a719d726bf4130ba/lovable-ueberarbeitung/supabase/functions/benachrichtigungen-mailen/index.ts
   (noch keine Secrets setzen, keinen Cron anlegen).
4. Supabase-Typen (src/integrations/supabase/types.ts) neu erzeugen. Security-Scan laufen lassen.
5. Keine Dateien unter src/ ändern außer types.ts – die Oberfläche kommt mit dem nächsten Auftrag.
6. Kurz antworten: welche Migrationen liefen, ob etwas angepasst werden musste.
```

### Auftrag 5 – Oberfläche

```
Paket 5 „Oberfläche“ – EIN Auftrag, gleiches Vorgehen wie Paket 1–3. Bitte komplett erledigen.

1. Diese 27 Dateien herunterladen und an dieselbe Stelle legen (komplett ersetzen bzw. anlegen):

B=https://raw.githubusercontent.com/andreeasloch-art/standard-Plus-/c9189a0f9bdc9457122e5a55a719d726bf4130ba/lovable-ueberarbeitung
for f in src/components/site/AnfrageDetails.tsx src/components/site/AusweisUpload.tsx src/components/site/BotSchutz.tsx src/components/site/BusDashboard.tsx \
  src/components/site/FahrtKarte.tsx src/components/site/FahrtVorschlaege.tsx src/components/site/Footer.tsx \
  src/components/site/FotoUpload.tsx src/components/site/Header.tsx src/components/site/KontoBereich.tsx \
  src/components/site/TelefonFeld.tsx src/lib/benachrichtigungen.ts src/lib/bus.ts src/lib/laender.ts \
  src/lib/sms-regeln.ts src/lib/sms.server.ts src/lib/sms.functions.ts \
  src/routes/_authenticated/admin.tsx src/routes/_authenticated/anreise.tsx src/routes/_authenticated/benachrichtigungen.tsx \
  src/routes/_authenticated/dashboard.tsx src/routes/_authenticated/profil-bearbeiten.tsx src/routes/agb-busunternehmen.tsx \
  src/routes/auth.tsx src/routes/busreisen.tsx src/routes/datenschutz.tsx 'src/routes/profil.$id.tsx'; do
  mkdir -p "$(dirname "$f")" && curl -fsSL "$B/$f" -o "$f" || { echo "FEHLER: $f"; exit 1; }
done

2. Paket installieren: libphonenumber-js
3. Typecheck und Build ausführen; bei Fehlern nur minimal anpassen (strengere Typen), keine Funktionen entfernen.
   Falls useRolle() in src/lib/auth.tsx die Rollen „busunternehmen“ oder „admin“ nicht kennt: dort ergänzen.
4. Keine Datenbank-Änderungen. Falls der Download nicht klappt: nichts nachbauen, nur „Download nicht möglich“ melden.
5. Kurz antworten: Build grün ja/nein und was angepasst wurde.
```

---

## Danach – das machst du selbst (keine Credits)

1. **Kostenschutz einrichten – VOR dem Einschalten der SMS** (siehe Abschnitt „Schutz vor SMS-Betrug“ unten).
2. **SMS einschalten (Twilio Verify, wie bei Showly):** siehe Abschnitt „Schutz vor SMS-Betrug“ unten.
   **Wichtig:** In Lovable Cloud → Authentifizierung den Anbieter **„Phone“ AUS lassen.** Die SMS laufen über den
   eigenen Server mit Kostenbremse. Wäre „Phone“ zusätzlich an, könnten Betrüger die Bremse umgehen.
3. **Selbst registrieren** (mit deiner Handynummer).
4. **Startskript ausführen:** Lovable → Cloud → SQL-Editor → Inhalt von `supabase/vor-dem-start.sql` einfügen,
   in Zeile 10 deine Handynummer eintragen, ausführen. Damit bist du Team-Konto (Bereich `/admin`) und die
   Beispielprofile sind weg. Außerdem werden alte Benachrichtigungen ab dann automatisch nach 180 Tagen gelöscht.
5. **Platzhalter füllen:** Gelb markierte Stellen in Impressum, Datenschutz, AGB, AGB für Busunternehmen.
6. **Veröffentlichen:** Lovable → **Publish**, optional eigene Domain verbinden.

### Optional: E-Mail-Benachrichtigungen einschalten

Ohne diesen Schritt erscheinen alle Benachrichtigungen trotzdem in der App (Glocke).

1. Konto bei **resend.com** anlegen, Domain bestätigen, API-Schlüssel erzeugen.
2. Lovable → Cloud → Secrets: `RESEND_API_KEY`, `MAIL_ABSENDER` (z. B. `Standard Plus <hinweis@deine-domain.de>`),
   `SEITE_URL` (z. B. `https://deine-domain.de`) und `CRON_SECRET` (beliebige lange Zeichenkette) anlegen.
3. Im SQL-Editor einmal ausführen (Projekt-Adresse und dasselbe CRON_SECRET einsetzen):

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
SELECT cron.schedule('benachrichtigungen-mailen', '* * * * *', $$
  SELECT net.http_post(
    url := 'https://<PROJEKT-ID>.supabase.co/functions/v1/benachrichtigungen-mailen',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', '<CRON_SECRET>'),
    body := '{}'::jsonb)
$$);
```

4. Resend in der Datenschutzerklärung (Abschnitt 4) prüfen und den AV-Vertrag von Resend abschließen.

---

## Schutz vor SMS-Betrug (Kosten deckeln) – wie bei Showly

Betrüger lösen über Anmeldeformulare massenhaft SMS an teure Auslandsnummern aus und verdienen mit
(„SMS-Pumping“). Standard Plus verschickt SMS-Codes deshalb über **Twilio Verify**, über den **eigenen Server**
und mit eingebauter Kostenbremse (`src/lib/sms.server.ts`):

- nur echte **Handynummern** – Festnetz-, Sonder- (0900), Premium- und Satellitennummern bekommen keine SMS
- nur **Länder auf der Liste** (`SMS_LAENDER` in `src/lib/laender.ts`): EU/EWR, Schweiz, Großbritannien,
  Westbalkan, Moldau, Ukraine, Türkei, USA, Kanada. Weitere Länder in Lovable unter Secrets als
  `SMS_EXTRA_LAENDER` freischalten, z. B. `BR,PH` – für sie gilt ein strengeres Tageslimit (25).
  Alle anderen registrieren sich kostenlos per E-Mail.
- **Anmeldung** nur für Nummern, zu denen es ein Konto gibt; **Registrierung** nur für neue Nummern und neue
  Personen/Firmen – sonst geht gar keine SMS raus
- je Nummer höchstens **3 Codes pro Stunde und 5 pro Tag**, je Internetadresse **5 pro Stunde und 15 pro Tag**,
  **5 Prüfversuche** pro Nummer und Stunde
- je Land und Tag höchstens **150** (`SMS_LAND_TAGESLIMIT`), insgesamt höchstens **300 SMS pro Tag**
  (`SMS_TAGESLIMIT`). Bei rund 5–10 Cent je SMS sind das höchstens etwa 15–30 € am Tag, auch bei einem Angriff.
- **Schlägt die Zählung fehl, geht im Zweifel keine SMS raus.**
- gespeichert werden nur Hashes von Nummer und IP, gelöscht nach 30 Tagen

### Einrichtung (ca. 15 Minuten, keine Credits)

1. Auf **twilio.com** ein Konto anlegen, **Guthaben aufladen (z. B. 20 €)** und **Auto-Recharge ausschalten** –
   so wird nie mehr abgebucht, als du aufgeladen hast. Unter Billing eine Warn-E-Mail ab z. B. 10 € einrichten.
2. In der Twilio-Konsole unter **Verify → Services** einen Dienst „Standard Plus“ anlegen, Kanal **SMS**.
   Dort **Fraud Guard** auf **„Maximum“** stellen.
3. Unter **Verify → Geo Permissions** nur die Länder aus der Liste erlauben, alle anderen sperren.
4. In Lovable → Cloud → **Secrets** eintragen: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`,
   `TWILIO_VERIFY_SERVICE_SID` (beginnt mit `VA…`) und `RATE_LIMIT_SALT` (beliebige lange Zeichenkette).
5. Optional: `SMS_TAGESLIMIT`, `SMS_LAND_TAGESLIMIT`, `SMS_EXTRA_LAENDER` anpassen.
6. Optional, zusätzlicher Bot-Schutz (kostenlos): bei **cloudflare.com → Turnstile** eine Seite anlegen,
   den Site Key als `VITE_TURNSTILE_SITE_KEY` und den Secret Key als `TURNSTILE_SECRET_KEY` eintragen.

Ohne die Twilio-Angaben bleibt der eigene SMS-Weg aus; die App bietet dann E-Mail an.

**Neue Länder:** erst freischalten, wenn dort echte Nutzer sind – in `SMS_EXTRA_LAENDER` **und** in den
Geo Permissions bei Twilio.
