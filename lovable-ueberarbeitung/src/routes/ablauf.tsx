import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/site/PageHeader";
import { Schritte } from "@/components/site/Schritte";

export const Route = createFileRoute("/ablauf")({
  head: () => ({
    meta: [
      { title: "Ablauf – Standard Plus" },
      { name: "description", content: "Vom Profil zum Vertrag in vier Schritten." },
      { property: "og:title", content: "So funktioniert Standard Plus" },
      { property: "og:description", content: "Vom Profil zum Vertrag in vier Schritten." },
    ],
  }),
  component: () => (
    <>
      <PageHeader eyebrow="Ablauf" title="In vier Schritten zum Vertrag">
        Kontaktdaten erst bei Vertragsabschluss.
      </PageHeader>
      <section className="container-page py-12">
        <Schritte />
        <Button asChild size="lg" className="mt-10">
          <Link to="/auth" search={{ modus: "registrieren" }}>Kostenlos registrieren</Link>
        </Button>
      </section>
    </>
  ),
});
