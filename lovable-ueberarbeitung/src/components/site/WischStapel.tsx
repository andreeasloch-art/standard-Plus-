import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, BriefcaseBusiness, CalendarCheck, CalendarDays, Check, Lock, MapPin, RotateCcw, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProfilFoto } from "@/components/site/ProfilFoto";
import { formatDatum, istBeispiel, matchProzent, type OeffentlichesProfil } from "@/lib/profile-data";
import { useEinladungen, useFavoriten } from "@/lib/favoriten";
import { cn } from "@/lib/utils";

type Aktion = { id: string; favorit: boolean; warVorherFavorit: boolean };
const SCHWELLE = 0.28; // Anteil der Kartenbreite, ab dem die Entscheidung fällt

function ruhig() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

function Fakt({ icon: I, label, wert, breit = false }: { icon: typeof MapPin; label: string; wert: React.ReactNode; breit?: boolean }) {
  return (
    <div className={cn("flex items-start gap-2.5", breit && "col-span-2")}>
      <I className="mt-0.5 h-4 w-4 shrink-0 text-tuerkis-600 dark:text-tuerkis-300" aria-hidden />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-semibold">{wert}</p>
      </div>
    </div>
  );
}

/**
 * Wischen wie bei Tinder – die Karte füllt den Bildschirm:
 * großes Foto, darunter die wichtigsten Daten.
 * ✓ oder nach rechts = gefällt mir → Favorit + die Karte klappt auf und zeigt mehr Infos.
 * ✕ oder nach links = weiter. Kontaktdaten gibt es erst bei Vertragsabschluss.
 * Tastatur: → gefällt mir, ← weiter.
 */
export function WischStapel({ profile, onEinladen }: { profile: OeffentlichesProfil[]; onEinladen: (p: OeffentlichesProfil) => void }) {
  const fav = useFavoriten();
  const einl = useEinladungen();
  const [pos, setPos] = useState(0);
  const [offen, setOffen] = useState(false);
  const [verlauf, setVerlauf] = useState<Aktion[]>([]);
  const [dx, setDx] = useState(0);
  const [raus, setRaus] = useState<0 | 1 | -1>(0);
  const [ansage, setAnsage] = useState("");
  const karteRef = useRef<HTMLDivElement>(null);
  const start = useRef<{ x: number; id: number } | null>(null);

  // Neue Suche → Stapel von vorn
  const schluessel = profile.map((p) => p.id).join(",");
  useEffect(() => { setPos(0); setVerlauf([]); setDx(0); setRaus(0); setOffen(false); }, [schluessel]);

  const aktuell = profile[pos];
  const breite = () => karteRef.current?.offsetWidth ?? 320;

  const naechste = (richtung: 1 | -1) => {
    setOffen(false);
    if (ruhig()) { setPos((p) => p + 1); setDx(0); return; }
    setRaus(richtung);
    window.setTimeout(() => { setPos((p) => p + 1); setDx(0); setRaus(0); }, 260);
  };

  /** ✓ = gefällt mir (Karte klappt auf), ✕ = weiter. Ist die Karte schon offen, geht es zur nächsten. */
  const entscheiden = (gefaellt: boolean) => {
    if (!aktuell || raus) return;
    const name = aktuell.anzeigename || "Fachkraft";
    if (offen) {
      setAnsage(`Weiter zur nächsten Fachkraft.`);
      naechste(gefaellt ? 1 : -1);
      return;
    }
    setVerlauf((v) => [...v, { id: aktuell.id, favorit: gefaellt, warVorherFavorit: fav.ist(aktuell.id) }]);
    if (gefaellt) {
      fav.setzen(aktuell.id, true);
      setDx(0);
      setOffen(true);
      setAnsage(`${name} gefällt Ihnen und ist als Favorit gemerkt. Mehr Infos werden angezeigt.`);
      karteRef.current?.scrollTo({ top: 0 });
    } else {
      setAnsage(`${name} übersprungen.`);
      naechste(-1);
    }
  };

  const rueckgaengig = () => {
    if (raus) return;
    const letzte = verlauf[verlauf.length - 1];
    if (!letzte) return;
    if (letzte.favorit && !letzte.warVorherFavorit) fav.setzen(letzte.id, false);
    setVerlauf((v) => v.slice(0, -1));
    if (offen) setOffen(false); // „Gefällt mir“ der aktuellen Karte zurücknehmen
    else setPos((p) => Math.max(0, p - 1));
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
  const kopf = aktuell.alter ? `${name}, ${aktuell.alter}` : name;
  const beispiel = istBeispiel(aktuell.id);
  const istFav = fav.ist(aktuell.id);
  const eingeladen = einl.eingeladen(aktuell.id);
  const route = (
    <span className="schrift-tafel inline-flex min-w-0 items-center gap-1.5 font-semibold">
      <span className="truncate">{aktuell.wohnort ?? aktuell.land ?? "–"}</span>
      <span className="flex shrink-0 items-center" aria-label="nach">
        <span className="h-0.5 w-4 bg-current opacity-70" aria-hidden />
        <ArrowRight className="-ml-1 h-4 w-4" aria-hidden />
      </span>
      <span className="truncate">{aktuell.zielort ?? "flexibel"}</span>
    </span>
  );

  return (
    <div className="mx-auto w-full max-w-[28rem]">
      <div
        className="relative h-[calc(100dvh-22.5rem)] min-h-[24rem] rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background sm:h-[min(calc(100dvh-17rem),46rem)] sm:min-h-[30rem]"
        tabIndex={0}
        role="group"
        aria-roledescription="Kartenstapel"
        aria-label={`${kopf}, ${aktuell.beruf ?? ""}. Pfeil rechts: gefällt mir, Pfeil links: weiter.`}
        onKeyDown={onKey}
      >
        {/* Die nächsten Karten liegen sichtbar dahinter */}
        {[2, 1].map((n) => profile[pos + n] && (
          <div key={profile[pos + n].id} aria-hidden className="card-base karte-fest absolute inset-0 overflow-hidden rounded-3xl"
            style={{ transform: `translateY(${n * 10}px) scale(${1 - n * 0.04})`, transformOrigin: "50% 100%", opacity: 1 - n * 0.25 }}>
            <ProfilFoto url={profile[pos + n].foto_url} name={profile[pos + n].anzeigename} kopfOben className="aspect-auto h-full" />
          </div>
        ))}

        <div
          ref={karteRef}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={() => { start.current = null; setDx(0); }}
          className={cn(
            "card-base karte-fest absolute inset-0 cursor-grab touch-pan-y select-none rounded-3xl active:cursor-grabbing",
            offen ? "overflow-y-auto overscroll-contain" : "overflow-hidden",
          )}
          style={{
            transform: `translateX(${x}px) rotate(${x / 18}deg)`,
            transition: start.current ? "none" : "transform 260ms cubic-bezier(.2,.7,.2,1)",
          }}
        >
          {/* Foto: geschlossen über die ganze Karte, offen als großer Kopf oben */}
          <div className={cn("relative transition-[height] duration-300", offen ? "h-[48%]" : "h-full")}>
            <ProfilFoto url={aktuell.foto_url} name={name} gross={!offen} kopfOben className="aspect-auto h-full" />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {beispiel && (
              <span className="absolute left-3 top-3 rounded-md bg-white/75 px-2.5 py-0.5 text-xs font-bold text-tuerkis-800 ring-1 ring-white/70 backdrop-blur-md">
                {matchProzent(aktuell.id)} % · Beispiel
              </span>
            )}
            {(istFav || eingeladen) && (
              <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-md bg-success px-2.5 py-0.5 text-xs font-bold text-success-foreground shadow-soft">
                {eingeladen ? "Eingeladen" : <><Check className="h-3.5 w-3.5" aria-hidden />Gefällt mir</>}
              </span>
            )}
            {/* Stempel beim Ziehen */}
            <span aria-hidden className="absolute left-5 top-14 -rotate-12 rounded-lg border-4 border-success bg-white/90 px-3 py-1 font-display text-3xl font-bold text-success"
              style={{ opacity: Math.max(0, anteil) }}>GEFÄLLT MIR</span>
            <span aria-hidden className="absolute right-5 top-14 rotate-12 rounded-lg border-4 border-ink/60 bg-white/90 px-3 py-1 font-display text-3xl font-bold text-ink/70"
              style={{ opacity: Math.max(0, -anteil) }}>WEITER</span>

            {/* Daten unten auf dem Foto */}
            <div className={cn("absolute inset-x-0 bottom-0 p-5 text-white", !offen && "pb-28")}>
              <h3 className="text-3xl leading-tight text-white drop-shadow sm:text-4xl">{kopf}</h3>
              <p className="mt-0.5 text-lg font-medium text-white/95">{aktuell.beruf ?? "Fachkraft"}</p>
              {!offen && (<>
              <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/90">
                {aktuell.branche && <span>{aktuell.branche}</span>}
                {aktuell.erfahrung_jahre != null && <span>{aktuell.erfahrung_jahre} Jahre Erfahrung</span>}
                {aktuell.deutschniveau && <span className="inline-flex items-center gap-1.5">Deutsch <span className="gleis h-6 min-w-6 bg-white text-sm text-tuerkis-800">{aktuell.deutschniveau}</span></span>}
              </p>
              <p className="mt-1.5 flex items-center gap-1.5 text-base text-white">
                <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                {route}
              </p>
              </>)}
            </div>
          </div>

          {/* Mehr Infos – erst nach „Gefällt mir“ */}
          {offen && (
            <div className="karte-rein space-y-5 p-5 pb-28">
              <p className="text-sm font-semibold text-success">Gefällt Ihnen – hier sind mehr Infos.</p>
              <div className="grid grid-cols-2 gap-4">
                {aktuell.branche && <Fakt icon={BriefcaseBusiness} label="Berufsfeld" wert={aktuell.branche} />}
                {aktuell.erfahrung_jahre != null && <Fakt icon={BriefcaseBusiness} label="Erfahrung" wert={`${aktuell.erfahrung_jahre} Jahre`} />}
                <Fakt icon={CalendarDays} label="Verfügbar ab" wert={aktuell.verfuegbar_ab ? formatDatum(aktuell.verfuegbar_ab) : "nach Absprache"} />
                <Fakt icon={MapPin} label="Von → Nach" wert={route} breit />
                {aktuell.deutschniveau && <Fakt icon={BriefcaseBusiness} label="Deutsch" wert={<span className="gleis h-6 min-w-6 text-sm">{aktuell.deutschniveau}</span>} />}
                {aktuell.land && <Fakt icon={MapPin} label="Herkunft" wert={aktuell.land} />}
              </div>
              {aktuell.ueber_mich && (
                <div>
                  <h4 className="text-base">Über mich</h4>
                  <p className="mt-1 text-[0.95rem] text-muted-foreground">{aktuell.ueber_mich}</p>
                </div>
              )}
              {aktuell.skills.length > 0 && (
                <div>
                  <h4 className="text-base">Fähigkeiten</h4>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {aktuell.skills.map((s) => <span key={s} className="rounded-md bg-tint px-2.5 py-1 text-sm text-tint-foreground">{s}</span>)}
                  </div>
                </div>
              )}
              <p className="flex items-start gap-2.5 rounded-xl border border-dashed p-3 text-sm text-muted-foreground">
                <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                Vollständiger Name, Telefon und E-Mail werden erst bei Vertragsabschluss sichtbar.
              </p>
              <Link to="/profil/$id" params={{ id: aktuell.id }} className="inline-block text-sm font-semibold text-info underline-offset-4 hover:underline">
                Ganzes Profil ansehen
              </Link>
            </div>
          )}
        </div>

        {/* Knöpfe unten auf der Karte – wie bei Tinder */}
        <div className={cn("pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-center justify-center gap-3 rounded-b-3xl p-4", offen && "bg-gradient-to-t from-card via-card/95 to-transparent pt-10")}>
          <button type="button" onClick={rueckgaengig} disabled={!verlauf.length} aria-label="Letzte Entscheidung zurücknehmen"
            className="glas-leiste pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition hover:text-foreground disabled:opacity-50">
            <RotateCcw className="h-5 w-5" />
          </button>
          <button type="button" onClick={() => entscheiden(false)} aria-label={offen ? "Weiter zur nächsten Fachkraft" : `${name} überspringen`} aria-keyshortcuts="ArrowLeft"
            className="glas-leiste pointer-events-auto flex h-16 w-16 items-center justify-center rounded-full text-ink transition hover:scale-105 dark:text-foreground">
            <X className="h-8 w-8" />
          </button>
          {offen ? (
            <button type="button" onClick={() => onEinladen(aktuell)} aria-label={`${name} zum Interview einladen`}
              className="knopf-gold pointer-events-auto flex h-14 items-center gap-2 rounded-full px-6 text-base font-semibold transition hover:brightness-[1.03]">
              <CalendarCheck className="h-5 w-5" aria-hidden /> Einladen
            </button>
          ) : (
            <button type="button" onClick={() => entscheiden(true)} aria-label={`${name} gefällt mir – als Favorit merken`} aria-keyshortcuts="ArrowRight"
              className="pointer-events-auto flex h-16 w-16 items-center justify-center rounded-full bg-success text-success-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.35),0_10px_24px_-8px_var(--color-success)] transition hover:scale-105 hover:brightness-110">
              <Check className="h-9 w-9" strokeWidth={3} />
            </button>
          )}
          {!offen && (
            <button type="button" onClick={() => onEinladen(aktuell)} aria-label={`${name} zum Interview einladen`}
              className="glas-leiste pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full text-tuerkis-700 transition hover:scale-105 dark:text-tuerkis-300">
              <CalendarCheck className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      <p className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>← weiter</span>
        <span className="tabular-nums">{pos + 1} von {profile.length}</span>
        <span>gefällt mir →</span>
      </p>
      <p className="sr-only" aria-live="polite">{ansage}</p>
    </div>
  );
}
