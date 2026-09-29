import { Check } from "lucide-react";

export type Vorteil = { text: string; bald?: boolean };

/** Kurze Vorteilsliste; noch nicht verfügbare Funktionen bekommen ein kleines Badge statt Erklärtext. */
export function Vorteile({ liste }: { liste: Vorteil[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {liste.map((v) => (
        <li key={v.text} className="card-base flex items-center gap-3 p-4">
          <Check className="h-5 w-5 shrink-0 text-tuerkis-600 dark:text-tuerkis-300" aria-hidden />
          <span className="flex-1">{v.text}</span>
          {v.bald && <Bald />}
        </li>
      ))}
    </ul>
  );
}

export function Bald() {
  return (
    <span className="shrink-0 rounded-full border border-dashed px-2 py-0.5 text-xs font-medium text-muted-foreground">
      in Vorbereitung
    </span>
  );
}
