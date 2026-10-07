import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bus, Clock, Mail, Phone, Star, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { preis, type Busfahrt } from "@/lib/bus";

/** Sterne als Symbole, mit Text für Screenreader. */
export function Sterne({ wert, klein = false }: { wert: number; klein?: boolean }) {
  const g = klein ? "h-3.5 w-3.5" : "h-4 w-4";
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${wert.toLocaleString("de-DE")} von 5 Sternen`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} aria-hidden className={`${g} ${n <= Math.round(wert) ? "fill-primary text-primary-hover" : "text-muted-foreground/40"}`} />
      ))}
    </span>
  );
}

/** Route als Linie mit allen Halten: Start und Ziel betont, Zwischenhalte klein. */
export function Route({ f }: { f: Pick<Busfahrt, "von_ort" | "nach_ort" | "haltestellen"> }) {
  const halte = [f.von_ort, ...f.haltestellen, f.nach_ort];
  return (
    <ol className="relative flex gap-0 overflow-x-auto pb-1" aria-label={`Route: ${halte.join(", ")}`}>
      {halte.map((h, i) => {
        const ende = i === 0 || i === halte.length - 1;
        return (
          <li key={`${h}-${i}`} className="relative flex min-w-[5.5rem] flex-1 flex-col items-center text-center">
            {i > 0 && <span aria-hidden className="absolute right-1/2 top-[0.5625rem] h-1 w-full bg-tuerkis-600" />}
            <span aria-hidden className={`relative z-10 rounded-full border-[3px] bg-background ${ende ? "h-5 w-5 border-tuerkis-700" : "mt-0.5 h-4 w-4 border-tuerkis-500"} ${i === halte.length - 1 ? "!border-primary !bg-primary" : ""}`} />
            <span className={`schrift-tafel mt-1 px-1 leading-tight ${ende ? "text-sm font-bold" : "text-xs text-muted-foreground"}`}>{h}</span>
          </li>
        );
      })}
    </ol>
  );
}

function Bewertungen({ firmaId }: { firmaId: string }) {
  const q = useQuery({
    queryKey: ["bus-bewertungen", firmaId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("bus_bewertungen_oeffentlich", { _firma: firmaId });
      if (error) throw error;
      return (data ?? []) as { sterne: number; text: string | null; von: string; created_at: string }[];
    },
  });
  if (q.isLoading) return <p className="text-sm text-muted-foreground">Wird geladen …</p>;
  if (!q.data?.length) return <p className="text-sm text-muted-foreground">Noch keine Bewertungen.</p>;
  return (
    <ul className="space-y-2">
      {q.data.map((b, i) => (
        <li key={i} className="rounded-lg bg-muted/60 p-3 text-sm">
          <p className="flex items-center gap-2"><Sterne wert={b.sterne} klein /> <span className="font-semibold">{b.von}</span>
            <span className="text-muted-foreground">{new Date(b.created_at).toLocaleDateString("de-DE")}</span></p>
          {b.text && <p className="mt-1">{b.text}</p>}
        </li>
      ))}
    </ul>
  );
}

/**
 * Eine Busfahrt: Foto, Firma mit Bewertung und Zahl der Fahrten, Route mit allen Halten,
 * Abfahrt, Dauer, Preis, Kontakt. `aktion` = z. B. Knopf „Fahrt anfragen“.
 */
export function FahrtKarte({ f, aktion, beispiel = false }: { f: Busfahrt; aktion?: ReactNode; beispiel?: boolean }) {
  const [bild, setBild] = useState(0);
  const [zeigeBewertungen, setZeigeBewertungen] = useState(false);
  const urls = f.bild_urls ?? [];
  return (
    <article className="card-base overflow-hidden" aria-label={`Busfahrt ${f.von_ort} nach ${f.nach_ort} mit ${f.firma ?? "Busunternehmen"}`}>
      <div className="grid md:grid-cols-[16rem_minmax(0,1fr)]">
        <div className="relative aspect-[16/10] bg-tuerkis-50 md:aspect-auto md:min-h-full">
          {urls.length ? (
            <img src={urls[bild]} alt={`Bus von ${f.firma ?? "Busunternehmen"}`} loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <div className="foto-platzhalter flex h-full w-full flex-col items-center justify-center gap-1 text-tuerkis-700" role="img" aria-label="Noch kein Bild">
              <Bus className="h-12 w-12" aria-hidden /><span className="text-xs">noch kein Bild</span>
            </div>
          )}
          {urls.length > 1 && (
            <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
              {urls.map((_, i) => (
                <button key={i} type="button" onClick={() => setBild(i)} aria-label={`Bild ${i + 1} von ${urls.length}`} aria-pressed={i === bild}
                  className={`h-2.5 w-2.5 rounded-full ring-1 ring-black/20 ${i === bild ? "bg-white" : "bg-white/50"}`} />
              ))}
            </div>
          )}
          {beispiel && <span className="absolute left-2 top-2 rounded-md bg-white/80 px-2 py-0.5 text-xs font-semibold text-tuerkis-800 backdrop-blur">Beispiel</span>}
        </div>

        <div className="space-y-4 p-5">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
            <div className="min-w-0">
              <h3 className="text-xl">{f.firma ?? "Busunternehmen"}</h3>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                {f.bewertungen > 0 && f.bewertung != null ? (
                  <button type="button" className="inline-flex items-center gap-1.5 hover:underline" onClick={() => setZeigeBewertungen((v) => !v)} aria-expanded={zeigeBewertungen}>
                    <Sterne wert={f.bewertung} /> <span className="font-semibold text-foreground">{f.bewertung.toLocaleString("de-DE")}</span> ({f.bewertungen})
                  </button>
                ) : <span>Noch keine Bewertung</span>}
                <span>{f.fahrten_durchgefuehrt} {f.fahrten_durchgefuehrt === 1 ? "Fahrt" : "Fahrten"} über Standard Plus</span>
                {f.fahrten_bisher ? <span>insgesamt ca. {f.fahrten_bisher.toLocaleString("de-DE")} (Angabe des Unternehmens)</span> : null}
              </p>
            </div>
            <div className="text-right">
              <p className="schrift-tafel text-3xl font-bold leading-none">{preis(f.preis_eur)}</p>
              <p className="text-xs text-muted-foreground">pro Person</p>
            </div>
          </div>

          <Route f={f} />

          <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4 text-tuerkis-600" aria-hidden />{f.abfahrt_info}{f.dauer_stunden ? ` · ca. ${f.dauer_stunden.toLocaleString("de-DE")} Std.` : ""}</span>
            {f.plaetze ? <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4 text-tuerkis-600" aria-hidden />{f.plaetze} Plätze</span> : null}
          </p>
          {f.beschreibung && <p className="text-sm text-muted-foreground">{f.beschreibung}</p>}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
            <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {f.telefon && <a className="inline-flex items-center gap-1.5 font-semibold text-info hover:underline" href={`tel:${f.telefon}`}><Phone className="h-4 w-4" aria-hidden />{f.telefon}</a>}
              {f.email && <a className="inline-flex items-center gap-1.5 font-semibold text-info hover:underline" href={`mailto:${f.email}`}><Mail className="h-4 w-4" aria-hidden />{f.email}</a>}
              {f.sitz && <span className="text-muted-foreground">Sitz: {f.sitz}</span>}
            </p>
            {aktion}
          </div>
          {zeigeBewertungen && <Bewertungen firmaId={f.firma_id} />}
        </div>
      </div>
    </article>
  );
}
