import type { OeffentlichesProfil } from "@/lib/profile-data";

const FUELLWOERTER = new Set(["in", "nach", "für", "fuer", "und", "als", "im", "aus", "z.", "b."]);

/** Zerlegt eine Suche wie „Koch in Paris“ in Begriffe – jeder Begriff muss irgendwo im Profil vorkommen. */
export function suchBegriffe(suche: string) {
  return suche
    .toLowerCase()
    .split(/[\s,]+/)
    .filter((w) => w && !FUELLWOERTER.has(w));
}

export function passtZurSuche(p: OeffentlichesProfil, suche: string) {
  const begriffe = suchBegriffe(suche);
  if (!begriffe.length) return true;
  const felder = [p.anzeigename, p.beruf, p.branche, p.land, p.wohnort, p.zielort, ...p.skills]
    .filter(Boolean)
    .map((x) => x!.toLowerCase());
  return begriffe.every((b) => felder.some((f) => f.includes(b)));
}
