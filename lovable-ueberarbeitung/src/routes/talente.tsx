import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Hand, LayoutGrid, SlidersHorizontal, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/site/PageHeader";
import { ProfilListe } from "@/components/site/ProfilListe";
import { SuchFeld } from "@/components/site/SuchFeld";
import { WischStapel } from "@/components/site/WischStapel";
import { EinladenDialog } from "@/components/site/EinladenDialog";
import { NIVEAUS, istBeispiel, oeffentlicheProfileQuery, type OeffentlichesProfil } from "@/lib/profile-data";
import { useFavoriten } from "@/lib/favoriten";

type Suche = { q?: string; ansicht?: "liste" };

export const Route = createFileRoute("/talente")({
  validateSearch: (s: Record<string, unknown>): Suche => ({
    q: typeof s.q === "string" && s.q.trim() ? s.q.slice(0, 100) : undefined,
    ansicht: s.ansicht === "liste" ? "liste" : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Talente finden – Standard Plus" },
      { name: "description", content: "Fachkräfte suchen, per Wischen auswählen und zum Interview einladen." },
      { property: "og:title", content: "Talente finden – Standard Plus" },
      { property: "og:description", content: "Fachkräfte aus ganz Europa durchsuchen." },
    ],
  }),
  component: Talente,
});

const LEER = { beruf: "", branche: "", land: "", niveau: "", verfuegbar: "" };

function Talente() {
  const { q: qParam = "", ansicht } = Route.useSearch();
  const liste_ = ansicht === "liste";
  const navigate = useNavigate({ from: "/talente" });
  const { data, isLoading, isError } = useQuery(oeffentlicheProfileQuery);
  const fav = useFavoriten();
  const [q, setQ] = useState(qParam);
  useEffect(() => setQ(qParam), [qParam]);
  const [f, setF] = useState(LEER);
  const [filterOffen, setFilterOffen] = useState(false);
  const [einladen, setEinladen] = useState<OeffentlichesProfil | null>(null);
  const set = (k: keyof typeof LEER) => (e: React.ChangeEvent<HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  const opts = useMemo(() => {
    const u = (k: "beruf" | "branche" | "land") =>
      [...new Set((data ?? []).map((p) => p[k]).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b, "de"));
    return { beruf: u("beruf"), branche: u("branche"), land: u("land") };
  }, [data]);

  // Im Wischmodus filtert erst die abgeschickte Suche, damit der Stapel nicht bei jedem Tastendruck neu startet.
  const suchbegriff = liste_ ? q : qParam;
  const liste = useMemo(() => {
    const s = suchbegriff.trim().toLowerCase();
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
  }, [data, f, suchbegriff]);

  const filterAktiv = Object.values(f).filter(Boolean).length;
  const sel = "field appearance-none";
  const umschalter = (aktiv: boolean) =>
    `inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition ${aktiv ? "bg-card text-tint-foreground shadow-soft" : "text-muted-foreground hover:text-foreground"}`;

  return (
    <>
      <section className="flaeche-hell border-b">
        <div className="container-page mx-auto max-w-5xl py-6 sm:py-12">
          <h1 className="text-2xl sm:text-4xl">Fachkräfte finden</h1>
          <p className="mt-1 hidden text-muted-foreground sm:block">Suchen, nach rechts wischen für Favoriten, dann zum Interview einladen.</p>

          <div className="mt-4 flex gap-2 sm:mt-6 sm:gap-3">
            <SuchFeld wert={qParam} onAenderung={setQ} onSuche={(t) => navigate({ search: (s) => ({ ...s, q: t || undefined }), replace: true })} />
            <Button variant="outline" size="lg" className="h-auto shrink-0 px-3 py-3 sm:px-7" aria-label={`Filter${filterAktiv ? ` (${filterAktiv} aktiv)` : ""}`} aria-expanded={filterOffen} aria-controls="filter" onClick={() => setFilterOffen((o) => !o)}>
              <SlidersHorizontal /> <span className="hidden sm:inline">Filter{filterAktiv > 0 && ` (${filterAktiv})`}</span>
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
        </div>
      </section>

      <section className="container-page mx-auto max-w-5xl pb-14 pt-4 sm:pt-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-xl bg-surface p-1" role="group" aria-label="Ansicht">
            <button type="button" aria-pressed={!liste_} className={umschalter(!liste_)} onClick={() => navigate({ search: (s) => ({ ...s, ansicht: undefined }), replace: true })}>
              <Hand className="h-4 w-4" aria-hidden /> Wischen
            </button>
            <button type="button" aria-pressed={liste_} className={umschalter(liste_)} onClick={() => navigate({ search: (s) => ({ ...s, ansicht: "liste" }), replace: true })}>
              <LayoutGrid className="h-4 w-4" aria-hidden /> Liste
            </button>
          </div>
          <Link to="/favoriten" className="inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-semibold hover:bg-accent">
            <Star className="h-4 w-4 text-primary" fill="currentColor" aria-hidden /> Favoriten ({fav.ids.length})
          </Link>
        </div>

        <p className="mb-3 text-sm text-muted-foreground" aria-live="polite">
          {isLoading ? "Profile werden geladen …" : `${liste.length} ${liste.length === 1 ? "Vorschlag" : "Vorschläge"}`}
          {qParam && !isLoading && ` für „${qParam}“`}
          {liste.some((p) => istBeispiel(p.id)) && " · enthält Beispielprofile (fiktiv)"}
        </p>
        {isError && <ErrorState />}

        {liste_ ? (
          <ProfilListe profile={liste} laedt={isLoading} />
        ) : (
          !isLoading && <WischStapel profile={liste} onEinladen={setEinladen} />
        )}

        {!isLoading && !isError && liste.length === 0 && (
          <EmptyState title="Keine passenden Profile">Suchbegriff oder Filter anpassen.</EmptyState>
        )}
      </section>

      <EinladenDialog profil={einladen} onClose={() => setEinladen(null)} />
    </>
  );
}
