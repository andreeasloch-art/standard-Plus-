import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowRight, Bus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/site/PageHeader";
import { FahrtKarte } from "@/components/site/FahrtKarte";
import { KlappText } from "@/components/site/KlappText";
import { busfahrtenQuery, faehrtStrecke } from "@/lib/bus";
import { istBeispiel } from "@/lib/profile-data";

export const Route = createFileRoute("/busreisen")({
  head: () => ({
    meta: [
      { title: "Busreisen zur Arbeit – Standard Plus" },
      { name: "description", content: "Busverbindungen zum Arbeitsort: Route mit allen Halten, Preis, Bewertungen und Kontakt der Busunternehmen." },
      { property: "og:title", content: "Busreisen zur Arbeit – Standard Plus" },
    ],
  }),
  component: Busreisen,
});

function Busreisen() {
  const { data, isLoading, isError } = useQuery(busfahrtenQuery);
  const [von, setVon] = useState("");
  const [nach, setNach] = useState("");
  const liste = useMemo(() => (data ?? []).filter((f) => faehrtStrecke(f, von, nach)), [data, von, nach]);

  return (
    <>
      <section className="flaeche-hell">
        <div className="container-page max-w-5xl pb-4 pt-8 sm:pt-12">
          <h1 className="text-4xl sm:text-6xl">Mit dem Bus zur Arbeit</h1>
          <p className="mt-2 max-w-2xl text-lg text-muted-foreground">Verbindungen von Busunternehmen – mit allen Halten, Preis und echten Bewertungen von Mitfahrenden.</p>

          <form className="glas-leiste mt-6 grid gap-2 rounded-xl p-2 sm:grid-cols-[1fr_auto_1fr]" role="search" onSubmit={(e) => e.preventDefault()}>
            <label className="sr-only" htmlFor="von">Von</label>
            <input id="von" className="field" placeholder="Von, z. B. Timișoara" value={von} onChange={(e) => setVon(e.target.value)} autoComplete="off" />
            <span className="hidden items-center justify-center text-tuerkis-600 sm:flex" aria-hidden><ArrowRight className="h-5 w-5" /></span>
            <label className="sr-only" htmlFor="nach">Nach</label>
            <input id="nach" className="field" placeholder="Nach, z. B. Stuttgart" value={nach} onChange={(e) => setNach(e.target.value)} autoComplete="off" />
          </form>
        </div>
      </section>

      <section className="container-page max-w-5xl pb-16 pt-4">
        <p className="mb-4 text-sm text-muted-foreground" aria-live="polite">
          {isLoading ? "Fahrten werden geladen …" : <><KlappText text={String(liste.length)} className="schrift-tafel font-bold text-foreground" /> {liste.length === 1 ? "Verbindung" : "Verbindungen"}</>}
          {liste.some((f) => istBeispiel(f.firma_id)) && " · enthält Beispiel-Unternehmen (fiktiv)"}
          {" · sortiert nach neuestem Angebot"}
        </p>
        {isError && <ErrorState />}
        <div className="space-y-4">
          {liste.map((f) => <FahrtKarte key={f.id} f={f} beispiel={istBeispiel(f.firma_id)} />)}
        </div>
        {!isLoading && !isError && liste.length === 0 && (
          <EmptyState title="Keine passende Verbindung">Andere Orte versuchen – oder lassen Sie uns die Anreise für Sie organisieren.</EmptyState>
        )}

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <div className="card-base p-6">
            <h2 className="text-xl">Sie haben einen Job über Standard Plus?</h2>
            <p className="mt-1 text-sm text-muted-foreground">Nach dem Vertragsabschluss schlagen wir Ihnen passende Fahrten vom Wohnort zum Arbeitsort vor. Anfragen geht mit einem Klick.</p>
            <Button asChild variant="outline" className="mt-4"><Link to="/dashboard">Zu meinem Konto</Link></Button>
          </div>
          <div className="card-base p-6">
            <h2 className="flex items-center gap-2 text-xl"><Bus className="h-5 w-5 text-tuerkis-600" aria-hidden />Sie sind ein Busunternehmen?</h2>
            <p className="mt-1 text-sm text-muted-foreground">Bieten Sie Ihre Fahrten an – Fachkräfte mit neuem Job brauchen eine Anreise.</p>
            <Button asChild className="mt-4"><Link to="/auth" search={{ modus: "registrieren", rolle: "busunternehmen" }}>Als Busunternehmen registrieren</Link></Button>
          </div>
        </div>
        <p className="mt-6 text-xs text-muted-foreground">
          Standard Plus vermittelt nur den Kontakt. Beförderungsvertrag, Bezahlung und Ticket laufen direkt zwischen Ihnen und dem Busunternehmen.
          Bewertungen stammen nur von Personen, deren Fahrt über Standard Plus gebucht und als durchgeführt bestätigt wurde.
        </p>
      </section>
    </>
  );
}
