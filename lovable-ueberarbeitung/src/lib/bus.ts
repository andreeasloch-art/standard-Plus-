import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const BUS_BUCKET = "busbilder";

/** Eine öffentlich angebotene Busfahrt inkl. Firmenangaben, Bewertung und Bildern (RPC oeffentliche_busfahrten). */
export type Busfahrt = {
  id: string;
  firma_id: string;
  firma: string | null;
  sitz: string | null;
  telefon: string | null;
  email: string | null;
  firma_beschreibung: string | null;
  fahrten_bisher: number | null; // Angabe des Unternehmens
  von_ort: string;
  nach_ort: string;
  haltestellen: string[];
  abfahrt_info: string;
  dauer_stunden: number | null;
  preis_eur: number;
  plaetze: number | null;
  beschreibung: string | null;
  bewertung: number | null;
  bewertungen: number;
  fahrten_durchgefuehrt: number; // auf Standard Plus gezählt
  bilder: string[];
  bild_urls?: string[];
  treffer?: number;
};

export type BuchungStatus = "angefragt" | "bestaetigt" | "abgelehnt" | "durchgefuehrt" | "storniert";
export const BUCHUNG_TEXT: Record<BuchungStatus, string> = {
  angefragt: "Angefragt",
  bestaetigt: "Bestätigt",
  abgelehnt: "Abgelehnt",
  durchgefuehrt: "Durchgeführt",
  storniert: "Storniert",
};

/** Kurzlebige Links zu den Bildern (Speicher ist privat; freigegeben sind nur Bilder von Busunternehmen). */
export async function mitBildern(fahrten: Busfahrt[]): Promise<Busfahrt[]> {
  const pfade = [...new Set(fahrten.flatMap((f) => f.bilder.slice(0, 6)))];
  if (!pfade.length) return fahrten;
  const { data } = await supabase.storage.from(BUS_BUCKET).createSignedUrls(pfade, 3600);
  const url = new Map((data ?? []).map((d: { path: string | null; signedUrl: string }) => [d.path, d.signedUrl]));
  return fahrten.map((f) => ({ ...f, bild_urls: f.bilder.map((p) => url.get(p)).filter((u): u is string => !!u) }));
}

export const busfahrtenQuery = queryOptions({
  queryKey: ["busfahrten"],
  queryFn: async (): Promise<Busfahrt[]> => {
    const { data, error } = await supabase.rpc("oeffentliche_busfahrten");
    if (error) throw error;
    return mitBildern((data ?? []) as Busfahrt[]);
  },
  staleTime: 60_000,
});

export function fahrtVorschlaegeQuery(anfrageId: string) {
  return queryOptions({
    queryKey: ["fahrt-vorschlaege", anfrageId],
    queryFn: async (): Promise<Busfahrt[]> => {
      const { data, error } = await supabase.rpc("fahrt_vorschlaege", { _anfrage: anfrageId });
      if (error) throw error;
      return mitBildern((data ?? []) as Busfahrt[]);
    },
  });
}

export const preis = (eur: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: eur % 1 ? 2 : 0 }).format(eur);

/** Ortsnamen vergleichbar machen (Akzente, Groß/klein) – wie intern.norm in der Datenbank. */
export function norm(t: string) {
  return t.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l").replace(/đ/g, "d").toLowerCase().trim();
}

/** Fährt diese Fahrt von „von“ nach „nach“? Haltestellen zählen mit, die Reihenfolge muss stimmen. */
export function faehrtStrecke(f: Busfahrt, von: string, nach: string) {
  const stopps = [f.von_ort, ...f.haltestellen, f.nach_ort].map(norm);
  const v = norm(von), n = norm(nach);
  const iv = v ? stopps.findIndex((s) => s.includes(v)) : 0;
  if (iv < 0) return false;
  if (!n) return true;
  const in_ = stopps.findIndex((s, i) => i > iv && s.includes(n));
  return in_ > iv || (!v && stopps.some((s) => s.includes(n)));
}
