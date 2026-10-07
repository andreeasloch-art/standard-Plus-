import { Download, Share, Smartphone, SquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppInstallation } from "@/lib/pwa";

/** Abschnitt „Als App nutzen“: Knopf auf Android/Chrome, Anleitung auf dem iPhone. */
export function AppInstallieren() {
  const app = useAppInstallation();
  if (app.installiert) return null;

  return (
    <section className="container-page pb-14 sm:pb-20" aria-labelledby="app-titel">
      <div className="card-base grid items-center gap-6 p-6 sm:grid-cols-[auto_1fr_auto] sm:p-8">
        <img src="/app/icon-192.png" alt="" width={72} height={72} className="h-16 w-16 rounded-2xl shadow-soft sm:h-[72px] sm:w-[72px]" />
        <div>
          <h2 id="app-titel" className="text-2xl">Standard Plus als App</h2>
          <p className="mt-1 text-muted-foreground">Auf den Startbildschirm legen – öffnet im Vollbild, ganz ohne App-Store.</p>
          {app.ios && (
            <ol className="mt-3 space-y-1.5 text-sm">
              <li className="flex items-center gap-2">1. Unten auf <Share className="h-4 w-4 text-info" aria-label="Teilen" /> <strong>Teilen</strong> tippen</li>
              <li className="flex items-center gap-2">2. <SquarePlus className="h-4 w-4 text-info" aria-hidden /> <strong>Zum Home-Bildschirm</strong> wählen</li>
            </ol>
          )}
          {!app.ios && !app.direkt && (
            <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Smartphone className="h-4 w-4" aria-hidden /> Öffnen Sie diese Seite auf dem Handy, um sie als App zu installieren.
            </p>
          )}
        </div>
        {app.direkt && (
          <Button size="lg" onClick={() => app.installieren()}>
            <Download /> App installieren
          </Button>
        )}
      </div>
    </section>
  );
}
