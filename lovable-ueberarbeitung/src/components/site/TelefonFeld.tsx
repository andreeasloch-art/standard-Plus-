import { useMemo } from "react";
import { HAEUFIG, laenderListe } from "@/lib/laender";

/** Ländervorwahl (alle Länder der Welt) + Handynummer. */
export function TelefonFeld({
  land,
  onLand,
  nummer,
  onNummer,
  error,
}: {
  land: string;
  onLand: (iso: string) => void;
  nummer: string;
  onNummer: (n: string) => void;
  error?: string;
}) {
  const liste = useMemo(() => laenderListe("de"), []);
  const oben = HAEUFIG.map((iso) => liste.find((l) => l.iso === iso)).filter((l): l is NonNullable<typeof l> => !!l);
  const option = (l: { iso: string; vorwahl: string; name: string }) => (
    <option key={l.iso} value={l.iso}>{`+${l.vorwahl} ${l.name}`}</option>
  );
  return (
    <div>
      <label htmlFor="telefon" className="text-sm font-medium">Handynummer <span aria-hidden>*</span></label>
      <div className="mt-1.5 grid grid-cols-[minmax(0,9.5rem)_minmax(0,1fr)] gap-2">
        <select
          id="land"
          aria-label="Land und Vorwahl"
          className="field appearance-none truncate pr-2"
          value={land}
          onChange={(e) => onLand(e.target.value)}
          autoComplete="tel-country-code"
        >
          <optgroup label="Häufig">{oben.map(option)}</optgroup>
          <optgroup label="Alle Länder">{liste.map(option)}</optgroup>
        </select>
        <input
          id="telefon"
          name="telefon"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="z. B. 170 1234567"
          className="field"
          value={nummer}
          onChange={(e) => onNummer(e.target.value)}
          required
          aria-required
          aria-invalid={!!error}
          aria-describedby={error ? "telefon-err" : "telefon-hilfe"}
        />
      </div>
      {error ? (
        <p id="telefon-err" className="mt-1 text-sm text-destructive">{error}</p>
      ) : (
        <p id="telefon-hilfe" className="mt-1 text-xs text-muted-foreground">Wir schicken Ihnen einen Code per SMS. Ohne führende 0 oder mit – beides geht.</p>
      )}
    </div>
  );
}

/** Eingabe für den 6-stelligen SMS-Code (füllt sich auf dem Handy automatisch). */
export function CodeFeld({ wert, onWert, error }: { wert: string; onWert: (c: string) => void; error?: string }) {
  return (
    <div>
      <label htmlFor="code" className="text-sm font-medium">Code aus der SMS <span aria-hidden>*</span></label>
      <input
        id="code"
        name="code"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        maxLength={6}
        className="field schrift-tafel mt-1.5 text-center text-2xl tracking-[0.5em]"
        value={wert}
        onChange={(e) => onWert(e.target.value.replace(/\D/g, "").slice(0, 6))}
        aria-invalid={!!error}
        aria-describedby={error ? "code-err" : undefined}
        autoFocus
      />
      {error && <p id="code-err" className="mt-1 text-sm text-destructive">{error}</p>}
    </div>
  );
}
