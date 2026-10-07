import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const FOTO_BUCKET = "profilbilder";

export type OeffentlichesProfil = {
  id: string;
  anzeigename: string;
  beruf: string | null;
  branche: string | null;
  land: string | null;
  wohnort: string | null;
  zielort: string | null;
  deutschniveau: string | null;
  erfahrung_jahre: number | null;
  /** Alter nur, wenn die Fachkraft es freiwillig zeigt (Opt-in; Hinweis AGG im README) – sonst fehlt das Feld */
  alter?: number | null;
  /** Team hat den Ausweis geprüft (Bilder danach gelöscht) */
  ausweis_geprueft?: boolean;
  verfuegbar_ab: string | null;
  ueber_mich: string | null;
  skills: string[];
  /** nur gesetzt, wenn die Person ihr Foto für die Suche freigegeben hat */
  foto_pfad: string | null;
  /** kurzlebiger signierter Link (Speicher ist privat) */
  foto_url: string | null;
};

export const oeffentlicheProfileQuery = queryOptions({
  queryKey: ["oeffentliche-profile"],
  queryFn: async (): Promise<OeffentlichesProfil[]> => {
    const { data, error } = await supabase.rpc("oeffentliche_profile");
    if (error) throw error;
    const liste = (data ?? []) as Omit<OeffentlichesProfil, "foto_url">[];

    const pfade = liste.map((p) => p.foto_pfad).filter((x): x is string => !!x);
    const urls = new Map<string, string>();
    if (pfade.length) {
      const { data: signiert } = await supabase.storage.from(FOTO_BUCKET).createSignedUrls(pfade, 60 * 60);
      for (const s of signiert ?? []) if (s.path && s.signedUrl) urls.set(s.path, s.signedUrl);
    }
    return liste.map((p) => ({ ...p, foto_url: p.foto_pfad ? urls.get(p.foto_pfad) ?? null : null }));
  },
  staleTime: 50 * 60_000, // unter der Gültigkeit der signierten Links bleiben
});

export const NIVEAUS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

/** Demonstrative Übereinstimmung – nur eine Empfehlung, keine automatisierte Entscheidung. */
const DEMO_MATCH: Record<string, number> = {
  "11111111-0000-4000-8000-000000000001": 96,
  "11111111-0000-4000-8000-000000000002": 91,
  "11111111-0000-4000-8000-000000000003": 88,
  "11111111-0000-4000-8000-000000000004": 85,
  "11111111-0000-4000-8000-000000000005": 82,
  "11111111-0000-4000-8000-000000000006": 93,
};
export function istBeispiel(id: string) {
  return id.startsWith("11111111-0000-4000-8000-");
}

export function matchProzent(id: string) {
  const fest = DEMO_MATCH[id];
  if (fest !== undefined) return fest;
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return 78 + (h % 20);
}

export function formatDatum(d: string | null) {
  if (!d) return "nach Absprache";
  return new Date(d).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}
