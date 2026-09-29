import { useEffect, useRef, useState } from "react";

/** Zeigt `schritt` Einträge und lädt beim Runterscrollen automatisch weitere nach. */
export function useMehrLaden(gesamt: number, schritt = 6) {
  const [anzahl, setAnzahl] = useState(schritt);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setAnzahl(schritt), [gesamt, schritt]);

  useEffect(() => {
    const el = ref.current;
    if (!el || anzahl >= gesamt || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setAnzahl((a) => Math.min(a + schritt, gesamt));
      },
      { rootMargin: "400px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [anzahl, gesamt, schritt]);

  return {
    anzahl,
    ref,
    mehr: anzahl < gesamt,
    weiter: () => setAnzahl((a) => Math.min(a + schritt, gesamt)),
  };
}
