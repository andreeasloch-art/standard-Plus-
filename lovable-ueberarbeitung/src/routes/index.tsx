import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Check, Hand } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/site/PageHeader";
import { ProfilListe } from "@/components/site/ProfilListe";
import { SuchFeld } from "@/components/site/SuchFeld";
import { Schritte } from "@/components/site/Schritte";
import { DolmetscherDemo } from "@/components/site/DolmetscherDemo";
import { Bald } from "@/components/site/Vorteile";
import { AppInstallieren } from "@/components/site/AppInstallieren";
import { istBeispiel, oeffentlicheProfileQuery } from "@/lib/profile-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Standard Plus – Europäische Personalvermittlung" },
      { name: "description", content: "Fachkräfte aus ganz Europa finden: suchen, wischen, zum Interview einladen." },
      { property: "og:title", content: "Standard Plus – Menschen verbinden. Erfolg gestalten." },
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

  return (
    <>
      <section className="flaeche-hell">
        <div className="container-page mx-auto max-w-3xl pb-16 pt-14 text-center sm:pb-20 sm:pt-20">
          <p className="glas-knopf inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-info"><span className="h-1.5 w-1.5 rounded-full bg-tuerkis-500" aria-hidden />Personalvermittlung in Europa</p>
          <h1 className="isolate mt-5 text-[2.6rem] leading-[1.05] sm:text-7xl">
            Menschen verbinden.{" "}
            <span className="relative whitespace-nowrap">
              Erfolg gestalten.
              <span className="absolute inset-x-0 -bottom-1 -z-10 h-3 rounded bg-primary/80" aria-hidden />
            </span>
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">Was suchen Sie? Wir schlagen passende Fachkräfte vor.</p>

          <SuchFeld gross className="mx-auto mt-8 max-w-2xl text-left" />

          <div className="mt-5 flex flex-wrap justify-center gap-2" aria-label="Beliebte Suchen">
            {BELIEBT.map((b) => (
              <Link
                key={b.label}
                to="/talente"
                search={{ q: b.q }}
                className="glas-knopf rounded-full px-4 py-1.5 text-sm font-medium text-tint-foreground transition hover:-translate-y-px hover:bg-[var(--glas-stark)]"
              >
                {b.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-14 sm:py-20">
        <h2 className="text-3xl sm:text-4xl">So funktioniert’s</h2>
        <Schritte />
      </section>

      <section className="py-14 sm:py-20">
        <div className="container-page mx-auto max-w-5xl">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-8">
            <div>
              <h2 className="text-3xl sm:text-4xl">Aktuelle Profile</h2>
              {data?.some((p) => istBeispiel(p.id)) && (
                <p className="mt-1 text-sm text-muted-foreground">Enthält Beispielprofile (fiktiv)</p>
              )}
            </div>
            <Button asChild>
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

      <section className="container-page grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-2">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-info">Live-Dolmetscher <Bald /></p>
          <h2 className="mt-2 text-3xl sm:text-4xl">Interview ohne Sprachbarriere</h2>
          <p className="mt-4 text-lg text-muted-foreground">Sie sprechen Deutsch. Die Fachkraft hört Ihre Worte in ihrer Sprache – und umgekehrt.</p>
          <ul className="mt-6 space-y-3">
            {[
              "Per Telefon oder Video, ohne Zusatzgerät",
              "Jeder wählt nur seine eigene Sprache",
              "Übersetzt wird nach jedem Satz – etwa 1 bis 3 Sekunden",
            ].map((t) => (
              <li key={t} className="flex gap-3">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-tuerkis-600 dark:text-tuerkis-300" aria-hidden />
                {t}
              </li>
            ))}
          </ul>
        </div>
        <DolmetscherDemo />
      </section>

      <AppInstallieren />

      <section className="container-page pb-14 sm:pb-20">
        <div className="relative isolate flex flex-col items-start justify-between gap-6 overflow-hidden rounded-[2rem] bg-ink p-8 text-ink-foreground shadow-lift sm:flex-row sm:items-center sm:p-12">
          <span aria-hidden className="absolute -right-24 -top-32 -z-10 h-80 w-80 rounded-full bg-tuerkis-500/45 blur-3xl" />
          <span aria-hidden className="absolute -bottom-40 left-1/4 -z-10 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
          <div>
            <h2 className="text-2xl sm:text-3xl">Bereit für Ihr nächstes Team-Mitglied?</h2>
            <p className="mt-2 text-ink-foreground/80">Kostenlos registrieren – Zahlung nur bei Erfolg.</p>
          </div>
          <Button asChild size="lg">
            <Link to="/auth" search={{ modus: "registrieren" }}>
              Jetzt starten <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
