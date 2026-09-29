-- Kündigungen bleiben nach einer Kontolöschung als Nachweis erhalten (ohne Kontobezug).
ALTER TABLE public.kuendigungen ALTER COLUMN user_id DROP NOT NULL;

-- Zeitpunkt, ab dem der Nachweis gelöscht werden darf (Frist in der Datenschutzerklärung).
ALTER TABLE public.kuendigungen ADD COLUMN IF NOT EXISTS konto_geloescht_at timestamptz;

CREATE OR REPLACE FUNCTION public.kuendigungen_konto_geloescht()
 RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.user_id IS NOT NULL AND NEW.user_id IS NULL THEN
    NEW.konto_geloescht_at := now();
  END IF;
  RETURN NEW;
END; $function$;

DROP TRIGGER IF EXISTS trg_kuendigungen_konto_geloescht ON public.kuendigungen;
CREATE TRIGGER trg_kuendigungen_konto_geloescht
  BEFORE UPDATE ON public.kuendigungen
  FOR EACH ROW EXECUTE FUNCTION public.kuendigungen_konto_geloescht();
