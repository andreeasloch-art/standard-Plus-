import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, BadgeCheck, Lock, MapPin, Phone, Mail, Briefcase, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/site/PageHeader";
import { ProfilFoto } from "@/components/site/ProfilFoto";
import { formatDatum, istBeispiel, matchProzent, oeffentlicheProfileQuery } from "@/lib/profile-data";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useRolle } from "@/lib/auth";

export const Route = createFileRoute("/profil/$id")({
  head: () => ({
    meta: [
      { title: "Fachkraft-Profil – Standard Plus" },
      { name: "description", content: "Pseudonymisiertes Profil einer Fachkraft auf Standard Plus." },
      { property: "og:title", content: "Fachkraft-Profil – Standard Plus" },
      { property: "og:description", content: "Pseudonymisiertes Profil – Kontaktdaten erst bei Vertragsabschluss." },
    ],
  }),
  component: ProfilAnsicht,
});

const STATUS: Record<string, string> = {
  offen: "Offen – wartet auf Zusage der Fachkraft",
  beidseitig: "Zugesagt – Vertrag im Dashboard bestätigen",
  abgelehnt: "Abgelehnt",
};

function ProfilAnsicht() {
  const { id } = Route.useParams();
  const { session } = useAuth();
  const { data: rolle } = useRolle();
  const qc = useQueryClient();
  const liste = useQuery(oeffentlicheProfileQuery);
  const p = liste.data?.find((x) => x.id === id);

  const details = useQuery({
    queryKey: ["profil-details", id],
    queryFn: async () => {
      const [sp, wg] = await Promise.all([
        supabase.from("sprachen").select("sprache, stufe").eq("profile_id", id),
        supabase.from("werdegang").select("*").eq("profile_id", id).order("von", { ascending: false }),
      ]);
      if (sp.error) throw sp.error;
      if (wg.error) throw wg.error;
      return { sprachen: sp.data, werdegang: wg.data };
    },
  });

  // Erst wenn beide Seiten den Vertragsabschluss bestätigt haben, liefert die Datenbank Kontaktdaten zurück.
  const kontakt = useQuery({
    queryKey: ["kontakt", id, session?.user.id],
    enabled: !!session,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("vorname, nachname, telefon, email").eq("id", id).maybeSingle();
      return data;
    },
  });

  const anfrage = useQuery({
    queryKey: ["anfrage-zu", id, session?.user.id],
    enabled: !!session && rolle === "arbeitgeber",
    queryFn: async () => {
      const { data } = await supabase.from("anfragen").select("status").eq("arbeitnehmer_id", id).eq("arbeitgeber_id", session!.user.id).limit(1).maybeSingle();
      return data;
    },
  });

  const stellen = useQuery({
    queryKey: ["meine-stellen", session?.user.id],
    enabled: !!session && rolle === "arbeitgeber",
    queryFn: async () => {
      const { data, error } = await supabase.from("stellen").select("id, titel").eq("arbeitgeber_id", session!.user.id).eq("offen", true);
      if (error) throw error;
      return data;
    },
  });
  const [stelle, setStelle] = useState("");

  const anfragen = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("anfragen").insert({ arbeitgeber_id: session!.user.id, arbeitnehmer_id: id, stelle_id: stelle || null });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Anfrage gesendet. Sie werden benachrichtigt, sobald die Fachkraft antwortet."); qc.invalidateQueries({ queryKey: ["anfrage-zu", id] }); },
    onError: (e: Error) => toast.error(e.message.includes("duplicate") ? "Sie haben diese Person bereits angefragt." : "Anfrage konnte nicht gesendet werden."),
  });

  if (liste.isLoading) return <div className="container-page py-16"><div className="card-base h-80 animate-pulse bg-surface" /></div>;
  if (liste.isError) return <div className="container-page py-16"><ErrorState /></div>;
  if (!p) return (
    <div className="container-page py-16">
      <EmptyState title="Profil nicht gefunden">Dieses Profil ist nicht (mehr) öffentlich sichtbar.</EmptyState>
      <Button asChild variant="outline" className="mt-6"><Link to="/talente"><ArrowLeft />Zur Suche</Link></Button>
    </div>
  );

  const voll = kontakt.data && kontakt.data.nachname ? kontakt.data : null;
  const name = voll ? `${voll.vorname} ${voll.nachname}` : p.anzeigename || "Fachkraft";

  return (
    <div className="container-page py-10">
      <Link to="/talente" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" aria-hidden />Alle Talente</Link>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <div className="card-base overflow-hidden p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row">
              <ProfilFoto url={p.foto_url} name={p.anzeigename || "Fachkraft"} gross className="w-40 shrink-0 rounded-2xl sm:w-56" />
              <div className="min-w-0 flex-1">
                <h1 className="flex flex-wrap items-center gap-x-2 text-2xl sm:text-3xl">
                  <span>{name}{p.alter ? <span className="font-normal text-muted-foreground">, {p.alter}</span> : null}</span>
                  {p.ausweis_geprueft && <BadgeCheck className="h-6 w-6 text-tuerkis-600" aria-label="Ausweis geprüft" />}
                </h1>
                {istBeispiel(p.id) && <p className="mt-1 inline-flex rounded-full border border-dashed px-2.5 py-0.5 text-xs font-semibold">Beispielprofil (fiktiv)</p>}
                <p className="text-muted-foreground">{[p.beruf, p.branche].filter(Boolean).join(" · ")}</p>
                {p.ausweis_geprueft && <p className="mt-1 text-sm text-tuerkis-700 dark:text-tuerkis-300">Ausweis vom Team geprüft</p>}
                {(istBeispiel(p.id) || !session) && <p className="mt-3 inline-flex rounded-full bg-success/12 px-3 py-1 text-sm font-semibold text-success">{matchProzent(p.id)} % Übereinstimmung (Beispiel)</p>}
                <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-3">
                  <div className="flex gap-2"><MapPin className="h-4 w-4 text-info" aria-hidden /><div><dt className="text-muted-foreground">Route</dt><dd>{p.wohnort ?? p.land} → {p.zielort ?? "flexibel"}</dd></div></div>
                  <div className="flex gap-2"><Briefcase className="h-4 w-4 text-info" aria-hidden /><div><dt className="text-muted-foreground">Erfahrung</dt><dd>{p.erfahrung_jahre ?? "–"} Jahre</dd></div></div>
                  <div className="flex gap-2"><CalendarDays className="h-4 w-4 text-info" aria-hidden /><div><dt className="text-muted-foreground">Verfügbar ab</dt><dd>{formatDatum(p.verfuegbar_ab)}</dd></div></div>
                </dl>
              </div>
            </div>
            {p.ueber_mich && <p className="prose-measure mt-6">{p.ueber_mich}</p>}
            <div className="mt-6 flex flex-wrap gap-2">{p.skills.map((s) => <span key={s} className="rounded-md bg-tint px-2.5 py-1 text-sm text-tint-foreground">{s}</span>)}</div>
          </div>

          <div className="card-base p-6 sm:p-8">
            <h2 className="text-xl">Werdegang</h2>
            {details.isLoading ? <p className="mt-4 text-sm text-muted-foreground">Wird geladen …</p> :
              details.data?.werdegang.length ? (
                <ol className="mt-4 space-y-4 border-l-2 border-tuerkis-500 pl-5">
                  {details.data.werdegang.map((w) => (
                    <li key={w.id}>
                      <p className="font-semibold">{w.position}</p>
                      <p className="text-sm text-muted-foreground">{[w.arbeitgeber, w.ort].filter(Boolean).join(" · ")} · {w.von ? new Date(w.von).getFullYear() : "?"} – {w.bis ? new Date(w.bis).getFullYear() : "heute"}</p>
                      {w.taetigkeit && <p className="mt-1 text-sm">{w.taetigkeit}</p>}
                    </li>
                  ))}
                </ol>
              ) : <p className="mt-4 text-sm text-muted-foreground">Keine Angaben.</p>}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="card-base p-6">
            <h2 className="text-lg">Sprachen</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {details.data?.sprachen.length ? details.data.sprachen.map((s) => <li key={s.sprache} className="flex justify-between"><span>{s.sprache}</span><strong>{s.stufe}</strong></li>)
                : <li className="text-muted-foreground">{details.isLoading ? "Wird geladen …" : "Keine Angaben."}</li>}
            </ul>
          </div>
          <div className="card-base p-6">
            <h2 className="text-lg">Kontakt</h2>
            {voll ? (
              <ul className="mt-3 space-y-2 text-sm">
                {voll.telefon && <li className="flex gap-2"><Phone className="h-4 w-4" aria-hidden />{voll.telefon}</li>}
                {voll.email && <li className="flex gap-2"><Mail className="h-4 w-4" aria-hidden />{voll.email}</li>}
                {!voll.telefon && !voll.email && <li className="text-muted-foreground">Noch keine Kontaktdaten hinterlegt.</li>}
              </ul>
            ) : (
              <>
                <p className="mt-3 flex gap-2 text-sm text-muted-foreground"><Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />Kontaktdaten werden erst sichtbar, wenn beide Seiten den Vertragsabschluss bestätigt haben.</p>
                {!session && <Button asChild className="mt-4 w-full"><Link to="/auth">Anmelden, um anzufragen</Link></Button>}
                {session && rolle === "arbeitgeber" && (anfrage.data ? (
                  <p className="mt-4 rounded-xl bg-surface p-3 text-sm">Anfrage-Status: <strong>{STATUS[anfrage.data.status] ?? anfrage.data.status}</strong></p>
                ) : (
                  <div className="mt-4 space-y-2">
                    {!!stellen.data?.length && (
                      <select className="field" value={stelle} onChange={(e) => setStelle(e.target.value)} aria-label="Stelle zuordnen">
                        <option value="">Ohne Stellenbezug</option>
                        {stellen.data.map((s) => <option key={s.id} value={s.id}>{s.titel}</option>)}
                      </select>
                    )}
                    <Button className="w-full" disabled={anfragen.isPending} onClick={() => anfragen.mutate()}>{anfragen.isPending ? "Wird gesendet …" : "Anfrage senden"}</Button>
                    <p className="text-xs text-muted-foreground">Mit der Anfrage wird Ihr Firmenprofil der Fachkraft angezeigt. Details in der <Link to="/datenschutz" className="underline">Datenschutzerklärung</Link>.</p>
                  </div>
                ))}
                {session && rolle === "arbeitnehmer" && <p className="mt-4 text-sm text-muted-foreground">Nur Unternehmen können Talente anfragen.</p>}
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
