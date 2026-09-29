import { useEffect, useId, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Camera, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProfilFoto } from "@/components/site/ProfilFoto";
import { supabase } from "@/integrations/supabase/client";
import { FOTO_BUCKET } from "@/lib/profile-data";

const MAX_EINGABE = 15 * 1024 * 1024; // vor dem Verkleinern
const ERLAUBT = ["image/jpeg", "image/png", "image/webp"];

/** Verkleinert auf max. 1000 px und speichert als JPEG – dabei gehen auch Metadaten (GPS, Kamera) verloren. */
async function verkleinern(datei: File): Promise<Blob> {
  const bild = await createImageBitmap(datei);
  const faktor = Math.min(1, 1000 / Math.max(bild.width, bild.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bild.width * faktor);
  canvas.height = Math.round(bild.height * faktor);
  canvas.getContext("2d")!.drawImage(bild, 0, 0, canvas.width, canvas.height);
  bild.close();
  return new Promise((ok, fehler) =>
    canvas.toBlob((b) => (b ? ok(b) : fehler(new Error("Bild konnte nicht verarbeitet werden."))), "image/jpeg", 0.86),
  );
}

export function FotoUpload({
  uid,
  name,
  fotoPfad,
  fotoSichtbar,
  refresh,
}: {
  uid: string;
  name: string;
  fotoPfad: string | null;
  fotoSichtbar: boolean;
  refresh: () => void;
}) {
  const qc = useQueryClient();
  const id = useId();
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let aktiv = true;
    if (!fotoPfad) { setUrl(null); return; }
    supabase.storage.from(FOTO_BUCKET).createSignedUrl(fotoPfad, 600).then(({ data }) => {
      if (aktiv) setUrl(data?.signedUrl ?? null);
    });
    return () => { aktiv = false; };
  }, [fotoPfad]);

  const fertig = () => { refresh(); qc.invalidateQueries({ queryKey: ["oeffentliche-profile"] }); };

  const hochladen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const datei = e.target.files?.[0];
    e.target.value = "";
    if (!datei) return;
    if (!ERLAUBT.includes(datei.type)) return toast.error("Bitte ein JPG-, PNG- oder WebP-Bild wählen.");
    if (datei.size > MAX_EINGABE) return toast.error("Das Bild ist zu groß (max. 15 MB).");
    setBusy(true);
    try {
      const blob = await verkleinern(datei);
      const pfad = `${uid}/profilbild-${Date.now()}.jpg`;
      const up = await supabase.storage.from(FOTO_BUCKET).upload(pfad, blob, { contentType: "image/jpeg", upsert: false });
      if (up.error) throw up.error;
      const { error } = await supabase.from("profiles").update({ foto_pfad: pfad }).eq("id", uid);
      if (error) {
        await supabase.storage.from(FOTO_BUCKET).remove([pfad]);
        throw error;
      }
      // altes Foto wirklich löschen
      if (fotoPfad) await supabase.storage.from(FOTO_BUCKET).remove([fotoPfad]);
      toast.success("Foto gespeichert.");
      fertig();
    } catch {
      toast.error("Foto konnte nicht gespeichert werden.");
    } finally {
      setBusy(false);
    }
  };

  const entfernen = async () => {
    if (!fotoPfad) return;
    setBusy(true);
    const del = await supabase.storage.from(FOTO_BUCKET).remove([fotoPfad]);
    const upd = await supabase.from("profiles").update({ foto_pfad: null, foto_sichtbar: false }).eq("id", uid);
    setBusy(false);
    if (del.error || upd.error) return toast.error("Foto konnte nicht gelöscht werden.");
    toast.success("Foto gelöscht.");
    fertig();
  };

  const sichtbarkeit = async (an: boolean) => {
    const { error } = await supabase.from("profiles").update({ foto_sichtbar: an }).eq("id", uid);
    if (error) return toast.error("Einstellung konnte nicht gespeichert werden.");
    toast.success(an ? "Foto wird in der Suche gezeigt." : "Foto wird nicht mehr in der Suche gezeigt.");
    fertig();
  };

  return (
    <section className="card-base mt-6 grid gap-5 p-6 sm:grid-cols-[9rem_1fr]" aria-labelledby={`${id}-titel`}>
      <ProfilFoto url={url} name={name || "Ich"} className="rounded-xl" />
      <div>
        <h2 id={`${id}-titel`} className="text-xl">Profilfoto</h2>
        <p className="mt-1 text-sm text-muted-foreground">Freiwillig. Am besten frontal, gut ausgeleuchtet, Gesicht gut erkennbar.</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <label className={`inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-soft focus-within:ring-2 focus-within:ring-ring ${busy ? "pointer-events-none opacity-50" : ""}`}>
            <Camera className="h-4 w-4" aria-hidden />
            {fotoPfad ? "Foto ersetzen" : "Foto hochladen"}
            <input type="file" accept={ERLAUBT.join(",")} className="sr-only" onChange={hochladen} disabled={busy} />
          </label>
          {fotoPfad && (
            <Button type="button" variant="outline" onClick={entfernen} disabled={busy}>
              <Trash2 /> Foto löschen
            </Button>
          )}
        </div>

        {fotoPfad && (
          <div className="mt-4 rounded-xl bg-tint p-4 text-tint-foreground">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={fotoSichtbar}
                onChange={(e) => sichtbarkeit(e.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-info)]"
                aria-describedby={`${id}-hint`}
              />
              <span className="text-sm font-medium">Einwilligung: Mein Foto darf Unternehmen in der Suche und im Profil angezeigt werden.</span>
            </label>
            <p id={`${id}-hint`} className="mt-2 pl-8 text-xs">Jederzeit widerrufbar. Ohne Häkchen sehen nur Sie das Foto.</p>
          </div>
        )}
      </div>
    </section>
  );
}
