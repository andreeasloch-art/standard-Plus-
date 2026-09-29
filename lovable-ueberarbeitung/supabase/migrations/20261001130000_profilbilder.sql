-- Profilfotos: freiwillig, privater Speicher, eigene Einwilligung für die Anzeige in der Suche.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS foto_pfad text,
  ADD COLUMN IF NOT EXISTS foto_sichtbar boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS foto_einwilligung_at timestamptz,
  ADD COLUMN IF NOT EXISTS foto_widerrufen_at timestamptz;

-- Foto-Pfad muss im eigenen Ordner liegen
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_foto_pfad_eigener_ordner;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_foto_pfad_eigener_ordner
  CHECK (foto_pfad IS NULL OR foto_pfad LIKE id::text || '/%');

-- Einwilligung zur Fotoanzeige protokollieren
CREATE OR REPLACE FUNCTION public.profiles_foto_log()
 RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.foto_pfad IS NULL THEN NEW.foto_sichtbar := false; END IF;
  IF NEW.foto_sichtbar IS DISTINCT FROM OLD.foto_sichtbar THEN
    IF NEW.foto_sichtbar THEN NEW.foto_einwilligung_at := now();
    ELSE NEW.foto_widerrufen_at := now(); END IF;
  ELSE
    NEW.foto_einwilligung_at := OLD.foto_einwilligung_at;
    NEW.foto_widerrufen_at := OLD.foto_widerrufen_at;
  END IF;
  RETURN NEW;
END; $function$;
DROP TRIGGER IF EXISTS trg_profiles_foto ON public.profiles;
CREATE TRIGGER trg_profiles_foto BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.profiles_foto_log();

-- Privater Bucket: max. 5 MB, nur Bilder
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('profilbilder', 'profilbilder', false, 5242880, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Darf das Foto unter diesem Pfad öffentlich (signiert) ausgeliefert werden?
CREATE OR REPLACE FUNCTION public.foto_freigegeben(_pfad text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE foto_pfad = _pfad AND foto_sichtbar AND sichtbar AND rolle = 'arbeitnehmer'
  )
$$;
GRANT EXECUTE ON FUNCTION public.foto_freigegeben(text) TO anon, authenticated;

DROP POLICY IF EXISTS "Profilbild eigenes lesen" ON storage.objects;
DROP POLICY IF EXISTS "Profilbild freigegebene lesen" ON storage.objects;
DROP POLICY IF EXISTS "Profilbild hochladen" ON storage.objects;
DROP POLICY IF EXISTS "Profilbild ändern" ON storage.objects;
DROP POLICY IF EXISTS "Profilbild löschen" ON storage.objects;

CREATE POLICY "Profilbild eigenes lesen" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'profilbilder' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Profilbild freigegebene lesen" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'profilbilder' AND public.foto_freigegeben(name));
CREATE POLICY "Profilbild hochladen" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'profilbilder' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Profilbild ändern" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'profilbilder' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Profilbild löschen" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'profilbilder' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Öffentliche Profilsicht um das Foto erweitern (nur wenn freigegeben)
DROP FUNCTION IF EXISTS public.oeffentliche_profile();
CREATE FUNCTION public.oeffentliche_profile()
RETURNS TABLE (id uuid, anzeigename text, beruf text, branche text, land text, wohnort text, zielort text,
  deutschniveau text, erfahrung_jahre int, verfuegbar_ab date, ueber_mich text, skills text[], foto_pfad text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id,
    p.vorname || CASE WHEN length(p.nachname) > 0 THEN ' ' || left(p.nachname,1) || '.' ELSE '' END,
    p.beruf, p.branche, p.land, p.wohnort, p.zielort, p.deutschniveau, p.erfahrung_jahre, p.verfuegbar_ab, p.ueber_mich,
    COALESCE((SELECT array_agg(s.name ORDER BY s.name) FROM public.skills s WHERE s.profile_id = p.id), '{}'),
    CASE WHEN p.foto_sichtbar THEN p.foto_pfad END
  FROM public.profiles p
  WHERE p.rolle = 'arbeitnehmer' AND p.sichtbar
  ORDER BY p.created_at
$$;
GRANT EXECUTE ON FUNCTION public.oeffentliche_profile() TO anon, authenticated;
