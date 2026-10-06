# Übertragung in Lovable – fertige Aufträge zum Kopieren

Stand: 06.10.2026 · Code-Stand (fester Commit): `60afda0f3d5da1930e2cc1edc2a74acac2b4ccf6`

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
   B=https://raw.githubusercontent.com/andreeasloch-art/standard-Plus-/60afda0f3d5da1930e2cc1edc2a74acac2b4ccf6/lovable-ueberarbeitung/supabase/migrations
   $B/20261004120000_telefon_vertrag_anreise.sql
   $B/20261004130000_rolle_busunternehmen.sql
   $B/20261004130100_busfahrten.sql
   $B/20261004140000_ein_konto_pro_person.sql
   $B/20261004150000_ausweis_pruefung.sql
   $B/20261006120000_benachrichtigungen.sql
   $B/20261006130000_alter_freiwillig.sql
2. Falls das direkte Anlegen der Speicherbereiche (INSERT INTO storage.buckets) abgelehnt wird: die Buckets
   „busbilder“ (öffentlich lesbar, 5 MB, nur Bilder) und „ausweise“ (PRIVAT, 10 MB, nur Bilder) mit dem
   Speicher-Werkzeug anlegen und den Rest der Migration ohne diesen Teil ausführen. Die Zugriffsregeln
   (Policies) aus der Migration trotzdem anlegen.
3. Edge Function anlegen: supabase/functions/benachrichtigungen-mailen/index.ts von
   https://raw.githubusercontent.com/andreeasloch-art/standard-Plus-/60afda0f3d5da1930e2cc1edc2a74acac2b4ccf6/lovable-ueberarbeitung/supabase/functions/benachrichtigungen-mailen/index.ts
   (noch keine Secrets setzen, keinen Cron anlegen).
4. Supabase-Typen (src/integrations/supabase/types.ts) neu erzeugen. Security-Scan laufen lassen.
5. Keine Dateien unter src/ ändern außer types.ts – die Oberfläche kommt mit dem nächsten Auftrag.
6. Kurz antworten: welche Migrationen liefen, ob etwas angepasst werden musste.
```

### Auftrag 5 – Oberfläche

```
Paket 5 „Oberfläche“ – EIN Auftrag, gleiches Vorgehen wie Paket 1–3. Bitte komplett erledigen.

1. Diese 24 Dateien herunterladen und an dieselbe Stelle legen (komplett ersetzen bzw. anlegen):

B=https://raw.githubusercontent.com/andreeasloch-art/standard-Plus-/60afda0f3d5da1930e2cc1edc2a74acac2b4ccf6/lovable-ueberarbeitung
for f in src/components/site/AnfrageDetails.tsx src/components/site/AusweisUpload.tsx src/components/site/BotSchutz.tsx src/components/site/BusDashboard.tsx \
  src/components/site/FahrtKarte.tsx src/components/site/FahrtVorschlaege.tsx src/components/site/Footer.tsx \
  src/components/site/FotoUpload.tsx src/components/site/Header.tsx src/components/site/KontoBereich.tsx \
  src/components/site/TelefonFeld.tsx src/lib/benachrichtigungen.ts src/lib/bus.ts src/lib/laender.ts \
  src/routes/_authenticated/admin.tsx src/routes/_authenticated/anreise.tsx src/routes/_authenticated/benachrichtigungen.tsx \
  src/routes/_authenticated/dashboard.tsx src/routes/_authenticated/profil-bearbeiten.tsx src/routes/agb-busunternehmen.tsx \
  src/routes/auth.tsx src/routes/busreisen.tsx src/routes/datenschutz.tsx 'src/routes/profil.$id.tsx'; do
  mkdir -p "$(dirname "$f")" && curl -fsSL "$B/$f" -o "$f" || { echo "FEHLER: $f"; exit 1; }
done

2. Typecheck und Build ausführen; bei Fehlern nur minimal anpassen (strengere Typen), keine Funktionen entfernen.
   Falls useRolle() in src/lib/auth.tsx die Rollen „busunternehmen“ oder „admin“ nicht kennt: dort ergänzen.
3. Keine Datenbank-Änderungen. Falls der Download nicht klappt: nichts nachbauen, nur „Download nicht möglich“ melden.
4. Kurz antworten: Build grün ja/nein und was angepasst wurde.
```

---

## Danach – das machst du selbst (keine Credits)

1. **Kostenschutz einrichten – VOR dem Einschalten der SMS** (siehe Abschnitt „Schutz vor SMS-Betrug“ unten).
2. **SMS einschalten:** Lovable → Cloud → Authentifizierung → Anbieter **Phone** aktivieren, SMS-Dienst eintragen
   (z. B. Twilio Verify: Konto anlegen, Account SID, Auth Token und Service-ID einfügen).
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

## Schutz vor SMS-Betrug (Kosten deckeln)

Betrüger lösen über Anmeldeformulare massenhaft SMS an teure Auslandsnummern aus und kassieren mit
(„SMS-Pumping“). Vier Schichten, von „wichtigste“ bis „zusätzlich“:

| # | Was | Wo | Kosten |
| - | --- | --- | --- |
| 1 | **Hartes Kostenlimit:** SMS-Anbieter nur mit Guthaben aufladen (z. B. 20–50 €), **automatisches Nachladen AUS**, Warn-E-Mail bei z. B. 10 € Verbrauch | Twilio → Billing | 0 € |
| 2 | **Länder sperren:** nur die Länder aus `SMS_LAENDER` (in `src/lib/laender.ts`) erlauben, alle anderen sperren | Twilio → Verify → Geo Permissions | 0 € |
| 3 | **Betrugserkennung:** „Fraud Guard“ einschalten (blockt verdächtige Nummernbereiche automatisch) | Twilio → Verify → Fraud Guard | 0 € (in Verify enthalten) |
| 4 | **Bot-Prüfung:** Cloudflare Turnstile (kostenlos) – Site Key als `VITE_TURNSTILE_SITE_KEY` eintragen, Secret Key in der Authentifizierung unter „Captcha protection“ (Anbieter Turnstile) | cloudflare.com → Turnstile; Lovable → Cloud → Auth | 0 € |
| 5 | **Versandlimit:** „Rate limit for sending SMS“ niedrig halten (Start: 30 pro Stunde für das ganze Projekt) | Lovable → Cloud → Auth → Rate Limits | 0 € |

Schon im Code eingebaut: SMS nur in freigegebene Länder (sonst E-Mail, kostenlos), 60 Sekunden Wartezeit
vor erneutem Senden, Bot-Prüfung (springt an, sobald der Schlüssel gesetzt ist).

**Schlimmstfall mit diesen Einstellungen:** höchstens 30 SMS pro Stunde und nie mehr als das aufgeladene Guthaben.
Ohne Guthaben werden keine SMS mehr verschickt – die Anmeldung per E-Mail funktioniert weiter.

**Weltweit günstig:** Für Länder außerhalb der Liste registrieren sich Nutzer per E-Mail (kostenlos). Neue Länder
erst freischalten, wenn dort echte Nutzer sind – dann in `SMS_LAENDER` **und** bei Twilio ergänzen.
