-- ============================================================================
-- Benachrichtigungen: in der App (Glocke) und – sobald RESEND_API_KEY gesetzt ist –
-- zusätzlich per E-Mail (Edge Function „benachrichtigungen-mailen“).
-- Einträge entstehen ausschließlich per Trigger (SECURITY DEFINER), nie vom Browser.
-- Inhalt bewusst ohne personenbezogene Details der Gegenseite (Datenminimierung):
-- „Neue Interview-Einladung“ statt Name/Firma.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.benachrichtigungen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  art text NOT NULL CHECK (char_length(art) <= 40),
  titel text NOT NULL CHECK (char_length(titel) <= 120),
  text text CHECK (text IS NULL OR char_length(text) <= 300),
  link text CHECK (link IS NULL OR link ~ '^/[A-Za-z0-9/_#?=&-]*$'),
  gelesen_at timestamptz,
  email_gesendet_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS benachrichtigungen_user_idx ON public.benachrichtigungen (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS benachrichtigungen_mail_idx ON public.benachrichtigungen (created_at) WHERE email_gesendet_at IS NULL;
GRANT SELECT, UPDATE ON public.benachrichtigungen TO authenticated;
GRANT ALL ON public.benachrichtigungen TO service_role;
ALTER TABLE public.benachrichtigungen ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Eigene Benachrichtigungen lesen" ON public.benachrichtigungen;
CREATE POLICY "Eigene Benachrichtigungen lesen" ON public.benachrichtigungen FOR SELECT TO authenticated
  USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Eigene als gelesen markieren" ON public.benachrichtigungen;
CREATE POLICY "Eigene als gelesen markieren" ON public.benachrichtigungen FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Nutzer dürfen nur „gelesen“ setzen – alles andere bleibt unverändert
CREATE OR REPLACE FUNCTION public.benachrichtigungen_guard()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.role() = 'authenticated' THEN
    NEW.user_id := OLD.user_id; NEW.art := OLD.art; NEW.titel := OLD.titel; NEW.text := OLD.text;
    NEW.link := OLD.link; NEW.email_gesendet_at := OLD.email_gesendet_at; NEW.created_at := OLD.created_at;
  END IF;
  RETURN NEW;
END; $function$;
DROP TRIGGER IF EXISTS trg_benachrichtigungen_guard ON public.benachrichtigungen;
CREATE TRIGGER trg_benachrichtigungen_guard BEFORE UPDATE ON public.benachrichtigungen
  FOR EACH ROW EXECUTE FUNCTION public.benachrichtigungen_guard();
REVOKE EXECUTE ON FUNCTION public.benachrichtigungen_guard() FROM PUBLIC, anon, authenticated;

-- E-Mail-Benachrichtigungen abbestellbar (In-App bleibt immer an)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_benachrichtigungen boolean NOT NULL DEFAULT true;

-- Alte Benachrichtigungen nach 180 Tagen löschen (Speicherbegrenzung, Art. 5 Abs. 1 lit. e DSGVO)
CREATE OR REPLACE FUNCTION intern.benachrichtigungen_aufraeumen()
 RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path TO 'public'
AS $$ DELETE FROM public.benachrichtigungen WHERE created_at < now() - interval '180 days' $$;
REVOKE ALL ON FUNCTION intern.benachrichtigungen_aufraeumen() FROM PUBLIC;

CREATE OR REPLACE FUNCTION intern.benachrichtigen(_user uuid, _art text, _titel text, _text text, _link text)
 RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path TO 'public'
AS $$
  INSERT INTO public.benachrichtigungen (user_id, art, titel, text, link)
  SELECT _user, _art, _titel, _text, _link WHERE _user IS NOT NULL
$$;
REVOKE ALL ON FUNCTION intern.benachrichtigen(uuid, text, text, text, text) FROM PUBLIC;

-- ---------- Auslöser ----------

-- Anfragen: Einladung, Zusage/Absage, Vertrag
CREATE OR REPLACE FUNCTION public.anfragen_benachrichtigen()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM intern.benachrichtigen(NEW.arbeitnehmer_id, 'einladung',
      CASE WHEN NEW.interview_gewuenscht THEN 'Neue Interview-Einladung' ELSE 'Neue Anfrage' END,
      'Ein Unternehmen interessiert sich für Ihr Profil. Sie entscheiden, ob Sie zusagen.', '/dashboard');
    RETURN NEW;
  END IF;

  IF NEW.status = 'beidseitig' AND OLD.status IS DISTINCT FROM 'beidseitig' THEN
    PERFORM intern.benachrichtigen(NEW.arbeitgeber_id, 'zusage', 'Zusage erhalten',
      'Die Fachkraft hat Ihrer Anfrage zugestimmt. Sie können jetzt den Vertrag bestätigen.', '/dashboard');
  ELSIF NEW.status = 'abgelehnt' AND OLD.status IS DISTINCT FROM 'abgelehnt' THEN
    PERFORM intern.benachrichtigen(NEW.arbeitgeber_id, 'absage', 'Anfrage abgelehnt',
      'Die Fachkraft hat Ihre Anfrage abgelehnt.', '/dashboard');
  END IF;

  IF NEW.vertrag_arbeitgeber_at IS NOT NULL AND NEW.vertrag_arbeitnehmer_at IS NOT NULL
     AND (OLD.vertrag_arbeitgeber_at IS NULL OR OLD.vertrag_arbeitnehmer_at IS NULL) THEN
    PERFORM intern.benachrichtigen(NEW.arbeitgeber_id, 'vertrag', 'Vertrag abgeschlossen',
      'Beide Seiten haben bestätigt. Die Kontaktdaten sind jetzt sichtbar.', '/dashboard');
    PERFORM intern.benachrichtigen(NEW.arbeitnehmer_id, 'vertrag', 'Vertrag abgeschlossen',
      'Beide Seiten haben bestätigt. Kontaktdaten und Fahrtvorschläge finden Sie im Dashboard.', '/dashboard');
  ELSIF NEW.vertrag_arbeitgeber_at IS NOT NULL AND OLD.vertrag_arbeitgeber_at IS NULL THEN
    PERFORM intern.benachrichtigen(NEW.arbeitnehmer_id, 'vertrag', 'Arbeitgeber hat den Vertrag bestätigt',
      'Bitte bestätigen Sie den Vertrag ebenfalls im Dashboard.', '/dashboard');
  ELSIF NEW.vertrag_arbeitnehmer_at IS NOT NULL AND OLD.vertrag_arbeitnehmer_at IS NULL THEN
    PERFORM intern.benachrichtigen(NEW.arbeitgeber_id, 'vertrag', 'Fachkraft hat den Vertrag bestätigt',
      'Bitte bestätigen Sie den Vertrag ebenfalls im Dashboard.', '/dashboard');
  END IF;
  RETURN NEW;
END; $function$;
DROP TRIGGER IF EXISTS trg_zz_anfragen_benachrichtigen ON public.anfragen;
CREATE TRIGGER trg_zz_anfragen_benachrichtigen AFTER INSERT OR UPDATE ON public.anfragen
  FOR EACH ROW EXECUTE FUNCTION public.anfragen_benachrichtigen();
REVOKE EXECUTE ON FUNCTION public.anfragen_benachrichtigen() FROM PUBLIC, anon, authenticated;

-- Ausweisprüfung: Ergebnis an die Fachkraft
CREATE OR REPLACE FUNCTION public.ausweis_benachrichtigen()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'geprueft' THEN
      PERFORM intern.benachrichtigen(NEW.user_id, 'ausweis', 'Ausweis geprüft',
        'Ihr Ausweis wurde bestätigt. Die Bilder wurden gelöscht.', '/dashboard');
    ELSIF NEW.status = 'abgelehnt' THEN
      PERFORM intern.benachrichtigen(NEW.user_id, 'ausweis', 'Ausweis bitte erneut hochladen',
        'Die Prüfung war nicht möglich. Den Grund sehen Sie im Dashboard.', '/dashboard');
    END IF;
  END IF;
  RETURN NEW;
END; $function$;
DROP TRIGGER IF EXISTS trg_zz_ausweis_benachrichtigen ON public.ausweis_pruefungen;
CREATE TRIGGER trg_zz_ausweis_benachrichtigen AFTER UPDATE ON public.ausweis_pruefungen
  FOR EACH ROW EXECUTE FUNCTION public.ausweis_benachrichtigen();
REVOKE EXECUTE ON FUNCTION public.ausweis_benachrichtigen() FROM PUBLIC, anon, authenticated;

-- Busbuchungen: neue Anfrage an das Busunternehmen, Antwort an die Fachkraft
CREATE OR REPLACE FUNCTION public.buchung_benachrichtigen()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM intern.benachrichtigen(NEW.firma_id, 'buchung', 'Neue Buchungsanfrage',
      'Eine Fachkraft möchte bei Ihnen mitfahren.', '/dashboard');
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'bestaetigt' THEN
      PERFORM intern.benachrichtigen(NEW.reisender_id, 'buchung', 'Fahrt bestätigt',
        'Das Busunternehmen hat Ihre Fahrt bestätigt.', '/dashboard');
    ELSIF NEW.status = 'abgelehnt' THEN
      PERFORM intern.benachrichtigen(NEW.reisender_id, 'buchung', 'Fahrt nicht möglich',
        'Das Busunternehmen kann diese Fahrt nicht anbieten. Wählen Sie gern eine andere.', '/dashboard');
    ELSIF NEW.status = 'storniert' THEN
      PERFORM intern.benachrichtigen(NEW.firma_id, 'buchung', 'Buchung storniert',
        'Eine Fachkraft hat ihre Buchungsanfrage storniert.', '/dashboard');
    ELSIF NEW.status = 'durchgefuehrt' THEN
      PERFORM intern.benachrichtigen(NEW.reisender_id, 'buchung', 'Wie war die Fahrt?',
        'Bewerten Sie das Busunternehmen – das hilft anderen Fachkräften.', '/dashboard');
    END IF;
  END IF;
  RETURN NEW;
END; $function$;
DROP TRIGGER IF EXISTS trg_zz_buchung_benachrichtigen ON public.bus_buchungen;
CREATE TRIGGER trg_zz_buchung_benachrichtigen AFTER INSERT OR UPDATE ON public.bus_buchungen
  FOR EACH ROW EXECUTE FUNCTION public.buchung_benachrichtigen();
REVOKE EXECUTE ON FUNCTION public.buchung_benachrichtigen() FROM PUBLIC, anon, authenticated;

-- Anreise (vom Team organisiert): Statuswechsel an die Fachkraft
CREATE OR REPLACE FUNCTION public.anreise_benachrichtigen()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('in_planung', 'gebucht') THEN
    PERFORM intern.benachrichtigen(NEW.user_id, 'anreise',
      CASE NEW.status WHEN 'gebucht' THEN 'Ihre Anreise ist gebucht' ELSE 'Ihre Anreise wird geplant' END,
      'Details finden Sie unter „Anreise“.', '/anreise');
  END IF;
  RETURN NEW;
END; $function$;
DROP TRIGGER IF EXISTS trg_zz_anreise_benachrichtigen ON public.anreise_anfragen;
CREATE TRIGGER trg_zz_anreise_benachrichtigen AFTER UPDATE ON public.anreise_anfragen
  FOR EACH ROW EXECUTE FUNCTION public.anreise_benachrichtigen();
REVOKE EXECUTE ON FUNCTION public.anreise_benachrichtigen() FROM PUBLIC, anon, authenticated;

-- Busunternehmen freigegeben
CREATE OR REPLACE FUNCTION public.bus_freigabe_benachrichtigen()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.bus_freigegeben_at IS NOT NULL AND OLD.bus_freigegeben_at IS NULL THEN
    PERFORM intern.benachrichtigen(NEW.id, 'freigabe', 'Ihr Unternehmen ist freigeschaltet',
      'Ihre Fahrten sind jetzt öffentlich sichtbar.', '/dashboard');
  END IF;
  RETURN NEW;
END; $function$;
DROP TRIGGER IF EXISTS trg_zz_bus_freigabe_benachrichtigen ON public.profiles;
CREATE TRIGGER trg_zz_bus_freigabe_benachrichtigen AFTER UPDATE OF bus_freigegeben_at ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.bus_freigabe_benachrichtigen();
REVOKE EXECUTE ON FUNCTION public.bus_freigabe_benachrichtigen() FROM PUBLIC, anon, authenticated;

-- Für die Edge Function: offene E-Mails holen (nur service_role)
CREATE OR REPLACE FUNCTION public.mails_offen(_limit int DEFAULT 50)
 RETURNS TABLE (id uuid, email text, vorname text, titel text, text text, link text)
 LANGUAGE sql SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT b.id, p.email, nullif(p.vorname, ''), b.titel, b.text, b.link
  FROM public.benachrichtigungen b JOIN public.profiles p ON p.id = b.user_id
  WHERE b.email_gesendet_at IS NULL AND b.created_at > now() - interval '2 days'
    AND p.email IS NOT NULL AND p.email_benachrichtigungen
  ORDER BY b.created_at
  LIMIT least(greatest(_limit, 1), 200)
$$;
REVOKE EXECUTE ON FUNCTION public.mails_offen(int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mails_offen(int) TO service_role;
