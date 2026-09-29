import { useEffect, useState } from "react";

type InstallEreignis = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

let gemerkt: InstallEreignis | null = null;
let registriert = false;
const hoerer = new Set<() => void>();

/**
 * Service Worker nur in der veröffentlichten Seite registrieren –
 * nicht in der Lovable-Vorschau und nicht in einem eingebetteten Rahmen.
 */
export function registriereApp() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  if (!import.meta.env.PROD || window.top !== window.self || location.hostname.startsWith("id-preview--")) return;
  if (registriert) return;
  registriert = true;
  const los = () => navigator.serviceWorker.register("/sw.js").catch(() => { /* ohne App-Funktion weiter */ });
  if (document.readyState === "complete") los();
  else window.addEventListener("load", los, { once: true });
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    gemerkt = e as InstallEreignis;
    hoerer.forEach((h) => h());
  });
  window.addEventListener("appinstalled", () => {
    gemerkt = null;
    hoerer.forEach((h) => h());
  });
}

export function istAlsAppGeoeffnet() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
}

function istIOS() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

/** Zustand für den Knopf „App installieren“. */
export function useAppInstallation() {
  const [, neu] = useState(0);
  const [bereit, setBereit] = useState(false);
  useEffect(() => {
    setBereit(true);
    const h = () => neu((n) => n + 1);
    hoerer.add(h);
    return () => { hoerer.delete(h); };
  }, []);

  const installiert = bereit && istAlsAppGeoeffnet();
  return {
    /** Android, Chrome, Edge: direkt installierbar */
    direkt: bereit && !installiert && !!gemerkt,
    /** iPhone/iPad: nur über „Teilen → Zum Home-Bildschirm“ */
    ios: bereit && !installiert && !gemerkt && istIOS(),
    installiert,
    installieren: async () => {
      if (!gemerkt) return false;
      await gemerkt.prompt();
      const { outcome } = await gemerkt.userChoice;
      gemerkt = null;
      hoerer.forEach((h) => h());
      return outcome === "accepted";
    },
  };
}
