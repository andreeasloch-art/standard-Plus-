import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Check, Hand } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/site/PageHeader";
import { ProfilListe } from "@/components/site/ProfilListe";
import { SuchFeld } from "@/components/site/SuchFeld";
import { Schritte, type Rolle } from "@/components/site/Schritte";
import { WischBuehne } from "@/components/site/WischBuehne";
import { DolmetscherDemo } from "@/components/site/DolmetscherDemo";
import { Bald } from "@/components/site/Vorteile";
import { AppInstallieren } from "@/components/site/AppInstallieren";
import { istBeispiel, oeffentlicheProfileQuery } from "@/lib/profile-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Standard Plus – Arbeit finden. Einfach wischen." },
      { name: "description", content: "Arbeit finden – überall. Fachkräfte und Unternehmen finden sich per Wisch, Interview mit Dolmetscher." },
      { property: "og:title", content: "Standard Plus – Arbeit finden. Überall. Einfach wischen." },
      { property: "og:description", content: "Fachkräfte aus ganz Europa finden." },
    ],
  }),
  component: Index,
});

const BEISPIELE = ["Pflegekraft in Wien", "Koch in Paris", "Elektriker in Zürich", "Entwickler in London", "Erntehelfer in Spanien", "Fahrer in New York"];

const BELIEBT = [
  { label: "Pflege", q: "Pflege" },
  { label: "Bau & Handwerk", q: "Bau & Handwerk" },
  { label: "IT & Software", q: "IT & Software" },
  { label: "Gastronomie", q: "Gastronomie" },
];

function Index() {
  const { data, isLoading, isError } = useQuery(oeffentlicheProfileQuery);
  const [rolle, setRolle] = useState<Rolle>("arbeit");
  const [suche, setSuche] = useState("");
  const tab = (r: Rolle) =>
    `rounded-md px-3.5 py-2 text-sm font-semibold transition ${rolle === r ? "bg-white text-tuerkis-800 shadow-soft dark:bg-card dark:text-tuerkis-200" : "text-muted-foreground hover:text-foreground"}`;

  return (
    <>
      <section className="container-page grid gap-8 pb-16 pt-6 sm:pt-14 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-x-16 lg:gap-y-8 lg:pb-24">
        <div className="min-w-0 lg:self-end">
          <h1 className="text-[2.4rem] leading-[1.02] sm:text-6xl lg:text-7xl">
            Arbeit finden. Überall.{" "}
            <span className="text-tuerkis-700 dark:text-tuerkis-300">Einfach wischen.</span>
          </h1>
          <p className="mt-4 max-w-xl text-base text-muted-foreground sm:mt-5 sm:text-lg">
            Fachkräfte und Unternehmen finden sich per Wisch – von Wien bis Paris, von London bis New York.
          </p>

          <SuchFeld gross wert={suche} beispiele={BEISPIELE} onAenderung={setSuche} className="mt-6 max-w-xl sm:mt-8" />
          <div className="mt-3 flex flex-wrap gap-2" aria-label="Beliebte Suchen">
            {BELIEBT.map((b) => (
              <button
                key={b.label}
                type="button"
                onClick={() => setSuche(b.q)}
                aria-pressed={suche === b.q}
                className={`rounded-md border px-3 py-1 text-sm transition ${suche === b.q ? "border-tuerkis-300 bg-tint text-tint-foreground" : "glas-knopf text-tint-foreground hover:bg-[var(--glas-stark)]"}`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        {/* Auf dem Handy direkt unter der Suche, ab Desktop rechts daneben */}
        <div className="min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-center">
          <WischBuehne profile={data ?? []} suche={suche} />
        </div>

        <div className="min-w-0 lg:self-start">
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link to="/auth" search={{ modus: "registrieren" }}>
                Kostenlos Profil anlegen <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/talente" search={{ q: suche.trim() || undefined }}>
                <Hand /> Fachkräfte wischen
              </Link>
            </Button>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">Kontaktdaten gibt es erst beim Match.</p>
        </div>
      </section>

      <section className="container-page pb-16 sm:pb-24" aria-labelledby="ablauf-titel">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="ablauf-titel" className="text-3xl sm:text-4xl">So funktioniert’s</h2>
          <div className="glas-knopf inline-flex rounded-lg p-1" role="group" aria-label="Ablauf anzeigen für">
            <button type="button" aria-pressed={rolle === "arbeit"} className={tab("arbeit")} onClick={() => setRolle("arbeit")}>Für Fachkräfte</button>
            <button type="button" aria-pressed={rolle === "personal"} className={tab("personal")} onClick={() => setRolle("personal")}>Für Unternehmen</button>
          </div>
        </div>
        <Schritte rolle={rolle} />
      </section>

      <section id="profile" className="pb-16 sm:pb-24" aria-labelledby="profile-titel">
        <div className="container-page">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-8">
            <div>
              <h2 id="profile-titel" className="text-3xl sm:text-4xl">Aktuelle Profile</h2>
              {data?.some((p) => istBeispiel(p.id)) && (
                <p className="mt-1 text-sm text-muted-foreground">Enthält Beispielprofile (fiktiv)</p>
              )}
            </div>
            <Button asChild variant="outline">
              <Link to="/talente">
                <Hand /> Jetzt wischen
              </Link>
            </Button>
          </div>
          {isError && <ErrorState />}
          {data && data.length === 0 && <EmptyState title="Noch keine Profile veröffentlicht" />}
          <ProfilListe profile={data ?? []} laedt={isLoading} />
        </div>
      </section>

      <section className="border-y bg-card/70 py-16 sm:py-24" aria-labelledby="dolmetscher-titel">
        <div className="container-page grid items-center gap-10 lg:grid-cols-2">
          <div>
            <h2 id="dolmetscher-titel" className="flex flex-wrap items-center gap-3 text-3xl sm:text-4xl">
              Interview ohne Sprachbarriere <Bald />
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">Jeder spricht seine Sprache. Der Live-Dolmetscher übersetzt nach jedem Satz.</p>
            <ul className="mt-6 space-y-3">
              {["Per Telefon oder Video, ohne Zusatzgerät", "Jeder wählt nur seine eigene Sprache", "Übersetzung in etwa 1 bis 3 Sekunden"].map((t) => (
                <li key={t} className="flex gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-tuerkis-600 dark:text-tuerkis-300" aria-hidden />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <DolmetscherDemo />
        </div>
      </section>

      <div className="pt-16 sm:pt-24">
        <AppInstallieren />
      </div>

      <section className="container-page pb-16 sm:pb-24">
        <div className="relative isolate flex flex-col items-start justify-between gap-6 overflow-hidden rounded-2xl bg-tafel p-8 text-tafel-text shadow-lift sm:flex-row sm:items-center sm:p-12">
          <span aria-hidden className="absolute -right-24 -top-32 -z-10 h-80 w-80 rounded-full bg-tuerkis-500/15 blur-3xl" />
          <div>
            <h2 className="text-3xl sm:text-4xl">Ihr nächster Job wartet – überall.</h2>
            <p className="mt-2 text-tafel-leise">Kostenlos für Fachkräfte. Unternehmen zahlen nur bei Erfolg.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/auth" search={{ modus: "registrieren" }}>
                Profil anlegen <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className="text-tafel-text hover:bg-white/10 hover:text-tafel-text">
              <Link to="/talente">Fachkräfte finden</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
