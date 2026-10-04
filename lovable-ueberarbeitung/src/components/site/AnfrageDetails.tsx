import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarClock, FileSignature, Languages, Lock, Mail, Phone, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

/** Felder einer Anfrage, die hier gebraucht werden (Spalten aus den Migrationen 2026-10-01 und 2026-10-04). */
export type AnfrageZeile = {
  id: string;
  status: string;
  arbeitgeber_id: string;
  arbeitnehmer_id: string;
  interview_gewuenscht?: boolean | null;
  interview_art?: string | null;
  wunschtermin?: string | null;
  dolmetscher?: boolean | null;
  nachricht?: string | null;
  vertrag_arbeitgeber_at?: string | null;
  vertrag_arbeitnehmer_at?: string | null;
};

export function vertragFertig(a: AnfrageZeile) {
  return a.status === "beidseitig" && !!a.vertrag_arbeitgeber_at && !!a.vertrag_arbeitnehmer_at;
}

/** Status in einfachen Worten: Einladung offen → Match – Interview → Vertrag abgeschlossen. */
export function AnfrageStatus({ a }: { a: AnfrageZeile }) {
  const [label, cls] =
    a.status === "abgelehnt" ? ["Abgelehnt", "bg-destructive/12 text-destructive"]
    : vertragFertig(a) ? ["Vertrag abgeschlossen", "bg-success/15 text-success"]
    : a.status === "beidseitig" ? ["Match – Interview", "bg-tint text-tint-foreground"]
    : ["Einladung offen", "bg-muted text-muted-foreground"];
  return <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${cls}`}>{label}</span>;
}

/** Wunsch des Unternehmens: Video oder Telefon, Termin, Dolmetscher, Nachricht. */
export function InterviewInfo({ a }: { a: AnfrageZeile }) {
  if (!a.interview_gewuenscht && !a.wunschtermin && !a.nachricht) return null;
  const Icon = a.interview_art === "telefon" ? Phone : Video;
  return (
    <div className="mt-3 space-y-1.5 rounded-lg bg-muted/60 p-3 text-sm">
      <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="inline-flex items-center gap-1.5"><Icon className="h-4 w-4 text-tuerkis-600" aria-hidden />{a.interview_art === "telefon" ? "Telefon-Interview" : "Video-Interview"}</span>
        {a.wunschtermin && (
          <span className="inline-flex items-center gap-1.5"><CalendarClock className="h-4 w-4 text-tuerkis-600" aria-hidden />
            {new Date(a.wunschtermin).toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" })}
          </span>
        )}
        {a.dolmetscher && <span className="inline-flex items-center gap-1.5"><Languages className="h-4 w-4 text-tuerkis-600" aria-hidden />mit Dolmetscher</span>}
      </p>
      {a.nachricht && <p className="text-muted-foreground">„{a.nachricht}“</p>}
    </div>
  );
}

/**
 * Vertragsabschluss nach dem Match: jede Seite bestätigt einzeln.
 * Erst wenn beide bestätigt haben, gibt die Datenbank Name und Kontaktdaten frei.
 */
export function VertragBlock({ a, seite, uid, queryKey }: { a: AnfrageZeile; seite: "arbeitgeber" | "arbeitnehmer"; uid: string; queryKey: unknown[] }) {
  const qc = useQueryClient();
  const ich = seite === "arbeitgeber" ? a.vertrag_arbeitgeber_at : a.vertrag_arbeitnehmer_at;
  const andere = seite === "arbeitgeber" ? a.vertrag_arbeitnehmer_at : a.vertrag_arbeitgeber_at;
  const fertig = vertragFertig(a);
  const gegenueber = seite === "arbeitgeber" ? a.arbeitnehmer_id : a.arbeitgeber_id;

  const bestaetigen = useMutation({
    mutationFn: async () => {
      const feld = seite === "arbeitgeber" ? "vertrag_arbeitgeber_at" : "vertrag_arbeitnehmer_at";
      const { error } = await supabase.from("anfragen").update({ [feld]: new Date().toISOString() } as never).eq("id", a.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Vertragsabschluss bestätigt."); qc.invalidateQueries({ queryKey }); },
    onError: () => toast.error("Bestätigung fehlgeschlagen."),
  });

  const kontakt = useQuery({
    queryKey: ["kontakt", uid, gegenueber],
    enabled: fertig,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("vorname, nachname, telefon, email, firma").eq("id", gegenueber).maybeSingle();
      if (error) throw error;
      return data as { vorname: string; nachname: string; telefon: string | null; email: string | null; firma: string | null } | null;
    },
  });

  if (a.status !== "beidseitig") return null;

  if (fertig) {
    const k = kontakt.data;
    return (
      <div className="mt-3 rounded-lg border border-success/40 bg-success/10 p-3 text-sm">
        <p className="font-semibold text-success">Vertrag abgeschlossen – Kontaktdaten freigegeben</p>
        {kontakt.isLoading && <p className="mt-1 text-muted-foreground">Wird geladen …</p>}
        {k && (
          <ul className="mt-2 space-y-1">
            <li className="font-semibold">{k.firma || [k.vorname, k.nachname].filter(Boolean).join(" ") || "–"}</li>
            {k.telefon && <li><a className="inline-flex items-center gap-1.5 underline" href={`tel:${k.telefon}`}><Phone className="h-4 w-4" aria-hidden />{k.telefon}</a></li>}
            {k.email && <li><a className="inline-flex items-center gap-1.5 underline" href={`mailto:${k.email}`}><Mail className="h-4 w-4" aria-hidden />{k.email}</a></li>}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-lg border border-dashed p-3 text-sm">
      <p className="flex items-start gap-2 text-muted-foreground">
        <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        Kontaktdaten werden erst sichtbar, wenn beide Seiten den Vertragsabschluss bestätigt haben.
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        {ich ? (
          <span className="font-semibold text-success">Von Ihnen bestätigt.</span>
        ) : (
          <Button size="sm" variant="outline" disabled={bestaetigen.isPending}
            onClick={() => { if (confirm("Bestätigen Sie, dass ein Arbeitsvertrag abgeschlossen wurde? Danach werden die Kontaktdaten beider Seiten freigegeben.")) bestaetigen.mutate(); }}>
            <FileSignature /> Vertragsabschluss bestätigen
          </Button>
        )}
        <span className="text-muted-foreground">{andere ? "Die Gegenseite hat bestätigt." : "Die Gegenseite hat noch nicht bestätigt."}</span>
      </div>
    </div>
  );
}
