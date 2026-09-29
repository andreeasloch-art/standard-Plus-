import { Link } from "@tanstack/react-router";
import { ArrowRight, MapPin } from "lucide-react";
import { istBeispiel, matchProzent, type OeffentlichesProfil } from "@/lib/profile-data";

export function ProfileCard({ p }: { p: OeffentlichesProfil }) {
  const match = matchProzent(p.id);
  const beispiel = istBeispiel(p.id);
  const name = p.anzeigename || "Fachkraft";
  return (
    <Link
      to="/profil/$id"
      params={{ id: p.id }}
      aria-label={`Profil von ${name} ansehen${beispiel ? " (Beispielprofil, fiktiv)" : ""}`}
      className="card-base group flex h-full flex-col gap-4 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift sm:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary font-display text-lg font-bold text-primary-foreground"
            aria-hidden
          >
            {name.charAt(0)}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-lg">{name}</h3>
            <p className="truncate text-sm text-muted-foreground">{p.beruf ?? "–"}</p>
          </div>
        </div>
        {/* Echte Übereinstimmung gibt es erst mit einem Matching gegen eine Stelle – bis dahin nur bei Beispielen zeigen. */}
        {beispiel && (
          <span className="shrink-0 rounded-full bg-success/12 px-2.5 py-1 text-xs font-semibold text-success">
            {match} % · Beispiel
          </span>
        )}
      </div>

      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <MapPin className="h-4 w-4 shrink-0" aria-hidden />
        {p.wohnort ?? p.land} <ArrowRight className="h-3.5 w-3.5" aria-label="nach" /> {p.zielort ?? "flexibel"}
      </p>

      <div className="flex flex-wrap gap-1.5">
        {p.skills.slice(0, 3).map((s) => (
          <span key={s} className="rounded-full bg-surface px-2.5 py-1 text-xs font-medium">
            {s}
          </span>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between border-t pt-4 text-sm">
        <span>
          Deutsch <strong>{p.deutschniveau ?? "–"}</strong>
        </span>
        {p.erfahrung_jahre != null && <span className="text-muted-foreground">{p.erfahrung_jahre} J. Erfahrung</span>}
      </div>
    </Link>
  );
}

export function ProfileCardSkeleton() {
  return <div className="card-base h-52 animate-pulse bg-surface" aria-hidden />;
}
