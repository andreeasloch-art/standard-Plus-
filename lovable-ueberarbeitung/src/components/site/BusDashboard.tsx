import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { Camera, Phone, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/site/PageHeader";
import { Route as RouteLinie } from "@/components/site/FahrtKarte";
import { supabase } from "@/integrations/supabase/client";
import { BUCHUNG_TEXT, BUS_BUCKET, preis, type BuchungStatus } from "@/lib/bus";

type Fahrt = {
  id: string; von_ort: string; nach_ort: string; haltestellen: string[]; abfahrt_info: string;
  dauer_stunden: number | null; preis_eur: number; plaetze: number | null; beschreibung: string | null; aktiv: boolean;
};
type Buchung = {
  id: string; fahrt_id: string; reisedatum: string | null; personen: number; nachricht: string | null;
  status: BuchungStatus; created_at: string; busfahrten: { von_ort: string; nach_ort: string } | null;
};

const fahrtSchema = z.object({
  von_ort: z.string().trim().min(2, "Bitte Abfahrtsort eingeben.").max(120),
  nach_ort: z.string().trim().min(2, "Bitte Zielort eingeben.").max(120),
  haltestellen: z.string().max(3000).transform((t) => t.split(/\n|,/).map((h) => h.trim()).filter(Boolean))
    .refine((l) => l.length <= 30, "Höchstens 30 Zwischenhalte."),
  abfahrt_info: z.string().trim().min(2, "Bitte Abfahrt angeben, z. B. „jeden Freitag 18:00“.").max(200),
  dauer_stunden: z.union([z.literal(""), z.coerce.number().min(0.5).max(99)]).transform((v) => (v === "" ? null : v)),
  preis_eur: z.coerce.number({ invalid_type_error: "Bitte Preis eingeben." }).min(0, "Bitte Preis eingeben.").max(10000),
  plaetze: z.union([z.literal(""), z.coerce.number().int().min(1).max(100)]).transform((v) => (v === "" ? null : v)),
  beschreibung: z.string().trim().max(1000).transform((t) => t || null),
});

const firmaSchema = z.object({
  firma: z.string().trim().min(2, "Bitte Firmennamen eingeben.").max(120),
  sitz: z.string().trim().max(120),
  telefon: z.string().trim().max(40),
  email: z.union([z.literal(""), z.string().trim().email("Bitte gültige E-Mail eingeben.").max(255)]),
  bus_lizenz: z.string().trim().max(200),
  bus_fahrten_bisher: z.union([z.literal(""), z.coerce.number().int().min(0).max(1000000)]).transform((v) => (v === "" ? null : v)),
  bus_beschreibung: z.string().trim().max(1000),
});

function Fehler({ text }: { text?: string | undefined }) {
  return text ? <p className="mt-1 text-sm text-destructive">{text}</p> : null;
}

/** Bereich für Busunternehmen: Firmendaten, Bilder, Fahrten anbieten, Buchungsanfragen. */
export function BusDashboard({ uid }: { uid: string }) {
  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <div className="space-y-6">
        <Buchungen uid={uid} />
        <Fahrten uid={uid} />
      </div>
      <div className="space-y-6">
        <Firmendaten uid={uid} />
        <Bilder uid={uid} />
      </div>
    </div>
  );
}

function Firmendaten({ uid }: { uid: string }) {
  const qc = useQueryClient();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const q = useQuery({
    queryKey: ["bus-firma", uid],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("firma, sitz, telefon, email, bus_lizenz, bus_fahrten_bisher, bus_beschreibung, bus_freigegeben_at").eq("id", uid).maybeSingle();
      if (error) throw error;
      return data as Record<string, string | number | null> | null;
    },
  });
  const speichern = useMutation({
    mutationFn: async (d: z.infer<typeof firmaSchema>) => {
      const { error } = await supabase.from("profiles").update(d as never).eq("id", uid);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Firmendaten gespeichert."); qc.invalidateQueries({ queryKey: ["bus-firma", uid] }); qc.invalidateQueries({ queryKey: ["busfahrten"] }); },
    onError: () => toast.error("Speichern fehlgeschlagen."),
  });
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const r = firmaSchema.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
    if (!r.success) {
      const errs: Record<string, string> = {};
      r.error.issues.forEach((i) => { errs[String(i.path[0])] ??= i.message; });
      return void setErrors(errs);
    }
    setErrors({});
    speichern.mutate(r.data);
  };
  if (q.isLoading) return <div className="card-base h-40 animate-pulse bg-muted" />;
  const d = q.data ?? {};
  const feld = (name: string, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label htmlFor={`f-${name}`} className="text-sm font-medium">{label}</label>
      <input id={`f-${name}`} name={name} defaultValue={(d[name] ?? "") as string} className="field mt-1" aria-invalid={!!errors[name]} {...props} />
      <Fehler text={errors[name]} />
    </div>
  );
  return (
    <section className="card-base p-6">
      <h2 className="text-xl">Firmendaten</h2>
      {d["bus_freigegeben_at"] ? (
        <p className="mt-2 rounded-lg bg-success/10 p-3 text-sm font-semibold text-success">Geprüft und freigegeben – Ihre Fahrten sind öffentlich sichtbar.</p>
      ) : (
        <p className="mt-2 rounded-lg bg-tint p-3 text-sm text-tint-foreground">
          <strong>In Prüfung:</strong> Bitte Firmenname, Sitz und Konzession ausfüllen. Nach unserer Prüfung werden Ihre Fahrten öffentlich sichtbar.
        </p>
      )}
      <p className="mt-1 text-sm text-muted-foreground">Name, Sitz, Telefon und E-Mail werden bei Ihren Fahrten <strong>öffentlich</strong> angezeigt.</p>
      <form onSubmit={submit} noValidate className="mt-4 space-y-3">
        {feld("firma", "Firmenname *", { autoComplete: "organization" })}
        {feld("sitz", "Sitz (Ort, Land)")}
        {feld("telefon", "Telefon für Buchungen", { type: "tel", autoComplete: "tel" })}
        {feld("email", "E-Mail für Buchungen", { type: "email", autoComplete: "email" })}
        {feld("bus_lizenz", "Konzession / Lizenznummer")}
        {feld("bus_fahrten_bisher", "Fahrten bisher insgesamt (ca.)", { type: "number", min: 0, inputMode: "numeric" })}
        <div>
          <label htmlFor="f-bus_beschreibung" className="text-sm font-medium">Über uns</label>
          <textarea id="f-bus_beschreibung" name="bus_beschreibung" rows={3} maxLength={1000} defaultValue={(d["bus_beschreibung"] ?? "") as string} className="field mt-1 h-auto py-2" />
        </div>
        <Button type="submit" disabled={speichern.isPending}>{speichern.isPending ? "Wird gespeichert …" : "Speichern"}</Button>
      </form>
    </section>
  );
}

/** Verkleinert auf max. 1600 px (JPEG) – entfernt dabei auch Metadaten wie GPS. */
async function verkleinern(datei: File): Promise<Blob> {
  const bild = await createImageBitmap(datei);
  const faktor = Math.min(1, 1600 / Math.max(bild.width, bild.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bild.width * faktor); c.height = Math.round(bild.height * faktor);
  c.getContext("2d")!.drawImage(bild, 0, 0, c.width, c.height);
  bild.close();
  return new Promise((ok, f) => c.toBlob((b) => (b ? ok(b) : f(new Error("Bild"))), "image/jpeg", 0.85));
}

function Bilder({ uid }: { uid: string }) {
  const qc = useQueryClient();
  const [rechte, setRechte] = useState(false);
  const [busy, setBusy] = useState(false);
  const q = useQuery({
    queryKey: ["bus-bilder", uid],
    queryFn: async () => {
      const { data, error } = await supabase.from("bus_bilder").select("id, pfad").eq("firma_id", uid).order("created_at");
      if (error) throw error;
      const liste = (data ?? []) as { id: string; pfad: string }[];
      if (!liste.length) return [];
      const { data: urls } = await supabase.storage.from(BUS_BUCKET).createSignedUrls(liste.map((b) => b.pfad), 600);
      return liste.map((b, i) => ({ ...b, url: urls?.[i]?.signedUrl as string | undefined }));
    },
  });
  const fertig = () => { qc.invalidateQueries({ queryKey: ["bus-bilder", uid] }); qc.invalidateQueries({ queryKey: ["busfahrten"] }); };

  const hochladen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateien = [...(e.target.files ?? [])];
    e.target.value = "";
    if (!dateien.length) return;
    const frei = 12 - (q.data?.length ?? 0);
    if (dateien.length > frei) return void toast.error(`Höchstens 12 Bilder – noch ${frei} frei.`);
    setBusy(true);
    try {
      for (const d of dateien) {
        if (!["image/jpeg", "image/png", "image/webp"].includes(d.type)) throw new Error("Bitte JPG, PNG oder WebP wählen.");
        const pfad = `${uid}/bus-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.jpg`;
        const up = await supabase.storage.from(BUS_BUCKET).upload(pfad, await verkleinern(d), { contentType: "image/jpeg" });
        if (up.error) throw up.error;
        const ins = await supabase.from("bus_bilder").insert({ firma_id: uid, pfad });
        if (ins.error) { await supabase.storage.from(BUS_BUCKET).remove([pfad]); throw ins.error; }
      }
      toast.success("Bilder gespeichert.");
    } catch (err) {
      toast.error(err instanceof Error && err.message.startsWith("Bitte") ? err.message : "Bild konnte nicht gespeichert werden.");
    } finally {
      setBusy(false);
      fertig();
    }
  };
  const loeschen = async (b: { id: string; pfad: string }) => {
    const del = await supabase.storage.from(BUS_BUCKET).remove([b.pfad]);
    const row = await supabase.from("bus_bilder").delete().eq("id", b.id);
    if (del.error || row.error) return void toast.error("Bild konnte nicht gelöscht werden.");
    toast.success("Bild gelöscht.");
    fertig();
  };

  return (
    <section className="card-base p-6">
      <h2 className="text-xl">Bilder</h2>
      <p className="mt-1 text-sm text-muted-foreground">Bus von außen und innen, Sitze, Gepäckraum – bis zu 12 Bilder, öffentlich sichtbar.</p>
      {q.isError && <ErrorState />}
      <ul className="mt-4 grid grid-cols-3 gap-2">
        {q.data?.map((b) => (
          <li key={b.id} className="group relative aspect-square overflow-hidden rounded-lg bg-muted">
            {b.url && <img src={b.url} alt="Bild Ihres Busses" className="h-full w-full object-cover" />}
            <button type="button" onClick={() => loeschen(b)} aria-label="Bild löschen"
              className="absolute right-1 top-1 rounded-md bg-white/85 p-1.5 text-destructive shadow-soft">
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
      <label className="mt-4 flex items-start gap-3 text-sm">
        <input type="checkbox" checked={rechte} onChange={(e) => setRechte(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-info)]" />
        <span>Ich habe die Rechte an den Bildern. Erkennbare Personen sind nur mit deren Einwilligung zu sehen.</span>
      </label>
      <label className={`mt-3 inline-flex h-11 cursor-pointer items-center gap-2 rounded-lg border border-[var(--glas-rand)] px-5 text-sm font-semibold shadow-soft focus-within:ring-2 focus-within:ring-ring ${!rechte || busy ? "pointer-events-none opacity-50" : "hover:bg-accent"}`}>
        <Camera className="h-4 w-4" aria-hidden /> {busy ? "Wird hochgeladen …" : "Bilder hochladen"}
        <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={hochladen} disabled={!rechte || busy} />
      </label>
    </section>
  );
}

function Fahrten({ uid }: { uid: string }) {
  const qc = useQueryClient();
  const [offen, setOffen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);
  const q = useQuery({
    queryKey: ["meine-fahrten", uid],
    queryFn: async () => {
      const { data, error } = await supabase.from("busfahrten").select("*").eq("firma_id", uid).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Fahrt[];
    },
  });
  const neu = () => { qc.invalidateQueries({ queryKey: ["meine-fahrten", uid] }); qc.invalidateQueries({ queryKey: ["busfahrten"] }); };
  const anlegen = useMutation({
    mutationFn: async (d: z.infer<typeof fahrtSchema>) => {
      const { error } = await supabase.from("busfahrten").insert({ ...d, firma_id: uid } as never);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Fahrt veröffentlicht."); formRef.current?.reset(); setOffen(false); neu(); },
    onError: () => toast.error("Fahrt konnte nicht gespeichert werden. Sind die Firmendaten ausgefüllt?"),
  });
  const umschalten = useMutation({
    mutationFn: async (f: Fahrt) => {
      const { error } = await supabase.from("busfahrten").update({ aktiv: !f.aktiv } as never).eq("id", f.id);
      if (error) throw error;
    },
    onSuccess: neu,
    onError: () => toast.error("Änderung fehlgeschlagen."),
  });
  const loeschen = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("busfahrten").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Fahrt gelöscht."); neu(); },
    onError: () => toast.error("Löschen fehlgeschlagen."),
  });
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const r = fahrtSchema.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
    if (!r.success) {
      const errs: Record<string, string> = {};
      r.error.issues.forEach((i) => { errs[String(i.path[0])] ??= i.message; });
      return void setErrors(errs);
    }
    setErrors({});
    anlegen.mutate(r.data);
  };
  const feld = (name: string, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label htmlFor={`fa-${name}`} className="text-sm font-medium">{label}</label>
      <input id={`fa-${name}`} name={name} className="field mt-1" aria-invalid={!!errors[name]} {...props} />
      <Fehler text={errors[name]} />
    </div>
  );

  return (
    <section className="card-base p-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl">Meine Fahrten</h2>
        <Button size="sm" variant="outline" onClick={() => setOffen((v) => !v)} aria-expanded={offen}><Plus />{offen ? "Abbrechen" : "Neue Fahrt"}</Button>
      </div>
      {offen && (
        <form ref={formRef} onSubmit={submit} noValidate className="mt-4 grid gap-3 rounded-xl bg-muted p-4 sm:grid-cols-2">
          {feld("von_ort", "Von *", { placeholder: "z. B. Timișoara (RO)" })}
          {feld("nach_ort", "Nach *", { placeholder: "z. B. Stuttgart (DE)" })}
          <div className="sm:col-span-2">
            <label htmlFor="fa-haltestellen" className="text-sm font-medium">Zwischenhalte (in Fahrtreihenfolge, je Zeile einer)</label>
            <textarea id="fa-haltestellen" name="haltestellen" rows={4} className="field mt-1 h-auto py-2" placeholder={"Arad\nBudapest\nWien\nLinz\nMünchen"} aria-invalid={!!errors["haltestellen"]} />
            <Fehler text={errors["haltestellen"]} />
          </div>
          {feld("abfahrt_info", "Abfahrt *", { placeholder: "z. B. jeden Freitag 18:00" })}
          {feld("dauer_stunden", "Fahrtdauer (Stunden)", { type: "number", step: "0.5", min: 0.5, inputMode: "decimal" })}
          {feld("preis_eur", "Preis pro Person (€) *", { type: "number", step: "0.01", min: 0, inputMode: "decimal" })}
          {feld("plaetze", "Plätze", { type: "number", min: 1, inputMode: "numeric" })}
          <div className="sm:col-span-2">
            <label htmlFor="fa-beschreibung" className="text-sm font-medium">Hinweise (Gepäck, WLAN, Pausen …)</label>
            <textarea id="fa-beschreibung" name="beschreibung" rows={2} maxLength={1000} className="field mt-1 h-auto py-2" />
          </div>
          <div className="sm:col-span-2"><Button type="submit" disabled={anlegen.isPending}>{anlegen.isPending ? "Wird gespeichert …" : "Fahrt veröffentlichen"}</Button></div>
        </form>
      )}
      <div className="mt-4 space-y-3">
        {q.isLoading && <p className="text-sm text-muted-foreground">Wird geladen …</p>}
        {q.isError && <ErrorState />}
        {q.data?.length === 0 && <EmptyState title="Noch keine Fahrten">Legen Sie Ihre erste Verbindung an – z. B. Timișoara → Stuttgart mit allen Halten.</EmptyState>}
        {q.data?.map((f) => (
          <div key={f.id} className={`rounded-xl border p-4 ${f.aktiv ? "" : "opacity-60"}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="schrift-tafel text-lg font-bold">{f.von_ort} → {f.nach_ort}</p>
              <p className="schrift-tafel text-lg font-bold">{preis(f.preis_eur)}</p>
            </div>
            <div className="mt-2"><RouteLinie f={f} /></div>
            <p className="mt-1 text-sm text-muted-foreground">{f.abfahrt_info}{f.plaetze ? ` · ${f.plaetze} Plätze` : ""}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant={f.aktiv ? "success" : "outline"} onClick={() => umschalten.mutate(f)}>{f.aktiv ? "Online" : "Offline"}</Button>
              <Button size="icon" variant="ghost" aria-label={`Fahrt ${f.von_ort} nach ${f.nach_ort} löschen`} onClick={() => { if (confirm("Fahrt wirklich löschen?")) loeschen.mutate(f.id); }}><Trash2 /></Button>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">Ihre Fahrten erscheinen unter <Link to="/busreisen" className="underline">Busreisen</Link> und werden Fachkräften nach einem Vertragsabschluss automatisch vorgeschlagen.</p>
    </section>
  );
}

function Reisender({ buchungId }: { buchungId: string }) {
  const q = useQuery({
    queryKey: ["reisender", buchungId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("buchung_reisender", { _buchung: buchungId });
      if (error) throw error;
      return ((data ?? []) as { name: string; telefon: string | null }[])[0] ?? null;
    },
  });
  if (!q.data) return null;
  return (
    <p className="mt-1 flex flex-wrap items-center gap-x-3 text-sm">
      <span className="font-semibold">{q.data.name || "Fachkraft"}</span>
      {q.data.telefon && <a href={`tel:${q.data.telefon}`} className="inline-flex items-center gap-1 text-info underline"><Phone className="h-4 w-4" aria-hidden />{q.data.telefon}</a>}
    </p>
  );
}

function Buchungen({ uid }: { uid: string }) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["bus-buchungen", uid],
    queryFn: async () => {
      const { data, error } = await supabase.from("bus_buchungen").select("*, busfahrten(von_ort, nach_ort)").eq("firma_id", uid).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Buchung[];
    },
  });
  const setzen = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: BuchungStatus }) => {
      const { error } = await supabase.from("bus_buchungen").update({ status } as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, v) => { toast.success(`Buchung: ${BUCHUNG_TEXT[v.status]}.`); qc.invalidateQueries({ queryKey: ["bus-buchungen", uid] }); },
    onError: () => toast.error("Änderung fehlgeschlagen."),
  });
  const offen = q.data?.filter((b) => b.status === "angefragt").length ?? 0;

  return (
    <section className="card-base p-6">
      <h2 className="text-xl">Buchungsanfragen {offen > 0 && <span className="ml-1 rounded-md bg-primary px-2 py-0.5 text-sm text-primary-foreground">{offen} neu</span>}</h2>
      <p className="mt-1 text-sm text-muted-foreground">Fachkräfte fragen Plätze an. Bestätigen Sie, klären Sie Ticket und Bezahlung direkt mit der Person, und markieren Sie die Fahrt danach als durchgeführt – erst dann kann bewertet werden.</p>
      <div className="mt-4 space-y-3">
        {q.isLoading && <p className="text-sm text-muted-foreground">Wird geladen …</p>}
        {q.isError && <ErrorState />}
        {q.data?.length === 0 && <EmptyState title="Noch keine Anfragen" />}
        {q.data?.map((b) => (
          <div key={b.id} className="rounded-xl border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="schrift-tafel text-lg font-bold">{b.busfahrten ? `${b.busfahrten.von_ort} → ${b.busfahrten.nach_ort}` : "Fahrt"}</p>
              <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold">{BUCHUNG_TEXT[b.status]}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {b.reisedatum ? `Reisedatum ${new Date(b.reisedatum).toLocaleDateString("de-DE")}` : "Datum offen"} · {b.personen} {b.personen === 1 ? "Person" : "Personen"}
            </p>
            {b.status !== "abgelehnt" && b.status !== "storniert" && <Reisender buchungId={b.id} />}
            {b.nachricht && <p className="mt-1 text-sm">„{b.nachricht}“</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              {b.status === "angefragt" && (<>
                <Button size="sm" variant="success" onClick={() => setzen.mutate({ id: b.id, status: "bestaetigt" })}>Bestätigen</Button>
                <Button size="sm" variant="outline" onClick={() => setzen.mutate({ id: b.id, status: "abgelehnt" })}>Ablehnen</Button>
              </>)}
              {b.status === "bestaetigt" && <Button size="sm" variant="outline" onClick={() => setzen.mutate({ id: b.id, status: "durchgefuehrt" })}>Fahrt durchgeführt</Button>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
