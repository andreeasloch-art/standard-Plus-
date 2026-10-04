-- ============================================================================
-- 1) Registrierung mit Handynummer (SMS-Code)
--    Supabase legt das Konto schon beim Senden des Codes an, aber ohne Sitzung.
--    Ein Profil darf erst sichtbar werden, wenn E-Mail ODER Handynummer bestätigt ist.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE r public.app_role; wunsch boolean; bestaetigt boolean; s boolean;
BEGIN
  r := CASE WHEN NEW.raw_user_meta_data->>'rolle' = 'arbeitgeber' THEN 'arbeitgeber'::public.app_role ELSE 'arbeitnehmer'::public.app_role END;
  wunsch := r = 'arbeitnehmer' AND COALESCE(NEW.raw_user_meta_data->>'sichtbar','false') = 'true';
  bestaetigt := NEW.email_confirmed_at IS NOT NULL OR NEW.phone_confirmed_at IS NOT NULL;
  s := wunsch AND bestaetigt; -- sonst erst nach Bestätigung (siehe handle_user_bestaetigt)
  INSERT INTO public.profiles (id, rolle, vorname, nachname, email, telefon, sichtbar,
    datenschutz_version, datenschutz_akzeptiert_at, bedingungen_version, bedingungen_akzeptiert_at,
    unternehmer_bestaetigt_at, sichtbarkeit_einwilligung_at)
  VALUES (NEW.id, r, '', '', NEW.email,
    CASE WHEN NEW.phone IS NOT NULL AND NEW.phone <> '' THEN '+' || ltrim(NEW.phone, '+') END,
    s,
    NEW.raw_user_meta_data->>'datenschutz_version', now(),
    NEW.raw_user_meta_data->>'bedingungen_version', now(),
    CASE WHEN r = 'arbeitgeber' AND NEW.raw_user_meta_data->>'unternehmer' = 'true' THEN now() END,
    CASE WHEN s THEN now() END);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, r);
  RETURN NEW;
END; $function$;

-- Sobald der SMS-Code (oder der E-Mail-Link) bestätigt ist: Konto freischalten = gewünschte Sichtbarkeit setzen.
CREATE OR REPLACE FUNCTION public.handle_user_bestaetigt()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
     OR (OLD.phone_confirmed_at IS NULL AND NEW.phone_confirmed_at IS NOT NULL) THEN
    UPDATE public.profiles p SET
      sichtbar = p.sichtbar OR (p.rolle = 'arbeitnehmer' AND COALESCE(NEW.raw_user_meta_data->>'sichtbar','false') = 'true'),
      telefon = COALESCE(p.telefon, CASE WHEN NEW.phone IS NOT NULL AND NEW.phone <> '' THEN '+' || ltrim(NEW.phone, '+') END),
      email = COALESCE(p.email, NEW.email)
    WHERE p.id = NEW.id;
  END IF;
  RETURN NEW;
END; $function$;
DROP TRIGGER IF EXISTS on_auth_user_bestaetigt ON auth.users;
CREATE TRIGGER on_auth_user_bestaetigt AFTER UPDATE OF email_confirmed_at, phone_confirmed_at ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_bestaetigt();
REVOKE EXECUTE ON FUNCTION public.handle_user_bestaetigt() FROM PUBLIC, anon, authenticated;

-- ============================================================================
-- 2) Kontaktdaten erst bei Vertragsabschluss (vorher: beim Match)
--    Beide Seiten bestätigen den Vertrag einzeln; jede Seite kann nur ihr eigenes Feld setzen,
--    und das erst nach dem Match (Status „beidseitig“).
-- ============================================================================
ALTER TABLE public.anfragen
  ADD COLUMN IF NOT EXISTS vertrag_arbeitgeber_at timestamptz,
  ADD COLUMN IF NOT EXISTS vertrag_arbeitnehmer_at timestamptz;

CREATE OR REPLACE FUNCTION public.anfragen_guard()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF auth.uid() = OLD.arbeitgeber_id THEN
      NEW.freigabe_arbeitnehmer := OLD.freigabe_arbeitnehmer;
      NEW.vertrag_arbeitnehmer_at := OLD.vertrag_arbeitnehmer_at;
    ELSIF auth.uid() = OLD.arbeitnehmer_id THEN
      NEW.freigabe_arbeitgeber := OLD.freigabe_arbeitgeber;
      NEW.interview_gewuenscht := OLD.interview_gewuenscht;
      NEW.interview_art := OLD.interview_art;
      NEW.wunschtermin := OLD.wunschtermin;
      NEW.dolmetscher := OLD.dolmetscher;
      NEW.nachricht := OLD.nachricht;
      NEW.stelle_id := OLD.stelle_id;
      NEW.vertrag_arbeitgeber_at := OLD.vertrag_arbeitgeber_at;
    END IF;
    -- Vertrag nur nach Match; einmal bestätigt bleibt bestätigt (Zeitpunkt nicht überschreibbar)
    IF OLD.status <> 'beidseitig' THEN
      NEW.vertrag_arbeitgeber_at := OLD.vertrag_arbeitgeber_at;
      NEW.vertrag_arbeitnehmer_at := OLD.vertrag_arbeitnehmer_at;
    END IF;
    IF OLD.vertrag_arbeitgeber_at IS NOT NULL THEN NEW.vertrag_arbeitgeber_at := OLD.vertrag_arbeitgeber_at; END IF;
    IF OLD.vertrag_arbeitnehmer_at IS NOT NULL THEN NEW.vertrag_arbeitnehmer_at := OLD.vertrag_arbeitnehmer_at; END IF;
    NEW.arbeitgeber_id := OLD.arbeitgeber_id;
    NEW.arbeitnehmer_id := OLD.arbeitnehmer_id;
    NEW.updated_at := now();
  ELSE
    NEW.freigabe_arbeitnehmer := false;
    NEW.vertrag_arbeitgeber_at := NULL;
    NEW.vertrag_arbeitnehmer_at := NULL;
  END IF;
  IF NEW.status = 'abgelehnt' THEN
    NEW.status := 'abgelehnt';
  ELSIF NEW.freigabe_arbeitgeber AND NEW.freigabe_arbeitnehmer THEN
    NEW.status := 'beidseitig';
  ELSE
    NEW.status := 'offen';
  END IF;
  RETURN NEW;
END; $function$;

CREATE OR REPLACE FUNCTION public.hat_vertrag(_a uuid, _b uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.anfragen WHERE status = 'beidseitig'
    AND vertrag_arbeitgeber_at IS NOT NULL AND vertrag_arbeitnehmer_at IS NOT NULL
    AND ((arbeitgeber_id = _a AND arbeitnehmer_id = _b) OR (arbeitgeber_id = _b AND arbeitnehmer_id = _a)))
$$;

-- Vollprofil (Nachname, Telefon, E-Mail …) erst nach beidseitig bestätigtem Vertrag
DROP POLICY IF EXISTS "Vollprofil nach beidseitiger Freigabe" ON public.profiles;
DROP POLICY IF EXISTS "Vollprofil nach Vertragsabschluss" ON public.profiles;
CREATE POLICY "Vollprofil nach Vertragsabschluss" ON public.profiles FOR SELECT TO authenticated
  USING (public.hat_vertrag(auth.uid(), id));

-- ============================================================================
-- 3) Anreise anfragen – das Team organisiert Bus/Fahrt und trägt den Status ein
-- ============================================================================
DO $$ BEGIN
  CREATE TYPE public.anreise_status AS ENUM ('angefragt', 'in_planung', 'gebucht', 'abgeschlossen', 'storniert');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.anreise_anfragen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  von_ort text NOT NULL CHECK (char_length(von_ort) BETWEEN 2 AND 120),
  nach_ort text NOT NULL CHECK (char_length(nach_ort) BETWEEN 2 AND 120),
  datum date NOT NULL,
  personen int NOT NULL DEFAULT 1 CHECK (personen BETWEEN 1 AND 9),
  hinweis text CHECK (hinweis IS NULL OR char_length(hinweis) <= 500),
  status public.anreise_status NOT NULL DEFAULT 'angefragt',
  team_info text CHECK (team_info IS NULL OR char_length(team_info) <= 1000), -- z. B. Abfahrt, Busunternehmen, Ticket
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.anreise_anfragen TO authenticated;
GRANT ALL ON public.anreise_anfragen TO service_role;
ALTER TABLE public.anreise_anfragen ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Eigene Anreise lesen" ON public.anreise_anfragen;
DROP POLICY IF EXISTS "Anreise anfragen" ON public.anreise_anfragen;
DROP POLICY IF EXISTS "Eigene Anreise stornieren" ON public.anreise_anfragen;
DROP POLICY IF EXISTS "Team verwaltet Anreisen" ON public.anreise_anfragen;
CREATE POLICY "Eigene Anreise lesen" ON public.anreise_anfragen FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anreise anfragen" ON public.anreise_anfragen FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.has_role(auth.uid(), 'arbeitnehmer'));
CREATE POLICY "Eigene Anreise stornieren" ON public.anreise_anfragen FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Fachkraft darf nur stornieren; Status und Team-Infos setzt nur das Team (Rolle admin)
CREATE OR REPLACE FUNCTION public.anreise_guard()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NOT public.has_role(auth.uid(), 'admin') THEN
      NEW.status := 'angefragt';
      NEW.team_info := NULL;
    END IF;
    RETURN NEW;
  END IF;
  NEW.user_id := OLD.user_id;
  NEW.updated_at := now();
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.von_ort := OLD.von_ort; NEW.nach_ort := OLD.nach_ort; NEW.datum := OLD.datum;
    NEW.personen := OLD.personen; NEW.hinweis := OLD.hinweis; NEW.team_info := OLD.team_info;
    IF NOT (NEW.status = 'storniert' AND OLD.status IN ('angefragt', 'in_planung')) THEN
      NEW.status := OLD.status;
    END IF;
  END IF;
  RETURN NEW;
END; $function$;
DROP TRIGGER IF EXISTS trg_anreise_guard ON public.anreise_anfragen;
CREATE TRIGGER trg_anreise_guard BEFORE INSERT OR UPDATE ON public.anreise_anfragen
  FOR EACH ROW EXECUTE FUNCTION public.anreise_guard();
REVOKE EXECUTE ON FUNCTION public.anreise_guard() FROM PUBLIC, anon, authenticated;
