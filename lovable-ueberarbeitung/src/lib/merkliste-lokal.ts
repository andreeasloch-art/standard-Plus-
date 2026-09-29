import { useSyncExternalStore } from "react";

/**
 * Kleine Merkliste im Browser (sessionStorage). Wird genutzt, solange niemand
 * als Unternehmen angemeldet ist – nach der Anmeldung zählt die Datenbank.
 */
export function lokaleListe<T>(schluessel: string) {
  let wert: T[] = [];
  let geladen = false;
  const hoerer = new Set<() => void>();

  const laden = () => {
    if (geladen || typeof window === "undefined") return;
    geladen = true;
    try {
      const roh = sessionStorage.getItem(schluessel);
      if (roh) wert = JSON.parse(roh) as T[];
    } catch { /* Speicher gesperrt – dann nur im Speicher */ }
  };

  const setzen = (neu: T[]) => {
    wert = neu;
    try { sessionStorage.setItem(schluessel, JSON.stringify(neu)); } catch { /* ignorieren */ }
    hoerer.forEach((h) => h());
  };

  const abonnieren = (h: () => void) => { hoerer.add(h); return () => hoerer.delete(h); };
  const holen = () => { laden(); return wert; };
  const LEER: T[] = [];

  return {
    setzen,
    holen,
    use: () => useSyncExternalStore(abonnieren, holen, () => LEER),
  };
}
