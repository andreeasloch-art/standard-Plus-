const SCHRITTE = [
  { n: "01", t: "Profil anlegen", d: "In wenigen Minuten." },
  { n: "02", t: "Vorschläge erhalten", d: "Passende Profile, pseudonymisiert." },
  { n: "03", t: "Beidseitig freigeben", d: "Erst dann werden Kontaktdaten sichtbar." },
  { n: "04", t: "Kennenlernen & Vertrag", d: "Persönlich und unkompliziert." },
];

export function Schritte() {
  return (
    <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {SCHRITTE.map((s) => (
        <li key={s.n} className="card-base p-5">
          <span className="font-display text-2xl font-extrabold text-info">{s.n}</span>
          <h3 className="mt-2 text-lg">{s.t}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
        </li>
      ))}
    </ol>
  );
}
