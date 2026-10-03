import { UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Profilfoto im Hochformat (4:5). Der Bildausschnitt sitzt im oberen Drittel,
 * damit Gesichter nicht angeschnitten werden. Ohne Foto: türkiser Platzhalter mit Initial.
 */
export function ProfilFoto({
  url,
  name,
  className,
  gross = false,
}: {
  url?: string | null;
  name: string;
  className?: string;
  gross?: boolean;
}) {
  return (
    <div className={cn("relative aspect-[4/5] w-full overflow-hidden bg-tuerkis-100", className)}>
      {url ? (
        <img
          src={url}
          alt={`Profilfoto von ${name}`}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover object-[50%_28%]"
        />
      ) : (
        <div className="foto-platzhalter flex h-full w-full flex-col items-center justify-center gap-2" role="img" aria-label={`Noch kein Foto von ${name}`}>
          {/* Avatar-Kreis statt riesigem Buchstaben – wirkt persönlicher */}
          <span
            className={cn(
              "flex items-center justify-center rounded-full bg-white/80 font-display font-bold text-tuerkis-700 shadow-soft ring-4 ring-white/50",
              gross ? "h-24 w-24 text-4xl" : "h-14 w-14 text-2xl sm:h-16 sm:w-16 sm:text-3xl",
            )}
            aria-hidden
          >
            {name.charAt(0)}
          </span>
          <span className="flex items-center gap-1 text-[11px] font-medium text-tuerkis-800/70" aria-hidden>
            <UserRound className="h-3.5 w-3.5" /> kein Foto
          </span>
        </div>
      )}
    </div>
  );
}
