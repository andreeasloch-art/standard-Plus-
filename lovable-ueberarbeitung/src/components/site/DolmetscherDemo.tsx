import { useEffect, useState } from "react";
import { Languages, Pause, Phone, Play } from "lucide-react";

type Zeile = { wer: "sie" | "fachkraft"; original: string; uebersetzt: string };

const GESPRAECH: Zeile[] = [
  { wer: "sie", original: "Guten Tag, Frau K. Ab wann könnten Sie bei uns anfangen?", uebersetzt: "Bună ziua, doamnă K. De când ați putea începe la noi?" },
  { wer: "fachkraft", original: "Din noiembrie. Am lucrat 12 ani la terapie intensivă.", uebersetzt: "Ab November. Ich habe 12 Jahre auf der Intensivstation gearbeitet." },
  { wer: "sie", original: "Das passt sehr gut. Brauchen Sie Hilfe bei der Wohnungssuche?", uebersetzt: "Se potrivește foarte bine. Aveți nevoie de ajutor la căutarea unei locuințe?" },
  { wer: "fachkraft", original: "Da, v-aș fi foarte recunoscătoare.", uebersetzt: "Ja, dafür wäre ich sehr dankbar." },
];

/** Beispielgespräch: zeigt, wie der Live-Dolmetscher im Telefon- oder Videointerview wirkt. */
export function DolmetscherDemo() {
  const [schritt, setSchritt] = useState(GESPRAECH.length);
  const [laeuft, setLaeuft] = useState(false);

  useEffect(() => {
    const ruhig = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (!ruhig) { setSchritt(1); setLaeuft(true); }
  }, []);

  useEffect(() => {
    if (!laeuft) return;
    const t = window.setTimeout(() => setSchritt((s) => (s >= GESPRAECH.length ? 1 : s + 1)), schritt >= GESPRAECH.length ? 4000 : 2600);
    return () => window.clearTimeout(t);
  }, [laeuft, schritt]);

  return (
    <figure className="card-base overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b bg-tint px-4 py-3 text-tint-foreground">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-tuerkis-600 text-white"><Phone className="h-4 w-4" aria-hidden /></span>
          Telefon-Interview · Live-Dolmetscher
        </div>
        <button
          type="button"
          onClick={() => { if (!laeuft && schritt >= GESPRAECH.length) setSchritt(1); setLaeuft((l) => !l); }}
          aria-label={laeuft ? "Beispiel anhalten" : "Beispiel abspielen"}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-tuerkis-300 bg-card hover:bg-accent"
        >
          {laeuft ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
      </div>

      <div className="grid grid-cols-2 border-b text-xs">
        <p className="p-3"><strong className="block text-sm">Sie</strong>sprechen Deutsch</p>
        <p className="border-l p-3"><strong className="block text-sm">Maria K.</strong>spricht Rumänisch</p>
      </div>

      <ol className="min-h-[19rem] space-y-3 p-4" aria-live="polite">
        {GESPRAECH.slice(0, schritt).map((z, i) => {
          const sie = z.wer === "sie";
          return (
            <li key={i} className={`flex ${sie ? "justify-start" : "justify-end"}`}>
              <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${sie ? "rounded-bl-md bg-surface" : "rounded-br-md bg-tuerkis-600 text-white"}`}>
                <p>{z.original}</p>
                <p className={`mt-1.5 flex gap-1.5 border-t pt-1.5 text-xs ${sie ? "border-border text-muted-foreground" : "border-white/25 text-white/85"}`}>
                  <Languages className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span><span className="sr-only">Übersetzung: </span>{z.uebersetzt}</span>
                </p>
              </div>
            </li>
          );
        })}
      </ol>
      <figcaption className="border-t px-4 py-2.5 text-xs text-muted-foreground">
        Beispielgespräch. Die Funktion ist in Vorbereitung.
      </figcaption>
    </figure>
  );
}
