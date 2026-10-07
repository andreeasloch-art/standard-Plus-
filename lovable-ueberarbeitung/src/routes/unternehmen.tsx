import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/site/PageHeader";
import { Vorteile } from "@/components/site/Vorteile";

export const Route = createFileRoute("/unternehmen")({
  head: () => ({
    meta: [
      { title: "Für Unternehmen – Standard Plus" },
      { name: "description", content: "Fachkräfte aus der EU finden und anfragen – Zahlung nur bei Erfolg." },
      { property: "og:title", content: "Für Unternehmen – Standard Plus" },
      { property: "og:description", content: "Fachkräfte aus ganz Europa – Kontaktdaten erst bei Vertragsabschluss." },
    ],
  }),
  component: () => (
    <>
      <PageHeader eyebrow="Für Unternehmen" title="Fachkräfte, die passen">
        Profile ansehen, einladen – beim Match direkt ins Gespräch.
      </PageHeader>
      <section className="container-page mx-auto max-w-5xl py-12">
        <Vorteile
          liste={[
            { text: "Zahlung nur bei Erfolg" },
            { text: "3 Monate kostenloser Ersatz" },
            { text: "Videointerview mit Live-Übersetzung", bald: true },
            { text: "Digitaler Vertrag", bald: true },
          ]}
        />
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg"><Link to="/talente">Talente durchsuchen</Link></Button>
          <Button asChild size="lg" variant="outline"><Link to="/preise">Preise ansehen</Link></Button>
        </div>
      </section>
    </>
  ),
});
