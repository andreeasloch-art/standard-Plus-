import { useEffect, useRef } from "react";

/**
 * Unsichtbare Bot-Prüfung (Cloudflare Turnstile) vor dem Versand von SMS-Codes und Bestätigungs-E-Mails.
 * Aktiv nur, wenn VITE_TURNSTILE_SITE_KEY gesetzt ist – sonst rendert die Komponente nichts.
 * Das Skript wird erst auf der Anmeldeseite geladen, nicht auf der übrigen Website.
 * Serverseitig prüft Supabase das Token, sobald dort „Captcha protection“ mit dem geheimen Schlüssel eingeschaltet ist.
 */
const SCHLUESSEL = (import.meta.env["VITE_TURNSTILE_SITE_KEY"] as string | undefined) ?? "";
export const botSchutzAktiv = !!SCHLUESSEL;

type Turnstile = {
  render: (el: HTMLElement, o: Record<string, unknown>) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};
declare global { interface Window { turnstile?: Turnstile } }

let laden: Promise<void> | null = null;
function skriptLaden() {
  laden ??= new Promise((ok, fehler) => {
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    s.onload = () => ok();
    s.onerror = () => { laden = null; fehler(new Error("Bot-Prüfung konnte nicht geladen werden.")); };
    document.head.appendChild(s);
  });
  return laden;
}

/** `zuruecksetzen` erhöhen, um nach einem Versand ein neues Token zu holen (Tokens gelten nur einmal). */
export function BotSchutz({ onToken, zuruecksetzen = 0 }: { onToken: (t: string | null) => void; zuruecksetzen?: number }) {
  const box = useRef<HTMLDivElement>(null);
  const id = useRef<string | null>(null);

  useEffect(() => {
    if (!SCHLUESSEL) return undefined;
    let aktiv = true;
    skriptLaden()
      .then(() => {
        if (!aktiv || !box.current || !window.turnstile || id.current) return;
        id.current = window.turnstile.render(box.current, {
          sitekey: SCHLUESSEL,
          language: "de",
          appearance: "interaction-only",
          callback: (t: string) => onToken(t),
          "expired-callback": () => onToken(null),
          "error-callback": () => onToken(null),
        });
      })
      .catch(() => onToken(null));
    return () => {
      aktiv = false;
      if (id.current && window.turnstile) window.turnstile.remove(id.current);
      id.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (zuruecksetzen && id.current && window.turnstile) { onToken(null); window.turnstile.reset(id.current); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zuruecksetzen]);

  if (!SCHLUESSEL) return null;
  return <div ref={box} className="min-h-0" />;
}
