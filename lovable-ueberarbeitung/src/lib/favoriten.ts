import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useRolle } from "@/lib/auth";
import { lokaleListe } from "@/lib/merkliste-lokal";

export type InterviewArt = "video" | "telefon";
export type EinladungDaten = {
  profilId: string;
  art: InterviewArt;
  termin: string; // ISO-Datum mit Uhrzeit
  dolmetscher: boolean;
  nachricht: string;
};

export class NichtAngemeldet extends Error {
  constructor() { super("Bitte melden Sie sich als Unternehmen an, um einzuladen."); }
}

const lokal = lokaleListe<string>("sp-favoriten");

/**
 * Favoriten: angemeldete Unternehmen speichern in der Datenbank,
 * alle anderen merken sich die Auswahl nur für diese Sitzung im Browser.
 */
export function useFavoriten() {
  const { session } = useAuth();
  const { data: rolle } = useRolle();
  const uid = session?.user.id;
  const inDb = !!uid && rolle === "arbeitgeber";
  const qc = useQueryClient();
  const lokaleIds = lokal.use();

  const q = useQuery({
    queryKey: ["favoriten", uid],
    enabled: inDb,
    queryFn: async () => {
      const { data, error } = await supabase.from("favoriten").select("arbeitnehmer_id").eq("arbeitgeber_id", uid!);
      if (error) throw error;
      return data.map((d) => d.arbeitnehmer_id);
    },
  });

  const m = useMutation({
    mutationFn: async ({ id, an }: { id: string; an: boolean }) => {
      const r = an
        ? await supabase.from("favoriten").upsert({ arbeitgeber_id: uid!, arbeitnehmer_id: id }, { onConflict: "arbeitgeber_id,arbeitnehmer_id" })
        : await supabase.from("favoriten").delete().eq("arbeitgeber_id", uid!).eq("arbeitnehmer_id", id);
      if (r.error) throw r.error;
    },
    onMutate: async ({ id, an }) => {
      await qc.cancelQueries({ queryKey: ["favoriten", uid] });
      const vorher = qc.getQueryData<string[]>(["favoriten", uid]) ?? [];
      qc.setQueryData(["favoriten", uid], an ? [...new Set([...vorher, id])] : vorher.filter((x) => x !== id));
      return { vorher };
    },
    onError: (_e, _v, ctx) => qc.setQueryData(["favoriten", uid], ctx?.vorher),
    onSettled: () => qc.invalidateQueries({ queryKey: ["favoriten", uid] }),
  });

  const ids = inDb ? q.data ?? [] : lokaleIds;
  const setzen = (id: string, an: boolean) => {
    if (inDb) m.mutate({ id, an });
    else lokal.setzen(an ? [...new Set([...lokal.holen(), id])] : lokal.holen().filter((x) => x !== id));
  };
  return { ids, gespeichert: inDb, ist: (id: string) => ids.includes(id), setzen, umschalten: (id: string) => setzen(id, !ids.includes(id)) };
}

/** Interview-Einladungen = Anfragen mit Interviewwunsch. Nur für angemeldete Unternehmen. */
export function useEinladungen() {
  const { session } = useAuth();
  const { data: rolle } = useRolle();
  const uid = session?.user.id;
  const darf = !!uid && rolle === "arbeitgeber";
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["einladungen", uid],
    enabled: darf,
    queryFn: async () => {
      const { data, error } = await supabase.from("anfragen").select("arbeitnehmer_id").eq("arbeitgeber_id", uid!).eq("interview_gewuenscht", true);
      if (error) throw error;
      return data.map((d) => d.arbeitnehmer_id);
    },
  });

  const einladen = async (e: EinladungDaten) => {
    if (!darf) throw new NichtAngemeldet();
    const { error } = await supabase.from("anfragen").insert({
      arbeitgeber_id: uid!,
      arbeitnehmer_id: e.profilId,
      interview_gewuenscht: true,
      interview_art: e.art,
      wunschtermin: e.termin,
      dolmetscher: e.dolmetscher,
      nachricht: e.nachricht.trim() || null,
    });
    if (error) {
      if (error.message.includes("duplicate")) throw new Error("Diese Person haben Sie bereits angefragt.");
      throw new Error("Die Einladung konnte nicht gesendet werden.");
    }
    qc.invalidateQueries({ queryKey: ["einladungen", uid] });
  };

  const ids = q.data ?? [];
  return { darf, ids, eingeladen: (id: string) => ids.includes(id), einladen };
}
