import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/site/PageHeader";
import { Bald } from "@/components/site/Vorteile";

export const Route = createFileRoute("/preise")({
  head: () => ({
    meta: [
      { title: "Preise – Standard Plus" },
      { name: "description", content: "Einmalzahlung nur bei Erfolg ab 399 € oder Abo mit Rundum-Betreuung für 119 €/Monat. Alle Preise zzgl. USt." },
      { property: "og:title", content: "Preise – Standard Plus" },
      { property: "og:description", content: "Zahlung nur bei Erfolg oder Rundum-Betreuung im Abo." },
    ],
  }),
  component: Preise,
});

const STUFEN = [
  { name: "Basis", preis: "399 €", fuer: "Hilfs- und Facharbeitskräfte" },
  { name: "Professional", preis: "899 €", fuer: "Fachkräfte mit Ausbildung" },
  { name: "Spezialisten", preis: "1.299 €", fuer: "Ingenieurwesen, Medizin, IT" },
  { name: "Executive", preis: "1.999 €", fuer: "Führungskräfte" },
];

type Punkt = { text: string; bald?: boolean };
const EINMAL: Punkt[] = [
  { text: "Suche und Vorauswahl" },
  { text: "Kostenloser Ersatz in den ersten 3 Monaten" },
  { text: "Videointerview mit Live-Übersetzung", bald: true },
  { text: "Digitaler Vertrag", bald: true },
];
const ABO: Punkt[] = [
  { text: "Alles aus der Einmalzahlung" },
  { text: "Unbegrenzte Vermittlungen" },
  { text: "Feste Ansprechperson" },
  { text: "Hilfe bei Unterlagen und Behörden" },
  { text: "Organisierte Anreise", bald: true },
];

function Liste({ punkte }: { punkte: Punkt[] }) {
  return (
    <ul className="mt-6 space-y-2.5 text-sm">
      {punkte.map((p) => (
        <li key={p.text} className="flex items-center gap-2">
          <Check className="h-4 w-4 shrink-0 text-success" aria-hidden />
          <span className="flex-1">{p.text}</span>
          {p.bald && <Bald />}
        </li>
      ))}
    </ul>
  );
}

function Preise() {
  return (
    <>
      <PageHeader eyebrow="Preise" title="Zwei Modelle. Keine versteckten Kosten." />

      <section className="container-page mx-auto max-w-5xl py-12 sm:py-16">
        <div className="grid gap-6 md:grid-cols-2">
          <article className="card-base flex flex-col p-6 sm:p-8">
            <h2 className="text-xl">Einmalzahlung</h2>
            <p className="text-sm text-muted-foreground">Nur bei Erfolg – fällig nach Vertragsunterschrift.</p>
            <p className="mt-6 font-display text-4xl font-extrabold">
              ab 399 € <span className="text-base font-semibold text-muted-foreground">/ Vermittlung</span>
            </p>
            <Liste punkte={EINMAL} />
            <Button asChild size="lg" variant="outline" className="mt-8">
              <Link to="/auth" search={{ modus: "registrieren" }}>Einzelvermittlung anfragen</Link>
            </Button>
          </article>

          <article className="card-base relative flex flex-col p-6 ring-2 ring-primary sm:p-8">
            <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-0.5 text-xs font-bold text-primary-foreground">
              Rundum-Betreuung
            </span>
            <h2 className="text-xl">Abo</h2>
            <p className="text-sm text-muted-foreground">399 € Startgebühr · 6 Monate Mindestlaufzeit</p>
            <p className="mt-6 font-display text-4xl font-extrabold">
              119 € <span className="text-base font-semibold text-muted-foreground">/ Monat</span>
            </p>
            <Liste punkte={ABO} />
            <Button asChild size="lg" className="mt-8">
              <Link to="/auth" search={{ modus: "registrieren" }}>Abo anfragen</Link>
            </Button>
          </article>
        </div>

        <h2 className="mt-16 text-2xl">Preis je Vermittlung</h2>
        <div className="card-base mt-4 overflow-hidden">
          <table className="w-full text-sm">
            <caption className="sr-only">Preise der Einmalzahlung nach Stufe</caption>
            <tbody className="divide-y">
              {STUFEN.map((s) => (
                <tr key={s.name}>
                  <th scope="row" className="p-4 text-left font-semibold">{s.name}</th>
                  <td className="p-4 text-muted-foreground">{s.fuer}</td>
                  <td className="p-4 text-right font-display text-lg font-bold">{s.preis}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <details className="card-base group mt-6 p-4 sm:p-5">
          <summary className="flex cursor-pointer list-none items-center justify-between font-semibold">
            Kostenbeispiele Abo
            <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden />
          </summary>
          <dl className="mt-4 grid gap-2 text-sm">
            <div className="flex justify-between"><dt>Nach 6 Monaten <span className="text-muted-foreground">(399 € + 6 × 119 €)</span></dt><dd className="font-bold">1.113 €</dd></div>
            <div className="flex justify-between"><dt>Nach 12 Monaten <span className="text-muted-foreground">(399 € + 12 × 119 €)</span></dt><dd className="font-bold">1.827 €</dd></div>
          </dl>
        </details>

        <p className="mt-8 text-sm text-muted-foreground">Alle Preise zzgl. gesetzlicher Umsatzsteuer.</p>
      </section>
    </>
  );
}
