import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { istBeispiel, type OeffentlichesProfil } from "@/lib/profile-data";

/** Text wie auf einer Klapptafel: wechselt der Text, klappt jedes Zeichen kurz nacheinander um. */
export function KlappText({ text, className }: { text: string; className?: string }) {
  return (
    <span className={className} aria-label={text}>
      <span key={text} aria-hidden>
        {[...text].map((z, i) => (
          <span key={i} className="klapp" style={{ animationDelay: `${i * 22}ms` }}>
            {z === " " ? " " : z}
          </span>
        ))}
      </span>
    </span>
  );
}

/** „Abfahrt“ in den Sprachen unserer Fachkräfte – die Kopfzeile der Tafel wechselt durch. */
const ABFAHRT = [
  { t: "Abfahrt", lang: "de" },
  { t: "Plecare", lang: "ro" },
  { t: "Odjazd", lang: "pl" },
  { t: "Заминаване", lang: "bg" },
  { t: "Departure", lang: "en" },
];

function useTakt(ms: number) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      if (!document.hidden) setN((x) => x + 1);
    }, ms);
    return () => window.clearInterval(id);
  }, [ms]);
  return n;
}

function Uhr() {
  const [zeit, setZeit] = useState<string | null>(null);
  useEffect(() => {
    const stellen = () => setZeit(new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }));
    stellen();
    const id = window.setInterval(stellen, 15_000);
    return () => window.clearInterval(id);
  }, []);
  return <span className="schrift-tafel text-lg font-semibold tabular-nums text-tafel-text/90" aria-hidden>{zeit ?? "--:--"}</span>;
}

function Zeile({ p }: { p: OeffentlichesProfil }) {
  const name = p.anzeigename || "Fachkraft";
  return (
    <li>
      <Link
        to="/profil/$id"
        params={{ id: p.id }}
        aria-label={`${name}, ${p.beruf ?? "Fachkraft"}, von ${p.wohnort ?? p.land ?? "–"} nach ${p.zielort ?? "flexibel"}, Deutsch ${p.deutschniveau ?? "–"}${istBeispiel(p.id) ? " (Beispielprofil)" : ""}`}
        className="group grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-tafel-zeile focus-visible:bg-tafel-zeile sm:grid-cols-[2.75rem_minmax(0,1.1fr)_minmax(0,1.4fr)_auto] sm:gap-4 sm:px-3"
      >
        <span className="h-10 w-10 overflow-hidden rounded-md bg-tuerkis-800 sm:h-11 sm:w-11">
          {p.foto_url ? (
            <img src={p.foto_url} alt="" className="h-full w-full object-cover object-[50%_28%]" />
          ) : (
            <span className="schrift-tafel flex h-full w-full items-center justify-center text-xl font-bold text-tuerkis-200" aria-hidden>{name.charAt(0)}</span>
          )}
        </span>
        <span className="min-w-0" aria-hidden>
          <KlappText text={name} className="schrift-tafel block truncate text-lg font-bold leading-tight text-tafel-text sm:text-xl" />
          <KlappText text={p.beruf ?? "Fachkraft"} className="block truncate text-sm leading-tight text-tafel-leise" />
          {/* Auf dem Handy: Verbindung als zweite Zeile */}
          <span className="schrift-tafel mt-0.5 flex min-w-0 items-center gap-1.5 text-base font-semibold sm:hidden">
            <KlappText text={p.wohnort ?? p.land ?? "–"} className="truncate text-tafel-text/90" />
            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-primary" />
            <KlappText text={p.zielort ?? "flexibel"} className="truncate text-primary" />
          </span>
        </span>
        <span className="hidden min-w-0 items-center gap-2 sm:flex" aria-hidden>
          <KlappText text={p.wohnort ?? p.land ?? "–"} className="schrift-tafel truncate text-lg font-semibold text-tafel-text/90" />
          <ArrowRight className="h-4 w-4 shrink-0 text-primary" />
          <KlappText text={p.zielort ?? "flexibel"} className="schrift-tafel truncate text-lg font-semibold text-primary" />
        </span>
        <span className="gleis bg-primary text-ink" aria-hidden>{p.deutschniveau ?? "–"}</span>
      </Link>
    </li>
  );
}

/**
 * Zugzielanzeiger als Bühne der Startseite: Kopfzeile „Abfahrt“ (mehrsprachig) und Uhr,
 * darunter der Inhalt (Überschrift, Umschalter, Aktion) und die nächsten Verbindungen.
 */
export function Abfahrtstafel({
  profile,
  children,
  className,
}: {
  profile: OeffentlichesProfil[];
  children: ReactNode;
  className?: string;
}) {
  const takt = useTakt(4500);
  const wort = ABFAHRT[takt % ABFAHRT.length];
  const anzahl = Math.min(4, profile.length);
  const start = profile.length > anzahl ? takt % profile.length : 0;
  const zeilen = Array.from({ length: anzahl }, (_, i) => profile[(start + i) % profile.length]);
  const beispiele = zeilen.some((p) => istBeispiel(p.id));

  return (
    <div className={cn("relative isolate rounded-2xl bg-tafel text-tafel-text shadow-lift", className)}>
      {/* feine Lamellen wie bei einer Klapptafel; eigene Ebene, damit Vorschlagslisten nicht abgeschnitten werden */}
      <span aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-2xl">
        <span className="absolute inset-0 bg-[repeating-linear-gradient(180deg,transparent_0,transparent_3px,rgb(255_255_255/0.025)_3px,rgb(255_255_255/0.025)_4px)]" />
        <span className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-tuerkis-500/25 blur-3xl" />
      </span>

      <div className="flex items-center justify-between border-b border-white/10 px-5 py-3 sm:px-8">
        <span className="flex items-center gap-3">
          <span className="schrift-tafel rounded-md bg-primary px-2.5 py-0.5 text-lg font-bold uppercase leading-snug tracking-wide text-ink" lang={wort.lang}>
            <KlappText text={wort.t} />
          </span>
          <span className="hidden text-sm text-tafel-leise sm:inline">Arbeitswege durch Europa</span>
        </span>
        <Uhr />
      </div>

      <div className="px-5 pb-6 pt-7 sm:px-8 sm:pb-8 sm:pt-10">{children}</div>

      {zeilen.length > 0 && (
        <div className="border-t border-white/10 px-3 pb-3 pt-3 sm:px-5 sm:pb-5">
          <div className="mb-1 hidden grid-cols-[2.75rem_minmax(0,1.1fr)_minmax(0,1.4fr)_auto] gap-4 px-3 text-xs font-semibold uppercase tracking-wider text-tafel-leise sm:grid" aria-hidden>
            <span />
            <span>Fachkraft</span>
            <span>Von → Nach</span>
            <span>Deutsch</span>
          </div>
          <ul aria-label="Aktuelle Profile" className="divide-y divide-white/5">
            {zeilen.map((p, i) => <Zeile key={i} p={p} />)}
          </ul>
          {beispiele && <p className="mt-2 px-3 text-xs text-tafel-leise">Beispielprofile (fiktiv)</p>}
        </div>
      )}
    </div>
  );
}
