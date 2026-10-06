import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BadgeCheck, Camera, Clock, IdCard, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const AUSWEIS_BUCKET = "ausweise";
type Pruefung = { status: "eingereicht" | "geprueft" | "abgelehnt"; grund: string | null; vorderseite: string | null; rueckseite: string | null };

/** Eigener Prüfstand (für Dashboard und Vertragsabschluss). */
export function useAusweis(uid: string) {
  return useQuery({
    queryKey: ["ausweis", uid],
    queryFn: async () => {
      const { data, error } = await supabase.from("ausweis_pruefungen").select("status, grund, vorderseite, rueckseite").eq("user_id", uid).maybeSingle();
      if (error) throw error;
      return (data ?? null) as Pruefung | null;
    },
  });
}

/** Verkleinert auf max. 2000 px (gut lesbar) und speichert als JPEG – Metadaten (GPS, Kamera) gehen dabei verloren. */
async function vorbereiten(datei: File): Promise<Blob> {
  const bild = await createImageBitmap(datei);
  const f = Math.min(1, 2000 / Math.max(bild.width, bild.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bild.width * f); c.height = Math.round(bild.height * f);
  c.getContext("2d")!.drawImage(bild, 0, 0, c.width, c.height);
  bild.close();
  return new Promise((ok, fehler) => c.toBlob((b) => (b ? ok(b) : fehler(new Error("Bild"))), "image/jpeg", 0.9));
}

function DateiWahl({ id, label, datei, onDatei }: { id: string; label: string; datei: File | null; onDatei: (f: File | null) => void }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed p-3 text-sm hover:bg-accent focus-within:ring-2 focus-within:ring-ring">
      <Camera className="h-5 w-5 shrink-0 text-tuerkis-600" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="font-semibold">{label}</span>
        <span className="block truncate text-muted-foreground">{datei ? datei.name : "Foto aufnehmen oder Datei wählen"}</span>
      </span>
      <input id={id} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="sr-only"
        onChange={(e) => onDatei(e.target.files?.[0] ?? null)} />
    </label>
  );
}

/**
 * Ausweisprüfung ohne externen Anbieter: Foto von Vorder- (und Rück-)seite hochladen,
 * das Team prüft Name und Geburtsdatum, danach werden die Bilder gelöscht.
 */
export function AusweisUpload({ uid }: { uid: string }) {
  const qc = useQueryClient();
  const q = useAusweis(uid);
  const [vorne, setVorne] = useState<File | null>(null);
  const [hinten, setHinten] = useState<File | null>(null);
  const [einwilligung, setEinwilligung] = useState(false);
  const [busy, setBusy] = useState(false);
  const p = q.data;

  const senden = async () => {
    if (!vorne || !einwilligung) return;
    for (const d of [vorne, hinten]) {
      if (d && !["image/jpeg", "image/png", "image/webp"].includes(d.type)) return void toast.error("Bitte ein Foto (JPG, PNG oder WebP) wählen.");
      if (d && d.size > 20 * 1024 * 1024) return void toast.error("Das Foto ist zu groß (max. 20 MB).");
    }
    setBusy(true);
    const neu: string[] = [];
    try {
      const hoch = async (d: File, seite: string) => {
        const pfad = `${uid}/${seite}-${Date.now()}.jpg`;
        const r = await supabase.storage.from(AUSWEIS_BUCKET).upload(pfad, await vorbereiten(d), { contentType: "image/jpeg" });
        if (r.error) throw r.error;
        neu.push(pfad);
        return pfad;
      };
      const vorderseite = await hoch(vorne, "vorderseite");
      const rueckseite = hinten ? await hoch(hinten, "rueckseite") : null;
      const alt = [p?.vorderseite, p?.rueckseite].filter((x): x is string => !!x);
      const { error } = await supabase.from("ausweis_pruefungen").upsert({ user_id: uid, vorderseite, rueckseite } as never);
      if (error) throw error;
      if (alt.length) await supabase.storage.from(AUSWEIS_BUCKET).remove(alt); // ersetzte Bilder wirklich löschen
      toast.success("Ausweis eingereicht. Wir prüfen ihn in der Regel innerhalb von 1–2 Werktagen.");
      setVorne(null); setHinten(null); setEinwilligung(false);
      qc.invalidateQueries({ queryKey: ["ausweis", uid] });
    } catch {
      if (neu.length) await supabase.storage.from(AUSWEIS_BUCKET).remove(neu);
      toast.error("Hochladen fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card-base h-fit p-6" aria-labelledby="ausweis-titel">
      <h2 id="ausweis-titel" className="flex items-center gap-2 text-xl"><IdCard className="h-5 w-5 text-tuerkis-600" aria-hidden />Ausweis</h2>
      {q.isLoading ? <p className="mt-2 text-sm text-muted-foreground">Wird geladen …</p> : p?.status === "geprueft" ? (
        <p className="mt-3 flex items-center gap-2 rounded-lg bg-success/10 p-3 text-sm font-semibold text-success">
          <BadgeCheck className="h-5 w-5" aria-hidden /> Ausweis geprüft – die Bilder wurden gelöscht.
        </p>
      ) : p?.status === "eingereicht" ? (
        <p className="mt-3 flex items-center gap-2 rounded-lg bg-tint p-3 text-sm text-tint-foreground">
          <Clock className="h-5 w-5" aria-hidden /> Eingereicht – wir prüfen gerade. Danach löschen wir die Bilder.
        </p>
      ) : (
        <>
          {p?.status === "abgelehnt" && (
            <p className="mt-3 flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <XCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden /> Nicht bestätigt{p.grund ? `: ${p.grund}` : "."} Bitte neue Fotos hochladen.
            </p>
          )}
          <p className="mt-2 text-sm text-muted-foreground">
            Für den Vertragsabschluss brauchen wir einen Blick auf Ihren Ausweis oder Reisepass. Name und Geburtsdatum müssen zu Ihrem Konto passen.
          </p>
          <div className="mt-4 space-y-2">
            <DateiWahl id="ausweis-vorne" label="Vorderseite (oder Passseite mit Foto) *" datei={vorne} onDatei={setVorne} />
            <DateiWahl id="ausweis-hinten" label="Rückseite (beim Personalausweis)" datei={hinten} onDatei={setHinten} />
          </div>
          <ul className="mt-3 list-disc space-y-0.5 pl-5 text-xs text-muted-foreground">
            <li>Gut lesbar, ohne Spiegelung, alle Ecken sichtbar.</li>
            <li>Sie dürfen Zugangsnummer (CAN, 6 Ziffern) und Seriennummer schwärzen – die brauchen wir nicht.</li>
          </ul>
          <label className="mt-3 flex items-start gap-3 text-sm">
            <input type="checkbox" checked={einwilligung} onChange={(e) => setEinwilligung(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-info)]" />
            <span>Ich bin einverstanden, dass Standard Plus die Fotos meines Ausweises nur zur Prüfung meiner Identität ansieht und <strong>sofort nach der Prüfung löscht</strong>. Gespeichert bleibt nur „geprüft am …“.</span>
          </label>
          <Button className="mt-4 w-full" disabled={!vorne || !einwilligung || busy} onClick={senden}>
            {busy ? "Wird hochgeladen …" : "Ausweis zur Prüfung senden"}
          </Button>
        </>
      )}
    </section>
  );
}
