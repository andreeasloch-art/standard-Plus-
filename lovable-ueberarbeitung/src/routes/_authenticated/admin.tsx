import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { BadgeCheck, Bus, IdCard, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/site/PageHeader";
import { AUSWEIS_BUCKET } from "@/components/site/AusweisUpload";
import { supabase } from "@/integrations/supabase/client";
import { useRolle } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Team-Bereich – Standard Plus" }, { name: "robots", content: "noindex" }] }),
  component: Admin,
});

type Offen = { user_id: string; vorname: string; nachname: string; geburtsdatum: string | null; vorderseite: string | null; rueckseite: string | null; eingereicht_at: string };
type BusOffen = { id: string; firma: string | null; sitz: string | null; register_nr: string | null; bus_lizenz: string | null; telefon: string | null; email: string | null; created_at: string };

function alter(geb: string | null) {
  if (!geb) return null;
  const g = new Date(geb), h = new Date();
  return h.getFullYear() - g.getFullYear() - (h < new Date(h.getFullYear(), g.getMonth(), g.getDate()) ? 1 : 0);
}

function AusweisPruefen({ a }: { a: Offen }) {
  const qc = useQueryClient();
  const [grund, setGrund] = useState("");
  const bilder = useQuery({
    queryKey: ["ausweis-bilder", a.user_id, a.vorderseite],
    queryFn: async () => {
      const pfade = [a.vorderseite, a.rueckseite].filter((x): x is string => !!x);
      if (!pfade.length) return [];
      const { data } = await supabase.storage.from(AUSWEIS_BUCKET).createSignedUrls(pfade, 300);
      return (data ?? []).map((d: { signedUrl: string }) => d.signedUrl);
    },
  });
  const entscheiden = useMutation({
    mutationFn: async (ok: boolean) => {
      const { error } = await supabase.rpc("ausweis_entscheiden", { _user: a.user_id, _ok: ok, _grund: ok ? null : grund || "Angaben nicht lesbar oder passen nicht zum Konto." });
      if (error) throw error;
      // Bilder wirklich löschen – nur „geprüft am …“ bleibt
      const pfade = [a.vorderseite, a.rueckseite].filter((x): x is string => !!x);
      if (pfade.length) await supabase.storage.from(AUSWEIS_BUCKET).remove(pfade);
    },
    onSuccess: (_, ok) => { toast.success(ok ? "Ausweis bestätigt, Bilder gelöscht." : "Abgelehnt, Bilder gelöscht."); qc.invalidateQueries({ queryKey: ["ausweise-offen"] }); },
    onError: () => toast.error("Entscheidung fehlgeschlagen."),
  });
  const j = alter(a.geburtsdatum);
  return (
    <article className="card-base p-5" aria-label={`Ausweis von ${a.vorname} ${a.nachname}`}>
      <div className="grid gap-4 md:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
        <dl className="space-y-2 text-sm">
          <div><dt className="text-muted-foreground">Name laut Konto</dt><dd className="text-lg font-bold">{a.vorname} {a.nachname}</dd></div>
          <div><dt className="text-muted-foreground">Geburtsdatum laut Konto</dt><dd className="text-lg font-bold">{a.geburtsdatum ? new Date(a.geburtsdatum).toLocaleDateString("de-DE") : "–"}{j != null && <span className="font-normal text-muted-foreground"> ({j} Jahre)</span>}</dd></div>
          <div><dt className="text-muted-foreground">Eingereicht</dt><dd>{new Date(a.eingereicht_at).toLocaleString("de-DE")}</dd></div>
          <div className="rounded-lg bg-muted p-3 text-xs">Prüfen: Stimmen Name und Geburtsdatum? Ist das Dokument gültig (Ablaufdatum)? Passt das Foto zum Profilfoto? Keine Anzeichen von Bearbeitung?</div>
        </dl>
        <div className="grid gap-2 sm:grid-cols-2">
          {bilder.isLoading && <p className="text-sm text-muted-foreground">Bilder werden geladen …</p>}
          {bilder.data?.map((u, i) => (
            <a key={i} href={u} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border bg-muted">
              <img src={u} alt={i === 0 ? "Ausweis Vorderseite" : "Ausweis Rückseite"} className="w-full object-contain" />
            </a>
          ))}
          {bilder.data?.length === 0 && <p className="text-sm text-muted-foreground">Keine Bilder vorhanden.</p>}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-end gap-2 border-t pt-4">
        <Button variant="success" disabled={entscheiden.isPending} onClick={() => entscheiden.mutate(true)}><BadgeCheck /> Bestätigen</Button>
        <div className="flex min-w-[14rem] flex-1 items-end gap-2">
          <div className="flex-1">
            <label htmlFor={`grund-${a.user_id}`} className="text-xs font-medium">Grund bei Ablehnung (sieht die Person)</label>
            <input id={`grund-${a.user_id}`} className="field mt-1" maxLength={300} value={grund} onChange={(e) => setGrund(e.target.value)} placeholder="z. B. Foto unscharf, Name passt nicht" />
          </div>
          <Button variant="outline" disabled={entscheiden.isPending} onClick={() => entscheiden.mutate(false)}><XCircle /> Ablehnen</Button>
        </div>
      </div>
    </article>
  );
}

function Admin() {
  const rolle = useRolle();
  const qc = useQueryClient();
  const ausweise = useQuery({
    queryKey: ["ausweise-offen"],
    enabled: rolle.data === "admin",
    queryFn: async () => {
      const { data, error } = await supabase.rpc("ausweise_offen");
      if (error) throw error;
      return (data ?? []) as Offen[];
    },
  });
  const busse = useQuery({
    queryKey: ["bus-offen"],
    enabled: rolle.data === "admin",
    queryFn: async () => {
      const { data, error } = await supabase.rpc("busunternehmen_offen");
      if (error) throw error;
      return (data ?? []) as BusOffen[];
    },
  });
  const freigeben = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("bus_freigeben", { _id: id });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Busunternehmen freigegeben."); qc.invalidateQueries({ queryKey: ["bus-offen"] }); qc.invalidateQueries({ queryKey: ["busfahrten"] }); },
    onError: () => toast.error("Freigabe fehlgeschlagen."),
  });

  if (rolle.isLoading) return <div className="container-page py-16"><div className="card-base h-40 animate-pulse bg-muted" /></div>;
  if (rolle.data !== "admin") return (
    <div className="container-page py-16"><EmptyState title="Nur für das Standard-Plus-Team"><Link to="/dashboard" className="underline">Zum Dashboard</Link></EmptyState></div>
  );

  return (
    <div className="container-page py-10">
      <h1 className="text-4xl">Team-Bereich</h1>
      <section className="mt-8" aria-labelledby="t-ausweise">
        <h2 id="t-ausweise" className="flex flex-wrap items-center gap-x-2 text-2xl"><IdCard className="h-6 w-6 text-tuerkis-600" aria-hidden />Ausweise prüfen {ausweise.data && <span className="text-base font-normal text-muted-foreground">({ausweise.data.length} offen)</span>}</h2>
        <p className="mt-1 text-sm text-muted-foreground">Nach jeder Entscheidung werden die Bilder sofort gelöscht.</p>
        <div className="mt-4 space-y-4">
          {ausweise.isError && <ErrorState />}
          {ausweise.data?.length === 0 && <EmptyState title="Keine offenen Ausweise" />}
          {ausweise.data?.map((a) => <AusweisPruefen key={a.user_id} a={a} />)}
        </div>
      </section>

      <section className="mt-12" aria-labelledby="t-bus">
        <h2 id="t-bus" className="flex flex-wrap items-center gap-x-2 text-2xl"><Bus className="h-6 w-6 text-tuerkis-600" aria-hidden />Busunternehmen freigeben {busse.data && <span className="text-base font-normal text-muted-foreground">({busse.data.length} offen)</span>}</h2>
        <p className="mt-1 text-sm text-muted-foreground">Vor der Freigabe Registernummer und Konzession prüfen (z. B. Handelsregister, Behördenregister des Landes).</p>
        <div className="mt-4 space-y-3">
          {busse.isError && <ErrorState />}
          {busse.data?.length === 0 && <EmptyState title="Keine offenen Busunternehmen" />}
          {busse.data?.map((b) => (
            <article key={b.id} className="card-base flex flex-wrap items-center justify-between gap-4 p-5">
              <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                <div><dt className="text-muted-foreground">Firma</dt><dd className="font-bold">{b.firma ?? "–"}</dd></div>
                <div><dt className="text-muted-foreground">Sitz</dt><dd>{b.sitz ?? "–"}</dd></div>
                <div><dt className="text-muted-foreground">Registernummer</dt><dd>{b.register_nr ?? "–"}</dd></div>
                <div><dt className="text-muted-foreground">Konzession</dt><dd>{b.bus_lizenz ?? "–"}</dd></div>
                <div><dt className="text-muted-foreground">Kontakt</dt><dd>{[b.telefon, b.email].filter(Boolean).join(" · ") || "–"}</dd></div>
              </dl>
              <Button variant="success" disabled={freigeben.isPending || !b.firma || !b.bus_lizenz} onClick={() => freigeben.mutate(b.id)}>
                <BadgeCheck /> Freigeben
              </Button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
