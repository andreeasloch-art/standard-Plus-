const SCHRITTE = [
  { t: "Profil anlegen", d: "In wenigen Minuten." },
  { t: "Vorschläge erhalten", d: "Passende Profile, pseudonymisiert." },
  { t: "Beidseitig freigeben", d: "Erst dann werden Kontaktdaten sichtbar." },
  { t: "Kennenlernen & Vertrag", d: "Persönlich und unkompliziert." },
];

/** Vier Schritte als verbundene Kette – die Linie zeigt die Reihenfolge. */
export function Schritte() {
  return (
    <ol className="relative mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
      <span className="absolute left-6 right-6 top-6 hidden h-0.5 bg-tuerkis-300 lg:block dark:bg-tuerkis-700" aria-hidden />
      {SCHRITTE.map((s, i) => (
        <li key={s.t} className="relative flex gap-4 lg:flex-col lg:gap-3">
          <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-tuerkis-600 font-display text-lg font-extrabold text-white ring-4 ring-tint">
            {i + 1}
          </span>
          <div>
            <h3 className="text-lg">{s.t}</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">{s.d}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
