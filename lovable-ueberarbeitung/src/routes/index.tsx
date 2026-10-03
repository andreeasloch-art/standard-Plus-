import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Check, Hand } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/site/PageHeader";
import { ProfilListe } from "@/components/site/ProfilListe";
import { SuchFeld } from "@/components/site/SuchFeld";
import { Schritte, type Rolle } from "@/components/site/Schritte";
import { Abfahrtstafel } from "@/components/site/Abfahrtstafel";
import { DolmetscherDemo } from "@/components/site/DolmetscherDemo";
import { Bald } from "@/components/site/Vorteile";
import { AppInstallieren } from "@/components/site/AppInstallieren";
import { istBeispiel, oeffentlicheProfileQuery } from "@/lib/profile-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Standard Plus – Europäische Personalvermittlung" },
      { name: "description", content: "Arbeit in Deutschland finden – oder Fachkräfte aus ganz Europa: Profil anlegen, wischen, Interview mit Dolmetscher." },
      { property: "og:title", content: "Standard Plus – Ihr nächster Halt: Arbeit in Deutschland" },
      { property: "og:description", content: "Fachkräfte aus ganz Europa finden." },
    ],
  }),
  component: Index,
});

const BELIEBT = [
  { label: "Pflege", q: "Pflege" },
  { label: "Bau & Handwerk", q: "Bau & Handwerk" },
  { label: "IT & Software", q: "IT & Software" },
  { label: "Gastronomie", q: "Gastronomie" },
];

function Index() {
  const { data, isLoading, isError } = useQuery(oeffentlicheProfileQuery);
  const [rolle, setRolle] = useState<Rolle>("arbeit");
  const tab = (r: Rolle) =>
    `rounded-md px-3.5 py-2 text-sm font-semibold transition sm:px-4 ${rolle === r ? "bg-white text-ink shadow-soft" : "text-tafel-text/80 hover:text-tafel-text"}`;

  return (
    <>
      <section className="container-page pt-4 sm:pt-6">
        <Abfahrtstafel profile={data ?? []}>
          <h1 className="max-w-3xl text-[2.5rem] leading-[1.02] text-tafel-text sm:text-6xl lg:text-7xl">
            Ihr nächster Halt: Arbeit in Deutschland.
          </h1>

          <div className="mt-7 inline-flex rounded-lg border border-white/15 bg-white/10 p-1 backdrop-blur-md" role="group" aria-label="Ich bin hier, weil ich …">
            <button type="button" aria-pressed={rolle === "arbeit"} className={tab("arbeit")} onClick={() => setRolle("arbeit")}>
              Ich suche Arbeit
            </button>
            <button type="button" aria-pressed={rolle === "personal"} className={tab("personal")} onClick={() => setRolle("personal")}>
              Ich suche Fachkräfte
            </button>
          </div>

          {rolle === "arbeit" ? (
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
              <Button asChild size="lg">
                <Link to="/auth" search={{ modus: "registrieren" }}>
                  Kostenlos Profil anlegen <ArrowRight />
                </Link>
              </Button>
              <p className="text-sm text-tafel-leise">Ihre Kontaktdaten sieht nur, mit wem Sie ein Match haben.</p>
            </div>
          ) : (
            <div className="mt-5 max-w-2xl">
              <SuchFeld gross />
              <div className="mt-3 flex flex-wrap gap-2" aria-label="Beliebte Suchen">
                {BELIEBT.map((b) => (
                  <Link
                    key={b.label}
                    to="/talente"
                    search={{ q: b.q }}
                    className="rounded-md border border-white/15 bg-white/5 px-3 py-1 text-sm text-tafel-text/90 transition hover:bg-white/15"
                  >
                    {b.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </Abfahrtstafel>
      </section>

      <section className="container-page py-16 sm:py-24" aria-labelledby="ablauf-titel">
        <h2 id="ablauf-titel" className="text-3xl sm:text-4xl">So funktioniert’s</h2>
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
          <span aria-hidden className="absolute -right-24 -top-32 -z-10 h-80 w-80 rounded-full bg-tuerkis-500/30 blur-3xl" />
          <div>
            <h2 className="text-3xl sm:text-4xl">Ihre nächste Abfahrt: Ihr Profil.</h2>
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
