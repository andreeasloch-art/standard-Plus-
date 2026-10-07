import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FahrtKarte } from "@/components/site/FahrtKarte";
import { supabase } from "@/integrations/supabase/client";
import { BUCHUNG_TEXT, fahrtVorschlaegeQuery, type BuchungStatus, type Busfahrt } from "@/lib/bus";
import { istBeispiel } from "@/lib/profile-data";

type Buchung = { id: string; fahrt_id: string; firma_id: string; status: BuchungStatus; reisedatum: string | null; personen: number; busfahrten: { von_ort: string; nach_ort: string } | null };

const heute = () => new Date().toISOString().slice(0, 10);

/** Anfrage-Formular der Fachkraft für eine vorgeschlagene Fahrt. */
function Anfragen({ f, anfrageId, uid, fertig }: { f: Busfahrt; anfrageId: string; uid: string; fertig: () => void }) {
  const [offen, setOffen] = useState(false);
  const [einwilligung, setEinwilligung] = useState(false);
  const senden = useMutation({
    mutationFn: async (fd: FormData) => {
      const { error } = await supabase.from("bus_buchungen").insert({
        fahrt_id: f.id, anfrage_id: anfrageId, reisender_id: uid,
        reisedatum: (fd.get("reisedatum") as string) || null,
        personen: Number(fd.get("personen") || 1),
        nachricht: ((fd.get("nachricht") as string) || "").trim() || null,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Fahrt angefragt. Das Busunternehmen meldet sich bei Ihnen."); setOffen(false); fertig(); },
    onError: () => toast.error("Anfrage fehlgeschlagen."),
  });
  if (!offen) return <Button size="sm" onClick={() => setOffen(true)}><Bus /> Fahrt anfragen</Button>;
  return (
    <form className="w-full space-y-3 rounded-xl bg-muted p-4" onSubmit={(e) => { e.preventDefault(); if (einwilligung) senden.mutate(new FormData(e.currentTarget)); }}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`rd-${f.id}`} className="text-sm font-medium">Reisedatum</label>
          <input id={`rd-${f.id}`} name="reisedatum" type="date" min={heute()} className="field mt-1" />
        </div>
        <div>
          <label htmlFor={`pe-${f.id}`} className="text-sm font-medium">Personen</label>
          <input id={`pe-${f.id}`} name="personen" type="number" min={1} max={9} defaultValue={1} className="field mt-1" />
        </div>
      </div>
      <div>
        <label htmlFor={`na-${f.id}`} className="text-sm font-medium">Nachricht (freiwillig)</label>
        <input id={`na-${f.id}`} name="nachricht" maxLength={500} className="field mt-1" placeholder="z. B. großer Koffer" />
      </div>
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" checked={einwilligung} onChange={(e) => setEinwilligung(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-info)]" />
        <span>Ich bin einverstanden, dass mein Name und meine Handynummer an {f.firma ?? "das Busunternehmen"} gehen, damit die Fahrt organisiert werden kann.</span>
      </label>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={!einwilligung || senden.isPending}>{senden.isPending ? "Wird gesendet …" : "Anfrage senden"}</Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOffen(false)}>Abbrechen</Button>
      </div>
    </form>
  );
}

function FahrtBewerten({ b, uid }: { b: Buchung; uid: string }) {
  const qc = useQueryClient();
  const [sterne, setSterne] = useState(0);
  const vorhanden = useQuery({
    queryKey: ["bus-bewertung", b.id, uid],
    queryFn: async () => {
      const { data } = await supabase.from("bus_bewertungen").select("sterne").eq("buchung_id", b.id).eq("von_id", uid).maybeSingle();
      return data as { sterne: number } | null;
    },
  });
  const senden = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("bus_bewertungen").insert({ buchung_id: b.id, firma_id: b.firma_id, von_id: uid, sterne } as never);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Danke für Ihre Bewertung!"); qc.invalidateQueries({ queryKey: ["bus-bewertung", b.id, uid] }); qc.invalidateQueries({ queryKey: ["busfahrten"] }); },
    onError: () => toast.error("Bewertung fehlgeschlagen."),
  });
  if (vorhanden.isLoading) return null;
  if (vorhanden.data) return <p className="text-sm text-muted-foreground">Ihre Bewertung der Fahrt: {vorhanden.data.sterne} von 5 Sternen</p>;
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span>Fahrt bewerten:</span>
      <span role="radiogroup" aria-label="Sterne für die Fahrt" className="inline-flex">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={sterne === n} aria-label={`${n} Sterne`} onClick={() => setSterne(n)} className="rounded p-0.5">
            <Star className={`h-5 w-5 ${n <= sterne ? "fill-primary text-primary-hover" : "text-muted-foreground"}`} />
          </button>
        ))}
      </span>
      <Button size="sm" variant="outline" disabled={!sterne || senden.isPending} onClick={() => senden.mutate()}>Senden</Button>
    </div>
  );
}

/**
 * Nach dem Vertragsabschluss: passende Busfahrten vom Wohnort der Fachkraft zum Arbeitsort.
 * Fachkraft fragt an (ihre Daten gehen ans Busunternehmen); Arbeitgeber sieht Vorschläge und Stand.
 */
export function FahrtVorschlaege({ anfrageId, seite, uid }: { anfrageId: string; seite: "arbeitgeber" | "arbeitnehmer"; uid: string }) {
  const qc = useQueryClient();
  const vorschlaege = useQuery(fahrtVorschlaegeQuery(anfrageId));
  const buchungen = useQuery({
    queryKey: ["deal-buchungen", anfrageId],
    queryFn: async () => {
      const { data, error } = await supabase.from("bus_buchungen").select("id, fahrt_id, firma_id, status, reisedatum, personen, busfahrten(von_ort, nach_ort)").eq("anfrage_id", anfrageId).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Buchung[];
    },
  });
  const fertig = () => qc.invalidateQueries({ queryKey: ["deal-buchungen", anfrageId] });
  const stornieren = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bus_buchungen").update({ status: "storniert" } as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Fahrtanfrage storniert."); fertig(); },
  });
  const laufend = buchungen.data?.filter((b) => b.status !== "storniert" && b.status !== "abgelehnt") ?? [];

  return (
    <div className="mt-4 space-y-3">
      <h4 className="flex items-center gap-2 text-base"><Bus className="h-5 w-5 text-tuerkis-600" aria-hidden />Anreise mit dem Bus</h4>
      {buchungen.data?.map((b) => (
        <div key={b.id} className="rounded-lg border p-3 text-sm">
          <p className="flex flex-wrap items-center justify-between gap-2">
            <span className="schrift-tafel font-semibold">{b.busfahrten ? `${b.busfahrten.von_ort} → ${b.busfahrten.nach_ort}` : "Busfahrt"}</span>
            <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold">{BUCHUNG_TEXT[b.status]}</span>
          </p>
          <p className="text-muted-foreground">{b.reisedatum ? new Date(b.reisedatum).toLocaleDateString("de-DE") : "Datum offen"} · {b.personen} {b.personen === 1 ? "Person" : "Personen"}</p>
          {seite === "arbeitnehmer" && (b.status === "angefragt" || b.status === "bestaetigt") && (
            <Button size="sm" variant="ghost" className="mt-1 px-0" onClick={() => { if (confirm("Fahrtanfrage stornieren?")) stornieren.mutate(b.id); }}>Stornieren</Button>
          )}
          {b.status === "durchgefuehrt" && <div className="mt-2"><FahrtBewerten b={b} uid={uid} /></div>}
        </div>
      ))}
      {laufend.length === 0 && (
        <>
          <p className="text-sm text-muted-foreground">
            {seite === "arbeitnehmer" ? "Passende Fahrten zu Ihrem Arbeitsort – wählen Sie eine aus:" : "Passende Fahrten für die Anreise Ihrer Fachkraft. Die Fachkraft kann sie mit einem Klick anfragen."}
            {" "}Sortiert nach Übereinstimmung der Strecke, dann Bewertung, dann Preis.
          </p>
          {vorschlaege.isLoading && <p className="text-sm text-muted-foreground">Fahrten werden gesucht …</p>}
          {vorschlaege.data?.length === 0 && (
            <p className="text-sm text-muted-foreground">Noch keine passende Busfahrt. {seite === "arbeitnehmer" ? <Link to="/anreise" className="underline">Anreise von uns organisieren lassen</Link> : "Wir organisieren die Anreise auf Anfrage."}</p>
          )}
          {vorschlaege.data?.map((f) => (
            <FahrtKarte key={f.id} f={f} beispiel={istBeispiel(f.firma_id)}
              aktion={seite === "arbeitnehmer" ? <Anfragen f={f} anfrageId={anfrageId} uid={uid} fertig={fertig} /> : undefined} />
          ))}
        </>
      )}
    </div>
  );
}
