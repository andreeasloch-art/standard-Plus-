import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/site/PageHeader";
import { ProfilListe } from "@/components/site/ProfilListe";
import { SuchFeld } from "@/components/site/SuchFeld";
import { Schritte } from "@/components/site/Schritte";
import { istBeispiel, oeffentlicheProfileQuery } from "@/lib/profile-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Standard Plus – Europäische Personalvermittlung" },
      { name: "description", content: "Fachkräfte aus ganz Europa finden. Kontaktdaten erst nach beidseitiger Freigabe." },
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
      <section className="hero-glow">
        <div className="container-page mx-auto max-w-3xl py-16 text-center sm:py-24">
          <h1 className="text-4xl sm:text-6xl">
            Menschen verbinden.{" "}
            <span className="relative whitespace-nowrap">
              Erfolg gestalten.
              <span className="absolute inset-x-0 -bottom-1 -z-10 h-3 rounded bg-primary/70" aria-hidden />
            </span>
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">Qualifizierte Fachkräfte aus ganz Europa.</p>

          <SuchFeld gross className="mx-auto mt-8 max-w-2xl text-left" />

          <div className="mt-4 flex flex-wrap justify-center gap-2" aria-label="Beliebte Suchen">
            {BELIEBT.map((b) => (
              <Link
                key={b.label}
                to="/talente"
                search={{ q: b.q }}
                className="rounded-full border bg-card px-3 py-1 text-sm transition hover:bg-surface"
              >
                {b.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page mx-auto max-w-5xl py-16 sm:py-20">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl sm:text-4xl">Aktuelle Profile</h2>
            {data?.some((p) => istBeispiel(p.id)) && (
              <p className="mt-1 text-sm text-muted-foreground">Enthält Beispielprofile (fiktiv)</p>
            )}
          </div>
          <Button asChild variant="link" className="px-0">
            <Link to="/talente">
              Alle ansehen <ArrowRight />
            </Link>
          </Button>
        </div>
        {isError && <ErrorState />}
        {data && data.length === 0 && <EmptyState title="Noch keine Profile veröffentlicht" />}
        <ProfilListe profile={data ?? []} laedt={isLoading} />
      </section>

      <section className="bg-surface py-16 sm:py-20">
        <div className="container-page">
          <h2 className="text-3xl sm:text-4xl">So funktioniert’s</h2>
          <Schritte />
        </div>
      </section>

      <section className="container-page py-16 sm:py-20">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-ink p-8 text-ink-foreground sm:flex-row sm:items-center sm:p-12">
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
