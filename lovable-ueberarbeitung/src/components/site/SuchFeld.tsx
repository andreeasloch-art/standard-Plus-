import { useEffect, useId, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { oeffentlicheProfileQuery } from "@/lib/profile-data";
import { cn } from "@/lib/utils";

type Art = "Beruf" | "Skill" | "Ort" | "Branche";
type Vorschlag = { text: string; art: Art };

/**
 * Suchfeld mit Autovervollständigung (ARIA-Combobox).
 * Ohne onSuche führt Enter/Auswahl zur Talente-Seite mit ?q=…
 */
export function SuchFeld({
  wert = "",
  onSuche,
  onAenderung,
  gross = false,
  className,
}: {
  wert?: string;
  onSuche?: (q: string) => void;
  onAenderung?: (q: string) => void;
  gross?: boolean;
  className?: string;
}) {
  const { data } = useQuery(oeffentlicheProfileQuery);
  const navigate = useNavigate();
  const [q, setQ] = useState(wert);
  const [offen, setOffen] = useState(false);
  const [aktiv, setAktiv] = useState(-1);
  const basisId = useId();
  const inputId = `${basisId}-eingabe`;
  const listId = `${basisId}-liste`;

  useEffect(() => setQ(wert), [wert]);

  const alle = useMemo(() => {
    const m = new Map<string, Vorschlag>();
    const add = (text: string | null | undefined, art: Art) => {
      const t = text?.trim();
      if (t && !m.has(t.toLowerCase())) m.set(t.toLowerCase(), { text: t, art });
    };
    for (const p of data ?? []) {
      add(p.beruf, "Beruf");
      add(p.branche, "Branche");
      p.skills.forEach((s) => add(s, "Skill"));
      add(p.wohnort, "Ort");
      add(p.zielort, "Ort");
      add(p.land, "Ort");
    }
    return [...m.values()];
  }, [data]);

  const vorschlaege = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return alle
      .filter((v) => v.text.toLowerCase().includes(s))
      .sort(
        (a, b) =>
          Number(!a.text.toLowerCase().startsWith(s)) - Number(!b.text.toLowerCase().startsWith(s)) ||
          a.text.localeCompare(b.text, "de"),
      )
      .slice(0, 8);
  }, [alle, q]);

  const zeige = offen && vorschlaege.length > 0;

  const absenden = (text: string) => {
    const t = text.trim();
    setQ(t);
    setOffen(false);
    setAktiv(-1);
    onAenderung?.(t);
    if (onSuche) onSuche(t);
    else navigate({ to: "/talente", search: { q: t || undefined } });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOffen(true);
      setAktiv((i) => (vorschlaege.length ? (i + 1) % vorschlaege.length : -1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setAktiv((i) => (vorschlaege.length ? (i <= 0 ? vorschlaege.length - 1 : i - 1) : -1));
    } else if (e.key === "Escape") {
      if (zeige) {
        e.preventDefault();
        setOffen(false);
        setAktiv(-1);
      }
    }
  };

  return (
    <form
      role="search"
      className={cn("relative w-full", className)}
      onSubmit={(e) => {
        e.preventDefault();
        absenden(zeige && aktiv >= 0 ? vorschlaege[aktiv].text : q);
      }}
    >
      <label htmlFor={inputId} className="sr-only">
        Nach Beruf, Skill oder Ort suchen
      </label>
      <div
        className={cn(
          "flex items-center gap-2 rounded-2xl border bg-card shadow-soft transition focus-within:ring-2 focus-within:ring-ring",
          gross ? "p-2 pl-4" : "p-1.5 pl-3",
        )}
      >
        <Search className={cn("shrink-0 text-muted-foreground", gross ? "h-5 w-5" : "h-4 w-4")} aria-hidden />
        <input
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={zeige}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={zeige && aktiv >= 0 ? `${listId}-${aktiv}` : undefined}
          autoComplete="off"
          maxLength={100}
          placeholder="Beruf, Skill oder Ort"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOffen(true);
            setAktiv(-1);
            onAenderung?.(e.target.value);
          }}
          onFocus={() => setOffen(true)}
          onBlur={() => setOffen(false)}
          onKeyDown={onKeyDown}
          className={cn(
            "min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground",
            gross ? "h-11 text-base sm:text-lg" : "h-9 text-sm",
          )}
        />
        <button
          type="submit"
          className={cn(
            "shrink-0 rounded-xl bg-primary font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            gross ? "h-11 px-5" : "h-9 px-4 text-sm",
          )}
        >
          Suchen
        </button>
      </div>

      <ul
        id={listId}
        role="listbox"
        aria-label="Vorschläge"
        hidden={!zeige}
        className="absolute inset-x-0 top-full z-40 mt-2 overflow-hidden rounded-2xl border bg-popover py-1 shadow-lift"
      >
        {vorschlaege.map((v, i) => (
          <li
            key={`${v.art}-${v.text}`}
            id={`${listId}-${i}`}
            role="option"
            aria-selected={i === aktiv}
            onMouseDown={(e) => {
              e.preventDefault();
              absenden(v.text);
            }}
            onMouseEnter={() => setAktiv(i)}
            className={cn(
              "flex cursor-pointer items-center justify-between gap-3 px-4 py-2.5 text-sm",
              i === aktiv && "bg-surface",
            )}
          >
            <span>
              <Hervorheben text={v.text} suche={q} />
            </span>
            <span className="text-xs text-muted-foreground">{v.art}</span>
          </li>
        ))}
      </ul>
    </form>
  );
}

function Hervorheben({ text, suche }: { text: string; suche: string }) {
  const s = suche.trim();
  const i = s ? text.toLowerCase().indexOf(s.toLowerCase()) : -1;
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <strong className="font-semibold">{text.slice(i, i + s.length)}</strong>
      {text.slice(i + s.length)}
    </>
  );
}
