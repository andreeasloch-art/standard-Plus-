import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Bus, Plus, Trash2, Star, UserPen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/site/PageHeader";
import { AnfrageStatus, InterviewInfo, VertragBlock, type AnfrageZeile } from "@/components/site/AnfrageDetails";
import { BusDashboard } from "@/components/site/BusDashboard";
import { AusweisUpload } from "@/components/site/AusweisUpload";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useRolle } from "@/lib/auth";
import { oeffentlicheProfileQuery } from "@/lib/profile-data";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard – Standard Plus" }, { name: "description", content: "Ihr persönlicher Bereich bei Standard Plus: Einladungen, Match und Vertrag." }, { property: "og:title", content: "Dashboard – Standard Plus" }, { property: "og:description", content: "Einladungen, Match und Vertrag verwalten." }, { name: "robots", content: "noindex" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { session } = useAuth();
  const rolle = useRolle();
  const uid = session?.user.id;
  const profil = useQuery({
    queryKey: ["mein-profil", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("vorname, firma").eq("id", uid!).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (rolle.isLoading || !uid) return <div className="container-page py-16"><div className="card-base h-40 animate-pulse bg-muted" /></div>;
  if (rolle.isError) return <div className="container-page py-16"><ErrorState /></div>;

  return (
    <div className="container-page py-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-info">{rolle.data === "arbeitgeber" ? "Arbeitgeber" : rolle.data === "busunternehmen" ? "Busunternehmen" : "Fachkraft"}</p>
          <h1 className="text-4xl">Hallo{rolle.data === "busunternehmen" && profil.data?.firma ? `, ${profil.data.firma}` : profil.data?.vorname ? `, ${profil.data.vorname}` : ""}!</h1>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {rolle.data !== "busunternehmen" && <Button asChild variant="outline"><Link to="/profil-bearbeiten"><UserPen />Mein Profil bearbeiten</Link></Button>}
          {rolle.data !== "arbeitnehmer" && rolle.data !== "admin" && <Button asChild variant="outline"><Link to="/kuendigen">Vertrag/Abo kündigen</Link></Button>}
          {rolle.data === "admin" && <Button asChild><Link to="/admin">Team-Bereich</Link></Button>}
        </div>
      </div>
      {rolle.data === "arbeitgeber" ? <ArbeitgeberDashboard uid={uid} /> : rolle.data === "busunternehmen" ? <BusDashboard uid={uid} /> : <ArbeitnehmerDashboard uid={uid} />}
    </div>
  );
}

const stelleSchema = z.object({
  titel: z.string().trim().min(3, "Der Titel muss mindestens 3 Zeichen haben.").max(120, "Maximal 120 Zeichen."),
  beruf: z.string().trim().max(80, "Maximal 80 Zeichen."),
  ort: z.string().trim().max(80, "Maximal 80 Zeichen."),
  beschreibung: z.string().trim().max(2000, "Maximal 2000 Zeichen."),
});

function ArbeitgeberDashboard({ uid }: { uid: string }) {
  const qc = useQueryClient();
  const [zeigeForm, setZeigeForm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const talente = useQuery(oeffentlicheProfileQuery);

  const stellen = useQuery({
    queryKey: ["stellen", uid],
    queryFn: async () => {
      const { data, error } = await supabase.from("stellen").select("*").eq("arbeitgeber_id", uid).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const anfragenKey = ["anfragen", uid];
  const anfragen = useQuery({
    queryKey: anfragenKey,
    queryFn: async () => {
      const { data, error } = await supabase.from("anfragen").select("*, stellen(titel)").eq("arbeitgeber_id", uid).order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as (AnfrageZeile & { created_at: string; stellen: { titel: string } | null })[];
    },
  });

  const anlegen = useMutation({
    mutationFn: async (d: z.infer<typeof stelleSchema>) => {
      const { error } = await supabase.from("stellen").insert({ ...d, arbeitgeber_id: uid });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Stelle angelegt."); setZeigeForm(false); qc.invalidateQueries({ queryKey: ["stellen", uid] }); },
    onError: () => toast.error("Stelle konnte nicht gespeichert werden."),
  });
  const umschalten = useMutation({
    mutationFn: async ({ id, offen }: { id: string; offen: boolean }) => {
      const { error } = await supabase.from("stellen").update({ offen }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stellen", uid] }),
    onError: () => toast.error("Änderung fehlgeschlagen."),
  });
  const loeschen = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("stellen").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Stelle gelöscht."); qc.invalidateQueries({ queryKey: ["stellen", uid] }); },
    onError: () => toast.error("Löschen fehlgeschlagen."),
  });

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const r = stelleSchema.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
    if (!r.success) {
      const errs: Record<string, string> = {};
      r.error.issues.forEach((i) => { errs[String(i.path[0])] ??= i.message; });
      return void setErrors(errs);
    }
    setErrors({});
    anlegen.mutate(r.data);
  };

  const name = (id: string) => talente.data?.find((t) => t.id === id)?.anzeigename ?? "Fachkraft";

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-2">
      <section className="card-base p-6">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xl">Einladungen & Match</h2>
          <Button asChild size="sm" variant="outline"><Link to="/talente">Fachkräfte wischen</Link></Button>
        </div>
        <div className="mt-4 space-y-3">
          {anfragen.isLoading && <p className="text-sm text-muted-foreground">Wird geladen …</p>}
          {anfragen.isError && <ErrorState />}
          {anfragen.data?.length === 0 && <EmptyState title="Noch keine Einladungen">Wischen Sie durch die Profile und laden Sie Fachkräfte zum Interview ein.</EmptyState>}
          {anfragen.data?.map((a) => (
            <div key={a.id} className="rounded-xl border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link to="/profil/$id" params={{ id: a.arbeitnehmer_id }} className="font-semibold hover:underline">{name(a.arbeitnehmer_id)}</Link>
                <AnfrageStatus a={a} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{a.stellen?.titel ?? "Ohne Stellenbezug"} · {new Date(a.created_at).toLocaleDateString("de-DE")}</p>
              <InterviewInfo a={a} />
              {a.status === "offen" && <p className="mt-2 text-sm text-muted-foreground">Wartet auf die Zusage der Fachkraft.</p>}
              <VertragBlock a={a} seite="arbeitgeber" uid={uid} queryKey={anfragenKey} />
              {a.status === "beidseitig" && <Bewertung von={uid} fuer={a.arbeitnehmer_id} />}
            </div>
          ))}
        </div>
      </section>

      <section className="card-base p-6">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xl">Meine Stellen</h2>
          <Button size="sm" variant="outline" onClick={() => setZeigeForm((v) => !v)}><Plus />{zeigeForm ? "Abbrechen" : "Neue Stelle"}</Button>
        </div>
        {zeigeForm && (
          <form onSubmit={submit} noValidate className="mt-4 space-y-3 rounded-xl bg-muted p-4">
            {([["titel", "Titel *"], ["beruf", "Beruf"], ["ort", "Ort"]] as const).map(([n, l]) => (
              <div key={n}>
                <label htmlFor={n} className="text-sm font-medium">{l}</label>
                <input id={n} name={n} className="field mt-1" aria-invalid={!!errors[n]} />
                {errors[n] && <p className="mt-1 text-sm text-destructive">{errors[n]}</p>}
              </div>
            ))}
            <div>
              <label htmlFor="beschreibung" className="text-sm font-medium">Beschreibung</label>
              <textarea id="beschreibung" name="beschreibung" rows={3} className="field mt-1 h-auto py-2" />
              {errors["beschreibung"] && <p className="mt-1 text-sm text-destructive">{errors["beschreibung"]}</p>}
            </div>
            <Button type="submit" disabled={anlegen.isPending}>{anlegen.isPending ? "Wird gespeichert …" : "Stelle speichern"}</Button>
          </form>
        )}
        <div className="mt-4 space-y-3">
          {stellen.isLoading && <p className="text-sm text-muted-foreground">Wird geladen …</p>}
          {stellen.isError && <ErrorState />}
          {stellen.data?.length === 0 && <EmptyState title="Noch keine Stellen">Legen Sie Ihre erste Stelle an, um Fachkräfte gezielt einzuladen.</EmptyState>}
          {stellen.data?.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
              <div>
                <p className="font-semibold">{s.titel}</p>
                <p className="text-sm text-muted-foreground">{[s.beruf, s.ort].filter(Boolean).join(" · ") || "–"}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant={s.offen ? "success" : "outline"} onClick={() => umschalten.mutate({ id: s.id, offen: !s.offen })}>{s.offen ? "Offen" : "Geschlossen"}</Button>
                <Button size="icon" variant="ghost" aria-label={`Stelle ${s.titel} löschen`} onClick={() => { if (confirm("Stelle wirklich löschen?")) loeschen.mutate(s.id); }}><Trash2 /></Button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ArbeitnehmerDashboard({ uid }: { uid: string }) {
  const qc = useQueryClient();
  const anfragenKey = ["anfragen-eingang", uid];
  const anfragen = useQuery({
    queryKey: anfragenKey,
    queryFn: async () => {
      const { data, error } = await supabase.from("anfragen").select("*, stellen(titel, ort)").eq("arbeitnehmer_id", uid).order("created_at", { ascending: false });
      if (error) throw error;
      const ids = [...new Set(data.map((a) => a.arbeitgeber_id))];
      const { data: firmen } = ids.length ? await supabase.from("profiles").select("id, firma, vorname").in("id", ids) : { data: [] };
      return (data as unknown as (AnfrageZeile & { stellen: { titel: string; ort: string | null } | null })[])
        .map((a) => ({ ...a, firma: firmen?.find((f) => f.id === a.arbeitgeber_id)?.firma ?? "Unternehmen" }));
    },
  });
  const antworten = useMutation({
    mutationFn: async ({ id, ja }: { id: string; ja: boolean }) => {
      const { error } = await supabase.from("anfragen").update(ja ? { freigabe_arbeitnehmer: true } : { status: "abgelehnt" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, v) => {
      toast.success(v.ja ? "Zugesagt – es ist ein Match! Das Interview läuft über Standard Plus." : "Einladung abgelehnt.");
      qc.invalidateQueries({ queryKey: anfragenKey });
    },
    onError: () => toast.error("Aktion fehlgeschlagen."),
  });

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <section className="card-base p-6">
        <h2 className="text-xl">Einladungen</h2>
        <p className="mt-1 text-sm text-muted-foreground">Sagen Sie zu, ist es ein Match. Ihre Kontaktdaten werden erst bei Vertragsabschluss sichtbar.</p>
        <div className="mt-4 space-y-3">
          {anfragen.isLoading && <p className="text-sm text-muted-foreground">Wird geladen …</p>}
          {anfragen.isError && <ErrorState />}
          {anfragen.data?.length === 0 && <EmptyState title="Noch keine Einladungen">Vervollständigen Sie Ihr Profil mit Foto, damit Unternehmen Sie finden.</EmptyState>}
          {anfragen.data?.map((a) => (
            <div key={a.id} className="rounded-xl border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">{a.firma}</p>
                <AnfrageStatus a={a} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{a.stellen ? `${a.stellen.titel}${a.stellen.ort ? ` · ${a.stellen.ort}` : ""}` : "Allgemeine Einladung"}</p>
              <InterviewInfo a={a} />
              {a.status === "offen" && (
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="success" disabled={antworten.isPending} onClick={() => antworten.mutate({ id: a.id, ja: true })}>Zusagen</Button>
                  <Button size="sm" variant="outline" disabled={antworten.isPending} onClick={() => antworten.mutate({ id: a.id, ja: false })}>Ablehnen</Button>
                </div>
              )}
              <VertragBlock a={a} seite="arbeitnehmer" uid={uid} queryKey={anfragenKey} />
              {a.status === "beidseitig" && <Bewertung von={uid} fuer={a.arbeitgeber_id} />}
            </div>
          ))}
        </div>
      </section>

      <div className="space-y-6">
      <AusweisUpload uid={uid} />
      <section className="card-base h-fit p-6">
        <h2 className="flex items-center gap-2 text-xl"><Bus className="h-5 w-5 text-tuerkis-600" aria-hidden />Anreise</h2>
        <p className="mt-1 text-sm text-muted-foreground">Sie brauchen eine Fahrt zum Arbeitsort? Wir organisieren Bus oder Fahrt für Sie.</p>
        <Button asChild className="mt-4 w-full" variant="outline"><Link to="/anreise">Anreise anfragen</Link></Button>
      </section>
      </div>
    </div>
  );
}

const bewSchema = z.object({ sterne: z.number().int().min(1, "Bitte Sterne vergeben.").max(5), text: z.string().trim().max(1000, "Maximal 1000 Zeichen.") });

function Bewertung({ von, fuer }: { von: string; fuer: string }) {
  const qc = useQueryClient();
  const [sterne, setSterne] = useState(0);
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const vorhanden = useQuery({
    queryKey: ["bewertung", von, fuer],
    queryFn: async () => {
      const { data } = await supabase.from("bewertungen").select("sterne").eq("von_id", von).eq("fuer_id", fuer).maybeSingle();
      return data;
    },
  });
  const senden = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("bewertungen").insert({ von_id: von, fuer_id: fuer, sterne, text: text || null });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Danke für Ihre Bewertung!"); qc.invalidateQueries({ queryKey: ["bewertung", von, fuer] }); },
    onError: () => toast.error("Bewertung konnte nicht gespeichert werden."),
  });
  if (vorhanden.isLoading) return null;
  if (vorhanden.data) return (
    <p className="mt-3 flex items-center gap-1 text-sm text-muted-foreground" aria-label={`Ihre Bewertung: ${vorhanden.data.sterne} von 5 Sternen`}>
      Ihre Bewertung: {Array.from({ length: vorhanden.data.sterne }, (_, i) => <Star key={i} className="h-4 w-4 fill-primary text-primary-hover" aria-hidden />)}
    </p>
  );
  return (
    <div className="mt-3 rounded-xl bg-muted p-3">
      <p className="text-sm font-medium">Zusammenarbeit bewerten</p>
      <div className="mt-1 flex gap-1" role="radiogroup" aria-label="Sterne">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={sterne === n} aria-label={`${n} Sterne`} onClick={() => setSterne(n)} className="rounded p-1">
            <Star className={`h-5 w-5 ${n <= sterne ? "fill-primary text-primary-hover" : "text-muted-foreground"}`} />
          </button>
        ))}
      </div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} maxLength={1000} placeholder="Optionaler Kommentar" className="field mt-2 h-auto py-2 text-sm" />
      {err && <p className="mt-1 text-sm text-destructive">{err}</p>}
      <Button size="sm" className="mt-2" disabled={senden.isPending} onClick={() => {
        const r = bewSchema.safeParse({ sterne, text });
        if (!r.success) return setErr(r.error.issues[0]?.message ?? "Ungültige Eingabe.");
        setErr(""); senden.mutate();
      }}>Bewertung senden</Button>
    </div>
  );
}
