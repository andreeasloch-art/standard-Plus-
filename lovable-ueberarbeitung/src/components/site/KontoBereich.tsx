import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Download, FileX, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { kontoLoeschen } from "@/lib/konto.functions";

export function KontoBereich({ uid, istAG }: { uid: string; istAG: boolean }) {
  const [busy, setBusy] = useState(false);
  const loeschen = useServerFn(kontoLoeschen);
  const qc = useQueryClient();
  const navigate = useNavigate();

  const exportieren = async () => {
    setBusy(true);
    try {
      const [profil, rollen, skills, sprachen, werdegang, stellen, anfragen, bewertungen, kuendigungen, favoriten,
        anreisen, ausweis, busfahrten, busbilder, busbuchungen, busbewertungen, benachrichtigungen] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", uid),
        supabase.from("skills").select("*").eq("profile_id", uid),
        supabase.from("sprachen").select("*").eq("profile_id", uid),
        supabase.from("werdegang").select("*").eq("profile_id", uid),
        supabase.from("stellen").select("*").eq("arbeitgeber_id", uid),
        supabase.from("anfragen").select("*").or(`arbeitgeber_id.eq.${uid},arbeitnehmer_id.eq.${uid}`),
        supabase.from("bewertungen").select("*").or(`von_id.eq.${uid},fuer_id.eq.${uid}`),
        supabase.from("kuendigungen").select("*").eq("user_id", uid),
        supabase.from("favoriten").select("*").eq("arbeitgeber_id", uid),
        supabase.from("anreise_anfragen").select("*").eq("user_id", uid),
        // Ausweisbilder werden nach der Prüfung gelöscht – exportiert wird nur der Status
        supabase.from("ausweis_pruefungen").select("status, grund, eingereicht_at, geprueft_at, einwilligung_at").eq("user_id", uid),
        supabase.from("busfahrten").select("*").eq("firma_id", uid),
        supabase.from("bus_bilder").select("*").eq("firma_id", uid),
        supabase.from("bus_buchungen").select("*").or(`reisender_id.eq.${uid},firma_id.eq.${uid}`),
        supabase.from("bus_bewertungen").select("*").or(`von_id.eq.${uid},firma_id.eq.${uid}`),
        supabase.from("benachrichtigungen").select("*").eq("user_id", uid),
      ]);
      const { data: u } = await supabase.auth.getUser();
      const daten = {
        exportiert_am: new Date().toISOString(),
        konto: { id: uid, email: u.user?.email, telefon: u.user?.phone, erstellt_am: u.user?.created_at },
        profil: profil.data, rollen: rollen.data, skills: skills.data, sprachen: sprachen.data, werdegang: werdegang.data,
        stellen: stellen.data, anfragen: anfragen.data, bewertungen: bewertungen.data, kuendigungen: kuendigungen.data, favoriten: favoriten.data,
        anreisen: anreisen.data, ausweispruefung: ausweis.data,
        busfahrten: busfahrten.data, bus_bilder: busbilder.data, bus_buchungen: busbuchungen.data, bus_bewertungen: busbewertungen.data,
        benachrichtigungen: benachrichtigungen.data,
        browser_speicher: { hinweis: "Farbmodus, Cookie-Einwilligung und die Merkliste nicht angemeldeter Besucher liegen nur in Ihrem Browser." },
      };
      const url = URL.createObjectURL(new Blob([JSON.stringify(daten, null, 2)], { type: "application/json" }));
      const a = document.createElement("a");
      a.href = url; a.download = `standard-plus-daten-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Ihre Daten wurden heruntergeladen.");
    } catch {
      toast.error("Export fehlgeschlagen. Bitte erneut versuchen.");
    } finally { setBusy(false); }
  };

  const kontoWeg = async () => {
    setBusy(true);
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) throw new Error("Nicht angemeldet.");
      await loeschen({ data: { token: data.session.access_token } });
      await qc.cancelQueries(); qc.clear();
      await supabase.auth.signOut();
      toast.success("Ihr Konto und alle zugehörigen Daten wurden gelöscht.");
      navigate({ to: "/", replace: true });
    } catch (e) {
      toast.error((e as Error).message || "Löschen fehlgeschlagen.");
      setBusy(false);
    }
  };

  return (
    <section className="card-base mt-6 p-6" aria-labelledby="konto-titel">
      <h2 id="konto-titel" className="text-xl">Konto und Daten</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Button variant="outline" onClick={exportieren} disabled={busy}><Download />Meine Daten exportieren</Button>
        {istAG && <Button asChild variant="outline"><Link to="/kuendigen"><FileX />Vertrag/Abo kündigen</Link></Button>}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive" disabled={busy}><Trash2 />Konto löschen</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Konto endgültig löschen?</AlertDialogTitle>
              <AlertDialogDescription>
                Gelöscht werden Ihr Profil, Sprachen, Werdegang, Skills, Stellen, Anfragen, Bewertungen, Anreisen, Busfahrten und -buchungen,
                Benachrichtigungen, alle hochgeladenen Dateien (Fotos, Ausweis, Busbilder) und Ihr Anmeldekonto.
                Das lässt sich nicht rückgängig machen. Laden Sie vorher bei Bedarf Ihre Daten herunter.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction onClick={kontoWeg} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Ja, Konto löschen</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Export nach Art. 15 und 20 DSGVO als JSON-Datei. Mehr in der <Link to="/datenschutz" className="underline">Datenschutzerklärung</Link>.</p>
    </section>
  );
}
