import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, MapPin, Star, X } from "lucide-react";
import { ProfilFoto } from "@/components/site/ProfilFoto";
import { KlappText } from "@/components/site/KlappText";
import { useFavoriten } from "@/lib/favoriten";
import { istBeispiel, type OeffentlichesProfil } from "@/lib/profile-data";
import { cn } from "@/lib/utils";

type Richtung = "rechts" | "links";

export function passtZurSuche(p: OeffentlichesProfil, suche: string) {
  const s = suche.trim().toLowerCase();
  if (!s) return true;
  return [p.anzeigename, p.beruf, p.branche, p.land, p.wohnort, p.zielort, ...p.skills].some((x) => x?.toLowerCase().includes(s));
}

function Karte({ p }: { p: OeffentlichesProfil }) {
  const name = p.anzeigename || "Fachkraft";
  return (
    <>
      <div className="relative">
        <ProfilFoto url={p.foto_url} name={name} gross className="aspect-[3/2] sm:aspect-[4/3.4]" />
        {istBeispiel(p.id) && (
          <span className="absolute left-3 top-3 rounded-md bg-white/75 px-2 py-0.5 text-xs font-semibold text-tuerkis-800 ring-1 ring-white/70 backdrop-blur-md">Beispiel</span>
        )}
      </div>
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-display text-2xl font-bold leading-tight">{name}</p>
            <p className="truncate text-tuerkis-700 dark:text-tuerkis-300">{p.beruf ?? "Fachkraft"}</p>
          </div>
          <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
            Deutsch <span className="gleis h-6 min-w-6 text-sm">{p.deutschniveau ?? "–"}</span>
          </span>
        </div>
        <p className="schrift-tafel mt-2 flex min-w-0 items-center gap-1.5 text-base font-semibold">
          <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="truncate">{p.wohnort ?? p.land ?? "–"}</span>
          <span className="flex shrink-0 items-center" aria-label="nach">
            <span className="h-0.5 w-5 bg-tuerkis-500" aria-hidden />
            <ArrowRight className="-ml-1 h-4 w-4 text-tuerkis-600" aria-hidden />
          </span>
          <span className="truncate text-tuerkis-700 dark:text-tuerkis-300">{p.zielort ?? "flexibel"}</span>
        </p>
      </div>
    </>
  );
}

/**
 * Kartenstapel auf der Startseite: spielt das Wischen von selbst vor, reagiert live auf die Suche
 * (der Stapel mischt sich neu) und lässt sich selbst wischen – rechts = Favorit, links = weiter.
 */
export function WischBuehne({ profile, suche }: { profile: OeffentlichesProfil[]; suche: string }) {
  const fav = useFavoriten();
  const treffer = useMemo(() => profile.filter((p) => passtZurSuche(p, suche)), [profile, suche]);
  const [idx, setIdx] = useState(0);
  const [flug, setFlug] = useState<Richtung | null>(null);
  const [dx, setDx] = useState(0);
  const [selbst, setSelbst] = useState(false);
  const [ansage, setAnsage] = useState("");
  const [mischung, setMischung] = useState(0);
  const start = useRef<number | null>(null);
  const autoNr = useRef(0);

  // Neue Suche → Stapel neu mischen
  useEffect(() => {
    setIdx(0);
    setFlug(null);
    setMischung((m) => m + 1);
  }, [suche]);

  const n = treffer.length;
  const oben = n ? treffer[idx % n] : undefined;

  const wischen = (r: Richtung, vonHand: boolean) => {
    if (!oben || flug) return;
    if (vonHand) {
      setSelbst(true);
      if (r === "rechts") fav.setzen(oben.id, true);
      setAnsage(r === "rechts" ? `${oben.anzeigename} als Favorit gemerkt` : `${oben.anzeigename} übersprungen`);
    }
    setFlug(r);
    window.setTimeout(() => {
      setIdx((i) => i + 1);
      setFlug(null);
      setDx(0);
    }, 380);
  };

  // Von selbst vorspielen, bis jemand selbst wischt
  useEffect(() => {
    if (selbst || n < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setTimeout(() => {
      if (document.hidden) return;
      wischen(autoNr.current++ % 3 === 2 ? "links" : "rechts", false);
    }, 2600);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, selbst, n, mischung]);

  const anteil = flug ? (flug === "rechts" ? 1 : -1) : Math.max(-1, Math.min(1, dx / 110));
  const transform = flug
    ? `translateX(${flug === "rechts" ? 130 : -130}%) rotate(${flug === "rechts" ? 16 : -16}deg)`
    : `translateX(${dx}px) rotate(${dx / 20}deg)`;

  return (
    <section aria-label="Wisch-Vorschau" className="mx-auto w-full max-w-[22rem]">
      <p className="mb-3 flex items-baseline gap-2 text-sm text-muted-foreground" aria-live="polite">
        <KlappText text={String(n)} className="schrift-tafel text-2xl font-bold text-foreground" />
        {suche.trim() ? <span className="truncate">Treffer für „{suche.trim()}“</span> : <span>Fachkräfte bereit zum Wischen</span>}
      </p>

      <div className="relative">
        {n === 0 && (
          <div className="card-base flex aspect-[4/5] flex-col items-center justify-center gap-2 p-6 text-center">
            <p className="font-display text-xl font-bold">Keine Treffer</p>
            <p className="text-sm text-muted-foreground">Versuchen Sie einen anderen Beruf oder Ort.</p>
          </div>
        )}
        {[2, 1].map((tiefe) =>
          n > tiefe ? (
            <div
              key={`${mischung}-${tiefe}`}
              aria-hidden
              className="card-base karte-rein absolute inset-0 overflow-hidden"
              style={{ transform: `translateY(${tiefe * 10}px) scale(${1 - tiefe * 0.05})`, transformOrigin: "50% 100%", opacity: 1 - tiefe * 0.2, animationDelay: `${(2 - tiefe) * 90}ms` }}
            >
              <Karte p={treffer[(idx + tiefe) % n]} />
            </div>
          ) : null,
        )}
        {oben && (
          <div
            key={`${mischung}-${oben.id}-${idx}`}
            className={cn("card-base relative z-10 cursor-grab touch-pan-y select-none overflow-hidden active:cursor-grabbing", idx === 0 && "karte-rein")}
            style={{
              transform,
              transition: start.current !== null ? "none" : "transform 380ms cubic-bezier(.2,.7,.2,1)",
              animationDelay: "180ms",
            }}
            onPointerDown={(e) => {
              start.current = e.clientX;
              (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => start.current !== null && setDx(e.clientX - start.current)}
            onPointerUp={() => {
              const weit = Math.abs(dx) > 90;
              start.current = null;
              if (weit) wischen(dx > 0 ? "rechts" : "links", true);
              else setDx(0);
            }}
            onPointerCancel={() => { start.current = null; setDx(0); }}
          >
            <Karte p={oben} />
            <span aria-hidden className="absolute left-4 top-14 -rotate-12 rounded-lg border-4 border-tuerkis-500 bg-white/90 px-3 py-1 font-display text-2xl font-extrabold text-tuerkis-600" style={{ opacity: Math.max(0, anteil) }}>FAVORIT</span>
            <span aria-hidden className="absolute right-4 top-14 rotate-12 rounded-lg border-4 border-ink/50 bg-white/90 px-3 py-1 font-display text-2xl font-extrabold text-ink/70" style={{ opacity: Math.max(0, -anteil) }}>WEITER</span>
          </div>
        )}
      </div>

      {oben && (
        <div className="mt-7 flex items-center justify-center gap-3">
          <button type="button" onClick={() => wischen("links", true)} aria-label={`Weiter – ${oben.anzeigename} überspringen`}
            className="glas-knopf flex h-14 w-14 items-center justify-center rounded-full text-ink transition hover:scale-105 hover:bg-[var(--glas-stark)] dark:text-foreground">
            <X className="h-6 w-6" aria-hidden />
          </button>
          <button type="button" onClick={() => wischen("rechts", true)} aria-label={`${oben.anzeigename} als Favorit merken`}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-b from-tuerkis-500 to-tuerkis-700 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.35),0_10px_24px_-10px_var(--color-tuerkis-700)] transition hover:scale-105">
            <Star className="h-6 w-6" fill="currentColor" aria-hidden />
          </button>
          <Link to="/talente" search={{ q: suche.trim() || undefined }} className="ml-1 inline-flex items-center gap-1 text-sm font-semibold text-info hover:underline">
            Alle wischen <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      )}
      <p className="sr-only" aria-live="polite">{ansage}</p>
    </section>
  );
}
