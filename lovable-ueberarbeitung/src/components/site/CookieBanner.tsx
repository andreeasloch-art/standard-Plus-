import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ALLE_AN, ALLE_AUS, KATEGORIEN, useConsent, type Auswahl, type Kategorie } from "@/lib/consent";

export function CookieBanner() {
  const { einwilligung, bereit, speichern, einstellungenOffen, oeffneEinstellungen, schliesseEinstellungen } = useConsent();
  const zeigeBanner = bereit && !einwilligung && !einstellungenOffen;

  return (
    <>
      {zeigeBanner && (
        <section
          role="region"
          aria-labelledby="consent-titel"
          className="glas-leiste fixed inset-x-3 bottom-3 z-50 mx-auto max-w-4xl rounded-3xl"
        >
          <div className="container-page flex flex-col gap-3 py-4 lg:flex-row lg:items-center lg:gap-6">
            <div className="flex-1">
              <h2 id="consent-titel" className="text-base">Datenschutz</h2>
              <p className="text-sm text-muted-foreground">
                Wir nutzen nur technisch notwendige Speicherung (Anmeldung, Farbmodus) – keine Tracker. Mehr in der{" "}
                <Link to="/datenschutz" className="underline underline-offset-2">Datenschutzerklärung</Link>.
              </p>
            </div>
            <div className="grid shrink-0 gap-2 sm:grid-cols-3">
              <Button variant="outline" onClick={() => speichern(ALLE_AUS)}>Alle ablehnen</Button>
              <Button variant="outline" onClick={oeffneEinstellungen}>Einstellungen</Button>
              <Button variant="outline" onClick={() => speichern(ALLE_AN)}>Alle akzeptieren</Button>
            </div>
          </div>
        </section>
      )}
      <EinstellungenDialog offen={einstellungenOffen} onClose={schliesseEinstellungen} aktuell={einwilligung?.auswahl ?? ALLE_AUS} onSave={speichern} datum={einwilligung?.datum} />
    </>
  );
}

function EinstellungenDialog({ offen, onClose, aktuell, onSave, datum }: { offen: boolean; onClose: () => void; aktuell: Auswahl; onSave: (a: Auswahl) => void; datum?: string | undefined }) {
  const [a, setA] = useState<Auswahl>(aktuell);
  useEffect(() => { if (offen) setA(aktuell); }, [offen, aktuell]);

  return (
    <Dialog open={offen} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cookie-Einstellungen</DialogTitle>
          <DialogDescription>Jederzeit über „Cookie-Einstellungen“ im Seitenfuß änderbar.</DialogDescription>
        </DialogHeader>
        <ul className="space-y-3">
          {KATEGORIEN.map((k) => {
            const fest = k.id === "notwendig";
            const id = `consent-${k.id}`;
            return (
              <li key={k.id} className="flex gap-3 rounded-xl border p-3">
                <input
                  id={id}
                  type="checkbox"
                  className="mt-1 h-5 w-5 shrink-0 accent-[var(--color-info)]"
                  checked={fest ? true : a[k.id as Kategorie]}
                  disabled={fest}
                  aria-describedby={`${id}-text`}
                  onChange={(e) => setA({ ...a, [k.id]: e.target.checked })}
                />
                <div>
                  <label htmlFor={id} className="font-semibold">{k.titel}{fest && " (immer aktiv)"}</label>
                  <p id={`${id}-text`} className="text-sm text-muted-foreground">{k.text}</p>
                </div>
              </li>
            );
          })}
        </ul>
        {datum && <p className="text-xs text-muted-foreground">Zuletzt gespeichert: {new Date(datum).toLocaleString("de-DE")}</p>}
        <DialogFooter className="grid gap-2 sm:grid-cols-3 sm:space-x-0">
          <Button variant="outline" onClick={() => onSave(ALLE_AUS)}>Alle ablehnen</Button>
          <Button variant="outline" onClick={() => onSave(a)}>Auswahl speichern</Button>
          <Button variant="outline" onClick={() => onSave(ALLE_AN)}>Alle akzeptieren</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
