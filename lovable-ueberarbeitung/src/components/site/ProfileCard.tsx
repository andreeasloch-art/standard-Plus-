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
      className="card-base group grid h-full overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift hover:ring-2 hover:ring-tuerkis-400 md:grid-cols-[11rem_minmax(0,1fr)]"
    >
      <div className="relative">
        <ProfilFoto url={p.foto_url} name={name} className="md:aspect-auto md:h-full md:min-h-[13.75rem]" />
        {/* Echte Übereinstimmung gibt es erst mit einem Matching gegen eine Stelle – bis dahin nur bei Beispielen zeigen. */}
        {beispiel && (
          <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-bold text-tuerkis-800 shadow-soft">
            {match} % · Beispiel
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-2 p-3 sm:gap-3 sm:p-5">
        <div className="min-w-0">
          <h3 className="truncate text-base sm:text-lg">{name}</h3>
          <p className="truncate text-sm text-tuerkis-700 dark:text-tuerkis-300">{p.beruf ?? "–"}</p>
        </div>

        <p className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground sm:text-sm">
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="truncate">{p.wohnort ?? p.land}</span>
          <ArrowRight className="h-3 w-3 shrink-0" aria-label="nach" />
          <span className="truncate">{p.zielort ?? "flexibel"}</span>
        </p>

        <div className="hidden flex-wrap gap-1.5 sm:flex">
          {p.skills.slice(0, 3).map((s) => (
            <span key={s} className="rounded-full bg-tint px-2.5 py-0.5 text-xs font-medium text-tint-foreground">
              {s}
            </span>
          ))}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 border-t pt-2 text-xs sm:pt-3 sm:text-sm">
          <span>
            Deutsch <strong>{p.deutschniveau ?? "–"}</strong>
          </span>
          {p.erfahrung_jahre != null && <span className="text-muted-foreground">{p.erfahrung_jahre} J.</span>}
        </div>
      </div>
    </Link>
  );
}

export function ProfileCardSkeleton() {
  return <div className="card-base aspect-[4/7] animate-pulse bg-surface md:aspect-auto md:h-56" aria-hidden />;
}
