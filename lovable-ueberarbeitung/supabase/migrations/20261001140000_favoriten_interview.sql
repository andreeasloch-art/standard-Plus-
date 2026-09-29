-- Favoriten (Wischen nach rechts) und Interview-Einladungen

CREATE TABLE IF NOT EXISTS public.favoriten (
  arbeitgeber_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  arbeitnehmer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (arbeitgeber_id, arbeitnehmer_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.favoriten TO authenticated;
GRANT ALL ON public.favoriten TO service_role;
ALTER TABLE public.favoriten ENABLE ROW LEVEL SECURITY;

-- Nur das Unternehmen selbst sieht seine Favoriten; die Fachkraft erfährt davon nichts.
CREATE POLICY "Eigene Favoriten lesen" ON public.favoriten FOR SELECT TO authenticated
  USING (arbeitgeber_id = auth.uid());
CREATE POLICY "Favorit setzen" ON public.favoriten FOR INSERT TO authenticated
  WITH CHECK (arbeitgeber_id = auth.uid() AND public.has_role(auth.uid(), 'arbeitgeber') AND public.profil_sichtbar(arbeitnehmer_id));
CREATE POLICY "Favorit ändern" ON public.favoriten FOR UPDATE TO authenticated
  USING (arbeitgeber_id = auth.uid()) WITH CHECK (arbeitgeber_id = auth.uid());
CREATE POLICY "Favorit entfernen" ON public.favoriten FOR DELETE TO authenticated
  USING (arbeitgeber_id = auth.uid());

-- Interviewwunsch an der Anfrage
ALTER TABLE public.anfragen
  ADD COLUMN IF NOT EXISTS interview_gewuenscht boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS interview_art text CHECK (interview_art IS NULL OR interview_art IN ('video', 'telefon')),
  ADD COLUMN IF NOT EXISTS wunschtermin timestamptz,
  ADD COLUMN IF NOT EXISTS dolmetscher boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS nachricht text CHECK (nachricht IS NULL OR char_length(nachricht) <= 500);

-- Favoriten gehören zum Konto: beim Löschen werden sie über ON DELETE CASCADE entfernt,
-- im Datenexport bitte mit ausgeben (siehe KontoBereich / Datenexport).
