import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, CalendarCheck, MapPin, RotateCcw, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProfilFoto } from "@/components/site/ProfilFoto";
import { istBeispiel, matchProzent, type OeffentlichesProfil } from "@/lib/profile-data";
import { useEinladungen, useFavoriten } from "@/lib/favoriten";

type Aktion = { id: string; favorit: boolean; warVorherFavorit: boolean };
const SCHWELLE = 0.28; // Anteil der Kartenbreite, ab dem die Entscheidung fällt

function ruhig() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Kartenstapel zum Wischen:
 * nach rechts = Favorit, nach links = weiter, Knopf „Einladen“ = Interview-Einladung.
 * Tastatur: ← weiter, → Favorit, Rückgängig per Knopf.
 */
export function WischStapel({ profile, onEinladen }: { profile: OeffentlichesProfil[]; onEinladen: (p: OeffentlichesProfil) => void }) {
  const fav = useFavoriten();
  const einl = useEinladungen();
  const [pos, setPos] = useState(0);
  const [verlauf, setVerlauf] = useState<Aktion[]>([]);
  const [dx, setDx] = useState(0);
  const [raus, setRaus] = useState<0 | 1 | -1>(0);
  const [ansage, setAnsage] = useState("");
  const karteRef = useRef<HTMLDivElement>(null);
  const start = useRef<{ x: number; id: number } | null>(null);

  // Neue Suche → Stapel von vorn
  const schluessel = profile.map((p) => p.id).join(",");
  useEffect(() => { setPos(0); setVerlauf([]); setDx(0); setRaus(0); }, [schluessel]);

  const aktuell = profile[pos];
  const breite = () => karteRef.current?.offsetWidth ?? 320;

  const entscheiden = (favorit: boolean) => {
    if (!aktuell || raus) return;
    const name = aktuell.anzeigename || "Fachkraft";
    setVerlauf((v) => [...v, { id: aktuell.id, favorit, warVorherFavorit: fav.ist(aktuell.id) }]);
    if (favorit) fav.setzen(aktuell.id, true);
    setAnsage(favorit ? `${name} als Favorit gemerkt.` : `${name} übersprungen.`);
    if (ruhig()) { setPos((p) => p + 1); setDx(0); return; }
    setRaus(favorit ? 1 : -1);
    window.setTimeout(() => { setPos((p) => p + 1); setDx(0); setRaus(0); }, 260);
  };

  const rueckgaengig = () => {
    const letzte = verlauf[verlauf.length - 1];
    if (!letzte || raus) return;
    if (letzte.favorit && !letzte.warVorherFavorit) fav.setzen(letzte.id, false);
    setVerlauf((v) => v.slice(0, -1));
    setPos((p) => Math.max(0, p - 1));
    setAnsage("Letzte Entscheidung zurückgenommen.");
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === "ArrowRight") { e.preventDefault(); entscheiden(true); }
    if (e.key === "ArrowLeft") { e.preventDefault(); entscheiden(false); }
  };

  const onDown = (e: React.PointerEvent) => {
    if (raus || (e.target as HTMLElement).closest("button,a")) return;
    start.current = { x: e.clientX, id: e.pointerId };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (start.current?.id === e.pointerId) setDx(e.clientX - start.current.x);
  };
  const onUp = (e: React.PointerEvent) => {
    if (start.current?.id !== e.pointerId) return;
    start.current = null;
    if (Math.abs(dx) > breite() * SCHWELLE) entscheiden(dx > 0);
    else setDx(0);
  };

  if (!profile.length) return null;

  if (!aktuell) {
    const favAnzahl = profile.filter((p) => fav.ist(p.id)).length;
    return (
      <div className="card-base mx-auto max-w-md p-8 text-center">
        <Star className="mx-auto h-10 w-10 text-primary" fill="currentColor" aria-hidden />
        <h2 className="mt-3 text-2xl">Alle {profile.length} Vorschläge gesehen</h2>
        <p className="mt-2 text-muted-foreground">
          {favAnzahl ? `${favAnzahl} ${favAnzahl === 1 ? "Favorit" : "Favoriten"} gemerkt.` : "Noch keine Favoriten gemerkt."}
        </p>
        <div className="mt-6 grid gap-2">
          {favAnzahl > 0 && <Button asChild size="lg"><Link to="/favoriten">Favoriten ansehen & einladen</Link></Button>}
          <Button variant="outline" onClick={() => { setPos(0); setVerlauf([]); }}>Nochmal von vorn</Button>
          <Button variant="ghost" onClick={rueckgaengig} disabled={!verlauf.length}><RotateCcw />Letzte Karte zurückholen</Button>
        </div>
        <p className="sr-only" aria-live="polite">{ansage}</p>
      </div>
    );
  }

  const w = breite();
  const x = raus ? raus * w * 1.5 : dx;
  const anteil = Math.max(-1, Math.min(1, x / (w * SCHWELLE)));
  const name = aktuell.anzeigename || "Fachkraft";
  const beispiel = istBeispiel(aktuell.id);
  const istFav = fav.ist(aktuell.id);
  const eingeladen = einl.eingeladen(aktuell.id);

  return (
    <div className="mx-auto w-full max-w-sm pb-4 sm:pb-0">
      <p className="mb-3 flex items-center justify-between text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1"><ArrowLeft className="h-4 w-4" aria-hidden />weiter</span>
        <span className="tabular-nums">{pos + 1} von {profile.length}</span>
        <span className="inline-flex items-center gap-1">Favorit<ArrowRight className="h-4 w-4" aria-hidden /></span>
      </p>

      <div
        className="relative rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
        tabIndex={0}
        role="group"
        aria-roledescription="Kartenstapel"
        aria-label={`${name}, ${aktuell.beruf ?? ""}. Pfeil rechts: Favorit, Pfeil links: weiter.`}
        onKeyDown={onKey}
      >
        {/* Die nächsten Karten liegen sichtbar dahinter */}
        {[2, 1].map((n) => profile[pos + n] && (
          <div key={profile[pos + n].id} aria-hidden className="card-base karte-fest absolute inset-0 overflow-hidden"
            style={{ transform: `translateY(${n * 10}px) scale(${1 - n * 0.04})`, opacity: 1 - n * 0.25 }}>
            <ProfilFoto url={profile[pos + n].foto_url} name={profile[pos + n].anzeigename} className="max-h-[20vh] sm:max-h-[44vh]" />
          </div>
        ))}

        <div
          ref={karteRef}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={() => { start.current = null; setDx(0); }}
          className="card-base karte-fest relative cursor-grab touch-pan-y select-none overflow-hidden active:cursor-grabbing"
          style={{
            transform: `translateX(${x}px) rotate(${x / 18}deg)`,
            transition: start.current ? "none" : "transform 260ms cubic-bezier(.2,.7,.2,1)",
          }}
        >
          <div className="relative">
            <ProfilFoto url={aktuell.foto_url} name={name} gross className="max-h-[20vh] sm:max-h-[44vh]" />
            {beispiel && (
              <span className="absolute left-3 top-3 rounded-full bg-white/70 ring-1 ring-white/70 backdrop-blur-md px-2.5 py-0.5 text-xs font-bold text-tuerkis-800 shadow-soft">
                {matchProzent(aktuell.id)} % · Beispiel
              </span>
            )}
            {(istFav || eingeladen) && (
              <span className="absolute right-3 top-3 rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-primary-foreground shadow-soft">
                {eingeladen ? "Eingeladen" : "★ Favorit"}
              </span>
            )}
            {/* Stempel beim Ziehen */}
            <span aria-hidden className="absolute left-4 top-12 -rotate-12 rounded-xl border-4 border-tuerkis-500 bg-white/90 px-3 py-1 font-display text-2xl font-extrabold text-tuerkis-600"
              style={{ opacity: Math.max(0, anteil) }}>FAVORIT</span>
            <span aria-hidden className="absolute right-4 top-12 rotate-12 rounded-xl border-4 border-ink/60 bg-white/90 px-3 py-1 font-display text-2xl font-extrabold text-ink/70"
              style={{ opacity: Math.max(0, -anteil) }}>WEITER</span>
          </div>
          <div className="p-4 sm:p-5">
            <h3 className="text-xl sm:text-2xl">{name}</h3>
            <p className="text-tuerkis-700 dark:text-tuerkis-300">{aktuell.beruf ?? "–"}</p>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" aria-hidden />
              {aktuell.wohnort ?? aktuell.land} → {aktuell.zielort ?? "flexibel"}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold">Deutsch {aktuell.deutschniveau ?? "–"}</span>
              {aktuell.erfahrung_jahre != null && <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold">{aktuell.erfahrung_jahre} J. Erfahrung</span>}
              {aktuell.skills.slice(0, 3).map((s) => <span key={s} className="rounded-full bg-tint px-2.5 py-0.5 text-xs text-tint-foreground">{s}</span>)}
            </div>
            <Link to="/profil/$id" params={{ id: aktuell.id }} className="mt-3 inline-block text-sm font-semibold text-info underline-offset-4 hover:underline">
              Ganzes Profil ansehen
            </Link>
          </div>
        </div>
      </div>

      <div className="glas-leiste sticky bottom-[calc(env(safe-area-inset-bottom,0px)+5.25rem)] z-10 mx-auto mt-5 flex w-fit items-center justify-center gap-2.5 rounded-full p-2 sm:static sm:gap-3">
        <button type="button" onClick={rueckgaengig} disabled={!verlauf.length} aria-label="Letzte Entscheidung zurücknehmen"
          className="glas-knopf flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition hover:bg-[var(--glas-stark)] disabled:opacity-40">
          <RotateCcw className="h-5 w-5" />
        </button>
        <button type="button" onClick={() => entscheiden(false)} aria-label={`${name} überspringen`} aria-keyshortcuts="ArrowLeft"
          className="glas-knopf flex h-16 w-16 items-center justify-center rounded-full text-ink transition hover:scale-105 hover:bg-[var(--glas-stark)] dark:text-foreground">
          <X className="h-7 w-7" />
        </button>
        <button type="button" onClick={() => entscheiden(true)} aria-label={`${name} als Favorit merken`} aria-keyshortcuts="ArrowRight"
          className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-b from-tuerkis-500 to-tuerkis-700 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.35),0_10px_24px_-10px_var(--color-tuerkis-700)] transition hover:scale-105 hover:brightness-110">
          <Star className="h-7 w-7" fill="currentColor" />
        </button>
        <button type="button" onClick={() => onEinladen(aktuell)} aria-label={`${name} zum Interview einladen`}
          className="knopf-gold flex h-11 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition hover:brightness-[1.03]">
          <CalendarCheck className="h-4 w-4" aria-hidden /> Einladen
        </button>
      </div>
      <p className="sr-only" aria-live="polite">{ansage}</p>
    </div>
  );
}
