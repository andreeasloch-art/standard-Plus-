-- ============================================================================
-- Ausweisprüfung ohne externen Anbieter: Fachkraft lädt Ausweisfotos hoch,
-- das Team (Rolle admin) prüft per Augenschein, danach werden die Bilder gelöscht.
-- Vertragsabschluss durch die Fachkraft erst nach geprüftem Ausweis.
-- ============================================================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ausweis_geprueft_at timestamptz;

-- Nur das Team setzt „geprüft“ (gleiches Muster wie die Identitätsfelder)
CREATE OR REPLACE FUNCTION public.profiles_ausweis_schutz()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.role() = 'authenticated' AND NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.ausweis_geprueft_at := OLD.ausweis_geprueft_at;
  END IF;
  RETURN NEW;
END; $function$;
DROP TRIGGER IF EXISTS trg_profiles_ausweis ON public.profiles;
CREATE TRIGGER trg_profiles_ausweis BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.profiles_ausweis_schutz();
REVOKE EXECUTE ON FUNCTION public.profiles_ausweis_schutz() FROM PUBLIC, anon, authenticated;

-- Privater Speicher – niemand außer der Person selbst (hochladen/löschen) und dem Team (ansehen/löschen)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('ausweise', 'ausweise', false, 8388608, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Ausweis hochladen" ON storage.objects;
DROP POLICY IF EXISTS "Ausweis eigenen löschen" ON storage.objects;
DROP POLICY IF EXISTS "Ausweis Team lesen" ON storage.objects;
DROP POLICY IF EXISTS "Ausweis Team löschen" ON storage.objects;
CREATE POLICY "Ausweis hochladen" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'ausweise' AND (storage.foldername(name))[1] = auth.uid()::text
    AND lower(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp'));
CREATE POLICY "Ausweis eigenen löschen" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'ausweise' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Ausweis Team lesen" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'ausweise' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Ausweis Team löschen" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'ausweise' AND public.has_role(auth.uid(), 'admin'));
-- Hinweis: Die Person selbst kann ihre hochgeladenen Bilder bewusst NICHT wieder ansehen
-- (weniger Angriffsfläche bei gestohlenen Sitzungen).

DO $$ BEGIN
  CREATE TYPE public.ausweis_status AS ENUM ('eingereicht', 'geprueft', 'abgelehnt');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.ausweis_pruefungen (
  user_id uuid PRIMARY KEY DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  vorderseite text,
  rueckseite text,
  einwilligung_at timestamptz NOT NULL DEFAULT now(),
  status public.ausweis_status NOT NULL DEFAULT 'eingereicht',
  grund text CHECK (grund IS NULL OR char_length(grund) <= 300),
  eingereicht_at timestamptz NOT NULL DEFAULT now(),
  geprueft_at timestamptz,
  CHECK (vorderseite IS NULL OR vorderseite LIKE user_id::text || '/%'),
  CHECK (rueckseite IS NULL OR rueckseite LIKE user_id::text || '/%')
);
GRANT SELECT, INSERT, UPDATE ON public.ausweis_pruefungen TO authenticated;
GRANT ALL ON public.ausweis_pruefungen TO service_role;
ALTER TABLE public.ausweis_pruefungen ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Eigene Ausweisprüfung lesen" ON public.ausweis_pruefungen FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Ausweis einreichen" ON public.ausweis_pruefungen FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.has_role(auth.uid(), 'arbeitnehmer'));
CREATE POLICY "Ausweis erneut einreichen" ON public.ausweis_pruefungen FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Person: darf nur (neu) einreichen; Status/Grund setzt nur das Team
CREATE OR REPLACE FUNCTION public.ausweis_guard()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    IF NEW.status <> OLD.status THEN NEW.geprueft_at := now(); END IF;
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = 'geprueft' THEN
    RAISE EXCEPTION 'Ausweis bereits geprüft';
  END IF;
  NEW.status := 'eingereicht';
  NEW.grund := NULL;
  NEW.geprueft_at := NULL;
  NEW.eingereicht_at := now();
  NEW.einwilligung_at := now();
  RETURN NEW;
END; $function$;
DROP TRIGGER IF EXISTS trg_ausweis_guard ON public.ausweis_pruefungen;
CREATE TRIGGER trg_ausweis_guard BEFORE INSERT OR UPDATE ON public.ausweis_pruefungen
  FOR EACH ROW EXECUTE FUNCTION public.ausweis_guard();
REVOKE EXECUTE ON FUNCTION public.ausweis_guard() FROM PUBLIC, anon, authenticated;

-- Team entscheidet: setzt Status + profiles.ausweis_geprueft_at und vergisst die Bildpfade
-- (die Dateien löscht die Admin-Seite direkt danach über die Speicher-API).
CREATE OR REPLACE FUNCTION public.ausweis_entscheiden(_user uuid, _ok boolean, _grund text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Nur für das Team'; END IF;
  UPDATE public.ausweis_pruefungen
     SET status = CASE WHEN _ok THEN 'geprueft'::public.ausweis_status ELSE 'abgelehnt'::public.ausweis_status END,
         grund = CASE WHEN _ok THEN NULL ELSE left(_grund, 300) END,
         geprueft_at = now(), vorderseite = NULL, rueckseite = NULL
   WHERE user_id = _user;
  UPDATE public.profiles SET ausweis_geprueft_at = CASE WHEN _ok THEN now() END WHERE id = _user;
END $$;
REVOKE ALL ON FUNCTION public.ausweis_entscheiden(uuid, boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ausweis_entscheiden(uuid, boolean, text) TO authenticated;

-- Liste für das Team: wartende Prüfungen mit den Registrierungsdaten zum Vergleich
CREATE OR REPLACE FUNCTION public.ausweise_offen()
RETURNS TABLE (user_id uuid, vorname text, nachname text, geburtsdatum date, vorderseite text, rueckseite text, eingereicht_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT a.user_id, p.vorname, p.nachname, p.geburtsdatum, a.vorderseite, a.rueckseite, a.eingereicht_at
  FROM public.ausweis_pruefungen a JOIN public.profiles p ON p.id = a.user_id
  WHERE a.status = 'eingereicht' AND public.has_role(auth.uid(), 'admin')
  ORDER BY a.eingereicht_at
$$;
GRANT EXECUTE ON FUNCTION public.ausweise_offen() TO authenticated;

-- Vertragsabschluss: Fachkraft erst mit geprüftem Ausweis
CREATE OR REPLACE FUNCTION public.vertrag_ausweis_pflicht()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.vertrag_arbeitnehmer_at IS NOT NULL AND OLD.vertrag_arbeitnehmer_at IS NULL
     AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.arbeitnehmer_id AND ausweis_geprueft_at IS NOT NULL) THEN
    RAISE EXCEPTION 'AUSWEIS_FEHLT';
  END IF;
  RETURN NEW;
END; $function$;
DROP TRIGGER IF EXISTS trg_zz_vertrag_ausweis ON public.anfragen;
-- Name mit „z“ beginnt → läuft nach trg_anfragen_guard (Trigger laufen alphabetisch)
CREATE TRIGGER trg_zz_vertrag_ausweis BEFORE UPDATE ON public.anfragen FOR EACH ROW EXECUTE FUNCTION public.vertrag_ausweis_pflicht();
REVOKE EXECUTE ON FUNCTION public.vertrag_ausweis_pflicht() FROM PUBLIC, anon, authenticated;

-- Öffentliche Profile bekommen das Merkmal „Ausweis geprüft“
DROP FUNCTION IF EXISTS public.oeffentliche_profile();
CREATE FUNCTION public.oeffentliche_profile()
RETURNS TABLE (id uuid, anzeigename text, beruf text, branche text, land text, wohnort text, zielort text,
  deutschniveau text, erfahrung_jahre int, verfuegbar_ab date, ueber_mich text, skills text[], foto_pfad text, ausweis_geprueft boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id,
    p.vorname || CASE WHEN length(p.nachname) > 0 THEN ' ' || left(p.nachname,1) || '.' ELSE '' END,
    p.beruf, p.branche, p.land, p.wohnort, p.zielort, p.deutschniveau, p.erfahrung_jahre, p.verfuegbar_ab, p.ueber_mich,
    COALESCE((SELECT array_agg(s.name ORDER BY s.name) FROM public.skills s WHERE s.profile_id = p.id), '{}'),
    CASE WHEN p.foto_sichtbar THEN p.foto_pfad END,
    p.ausweis_geprueft_at IS NOT NULL
  FROM public.profiles p
  WHERE p.rolle = 'arbeitnehmer' AND p.sichtbar
  ORDER BY p.created_at
$$;
GRANT EXECUTE ON FUNCTION public.oeffentliche_profile() TO anon, authenticated;

-- Team: Busunternehmen prüfen und freigeben (statt im Tabellen-Editor)
CREATE OR REPLACE FUNCTION public.busunternehmen_offen()
RETURNS TABLE (id uuid, firma text, sitz text, register_nr text, bus_lizenz text, telefon text, email text, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.firma, p.sitz, p.register_nr, p.bus_lizenz, p.telefon, p.email, p.created_at
  FROM public.profiles p
  WHERE p.rolle = 'busunternehmen' AND p.bus_freigegeben_at IS NULL AND p.identitaet_bestaetigt
    AND public.has_role(auth.uid(), 'admin')
  ORDER BY p.created_at
$$;
GRANT EXECUTE ON FUNCTION public.busunternehmen_offen() TO authenticated;

CREATE OR REPLACE FUNCTION public.bus_freigeben(_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Nur für das Team'; END IF;
  UPDATE public.profiles SET bus_freigegeben_at = now() WHERE id = _id AND rolle = 'busunternehmen';
END $$;
REVOKE ALL ON FUNCTION public.bus_freigeben(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.bus_freigeben(uuid) TO authenticated;
