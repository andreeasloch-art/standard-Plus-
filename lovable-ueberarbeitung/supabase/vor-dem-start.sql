-- ============================================================================
-- VOR DEM START – einmalig ausführen (Lovable → Cloud → SQL-Editor), NICHT als Migration.
-- Erst ausführen, wenn alle Migrationen übertragen sind und Sie sich selbst
-- einmal registriert haben (Handynummer bestätigt).
-- ============================================================================

-- 1) Ihr eigenes Konto zum Team-Konto machen (Zugang zu /admin: Ausweise prüfen,
--    Busunternehmen freigeben, Anreisen planen).
--    >>> Ihre Handynummer im internationalen Format eintragen, z. B. '+4917612345678' <<<
DO $$
DECLARE _nummer text := '+49XXXXXXXXXXX';   -- HIER ÄNDERN
        _id uuid;
BEGIN
  SELECT id INTO _id FROM auth.users WHERE '+' || ltrim(phone, '+') = _nummer;
  IF _id IS NULL THEN
    RAISE EXCEPTION 'Kein bestätigtes Konto mit der Nummer % gefunden – erst registrieren, dann erneut ausführen.', _nummer;
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (_id, 'admin') ON CONFLICT DO NOTHING;
  RAISE NOTICE 'Team-Konto eingerichtet: %', _id;
END $$;

-- 2) Beispielprofile entfernen (fiktive Personen „Maria K.“ usw.).
--    Alle Beispiel-IDs beginnen mit 11111111-0000-4000-8000-.
DELETE FROM public.favoriten  WHERE arbeitnehmer_id::text LIKE '11111111-0000-4000-8000-%';
DELETE FROM public.anfragen   WHERE arbeitnehmer_id::text LIKE '11111111-0000-4000-8000-%' OR arbeitgeber_id::text LIKE '11111111-0000-4000-8000-%';
DELETE FROM public.profiles   WHERE id::text LIKE '11111111-0000-4000-8000-%';
DELETE FROM auth.users        WHERE id::text LIKE '11111111-0000-4000-8000-%';

-- 3) Löschfristen automatisch: Benachrichtigungen nach 180 Tagen, SMS-Zählwerte nach 30 Tagen
CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule('benachrichtigungen-aufraeumen', '17 3 * * *', $$ SELECT intern.benachrichtigungen_aufraeumen() $$);
-- Zählwerte der SMS-Kostenbremse nach 30 Tagen löschen
SELECT cron.schedule('sms-log-aufraeumen', '23 3 * * *', $$ SELECT intern.sms_log_aufraeumen() $$);

-- 4) Kontrolle: sollte 0 Beispielprofile und mindestens 1 Team-Konto zeigen.
SELECT
  (SELECT count(*) FROM public.profiles WHERE id::text LIKE '11111111-0000-4000-8000-%') AS beispielprofile,
  (SELECT count(*) FROM public.user_roles WHERE role = 'admin')                         AS team_konten;
