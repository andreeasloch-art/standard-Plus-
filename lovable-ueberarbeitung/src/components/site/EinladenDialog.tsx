import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, Languages, Phone, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/site/Modal";
import { Bald } from "@/components/site/Vorteile";
import { NichtAngemeldet, useEinladungen, useFavoriten, type InterviewArt } from "@/lib/favoriten";
import type { OeffentlichesProfil } from "@/lib/profile-data";

const SPRACHE: Record<string, string> = {
  Rumänien: "Rumänisch", Moldau: "Rumänisch", Polen: "Polnisch", Bulgarien: "Bulgarisch", Italien: "Italienisch",
  Kroatien: "Kroatisch", Tschechien: "Tschechisch", Ungarn: "Ungarisch", Spanien: "Spanisch", Portugal: "Portugiesisch",
  Griechenland: "Griechisch", Slowakei: "Slowakisch", Serbien: "Serbisch", Ukraine: "Ukrainisch",
};
export const spracheVon = (p: OeffentlichesProfil) => (p.land && SPRACHE[p.land]) || "ihrer Muttersprache";

/** Frühester Termin: morgen 09:00 – als Wert für <input type="datetime-local"> */
function morgenNeun() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  const z = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}T09:00`;
}

export function EinladenDialog({ profil, onClose }: { profil: OeffentlichesProfil | null; onClose: () => void }) {
  const { einladen } = useEinladungen();
  const fav = useFavoriten();
  const [art, setArt] = useState<InterviewArt>("video");
  const [termin, setTermin] = useState(morgenNeun());
  const [dolmetscher, setDolmetscher] = useState(true);
  const [nachricht, setNachricht] = useState("");
  const [status, setStatus] = useState<"eingabe" | "sendet" | "fertig">("eingabe");
  const [fehler, setFehler] = useState<{ text: string; anmelden?: boolean } | null>(null);

  useEffect(() => {
    if (profil) { setStatus("eingabe"); setFehler(null); setNachricht(""); setTermin(morgenNeun()); }
  }, [profil]);

  if (!profil) return <Modal offen={false} onClose={onClose} titel="">{null}</Modal>;
  const name = profil.anzeigename || "Fachkraft";
  const sprache = spracheVon(profil);

  const senden = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termin || new Date(termin) < new Date()) return setFehler({ text: "Bitte einen Termin in der Zukunft wählen." });
    setFehler(null);
    setStatus("sendet");
    try {
      await einladen({ profilId: profil.id, art, termin: new Date(termin).toISOString(), dolmetscher, nachricht });
      fav.setzen(profil.id, true); // Eingeladene landen automatisch in den Favoriten
      setStatus("fertig");
    } catch (err) {
      setStatus("eingabe");
      setFehler({ text: (err as Error).message, anmelden: err instanceof NichtAngemeldet });
    }
  };

  return (
    <Modal offen onClose={onClose} titel={status === "fertig" ? "Einladung gesendet" : `${name} zum Interview einladen`}>
      {status === "fertig" ? (
        <div className="text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-tuerkis-600" aria-hidden />
          <p className="mt-3">{name} bekommt Ihre Einladung. Sagt {name} zu, haben Sie ein Match.</p>
          <p className="mt-2 text-sm text-muted-foreground">Mit dem Match sehen Sie beide Name und Kontaktdaten und können das Interview starten.</p>
          <Button className="mt-6" onClick={onClose}>Weiter wischen</Button>
        </div>
      ) : (
        <form onSubmit={senden} noValidate className="space-y-5">
          <fieldset>
            <legend className="text-sm font-medium">Wie möchten Sie sprechen?</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {([["video", "Videoanruf", Video], ["telefon", "Telefonanruf", Phone]] as const).map(([v, l, I]) => (
                <label key={v} className={`flex cursor-pointer items-center gap-2 rounded-xl border-2 p-3 text-sm font-semibold transition-colors ${art === v ? "border-tuerkis-500 bg-tint text-tint-foreground" : "border-border hover:bg-accent"}`}>
                  <input type="radio" name="art" value={v} checked={art === v} onChange={() => setArt(v)} className="sr-only" />
                  <I className="h-4 w-4" aria-hidden /> {l}
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor="termin" className="text-sm font-medium">Wunschtermin</label>
            <input id="termin" type="datetime-local" required value={termin} min={morgenNeun().slice(0, 10) + "T00:00"} onChange={(e) => setTermin(e.target.value)} className="field mt-1.5" />
          </div>

          <label className="flex items-start gap-3 rounded-xl bg-tint p-4 text-tint-foreground">
            <input type="checkbox" checked={dolmetscher} onChange={(e) => setDolmetscher(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-info)]" />
            <span className="text-sm">
              <span className="flex flex-wrap items-center gap-2 font-semibold"><Languages className="h-4 w-4" aria-hidden />Live-Dolmetscher zuschalten <Bald /></span>
              <span className="mt-1 block">Sie sprechen Deutsch, {name} hört {sprache} – und umgekehrt.</span>
            </span>
          </label>

          <div>
            <label htmlFor="nachricht" className="text-sm font-medium">Kurze Nachricht <span className="font-normal text-muted-foreground">(freiwillig)</span></label>
            <textarea id="nachricht" rows={3} maxLength={500} value={nachricht} onChange={(e) => setNachricht(e.target.value)} className="field mt-1.5 h-auto py-2" placeholder="z. B. Wir suchen ab November Verstärkung für unser Team." />
          </div>

          {fehler && (
            <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm">
              {fehler.text} {fehler.anmelden && <Link to="/auth" className="font-semibold underline">Jetzt anmelden</Link>}
            </p>
          )}

          <p className="text-xs text-muted-foreground">
            {name} sieht mit der Einladung Ihr Firmenprofil. Kontaktdaten gibt es erst beim Match. Mehr in der{" "}
            <Link to="/datenschutz" className="underline">Datenschutzerklärung</Link>.
          </p>

          <Button type="submit" size="lg" className="w-full" disabled={status === "sendet"}>
            {status === "sendet" ? "Wird gesendet …" : "Einladung senden"}
          </Button>
        </form>
      )}
    </Modal>
  );
}
