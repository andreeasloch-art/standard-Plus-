-- ============================================================================
-- Alter freiwillig anzeigen (Opt-in, standardmäßig AUS).
-- Hinweis AGG: Das Alter kann Altersdiskriminierung begünstigen – deshalb nur, wenn die
-- Fachkraft es ausdrücklich einschaltet. Angezeigt werden nur ganze Jahre, nie das Geburtsdatum.
-- ============================================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS alter_sichtbar boolean NOT NULL DEFAULT false;

DROP FUNCTION IF EXISTS public.oeffentliche_profile();
CREATE FUNCTION public.oeffentliche_profile()
RETURNS TABLE (id uuid, anzeigename text, beruf text, branche text, land text, wohnort text, zielort text,
  deutschniveau text, erfahrung_jahre int, verfuegbar_ab date, ueber_mich text, skills text[], foto_pfad text,
  ausweis_geprueft boolean, "alter" int)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id,
    p.vorname || CASE WHEN length(p.nachname) > 0 THEN ' ' || left(p.nachname,1) || '.' ELSE '' END,
    p.beruf, p.branche, p.land, p.wohnort, p.zielort, p.deutschniveau, p.erfahrung_jahre, p.verfuegbar_ab, p.ueber_mich,
    COALESCE((SELECT array_agg(s.name ORDER BY s.name) FROM public.skills s WHERE s.profile_id = p.id), '{}'),
    CASE WHEN p.foto_sichtbar THEN p.foto_pfad END,
    p.ausweis_geprueft_at IS NOT NULL,
    CASE WHEN p.alter_sichtbar AND p.geburtsdatum IS NOT NULL
      THEN extract(year FROM age(current_date, p.geburtsdatum))::int END
  FROM public.profiles p
  WHERE p.rolle = 'arbeitnehmer' AND p.sichtbar
  ORDER BY p.created_at
$$;
GRANT EXECUTE ON FUNCTION public.oeffentliche_profile() TO anon, authenticated;
