import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Lock, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/site/PageHeader";
import { FotoUpload } from "@/components/site/FotoUpload";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { NIVEAUS } from "@/lib/profile-data";
import { KontoBereich } from "@/components/site/KontoBereich";

export const Route = createFileRoute("/_authenticated/profil-bearbeiten")({
  head: () => ({ meta: [{ title: "Mein Profil bearbeiten – Standard Plus" }, { name: "description", content: "Profil, Sprachen, Werdegang und Skills bei Standard Plus pflegen." }, { property: "og:title", content: "Mein Profil – Standard Plus" }, { property: "og:description", content: "Profil bei Standard Plus bearbeiten." }, { name: "robots", content: "noindex" }] }),
  component: ProfilBearbeiten,
});

const opt = (max: number) => z.string().trim().max(max, `Maximal ${max} Zeichen.`).optional().transform((v) => (v ? v : null));
// Name, Geburtsdatum und Registernummer sind hier bewusst NICHT enthalten: Sie bestimmen „ein Konto pro Person/Firma“
// und lassen sich nur über das Team ändern (Datenbank-Trigger profiles_identitaet_schutz).
const schema = z.object({
  telefon: z.string().trim().max(30, "Maximal 30 Zeichen.").regex(/^[+0-9 ()/-]*$/, "Bitte nur Ziffern, Leerzeichen und + ( ) / - verwenden.").optional().transform((v) => v || null),
  wohnort: opt(80), land: opt(60), zielort: opt(80), staatsangehoerigkeit: opt(60),
  beruf: opt(80), branche: opt(80),
  erfahrung_jahre: z.string().optional().transform((v) => (v ? Number(v) : null)).refine((v) => v === null || (Number.isInteger(v) && v >= 0 && v <= 60), "Bitte 0 bis 60 Jahre angeben."),
  deutschniveau: z.string().optional().transform((v) => v || null).refine((v) => v === null || (NIVEAUS as readonly string[]).includes(v), "Ungültiges Niveau."),
  verfuegbar_ab: z.string().optional().transform((v) => v || null),
  ueber_mich: opt(1500),
  firma: opt(120), rechtsform: opt(40), sitz: opt(80), groesse: opt(40), leistungen: opt(1500),
});

function ProfilBearbeiten() {
  const { session } = useAuth();
  const uid = session!.user.id;
  const qc = useQueryClient();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const q = useQuery({
    queryKey: ["profil-edit", uid],
    queryFn: async () => {
      const [p, sp, sk, wg] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", uid).single(),
        supabase.from("sprachen").select("*").eq("profile_id", uid).order("created_at"),
        supabase.from("skills").select("*").eq("profile_id", uid).order("created_at"),
        supabase.from("werdegang").select("*").eq("profile_id", uid).order("von", { ascending: false }),
      ]);
      if (p.error) throw p.error;
      return { p: p.data, sprachen: sp.data ?? [], skills: sk.data ?? [], werdegang: wg.data ?? [] };
    },
  });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["profil-edit", uid] }); qc.invalidateQueries({ queryKey: ["oeffentliche-profile"] }); };

  const speichern = useMutation({
    mutationFn: async (d: z.infer<typeof schema> & { sichtbar?: boolean; alter_sichtbar?: boolean }) => {
      const { error } = await supabase.from("profiles").update(d).eq("id", uid);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Profil gespeichert."); refresh(); },
    onError: () => toast.error("Speichern fehlgeschlagen."),
  });

  if (q.isLoading) return <div className="container-page py-16"><div className="card-base h-96 animate-pulse bg-surface" /></div>;
  if (q.isError || !q.data) return <div className="container-page py-16"><ErrorState /></div>;
  const { p } = q.data;
  const istAG = p.rolle === "arbeitgeber";

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const raw = Object.fromEntries(fd) as Record<string, string>;
    const r = schema.safeParse(raw);
    if (!r.success) {
      const errs: Record<string, string> = {};
      r.error.issues.forEach((i) => { errs[String(i.path[0])] ??= i.message; });
      setErrors(errs);
      toast.error("Bitte prüfen Sie die markierten Felder.");
      return;
    }
    setErrors({});
    speichern.mutate(istAG ? r.data : { ...r.data, sichtbar: fd.get("sichtbar") === "on", alter_sichtbar: fd.get("alter_sichtbar") === "on" });
  };

  const F = (name: string, label: string, type = "text", extra: Record<string, unknown> = {}, hinweis?: string) => (
    <div key={name}>
      <label htmlFor={name} className="text-sm font-medium">{label}</label>
      <input id={name} name={name} type={type} defaultValue={(p as Record<string, unknown>)[name] as string ?? ""} className="field mt-1.5" aria-invalid={!!errors[name]}
        aria-describedby={[errors[name] && `${name}-err`, hinweis && `${name}-hint`].filter(Boolean).join(" ") || undefined} {...extra} />
      {hinweis && <p id={`${name}-hint`} className="mt-1 text-xs text-muted-foreground">{hinweis}</p>}
      {errors[name] && <p id={`${name}-err`} className="mt-1 text-sm text-destructive">{errors[name]}</p>}
    </div>
  );

  const geburtsdatum = p.geburtsdatum ? new Date(p.geburtsdatum).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }) : null;

  return (
    <div className="container-page max-w-3xl py-10">
      <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Dashboard</Link>
      <h1 className="mt-4 text-3xl">Mein Profil bearbeiten</h1>

      {!istAG && (
        <div className="mt-6">
          <FotoUpload uid={uid} name={p.vorname} fotoPfad={p.foto_pfad} fotoSichtbar={p.foto_sichtbar} refresh={refresh} />
        </div>
      )}

      {/* Identität: nur anzeigen – ein Konto pro Person bzw. Firma */}
      <section className="card-base mt-6 p-6" aria-labelledby="identitaet-titel">
        <h2 id="identitaet-titel" className="flex items-center gap-2 text-lg"><Lock className="h-4 w-4 text-muted-foreground" aria-hidden />Angaben aus der Registrierung</h2>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-muted-foreground">Name</dt><dd className="font-medium">{[p.vorname, p.nachname].filter(Boolean).join(" ") || "–"}</dd></div>
          {istAG
            ? <div><dt className="text-muted-foreground">Handelsregister- / USt-Nummer</dt><dd className="font-medium">{p.register_nr ?? "–"}</dd></div>
            : <div><dt className="text-muted-foreground">Geburtsdatum</dt><dd className="font-medium">{geburtsdatum ?? "–"}</dd></div>}
        </dl>
        <p className="mt-3 text-xs text-muted-foreground">
          Diese Angaben sichern, dass jede Person bzw. Firma nur ein Konto hat. Ändern können wir sie nur auf Anfrage – schreiben Sie uns.
          {!istAG && " Unternehmen sehen vor dem Vertragsabschluss nur Ihren Vornamen und den ersten Buchstaben des Nachnamens."}
        </p>
      </section>

      <form onSubmit={submit} noValidate className="card-base mt-6 space-y-6 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {F("telefon", "Telefon", "tel", { autoComplete: "tel" }, "Erst nach beidseitig bestätigtem Vertragsabschluss sichtbar.")}{F("wohnort", "Wohnort", "text", { autoComplete: "address-level2" })}{F("land", "Land", "text", { autoComplete: "country-name" })}
        </div>
        {istAG ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {F("firma", "Firma", "text", { autoComplete: "organization" })}{F("rechtsform", "Rechtsform")}{F("sitz", "Sitz")}{F("groesse", "Größe (Mitarbeitende)")}
            <div className="sm:col-span-2">
              <label htmlFor="leistungen" className="text-sm font-medium">Leistungen / Angebot</label>
              <textarea id="leistungen" name="leistungen" rows={4} defaultValue={p.leistungen ?? ""} className="field mt-1.5 h-auto py-2" />
              {errors["leistungen"] && <p className="mt-1 text-sm text-destructive">{errors["leistungen"]}</p>}
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {F("zielort", "Wunsch-Arbeitsort")}{F("staatsangehoerigkeit", "Staatsangehörigkeit (freiwillig)", "text", {}, "Hilft bei der Einschätzung, ob eine Arbeitserlaubnis nötig ist. Nicht öffentlich sichtbar.")}
            {F("beruf", "Beruf")}{F("branche", "Branche")}
            {F("erfahrung_jahre", "Berufserfahrung (Jahre)", "number", { inputMode: "numeric" })}
            <div>
              <label htmlFor="deutschniveau" className="text-sm font-medium">Deutschniveau</label>
              <select id="deutschniveau" name="deutschniveau" defaultValue={p.deutschniveau ?? ""} className="field mt-1.5">
                <option value="">Keine Angabe</option>{NIVEAUS.map((n) => <option key={n}>{n}</option>)}
              </select>
            </div>
            {F("verfuegbar_ab", "Verfügbar ab", "date")}
            <div className="sm:col-span-2">
              <label htmlFor="ueber_mich" className="text-sm font-medium">Über mich</label>
              <textarea id="ueber_mich" name="ueber_mich" rows={4} defaultValue={p.ueber_mich ?? ""} className="field mt-1.5 h-auto py-2" />
              {errors["ueber_mich"] && <p className="mt-1 text-sm text-destructive">{errors["ueber_mich"]}</p>}
            </div>
            <div className="space-y-4 rounded-xl bg-surface p-4 sm:col-span-2">
              <div>
                <label className="flex items-start gap-3">
                  <input type="checkbox" name="sichtbar" defaultChecked={p.sichtbar} aria-describedby="sichtbar-hint" className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-info)]" />
                  <span className="text-sm font-medium">Einwilligung: Mein pseudonymisiertes Profil darf Unternehmen in der Suche angezeigt werden.</span>
                </label>
                <p id="sichtbar-hint" className="mt-2 pl-8 text-xs text-muted-foreground">
                  Freiwillig und jederzeit widerrufbar – Häkchen entfernen und speichern. Angezeigt werden Vorname + Initial, Beruf, Orte, Deutschniveau, Erfahrung, Skills, Sprachen und Werdegang.
                  {p.sichtbarkeit_einwilligung_at && p.sichtbar && ` Erteilt am ${new Date(p.sichtbarkeit_einwilligung_at).toLocaleDateString("de-DE")}.`}
                </p>
              </div>
              <div>
                <label className="flex items-start gap-3">
                  <input type="checkbox" name="alter_sichtbar" defaultChecked={p.alter_sichtbar} aria-describedby="alter-hint" className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-info)]" />
                  <span className="text-sm font-medium">Freiwillig: Mein Alter (in Jahren) im Profil anzeigen.</span>
                </label>
                <p id="alter-hint" className="mt-2 pl-8 text-xs text-muted-foreground">Standardmäßig aus. Das Geburtsdatum selbst wird nie angezeigt.</p>
              </div>
            </div>
          </div>
        )}
        <p className="text-xs text-muted-foreground">Alle Angaben sind freiwillig. Wir verarbeiten sie zur Vermittlung, siehe <Link to="/datenschutz" className="underline">Datenschutzerklärung</Link>.</p>
        <Button type="submit" size="lg" disabled={speichern.isPending}>{speichern.isPending ? "Wird gespeichert …" : "Profil speichern"}</Button>
      </form>

      {!istAG && (
        <>
          <ListenEditor
            titel="Skills" items={q.data.skills.map((s) => ({ id: s.id, text: s.name }))}
            felder={[{ name: "name", label: "Skill", max: 60 }]}
            onAdd={async (v) => supabase.from("skills").insert({ profile_id: uid, name: v["name"] ?? "" })}
            onRemove={async (id) => supabase.from("skills").delete().eq("id", id)} refresh={refresh}
          />
          <ListenEditor
            titel="Sprachen" items={q.data.sprachen.map((s) => ({ id: s.id, text: `${s.sprache} – ${s.stufe}` }))}
            felder={[{ name: "sprache", label: "Sprache", max: 40 }, { name: "stufe", label: "Stufe (z. B. B2)", max: 20 }]}
            onAdd={async (v) => supabase.from("sprachen").insert({ profile_id: uid, sprache: v["sprache"] ?? "", stufe: v["stufe"] ?? "" })}
            onRemove={async (id) => supabase.from("sprachen").delete().eq("id", id)} refresh={refresh}
          />
          <ListenEditor
            titel="Werdegang" items={q.data.werdegang.map((w) => ({ id: w.id, text: `${w.position}${w.arbeitgeber ? ` · ${w.arbeitgeber}` : ""}${w.von ? ` (${w.von.slice(0, 4)}–${w.bis ? w.bis.slice(0, 4) : "heute"})` : ""}` }))}
            felder={[{ name: "position", label: "Position", max: 80 }, { name: "arbeitgeber", label: "Arbeitgeber", max: 80, optional: true }, { name: "ort", label: "Ort", max: 80, optional: true }, { name: "von", label: "Von", type: "date", optional: true }, { name: "bis", label: "Bis", type: "date", optional: true }]}
            onAdd={async (v) => supabase.from("werdegang").insert({ profile_id: uid, position: v["position"] ?? "", arbeitgeber: v["arbeitgeber"] || null, ort: v["ort"] || null, von: v["von"] || null, bis: v["bis"] || null })}
            onRemove={async (id) => supabase.from("werdegang").delete().eq("id", id)} refresh={refresh}
          />
        </>
      )}
      <KontoBereich uid={uid} istAG={istAG} />
    </div>
  );
}

type Feld = { name: string; label: string; max?: number; type?: string; optional?: boolean };
function ListenEditor({ titel, items, felder, onAdd, onRemove, refresh }: {
  titel: string; items: { id: string; text: string }[]; felder: Feld[];
  onAdd: (v: Record<string, string>) => PromiseLike<{ error: unknown }>; onRemove: (id: string) => PromiseLike<{ error: unknown }>; refresh: () => void;
}) {
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const add = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const v = Object.fromEntries(new FormData(form)) as Record<string, string>;
    for (const f of felder) {
      const val = (v[f.name] ?? "").trim();
      if (!f.optional && !val) return setErr(`Bitte „${f.label}“ ausfüllen.`);
      if (f.max && val.length > f.max) return setErr(`„${f.label}“: maximal ${f.max} Zeichen.`);
      v[f.name] = val;
    }
    if (v["von"] && v["bis"] && v["bis"] < v["von"]) return setErr("„Bis“ darf nicht vor „Von“ liegen.");
    setErr(""); setBusy(true);
    const { error } = await onAdd(v);
    setBusy(false);
    if (error) return void toast.error("Konnte nicht gespeichert werden.");
    form.reset(); refresh();
  };
  return (
    <section className="card-base mt-6 p-6">
      <h2 className="text-xl">{titel}</h2>
      {items.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">Noch keine Einträge.</p> : (
        <ul className="mt-3 flex flex-wrap gap-2">
          {items.map((i) => (
            <li key={i.id} className="inline-flex items-center gap-1 rounded-full bg-surface py-1 pl-3 pr-1 text-sm">
              {i.text}
              <button type="button" aria-label={`${i.text} entfernen`} className="rounded-full p-1 hover:bg-accent"
                onClick={async () => { const { error } = await onRemove(i.id); if (error) toast.error("Entfernen fehlgeschlagen."); else refresh(); }}>
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={add} noValidate className="mt-4 grid gap-2 sm:grid-cols-[repeat(auto-fit,minmax(9rem,1fr))_auto] sm:items-end">
        {felder.map((f) => (
          <label key={f.name} className="text-sm">
            <span className="font-medium">{f.label}</span>
            <input name={f.name} type={f.type ?? "text"} maxLength={f.max} className="field mt-1" />
          </label>
        ))}
        <Button type="submit" variant="outline" disabled={busy}><Plus />Hinzufügen</Button>
      </form>
      {err && <p className="mt-2 text-sm text-destructive">{err}</p>}
    </section>
  );
}
