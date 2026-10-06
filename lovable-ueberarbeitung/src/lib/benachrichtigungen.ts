import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export type Benachrichtigung = {
  id: string;
  art: string;
  titel: string;
  text: string | null;
  link: string | null;
  gelesen_at: string | null;
  created_at: string;
};

/** Benachrichtigungen des angemeldeten Kontos. Fragt alle 60 Sekunden nach (keine Echtzeit-Verbindung nötig). */
export function useBenachrichtigungen() {
  const { session } = useAuth();
  const uid = session?.user.id;
  const qc = useQueryClient();
  const schluessel = ["benachrichtigungen", uid];

  const q = useQuery({
    queryKey: schluessel,
    enabled: !!uid,
    refetchInterval: 60_000,
    queryFn: async (): Promise<Benachrichtigung[]> => {
      const { data, error } = await supabase
        .from("benachrichtigungen")
        .select("id, art, titel, text, link, gelesen_at, created_at")
        .eq("user_id", uid!)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as Benachrichtigung[];
    },
  });

  const gelesen = useMutation({
    mutationFn: async (ids: string[]) => {
      if (!ids.length) return;
      const { error } = await supabase.from("benachrichtigungen").update({ gelesen_at: new Date().toISOString() }).in("id", ids);
      if (error) throw error;
    },
    onMutate: (ids) => {
      const jetzt = new Date().toISOString();
      qc.setQueryData<Benachrichtigung[]>(schluessel, (alt) => alt?.map((b) => (ids.includes(b.id) ? { ...b, gelesen_at: b.gelesen_at ?? jetzt } : b)));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: schluessel }),
  });

  const liste = q.data ?? [];
  const ungelesen = liste.filter((b) => !b.gelesen_at);
  return {
    ...q,
    liste,
    anzahlUngelesen: ungelesen.length,
    alleGelesen: () => gelesen.mutate(ungelesen.map((b) => b.id)),
    alsGelesen: (id: string) => gelesen.mutate([id]),
  };
}

/** Relativ und knapp: „gerade eben“, „vor 5 Min.“, „vor 3 Std.“, sonst Datum. */
export function zeitpunkt(iso: string, jetzt = Date.now()) {
  const min = Math.round((jetzt - new Date(iso).getTime()) / 60_000);
  if (min < 1) return "gerade eben";
  if (min < 60) return `vor ${min} Min.`;
  if (min < 24 * 60) return `vor ${Math.round(min / 60)} Std.`;
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}
