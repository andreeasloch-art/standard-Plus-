-- ============================================================================
-- SMS-Codes mit Kostenbremse (Versand über Twilio Verify aus src/lib/sms.server.ts)
--
-- Jede verschickte SMS und jeder Prüfversuch wird gezählt, damit der Server Limits je Nummer,
-- je Internetadresse, je Land und pro Tag durchsetzen kann. Gespeichert werden nur gekürzte
-- Prüfwerte (Hash) von Nummer und IP – nie die Nummer oder IP selbst – und nach 30 Tagen wird
-- alles gelöscht.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.sms_log (
  id          bigserial PRIMARY KEY,
  art         text NOT NULL CHECK (art IN ('senden', 'pruefen')),
  nummer_hash text NOT NULL CHECK (char_length(nummer_hash) <= 64),
  ip_hash     text NOT NULL CHECK (char_length(ip_hash) <= 64),
  land        text NOT NULL CHECK (char_length(land) = 2),
  ok          boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sms_log_nummer_idx ON public.sms_log (nummer_hash, created_at);
CREATE INDEX IF NOT EXISTS sms_log_ip_idx ON public.sms_log (ip_hash, created_at);
CREATE INDEX IF NOT EXISTS sms_log_tag_idx ON public.sms_log (art, created_at);
-- Nur der Server (service_role) liest und schreibt; keine Policies für Nutzer
ALTER TABLE public.sms_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.sms_log FROM anon, authenticated;
GRANT ALL ON public.sms_log TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.sms_log_id_seq TO service_role;

CREATE OR REPLACE FUNCTION intern.sms_log_aufraeumen()
 RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path TO 'public'
AS $$ DELETE FROM public.sms_log WHERE created_at < now() - interval '30 days' $$;
REVOKE ALL ON FUNCTION intern.sms_log_aufraeumen() FROM PUBLIC;

-- Vor dem SMS-Versand prüfen, ob es diese Person/Firma schon gibt (spart die SMS).
-- Nur für den Server, damit niemand damit Personen ausforschen kann.
CREATE OR REPLACE FUNCTION public.konto_frei(_rolle text, _vorname text, _nachname text, _geburtsdatum date, _register_nr text)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE identitaet_bestaetigt
      AND identitaet = intern.identitaet(
        CASE _rolle WHEN 'arbeitgeber' THEN 'arbeitgeber'::public.app_role
                    WHEN 'busunternehmen' THEN 'busunternehmen'::public.app_role
                    ELSE 'arbeitnehmer'::public.app_role END,
        trim(coalesce(_vorname, '')), trim(coalesce(_nachname, '')), _geburtsdatum, nullif(trim(coalesce(_register_nr, '')), ''))
  )
$$;
REVOKE EXECUTE ON FUNCTION public.konto_frei(text, text, text, date, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.konto_frei(text, text, text, date, text) TO service_role;

-- Konten, die sich per Handynummer anmelden, bekommen intern eine Ersatzadresse
-- (p<Nummer>@sms.standard-plus.invalid), damit der Server eine Sitzung ausstellen kann.
-- An sie geht nie eine E-Mail: Im Profil bleibt die E-Mail leer.
CREATE OR REPLACE FUNCTION intern.echte_email(_email text)
 RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN _email IS NULL OR _email ILIKE '%@sms.standard-plus.invalid' THEN NULL ELSE _email END
$$;

-- handle_new_user wie in 20261004140000, nur mit intern.echte_email(...)
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
  bestaetigt := NEW.phone_confirmed_at IS NOT NULL
    OR (NEW.email_confirmed_at IS NOT NULL AND intern.echte_email(NEW.email) IS NOT NULL);
  s := wunsch AND bestaetigt;
  INSERT INTO public.profiles (id, rolle, vorname, nachname, geburtsdatum, geburtsjahr, firma, register_nr,
    identitaet, identitaet_bestaetigt, email, telefon, sichtbar,
    datenschutz_version, datenschutz_akzeptiert_at, bedingungen_version, bedingungen_akzeptiert_at,
    unternehmer_bestaetigt_at, sichtbarkeit_einwilligung_at)
  VALUES (NEW.id, r, vn, nn, geb, extract(year FROM geb)::int, firma, reg,
    ident, bestaetigt, intern.echte_email(NEW.email),
    CASE WHEN NEW.phone IS NOT NULL AND NEW.phone <> '' THEN '+' || ltrim(NEW.phone, '+') END,
    s,
    NEW.raw_user_meta_data->>'datenschutz_version', now(),
    NEW.raw_user_meta_data->>'bedingungen_version', now(),
    CASE WHEN r IN ('arbeitgeber', 'busunternehmen') AND NEW.raw_user_meta_data->>'unternehmer' = 'true' THEN now() END,
    CASE WHEN s THEN now() END);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, r);
  RETURN NEW;
END; $function$;

-- handle_user_bestaetigt wie in 20261004140000, Ersatzadresse landet nicht im Profil
CREATE OR REPLACE FUNCTION public.handle_user_bestaetigt()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL AND intern.echte_email(NEW.email) IS NOT NULL)
     OR (OLD.phone_confirmed_at IS NULL AND NEW.phone_confirmed_at IS NOT NULL) THEN
    UPDATE public.profiles p SET
      identitaet_bestaetigt = true,
      sichtbar = p.sichtbar OR (p.rolle = 'arbeitnehmer' AND COALESCE(NEW.raw_user_meta_data->>'sichtbar','false') = 'true'),
      telefon = COALESCE(p.telefon, CASE WHEN NEW.phone IS NOT NULL AND NEW.phone <> '' THEN '+' || ltrim(NEW.phone, '+') END),
      email = COALESCE(p.email, intern.echte_email(NEW.email))
    WHERE p.id = NEW.id;
  END IF;
  RETURN NEW;
END; $function$;
