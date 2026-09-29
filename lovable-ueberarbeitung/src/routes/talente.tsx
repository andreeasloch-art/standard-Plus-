import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/site/PageHeader";
import { ProfilListe } from "@/components/site/ProfilListe";
import { SuchFeld } from "@/components/site/SuchFeld";
import { NIVEAUS, istBeispiel, oeffentlicheProfileQuery } from "@/lib/profile-data";

type Suche = { q?: string };

export const Route = createFileRoute("/talente")({
  validateSearch: (s: Record<string, unknown>): Suche => ({
    q: typeof s.q === "string" && s.q.trim() ? s.q.slice(0, 100) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Talente finden – Standard Plus" },
      { name: "description", content: "Fachkräfte aus ganz Europa nach Beruf, Skill und Ort durchsuchen." },
      { property: "og:title", content: "Talente finden – Standard Plus" },
      { property: "og:description", content: "Fachkräfte aus ganz Europa durchsuchen." },
    ],
  }),
  component: Talente,
});

const LEER = { beruf: "", branche: "", land: "", niveau: "", verfuegbar: "" };

function Talente() {
  const { q: qParam = "" } = Route.useSearch();
  const navigate = useNavigate({ from: "/talente" });
  const { data, isLoading, isError } = useQuery(oeffentlicheProfileQuery);
  const [q, setQ] = useState(qParam);
  useEffect(() => setQ(qParam), [qParam]);
  const [f, setF] = useState(LEER);
  const [filterOffen, setFilterOffen] = useState(false);
  const set = (k: keyof typeof LEER) => (e: React.ChangeEvent<HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  const opts = useMemo(() => {
    const u = (k: "beruf" | "branche" | "land") =>
      [...new Set((data ?? []).map((p) => p[k]).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b, "de"));
    return { beruf: u("beruf"), branche: u("branche"), land: u("land") };
  }, [data]);

  const liste = useMemo(() => {
    const s = q.trim().toLowerCase();
    const grenze = new Date();
    if (f.verfuegbar) grenze.setMonth(grenze.getMonth() + Number(f.verfuegbar));
    return (data ?? []).filter((p) => {
      if (f.beruf && p.beruf !== f.beruf) return false;
      if (f.branche && p.branche !== f.branche) return false;
      if (f.land && p.land !== f.land) return false;
      if (f.niveau && (!p.deutschniveau || NIVEAUS.indexOf(p.deutschniveau as never) < NIVEAUS.indexOf(f.niveau as never))) return false;
      if (f.verfuegbar && p.verfuegbar_ab && new Date(p.verfuegbar_ab) > grenze) return false;
      if (s) {
        const felder = [p.anzeigename, p.beruf, p.branche, p.land, p.wohnort, p.zielort, ...p.skills];
        if (!felder.some((x) => x?.toLowerCase().includes(s))) return false;
      }
      return true;
    });
  }, [data, f, q]);

  const filterAktiv = Object.values(f).filter(Boolean).length;
  const sel = "field appearance-none";

  return (
    <section className="container-page mx-auto max-w-5xl py-10 sm:py-14">
      <h1 className="text-3xl sm:text-4xl">Fachkräfte finden</h1>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <SuchFeld
          wert={qParam}
          onAenderung={setQ}
          onSuche={(t) => navigate({ search: { q: t || undefined }, replace: true })}
        />
        <Button
          variant="outline"
          size="lg"
          className="h-auto shrink-0"
          aria-expanded={filterOffen}
          aria-controls="filter"
          onClick={() => setFilterOffen((o) => !o)}
        >
          <SlidersHorizontal /> Filter{filterAktiv > 0 && ` (${filterAktiv})`}
        </Button>
      </div>

      <div id="filter" hidden={!filterOffen} className="card-base mt-3 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
        <select className={sel} value={f.beruf} onChange={set("beruf")} aria-label="Beruf">
          <option value="">Alle Berufe</option>
          {opts.beruf.map((o) => <option key={o}>{o}</option>)}
        </select>
        <select className={sel} value={f.branche} onChange={set("branche")} aria-label="Branche">
          <option value="">Alle Branchen</option>
          {opts.branche.map((o) => <option key={o}>{o}</option>)}
        </select>
        <select className={sel} value={f.land} onChange={set("land")} aria-label="Herkunftsland">
          <option value="">Alle Länder</option>
          {opts.land.map((o) => <option key={o}>{o}</option>)}
        </select>
        <select className={sel} value={f.niveau} onChange={set("niveau")} aria-label="Deutschniveau mindestens">
          <option value="">Deutsch: alle</option>
          {NIVEAUS.map((n) => <option key={n} value={n}>Deutsch ab {n}</option>)}
        </select>
        <select className={sel} value={f.verfuegbar} onChange={set("verfuegbar")} aria-label="Verfügbarkeit">
          <option value="">Verfügbar: egal</option>
          <option value="1">innerhalb 1 Monat</option>
          <option value="3">innerhalb 3 Monaten</option>
          <option value="6">innerhalb 6 Monaten</option>
        </select>
        {filterAktiv > 0 && (
          <Button variant="ghost" onClick={() => setF(LEER)} className="justify-start">
            <X /> Filter zurücksetzen
          </Button>
        )}
      </div>

      <p className="mb-4 mt-6 text-sm text-muted-foreground" aria-live="polite">
        {isLoading ? "Profile werden geladen …" : `${liste.length} ${liste.length === 1 ? "Profil" : "Profile"}`}
        {liste.some((p) => istBeispiel(p.id)) && " · enthält Beispielprofile (fiktiv)"}
      </p>
      {isError && <ErrorState />}
      <ProfilListe profile={liste} laedt={isLoading} />
      {!isLoading && !isError && liste.length === 0 && (
        <EmptyState title="Keine passenden Profile">Suchbegriff oder Filter anpassen.</EmptyState>
      )}
    </section>
  );
}
