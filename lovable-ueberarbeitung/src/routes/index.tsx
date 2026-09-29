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
      <section className="flaeche-tuerkis">
        <div className="container-page mx-auto max-w-3xl pb-20 pt-16 text-center sm:pb-28 sm:pt-24">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-tuerkis-200">Personalvermittlung in Europa</p>
          <h1 className="isolate mt-4 text-4xl text-white sm:text-6xl">
            Menschen verbinden.{" "}
            <span className="relative whitespace-nowrap">
              Erfolg gestalten.
              <span className="absolute inset-x-0 -bottom-1 -z-10 h-3 rounded bg-primary/80" aria-hidden />
            </span>
          </h1>
          <p className="mt-5 text-lg text-tuerkis-100">Qualifizierte Fachkräfte aus ganz Europa.</p>

          <SuchFeld gross className="mx-auto mt-8 max-w-2xl text-left text-foreground" />

          <div className="mt-5 flex flex-wrap justify-center gap-2" aria-label="Beliebte Suchen">
            {BELIEBT.map((b) => (
              <Link
                key={b.label}
                to="/talente"
                search={{ q: b.q }}
                className="rounded-full border border-white/25 bg-white/10 px-3.5 py-1 text-sm text-white backdrop-blur transition hover:bg-white/20"
              >
                {b.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page mx-auto max-w-5xl py-14 sm:py-20">
        <div className="mb-6 flex items-end justify-between gap-4 sm:mb-8">
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

      <section className="bg-tint py-14 sm:py-20">
        <div className="container-page">
          <h2 className="text-3xl text-tint-foreground sm:text-4xl">So funktioniert’s</h2>
          <Schritte />
        </div>
      </section>

      <section className="container-page py-14 sm:py-20">
        <div className="flaeche-tuerkis flex flex-col items-start justify-between gap-6 rounded-3xl p-8 sm:flex-row sm:items-center sm:p-12">
          <div>
            <h2 className="text-2xl text-white sm:text-3xl">Bereit für Ihr nächstes Team-Mitglied?</h2>
            <p className="mt-2 text-tuerkis-100">Kostenlos registrieren – Zahlung nur bei Erfolg.</p>
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
