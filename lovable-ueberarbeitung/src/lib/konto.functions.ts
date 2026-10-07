import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

type Speicher = {
  list: (
    pfad: string,
    opts: { limit: number; offset: number },
  ) => Promise<{ data: { name: string; id: string | null }[] | null; error: unknown }>;
  remove: (pfade: string[]) => Promise<{ error: unknown }>;
};

/** Sammelt alle Dateipfade unter `ordner` – auch in Unterordnern und über mehrere Seiten. */
async function allePfade(speicher: Speicher, ordner: string): Promise<string[]> {
  const pfade: string[] = [];
  const SEITE = 1000;
  for (let offset = 0; ; offset += SEITE) {
    const { data, error } = await speicher.list(ordner, { limit: SEITE, offset });
    if (error) throw new Error("Dateien konnten nicht gelesen werden.");
    for (const f of data ?? []) {
      const pfad = `${ordner}/${f.name}`;
      // Ordner haben in Supabase Storage keine id
      if (f.id === null) pfade.push(...(await allePfade(speicher, pfad)));
      else pfade.push(pfad);
    }
    if (!data || data.length < SEITE) return pfade;
  }
}

/**
 * Löscht das eigene Konto vollständig: alle Datenbankeinträge, alle Dateien im Speicher
 * und den Anmelde-Nutzer. Kündigungen bleiben als Nachweis erhalten (ohne Kontobezug),
 * wie in der Datenschutzerklärung beschrieben. Der Aufrufer wird über sein Zugriffstoken identifiziert.
 */
export const kontoLoeschen = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: z.string().min(20).max(4000) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: u, error: authErr } = await supabaseAdmin.auth.getUser(data.token);
    if (authErr || !u.user) throw new Error("Nicht angemeldet.");
    const uid = u.user.id;

    const schritte = [
      supabaseAdmin.from("bewertungen").delete().or(`von_id.eq.${uid},fuer_id.eq.${uid}`),
      supabaseAdmin.from("anfragen").delete().or(`arbeitgeber_id.eq.${uid},arbeitnehmer_id.eq.${uid}`),
    ];
    for (const s of schritte) { const { error } = await s; if (error) throw new Error("Löschen fehlgeschlagen (Anfragen/Bewertungen)."); }
    {
      const { error } = await supabaseAdmin.from("stellen").delete().eq("arbeitgeber_id", uid);
      if (error) throw new Error("Löschen fehlgeschlagen (Stellen).");
    }
    for (const t of ["skills", "sprachen", "werdegang"] as const) {
      const { error } = await supabaseAdmin.from(t).delete().eq("profile_id", uid);
      if (error) throw new Error("Löschen fehlgeschlagen (Profilangaben).");
    }
    // Kündigungen als Nachweis behalten, aber vom Konto lösen (Aufbewahrung laut Datenschutzerklärung).
    {
      const { error } = await supabaseAdmin.from("kuendigungen").update({ user_id: null }).eq("user_id", uid);
      if (error) throw new Error("Löschen fehlgeschlagen (Kündigungen).");
    }

    // Alle Dateien des Nutzers in allen Buckets entfernen (Ablage unter <uid>/…, inkl. Unterordner).
    const { data: buckets, error: bErr } = await supabaseAdmin.storage.listBuckets();
    if (bErr) throw new Error("Dateispeicher nicht erreichbar.");
    for (const b of buckets ?? []) {
      const speicher = supabaseAdmin.storage.from(b.id) as unknown as Speicher;
      const pfade = await allePfade(speicher, uid);
      for (let i = 0; i < pfade.length; i += 1000) {
        const { error } = await speicher.remove(pfade.slice(i, i + 1000));
        if (error) throw new Error("Dateien konnten nicht gelöscht werden.");
      }
    }

    await supabaseAdmin.from("user_roles").delete().eq("user_id", uid);
    const { error: pErr } = await supabaseAdmin.from("profiles").delete().eq("id", uid);
    if (pErr) throw new Error("Löschen fehlgeschlagen (Profil).");
    const { error: dErr } = await supabaseAdmin.auth.admin.deleteUser(uid);
    if (dErr) throw new Error("Anmeldekonto konnte nicht gelöscht werden.");
    return { ok: true };
  });
