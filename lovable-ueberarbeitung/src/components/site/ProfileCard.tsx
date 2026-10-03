import { Link } from "@tanstack/react-router";
import { ArrowRight, MapPin } from "lucide-react";
import { istBeispiel, matchProzent, type OeffentlichesProfil } from "@/lib/profile-data";
import { ProfilFoto } from "@/components/site/ProfilFoto";

/**
 * Profilkarte: auf dem Handy Foto oben, ab Tablet Foto links.
 * Immer zwei Karten nebeneinander (siehe ProfilListe).
 */
export function ProfileCard({ p }: { p: OeffentlichesProfil }) {
  const match = matchProzent(p.id);
  const beispiel = istBeispiel(p.id);
  const name = p.anzeigename || "Fachkraft";
  return (
    <Link
      to="/profil/$id"
      params={{ id: p.id }}
      aria-label={`Profil von ${name} ansehen${beispiel ? " (Beispielprofil, fiktiv)" : ""}`}
      className="card-base group grid h-full overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:border-tuerkis-300 hover:shadow-lift md:grid-cols-[11rem_minmax(0,1fr)]"
    >
      <div className="relative">
        <ProfilFoto url={p.foto_url} name={name} className="md:aspect-auto md:h-full md:min-h-[13.75rem]" />
        {/* Echte Übereinstimmung gibt es erst mit einem Matching gegen eine Stelle – bis dahin nur bei Beispielen zeigen. */}
        {beispiel && (
          <span className="absolute left-2 top-2 rounded-full bg-white/70 ring-1 ring-white/70 backdrop-blur-md px-2 py-0.5 text-[11px] font-bold text-tuerkis-800 shadow-soft">
            {match} % · Beispiel
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-2 p-3 sm:gap-3 sm:p-5">
        <div className="min-w-0">
          <h3 className="truncate text-lg sm:text-xl">{name}{p.alter ? <span className="font-normal text-muted-foreground">, {p.alter}</span> : null}</h3>
          <p className="truncate text-sm text-tuerkis-700 dark:text-tuerkis-300">{p.beruf ?? "–"}</p>
        </div>

        {/* Verbindung wie auf der Fahrkarte: Von ── Nach */}
        <p className="schrift-tafel flex min-w-0 flex-wrap items-center gap-x-1.5 text-sm font-semibold leading-snug sm:flex-nowrap sm:text-base">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
          <span className="min-w-0 sm:truncate">{p.wohnort ?? p.land}</span>
          <span className="flex shrink-0 items-center" aria-label="nach">
            <span className="h-0.5 w-3 bg-tuerkis-500 sm:w-5" aria-hidden />
            <ArrowRight className="-ml-1 h-3.5 w-3.5 text-tuerkis-600" aria-hidden />
          </span>
          <span className="min-w-0 text-tuerkis-700 sm:truncate dark:text-tuerkis-300">{p.zielort ?? "flexibel"}</span>
        </p>

        <div className="hidden flex-wrap gap-1.5 sm:flex">
          {p.skills.slice(0, 3).map((s) => (
            <span key={s} className="rounded-md bg-tint px-2 py-0.5 text-xs font-medium text-tint-foreground">
              {s}
            </span>
          ))}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-[var(--glas-linie)] pt-2 text-xs sm:pt-3 sm:text-sm">
          {p.deutschniveau ? (
            <span className="flex items-center gap-2">
              <span className="text-muted-foreground">Deutsch</span>
              <span className="gleis h-6 min-w-6 text-sm">{p.deutschniveau}</span>
            </span>
          ) : (
            <span />
          )}
          {p.erfahrung_jahre != null && <span className="text-muted-foreground">{p.erfahrung_jahre} J.</span>}
        </div>
      </div>
    </Link>
  );
}

export function ProfileCardSkeleton() {
  return <div className="card-base aspect-[4/7] animate-pulse bg-surface md:aspect-auto md:h-56" aria-hidden />;
}
