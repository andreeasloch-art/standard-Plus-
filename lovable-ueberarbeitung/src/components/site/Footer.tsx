import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { useConsent } from "@/lib/consent";

export function Footer() {
  const { oeffneEinstellungen } = useConsent();
  return (
    <footer className="mt-24 border-t bg-surface">
      <div className="container-page grid gap-10 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo className="h-7" />
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            Arbeit in ganz Europa und weltweit finden – Kontaktdaten erst bei Vertragsabschluss.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-semibold">Plattform</h2>
          <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
            <li><Link to="/talente" className="inline-block py-1 hover:text-foreground">Talente finden</Link></li>
            <li><Link to="/busreisen" className="inline-block py-1 hover:text-foreground">Busreisen</Link></li>
            <li><Link to="/ablauf" className="inline-block py-1 hover:text-foreground">Ablauf</Link></li>
            <li><Link to="/preise" className="inline-block py-1 hover:text-foreground">Preise</Link></li>
            <li><Link to="/auth" className="inline-block py-1 hover:text-foreground">Anmelden</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold">Rechtliches</h2>
          <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
            <li><Link to="/impressum" className="inline-block py-1 hover:text-foreground">Impressum</Link></li>
            <li><Link to="/datenschutz" className="inline-block py-1 hover:text-foreground">Datenschutz</Link></li>
            <li><Link to="/agb" className="inline-block py-1 hover:text-foreground">AGB (Unternehmen)</Link></li>
            <li><Link to="/agb-busunternehmen" className="inline-block py-1 hover:text-foreground">AGB (Busunternehmen)</Link></li>
            <li><Link to="/nutzungsbedingungen" className="inline-block py-1 hover:text-foreground">Nutzungsbedingungen</Link></li>
            <li><Link to="/barrierefreiheit" className="inline-block py-1 hover:text-foreground">Barrierefreiheit</Link></li>
            <li><button type="button" onClick={oeffneEinstellungen} className="inline-block py-1 text-left hover:text-foreground">Cookie-Einstellungen</button></li>
          </ul>
        </div>
      </div>
      <div className="border-t">
        <p className="container-page py-6 text-xs text-muted-foreground">© {new Date().getFullYear()} Standard Plus. Alle Rechte vorbehalten.</p>
      </div>
    </footer>
  );
}
