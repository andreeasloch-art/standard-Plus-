-- ============================================================================
-- Busunternehmen: Fahrten anbieten, Bilder, Buchungen, echte Bewertungen,
-- automatische Fahrtvorschläge nach Vertragsabschluss.
-- ============================================================================

-- Registrierung: Rolle „busunternehmen“ aus den Metadaten übernehmen (sonst wie 20261004120000)
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE r public.app_role; wunsch boolean; bestaetigt boolean; s boolean;
BEGIN
  r := CASE NEW.raw_user_meta_data->>'rolle'
         WHEN 'arbeitgeber' THEN 'arbeitgeber'::public.app_role
         WHEN 'busunternehmen' THEN 'busunternehmen'::public.app_role
         ELSE 'arbeitnehmer'::public.app_role END;
  wunsch := r = 'arbeitnehmer' AND COALESCE(NEW.raw_user_meta_data->>'sichtbar','false') = 'true';
  bestaetigt := NEW.email_confirmed_at IS NOT NULL OR NEW.phone_confirmed_at IS NOT NULL;
  s := wunsch AND bestaetigt;
  INSERT INTO public.profiles (id, rolle, vorname, nachname, email, telefon, sichtbar,
    datenschutz_version, datenschutz_akzeptiert_at, bedingungen_version, bedingungen_akzeptiert_at,
    unternehmer_bestaetigt_at, sichtbarkeit_einwilligung_at)
  VALUES (NEW.id, r, '', '', NEW.email,
    CASE WHEN NEW.phone IS NOT NULL AND NEW.phone <> '' THEN '+' || ltrim(NEW.phone, '+') END,
    s,
    NEW.raw_user_meta_data->>'datenschutz_version', now(),
    NEW.raw_user_meta_data->>'bedingungen_version', now(),
    CASE WHEN r IN ('arbeitgeber', 'busunternehmen') AND NEW.raw_user_meta_data->>'unternehmer' = 'true' THEN now() END,
    CASE WHEN s THEN now() END);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, r);
  RETURN NEW;
END; $function$;

-- Firmenangaben des Busunternehmens (öffentlich): Name/Sitz/Telefon/E-Mail stehen schon in profiles.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bus_beschreibung text CHECK (bus_beschreibung IS NULL OR char_length(bus_beschreibung) <= 1000),
  ADD COLUMN IF NOT EXISTS bus_fahrten_bisher int CHECK (bus_fahrten_bisher IS NULL OR bus_fahrten_bisher BETWEEN 0 AND 1000000),
  ADD COLUMN IF NOT EXISTS bus_lizenz text CHECK (bus_lizenz IS NULL OR char_length(bus_lizenz) <= 200),
  ADD COLUMN IF NOT EXISTS bus_freigegeben_at timestamptz; -- vom Team nach Prüfung gesetzt (DSA Art. 30)

-- Nur das Team (admin) setzt die Freigabe
CREATE OR REPLACE FUNCTION public.profiles_bus_freigabe_schutz()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.bus_freigegeben_at := OLD.bus_freigegeben_at;
  END IF;
  RETURN NEW;
END; $function$;
DROP TRIGGER IF EXISTS trg_profiles_bus_freigabe ON public.profiles;
CREATE TRIGGER trg_profiles_bus_freigabe BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.profiles_bus_freigabe_schutz();
REVOKE EXECUTE ON FUNCTION public.profiles_bus_freigabe_schutz() FROM PUBLIC, anon, authenticated;

-- Hilfsfunktion: Ortsnamen vergleichbar machen (Groß/klein, Akzente: „Timișoara“ = „Timisoara“)
CREATE OR REPLACE FUNCTION intern.norm(t text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT lower(translate(coalesce(t, ''),
    'ăâîșşțţáàäãåéèêëíìïóòöôõúùüûçčćđšžłńñýÿĂÂÎȘŞȚŢÁÀÄÉÈÍÓÖÚÜÇČĆĐŠŽŁŃÑ',
    'aaissttaaaaaeeeeiiiooooouuuucccdszlnnyyAAISSTTAAAEEIOOUUCCCDSZLNN'))
$$;

-- ---------------------------------------------------------------- Fahrten
CREATE TABLE IF NOT EXISTS public.busfahrten (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  von_ort text NOT NULL CHECK (char_length(von_ort) BETWEEN 2 AND 120),
  nach_ort text NOT NULL CHECK (char_length(nach_ort) BETWEEN 2 AND 120),
  haltestellen text[] NOT NULL DEFAULT '{}' CHECK (cardinality(haltestellen) <= 30),
  abfahrt_info text NOT NULL CHECK (char_length(abfahrt_info) BETWEEN 2 AND 200), -- z. B. „jeden Freitag 18:00“
  dauer_stunden numeric(4,1) CHECK (dauer_stunden IS NULL OR dauer_stunden BETWEEN 0.5 AND 99),
  preis_eur numeric(8,2) NOT NULL CHECK (preis_eur BETWEEN 0 AND 10000),
  plaetze int CHECK (plaetze IS NULL OR plaetze BETWEEN 1 AND 100),
  beschreibung text CHECK (beschreibung IS NULL OR char_length(beschreibung) <= 1000),
  aktiv boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.busfahrten TO authenticated;
GRANT ALL ON public.busfahrten TO service_role;
ALTER TABLE public.busfahrten ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_busfahrten_updated BEFORE UPDATE ON public.busfahrten FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY "Eigene Fahrten lesen" ON public.busfahrten FOR SELECT TO authenticated USING (firma_id = auth.uid());
CREATE POLICY "Fahrt anbieten" ON public.busfahrten FOR INSERT TO authenticated
  WITH CHECK (firma_id = auth.uid() AND public.has_role(auth.uid(), 'busunternehmen'));
CREATE POLICY "Eigene Fahrt ändern" ON public.busfahrten FOR UPDATE TO authenticated
  USING (firma_id = auth.uid()) WITH CHECK (firma_id = auth.uid());
CREATE POLICY "Eigene Fahrt löschen" ON public.busfahrten FOR DELETE TO authenticated USING (firma_id = auth.uid());

-- ---------------------------------------------------------------- Bilder (privater Speicher)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('busbilder', 'busbilder', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.bus_bilder (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  pfad text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (pfad LIKE firma_id::text || '/%')
);
GRANT SELECT, INSERT, DELETE ON public.bus_bilder TO authenticated;
GRANT ALL ON public.bus_bilder TO service_role;
ALTER TABLE public.bus_bilder ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Eigene Busbilder lesen" ON public.bus_bilder FOR SELECT TO authenticated USING (firma_id = auth.uid());
CREATE POLICY "Busbild eintragen" ON public.bus_bilder FOR INSERT TO authenticated
  WITH CHECK (firma_id = auth.uid() AND public.has_role(auth.uid(), 'busunternehmen')
    AND (SELECT count(*) FROM public.bus_bilder b WHERE b.firma_id = auth.uid()) < 12);
CREATE POLICY "Busbild austragen" ON public.bus_bilder FOR DELETE TO authenticated USING (firma_id = auth.uid());

CREATE OR REPLACE FUNCTION intern.busbild_oeffentlich(_pfad text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.bus_bilder b JOIN public.profiles p ON p.id = b.firma_id
                 WHERE b.pfad = _pfad AND p.rolle = 'busunternehmen')
$$;
REVOKE ALL ON FUNCTION intern.busbild_oeffentlich(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION intern.busbild_oeffentlich(text) TO anon, authenticated;

DROP POLICY IF EXISTS "Busbild lesen" ON storage.objects;
DROP POLICY IF EXISTS "Busbild eigenes lesen" ON storage.objects;
DROP POLICY IF EXISTS "Busbild hochladen" ON storage.objects;
DROP POLICY IF EXISTS "Busbild löschen" ON storage.objects;
CREATE POLICY "Busbild lesen" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'busbilder' AND intern.busbild_oeffentlich(name));
CREATE POLICY "Busbild eigenes lesen" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'busbilder' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Busbild hochladen" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'busbilder' AND (storage.foldername(name))[1] = auth.uid()::text
    AND public.has_role(auth.uid(), 'busunternehmen')
    AND lower(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp'));
CREATE POLICY "Busbild löschen" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'busbilder' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------- Buchungen
DO $$ BEGIN
  CREATE TYPE public.buchung_status AS ENUM ('angefragt', 'bestaetigt', 'abgelehnt', 'durchgefuehrt', 'storniert');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.bus_buchungen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fahrt_id uuid NOT NULL REFERENCES public.busfahrten(id) ON DELETE CASCADE,
  firma_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  anfrage_id uuid REFERENCES public.anfragen(id) ON DELETE SET NULL, -- der Job-Deal, aus dem die Fahrt entstand
  reisender_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  reisedatum date,
  personen int NOT NULL DEFAULT 1 CHECK (personen BETWEEN 1 AND 9),
  nachricht text CHECK (nachricht IS NULL OR char_length(nachricht) <= 500),
  kontakt_einwilligung_at timestamptz, -- Fachkraft willigt ein, dass Name + Handynummer an das Busunternehmen gehen
  status public.buchung_status NOT NULL DEFAULT 'angefragt',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.bus_buchungen TO authenticated;
GRANT ALL ON public.bus_buchungen TO service_role;
ALTER TABLE public.bus_buchungen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buchungen lesen" ON public.bus_buchungen FOR SELECT TO authenticated
  USING (reisender_id = auth.uid() OR firma_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.anfragen a WHERE a.id = anfrage_id AND a.arbeitgeber_id = auth.uid()));
-- Nur die Fachkraft selbst fragt an (ihre Daten gehen an das Busunternehmen)
CREATE POLICY "Fahrt anfragen" ON public.bus_buchungen FOR INSERT TO authenticated
  WITH CHECK (reisender_id = auth.uid() AND public.has_role(auth.uid(), 'arbeitnehmer'));
CREATE POLICY "Buchung ändern" ON public.bus_buchungen FOR UPDATE TO authenticated
  USING (reisender_id = auth.uid() OR firma_id = auth.uid())
  WITH CHECK (reisender_id = auth.uid() OR firma_id = auth.uid());

CREATE OR REPLACE FUNCTION public.bus_buchungen_guard()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE f public.busfahrten;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT * INTO f FROM public.busfahrten WHERE id = NEW.fahrt_id AND aktiv;
    IF NOT FOUND THEN RAISE EXCEPTION 'Fahrt nicht verfügbar'; END IF;
    NEW.firma_id := f.firma_id;
    NEW.status := 'angefragt';
    NEW.kontakt_einwilligung_at := now();
    -- Deal-Bezug nur, wenn die Fachkraft an diesem Deal beteiligt ist
    IF NEW.anfrage_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.anfragen a WHERE a.id = NEW.anfrage_id AND a.arbeitnehmer_id = NEW.reisender_id) THEN
      NEW.anfrage_id := NULL;
    END IF;
    RETURN NEW;
  END IF;
  -- UPDATE: nur der Status ändert sich, und nur in erlaubten Schritten
  NEW.fahrt_id := OLD.fahrt_id; NEW.firma_id := OLD.firma_id; NEW.anfrage_id := OLD.anfrage_id;
  NEW.reisender_id := OLD.reisender_id; NEW.reisedatum := OLD.reisedatum; NEW.personen := OLD.personen;
  NEW.nachricht := OLD.nachricht; NEW.kontakt_einwilligung_at := OLD.kontakt_einwilligung_at;
  NEW.updated_at := now();
  IF auth.uid() = OLD.firma_id THEN
    IF NOT ((OLD.status = 'angefragt' AND NEW.status IN ('bestaetigt', 'abgelehnt'))
         OR (OLD.status = 'bestaetigt' AND NEW.status = 'durchgefuehrt')) THEN
      NEW.status := OLD.status;
    END IF;
  ELSIF auth.uid() = OLD.reisender_id THEN
    IF NOT (OLD.status IN ('angefragt', 'bestaetigt') AND NEW.status = 'storniert') THEN
      NEW.status := OLD.status;
    END IF;
  ELSE
    NEW.status := OLD.status;
  END IF;
  RETURN NEW;
END; $function$;
DROP TRIGGER IF EXISTS trg_bus_buchungen_guard ON public.bus_buchungen;
CREATE TRIGGER trg_bus_buchungen_guard BEFORE INSERT OR UPDATE ON public.bus_buchungen
  FOR EACH ROW EXECUTE FUNCTION public.bus_buchungen_guard();
REVOKE EXECUTE ON FUNCTION public.bus_buchungen_guard() FROM PUBLIC, anon, authenticated;

-- Busunternehmen sieht vom Reisenden nur Name und Handynummer (Datensparsamkeit) – solange die Buchung läuft
CREATE OR REPLACE FUNCTION public.buchung_reisender(_buchung uuid)
RETURNS TABLE (name text, telefon text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT trim(p.vorname || ' ' || p.nachname), p.telefon
  FROM public.bus_buchungen b JOIN public.profiles p ON p.id = b.reisender_id
  WHERE b.id = _buchung AND b.firma_id = auth.uid() AND b.status IN ('angefragt', 'bestaetigt', 'durchgefuehrt')
$$;
GRANT EXECUTE ON FUNCTION public.buchung_reisender(uuid) TO authenticated;

-- ---------------------------------------------------------------- Bewertungen (nur nach durchgeführter Fahrt)
CREATE TABLE IF NOT EXISTS public.bus_bewertungen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buchung_id uuid NOT NULL REFERENCES public.bus_buchungen(id) ON DELETE CASCADE,
  firma_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  von_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  sterne int NOT NULL CHECK (sterne BETWEEN 1 AND 5),
  text text CHECK (text IS NULL OR char_length(text) <= 1000),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (buchung_id, von_id)
);
GRANT SELECT, INSERT ON public.bus_bewertungen TO authenticated;
GRANT ALL ON public.bus_bewertungen TO service_role;
ALTER TABLE public.bus_bewertungen ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Eigene Busbewertungen lesen" ON public.bus_bewertungen FOR SELECT TO authenticated
  USING (von_id = auth.uid() OR firma_id = auth.uid());
CREATE POLICY "Fahrt bewerten" ON public.bus_bewertungen FOR INSERT TO authenticated
  WITH CHECK (von_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.bus_buchungen b
    WHERE b.id = buchung_id AND b.firma_id = bus_bewertungen.firma_id AND b.status = 'durchgefuehrt'
      AND (b.reisender_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.anfragen a WHERE a.id = b.anfrage_id AND a.arbeitgeber_id = auth.uid()))));

-- ---------------------------------------------------------------- Öffentliche Fahrtenliste
CREATE OR REPLACE FUNCTION public.oeffentliche_busfahrten()
RETURNS TABLE (id uuid, firma_id uuid, firma text, sitz text, telefon text, email text, firma_beschreibung text,
  fahrten_bisher int, von_ort text, nach_ort text, haltestellen text[], abfahrt_info text, dauer_stunden numeric,
  preis_eur numeric, plaetze int, beschreibung text, bewertung numeric, bewertungen int, fahrten_durchgefuehrt int, bilder text[])
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT f.id, f.firma_id, p.firma, p.sitz, p.telefon, p.email, p.bus_beschreibung, p.bus_fahrten_bisher,
    f.von_ort, f.nach_ort, f.haltestellen, f.abfahrt_info, f.dauer_stunden, f.preis_eur, f.plaetze, f.beschreibung,
    (SELECT round(avg(v.sterne)::numeric, 1) FROM public.bus_bewertungen v WHERE v.firma_id = f.firma_id),
    (SELECT count(*)::int FROM public.bus_bewertungen v WHERE v.firma_id = f.firma_id),
    (SELECT count(*)::int FROM public.bus_buchungen b WHERE b.firma_id = f.firma_id AND b.status = 'durchgefuehrt'),
    COALESCE((SELECT array_agg(i.pfad ORDER BY i.created_at) FROM public.bus_bilder i WHERE i.firma_id = f.firma_id), '{}')
  FROM public.busfahrten f JOIN public.profiles p ON p.id = f.firma_id
  WHERE f.aktiv AND p.rolle = 'busunternehmen' AND coalesce(p.firma, '') <> '' AND p.bus_freigegeben_at IS NOT NULL
  ORDER BY f.created_at DESC
$$;
GRANT EXECUTE ON FUNCTION public.oeffentliche_busfahrten() TO anon, authenticated;

-- Öffentliche Bewertungstexte (Vorname + Initial)
CREATE OR REPLACE FUNCTION public.bus_bewertungen_oeffentlich(_firma uuid)
RETURNS TABLE (sterne int, text text, von text, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT v.sterne, v.text,
    p.vorname || CASE WHEN length(p.nachname) > 0 THEN ' ' || left(p.nachname, 1) || '.' ELSE '' END,
    v.created_at
  FROM public.bus_bewertungen v JOIN public.profiles p ON p.id = v.von_id
  WHERE v.firma_id = _firma ORDER BY v.created_at DESC LIMIT 20
$$;
GRANT EXECUTE ON FUNCTION public.bus_bewertungen_oeffentlich(uuid) TO anon, authenticated;

-- ---------------------------------------------------------------- Vorschläge nach dem Deal
-- Für Arbeitgeber und Fachkraft eines Deals mit bestätigtem Vertrag: Fahrten vom Wohnort/Land der Fachkraft
-- zum Arbeitsort (Ort der Stelle, sonst Wunsch-Zielort). Sortierung offen gelegt: Strecke, dann Bewertung, dann Preis.
CREATE OR REPLACE FUNCTION public.fahrt_vorschlaege(_anfrage uuid)
RETURNS TABLE (id uuid, firma_id uuid, firma text, sitz text, telefon text, email text, firma_beschreibung text,
  fahrten_bisher int, von_ort text, nach_ort text, haltestellen text[], abfahrt_info text, dauer_stunden numeric,
  preis_eur numeric, plaetze int, beschreibung text, bewertung numeric, bewertungen int, fahrten_durchgefuehrt int,
  bilder text[], treffer int)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH d AS (
    SELECT intern.norm(w.wohnort) AS von, intern.norm(w.land) AS land,
      intern.norm(COALESCE(NULLIF(s.ort, ''), w.zielort)) AS ziel
    FROM public.anfragen a
    JOIN public.profiles w ON w.id = a.arbeitnehmer_id
    LEFT JOIN public.stellen s ON s.id = a.stelle_id
    WHERE a.id = _anfrage
      AND (a.arbeitgeber_id = auth.uid() OR a.arbeitnehmer_id = auth.uid())
      AND public.hat_vertrag(a.arbeitgeber_id, a.arbeitnehmer_id)
  ), bewertet AS (
    SELECT f.*,
      (CASE WHEN EXISTS (SELECT 1 FROM unnest(array[f.von_ort] || f.haltestellen) h
              WHERE (d.von <> '' AND intern.norm(h) LIKE '%' || d.von || '%')
                 OR (d.land <> '' AND intern.norm(h) LIKE '%' || d.land || '%')) THEN 2 ELSE 0 END
     + CASE WHEN d.ziel <> '' AND EXISTS (SELECT 1 FROM unnest(f.haltestellen || array[f.nach_ort]) h
              WHERE intern.norm(h) LIKE '%' || d.ziel || '%') THEN 2 ELSE 0 END)::int AS treffer
    FROM public.oeffentliche_busfahrten() f, d
  )
  SELECT * FROM bewertet WHERE treffer > 0
  ORDER BY treffer DESC, bewertung DESC NULLS LAST, preis_eur ASC
  LIMIT 5
$$;
GRANT EXECUTE ON FUNCTION public.fahrt_vorschlaege(uuid) TO authenticated;
