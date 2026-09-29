import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CalendarCheck, Hand, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, PageHeader } from "@/components/site/PageHeader";
import { ProfilFoto } from "@/components/site/ProfilFoto";
import { EinladenDialog } from "@/components/site/EinladenDialog";
import { oeffentlicheProfileQuery, type OeffentlichesProfil } from "@/lib/profile-data";
import { useEinladungen, useFavoriten } from "@/lib/favoriten";

export const Route = createFileRoute("/favoriten")({
  head: () => ({
    meta: [
      { title: "Favoriten – Standard Plus" },
      { name: "description", content: "Gemerkte Fachkräfte zum Interview einladen." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Favoriten,
});

function Favoriten() {
  const { data, isLoading, isError } = useQuery(oeffentlicheProfileQuery);
  const fav = useFavoriten();
  const einl = useEinladungen();
  const [einladen, setEinladen] = useState<OeffentlichesProfil | null>(null);
  const liste = (data ?? []).filter((p) => fav.ist(p.id));

  return (
    <>
      <PageHeader eyebrow="Favoriten" title="Ihre Auswahl">
        {fav.gespeichert ? "Gespeichert in Ihrem Konto." : "Nur für diese Sitzung gemerkt – melden Sie sich an, um die Auswahl zu behalten."}
      </PageHeader>
      <section className="container-page mx-auto max-w-5xl py-10">
        {isError && <ErrorState />}
        {!isLoading && liste.length === 0 && (
          <EmptyState title="Noch keine Favoriten">
            Wischen Sie Profile nach rechts, um sie hier zu sammeln.
            <div className="mt-4"><Button asChild><Link to="/talente"><Hand />Profile ansehen</Link></Button></div>
          </EmptyState>
        )}
        <ul className="grid grid-cols-2 gap-3 sm:gap-5">
          {liste.map((p) => {
            const name = p.anzeigename || "Fachkraft";
            const eingeladen = einl.eingeladen(p.id);
            return (
              <li key={p.id} className="card-base flex flex-col overflow-hidden md:grid md:grid-cols-[10rem_minmax(0,1fr)]">
                <Link to="/profil/$id" params={{ id: p.id }} aria-label={`Profil von ${name} ansehen`}>
                  <ProfilFoto url={p.foto_url} name={name} className="md:aspect-auto md:h-full" />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col gap-2 p-3 sm:p-5">
                  <h2 className="flex items-center gap-1.5 truncate text-base sm:text-lg">
                    <Star className="h-4 w-4 shrink-0 text-primary" fill="currentColor" aria-hidden />{name}
                  </h2>
                  <p className="truncate text-sm text-tuerkis-700 dark:text-tuerkis-300">{p.beruf}</p>
                  <div className="mt-auto grid gap-2 pt-2">
                    {eingeladen ? (
                      <p className="rounded-lg bg-tint px-3 py-2 text-center text-xs font-semibold text-tint-foreground">Eingeladen – wartet auf Zusage</p>
                    ) : (
                      <Button size="sm" onClick={() => setEinladen(p)}><CalendarCheck />Einladen</Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => fav.setzen(p.id, false)} aria-label={`${name} aus den Favoriten entfernen`}>
                      <Trash2 />Entfernen
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
      <EinladenDialog profil={einladen} onClose={() => setEinladen(null)} />
    </>
  );
}
