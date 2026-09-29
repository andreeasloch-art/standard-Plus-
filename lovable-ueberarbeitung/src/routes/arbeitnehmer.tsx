import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/site/PageHeader";
import { Vorteile } from "@/components/site/Vorteile";

export const Route = createFileRoute("/arbeitnehmer")({
  head: () => ({
    meta: [
      { title: "Für Arbeitnehmer – Standard Plus" },
      { name: "description", content: "Kostenlos registrieren und selbst entscheiden, wer Ihre Kontaktdaten sieht." },
      { property: "og:title", content: "Für Arbeitnehmer – Standard Plus" },
      { property: "og:description", content: "Ihr nächster Job in Europa – kostenlos und sicher." },
    ],
  }),
  component: () => (
    <>
      <PageHeader eyebrow="Für Arbeitnehmer" title="Ihr nächster Job in Europa">
        Kostenlos. Ihre Kontaktdaten sieht nur, wen Sie freigeben.
      </PageHeader>
      <section className="container-page mx-auto max-w-5xl py-12">
        <Vorteile
          liste={[
            { text: "Immer kostenlos" },
            { text: "Anfragen freigeben oder ablehnen" },
            { text: "Interview in Ihrer Muttersprache", bald: true },
            { text: "Hilfe bei Anerkennung und Anreise", bald: true },
          ]}
        />
        <Button asChild size="lg" className="mt-8">
          <Link to="/auth" search={{ modus: "registrieren" }}>Profil kostenlos anlegen</Link>
        </Button>
      </section>
    </>
  ),
});
