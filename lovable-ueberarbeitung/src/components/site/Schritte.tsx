export type Rolle = "arbeit" | "personal";

const HALTE: Record<Rolle, { t: string; d: string }[]> = {
  arbeit: [
    { t: "Profil anlegen", d: "Kostenlos, in wenigen Minuten – mit Foto." },
    { t: "Gefunden werden", d: "Unternehmen sehen Beruf, Erfahrung und Deutschniveau." },
    { t: "Einladung & Match", d: "Sie sagen zu – das Interview läuft über Standard Plus." },
    { t: "Interview & Vertrag", d: "Mit Dolmetscher. Kontaktdaten erst bei Vertragsabschluss." },
  ],
  personal: [
    { t: "Suchen", d: "Beruf eingeben – passende Profile werden vorgeschlagen." },
    { t: "Wischen", d: "Haken = gefällt mir, mehr Infos sehen. Kreuz = weiter." },
    { t: "Einladen & Match", d: "Sagt die Fachkraft zu, ist es ein Match." },
    { t: "Interview & Vertrag", d: "Live übersetzt. Kontaktdaten erst bei Vertragsabschluss." },
  ],
};

/** Ablauf als Linienplan: vier Halte auf einer Linie, das Ziel in Gold. */
export function Schritte({ rolle = "arbeit" }: { rolle?: Rolle }) {
  const halte = HALTE[rolle];
  return (
    <ol className="relative mt-8 grid gap-7 lg:grid-cols-4 lg:gap-6">
      {/* Linie: senkrecht auf dem Handy, waagerecht ab Desktop */}
      <span aria-hidden className="absolute bottom-3 left-[0.8125rem] top-3 w-1 rounded-full bg-tuerkis-600 lg:bottom-auto lg:left-3 lg:right-3 lg:top-[0.8125rem] lg:h-1 lg:w-auto" />
      {halte.map((h, i) => {
        const ziel = i === halte.length - 1;
        return (
          <li key={h.t} className="relative grid grid-cols-[1.875rem_1fr] gap-4 lg:grid-cols-1 lg:gap-4">
            <span
              aria-hidden
              className={`schrift-tafel relative z-10 flex h-[1.875rem] w-[1.875rem] items-center justify-center rounded-full border-[3px] text-base font-bold ${ziel ? "border-primary bg-primary text-ink" : "border-tuerkis-600 bg-background text-tuerkis-700 dark:text-tuerkis-300"}`}
            >
              {i + 1}
            </span>
            <div>
              <h3 className="text-xl"><span className="sr-only">Schritt {i + 1}: </span>{h.t}</h3>
              <p className="mt-1 text-[0.95rem] text-muted-foreground">{h.d}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
