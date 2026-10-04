-- ============================================================================
-- Ein Konto pro Person bzw. Firma
--   Fachkraft:      Vorname + Nachname + Geburtsdatum (normalisiert) – einmalig
--   Unternehmen:    Handelsregister- oder USt-Nummer (normalisiert) – einmalig
--   Handynummer/E-Mail sind ohnehin je Konto eindeutig (Supabase Auth).
-- Die Sperre gilt für BESTÄTIGTE Konten: Wer die SMS nicht bestätigt, blockiert niemanden.
-- ============================================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS geburtsdatum date,
  ADD COLUMN IF NOT EXISTS register_nr text CHECK (register_nr IS NULL OR char_length(register_nr) <= 60),
  ADD COLUMN IF NOT EXISTS identitaet text,
  ADD COLUMN IF NOT EXISTS identitaet_bestaetigt boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION intern.identitaet(_rolle public.app_role, _vorname text, _nachname text, _geb date, _register text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN _rolle = 'arbeitnehmer' AND _geb IS NOT NULL AND coalesce(_vorname, '') <> '' AND coalesce(_nachname, '') <> ''
      THEN 'p:' || regexp_replace(intern.norm(_vorname), '[^a-z]', '', 'g') || '|'
                || regexp_replace(intern.norm(_nachname), '[^a-z]', '', 'g') || '|' || _geb::text
    WHEN _rolle IN ('arbeitgeber', 'busunternehmen') AND coalesce(_register, '') <> ''
      THEN 'f:' || regexp_replace(upper(_register), '[^A-Z0-9]', '', 'g')
  END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_ein_konto
  ON public.profiles (identitaet) WHERE identitaet_bestaetigt AND identitaet IS NOT NULL;

-- Registrierung: Pflichtangaben prüfen, Dubletten früh abweisen
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE r public.app_role; wunsch boolean; bestaetigt boolean; s boolean;
  vn text; nn text; geb date; reg text; firma text; ident text;
BEGIN
  r := CASE NEW.raw_user_meta_data->>'rolle'
         WHEN 'arbeitgeber' THEN 'arbeitgeber'::public.app_role
         WHEN 'busunternehmen' THEN 'busunternehmen'::public.app_role
         ELSE 'arbeitnehmer'::public.app_role END;
  vn := trim(coalesce(NEW.raw_user_meta_data->>'vorname', ''));
  nn := trim(coalesce(NEW.raw_user_meta_data->>'nachname', ''));
  reg := nullif(trim(coalesce(NEW.raw_user_meta_data->>'register_nr', '')), '');
  firma := nullif(trim(coalesce(NEW.raw_user_meta_data->>'firma', '')), '');
  BEGIN geb := (NEW.raw_user_meta_data->>'geburtsdatum')::date; EXCEPTION WHEN others THEN geb := NULL; END;

  IF vn = '' OR nn = '' THEN RAISE EXCEPTION 'ANGABEN_FEHLEN: Name'; END IF;
  IF r = 'arbeitnehmer' THEN
    IF geb IS NULL THEN RAISE EXCEPTION 'ANGABEN_FEHLEN: Geburtsdatum'; END IF;
    IF geb > (current_date - interval '18 years')::date OR geb < date '1900-01-01' THEN RAISE EXCEPTION 'MINDESTALTER'; END IF;
  ELSE
    IF reg IS NULL OR firma IS NULL THEN RAISE EXCEPTION 'ANGABEN_FEHLEN: Firma'; END IF;
  END IF;

  ident := intern.identitaet(r, vn, nn, geb, reg);
  IF ident IS NOT NULL AND EXISTS (SELECT 1 FROM public.profiles WHERE identitaet = ident AND identitaet_bestaetigt) THEN
    RAISE EXCEPTION 'KONTO_EXISTIERT';
  END IF;

  wunsch := r = 'arbeitnehmer' AND COALESCE(NEW.raw_user_meta_data->>'sichtbar','false') = 'true';
  bestaetigt := NEW.email_confirmed_at IS NOT NULL OR NEW.phone_confirmed_at IS NOT NULL;
  s := wunsch AND bestaetigt;
  INSERT INTO public.profiles (id, rolle, vorname, nachname, geburtsdatum, geburtsjahr, firma, register_nr,
    identitaet, identitaet_bestaetigt, email, telefon, sichtbar,
    datenschutz_version, datenschutz_akzeptiert_at, bedingungen_version, bedingungen_akzeptiert_at,
    unternehmer_bestaetigt_at, sichtbarkeit_einwilligung_at)
  VALUES (NEW.id, r, vn, nn, geb, extract(year FROM geb)::int, firma, reg,
    ident, bestaetigt, NEW.email,
    CASE WHEN NEW.phone IS NOT NULL AND NEW.phone <> '' THEN '+' || ltrim(NEW.phone, '+') END,
    s,
    NEW.raw_user_meta_data->>'datenschutz_version', now(),
    NEW.raw_user_meta_data->>'bedingungen_version', now(),
    CASE WHEN r IN ('arbeitgeber', 'busunternehmen') AND NEW.raw_user_meta_data->>'unternehmer' = 'true' THEN now() END,
    CASE WHEN s THEN now() END);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, r);
  RETURN NEW;
END; $function$;

-- Bestätigung (SMS-Code / E-Mail-Link): jetzt greift die Eindeutigkeit (Index profiles_ein_konto).
-- Gibt es die Person/Firma schon bestätigt, schlägt die Bestätigung fehl → kein zweites Konto.
CREATE OR REPLACE FUNCTION public.handle_user_bestaetigt()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
     OR (OLD.phone_confirmed_at IS NULL AND NEW.phone_confirmed_at IS NOT NULL) THEN
    UPDATE public.profiles p SET
      identitaet_bestaetigt = true,
      sichtbar = p.sichtbar OR (p.rolle = 'arbeitnehmer' AND COALESCE(NEW.raw_user_meta_data->>'sichtbar','false') = 'true'),
      telefon = COALESCE(p.telefon, CASE WHEN NEW.phone IS NOT NULL AND NEW.phone <> '' THEN '+' || ltrim(NEW.phone, '+') END),
      email = COALESCE(p.email, NEW.email)
    WHERE p.id = NEW.id;
  END IF;
  RETURN NEW;
END; $function$;

-- Name, Geburtsdatum, Registernummer: nach der Registrierung nur noch durch das Team änderbar
-- (sonst ließe sich die Sperre durch Umbenennen umgehen). Leere Altdaten dürfen einmal ergänzt werden.
CREATE OR REPLACE FUNCTION public.profiles_identitaet_schutz()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.role() = 'authenticated' AND NOT public.has_role(auth.uid(), 'admin') THEN
    IF OLD.vorname <> '' THEN NEW.vorname := OLD.vorname; END IF;
    IF OLD.nachname <> '' THEN NEW.nachname := OLD.nachname; END IF;
    IF OLD.geburtsdatum IS NOT NULL THEN NEW.geburtsdatum := OLD.geburtsdatum; NEW.geburtsjahr := OLD.geburtsjahr; END IF;
    IF OLD.register_nr IS NOT NULL THEN NEW.register_nr := OLD.register_nr; END IF;
    NEW.identitaet_bestaetigt := OLD.identitaet_bestaetigt;
  END IF;
  NEW.identitaet := COALESCE(intern.identitaet(NEW.rolle, NEW.vorname, NEW.nachname, NEW.geburtsdatum, NEW.register_nr), OLD.identitaet);
  RETURN NEW;
END; $function$;
DROP TRIGGER IF EXISTS trg_profiles_identitaet ON public.profiles;
CREATE TRIGGER trg_profiles_identitaet BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.profiles_identitaet_schutz();
REVOKE EXECUTE ON FUNCTION public.profiles_identitaet_schutz() FROM PUBLIC, anon, authenticated;

-- Hinweis für den Betrieb: unbestätigte Registrierungen regelmäßig löschen (siehe Datenschutzerklärung, Abschnitt 3).

-- Bestehende, bereits bestätigte Konten zählen ab sofort mit (Altkonten ohne Geburtsdatum/Registernummer
-- haben noch keine Identität und werden erst erfasst, wenn sie diese Angaben ergänzen).
UPDATE public.profiles p SET identitaet_bestaetigt = true
FROM auth.users u
WHERE u.id = p.id AND (u.email_confirmed_at IS NOT NULL OR u.phone_confirmed_at IS NOT NULL);
