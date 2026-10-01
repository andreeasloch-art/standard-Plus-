import { CalendarCheck, Languages, Search, Hand } from "lucide-react";

const SCHRITTE = [
  { icon: Search, t: "Suchen", d: "Beruf eingeben – passende Profile werden vorgeschlagen." },
  { icon: Hand, t: "Wischen", d: "Nach rechts = Favorit, nach links = weiter." },
  { icon: CalendarCheck, t: "Einladen & Match", d: "Sagt die Fachkraft zu, ist es ein Match – erst dann gibt es Kontaktdaten." },
  { icon: Languages, t: "Mit Dolmetscher sprechen", d: "Jeder spricht seine Sprache, die Übersetzung läuft live mit." },
];

/** Vier Schritte als Kette – die Linie zeigt die Reihenfolge. */
export function Schritte() {
  return (
    <ol className="relative mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
      <span className="absolute left-7 right-7 top-7 hidden h-px bg-tuerkis-200 lg:block dark:bg-tuerkis-800" aria-hidden />
      {SCHRITTE.map(({ icon: I, t, d }, i) => (
        <li key={t} className="relative flex gap-4 lg:flex-col lg:gap-3">
          <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-tuerkis-200 bg-card text-tuerkis-600 shadow-soft dark:border-tuerkis-800 dark:text-tuerkis-300">
            <I className="h-6 w-6" aria-hidden />
            <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
              {i + 1}
            </span>
          </span>
          <div>
            <h3 className="text-lg">{t}</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">{d}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
