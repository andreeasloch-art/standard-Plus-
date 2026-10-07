/* Wer bekommt einen SMS-Code? Regeln gegen Kostenmissbrauch („SMS-Pumping“).
 *
 * Jede SMS kostet Geld. Betrüger fordern über Anmeldeformulare massenhaft Codes an teure
 * Auslands- und Sondernummern an und verdienen an den Gebühren mit. Deshalb gilt,
 * bevor überhaupt eine SMS rausgeht:
 *
 *  1. Nur echte Handynummern. Festnetz-, Sonder-, Premium- und Satellitennummern bekommen keine SMS.
 *  2. Nur Länder auf der Liste (SMS_LAENDER in laender.ts). Weitere Länder schaltet die Verwaltung
 *     über das Secret SMS_EXTRA_LAENDER frei. Alle anderen registrieren sich kostenlos per E-Mail.
 *  3. Mengenbremsen je Nummer, je Internetadresse, je Land und insgesamt pro Tag (lib/sms.server.ts).
 *
 * Diese Datei enthält nur die Prüfung der Nummer (rein, ohne Server – testbar). */
import { parsePhoneNumberFromString } from "libphonenumber-js/max";
import { SMS_LAENDER } from "@/lib/laender";

export type SmsAblehnung = "ungueltig" | "festnetz" | "land";
export type SmsZiel = { e164: string; land: string };

/** Nummer prüfen. `extra`: zusätzlich freigeschaltete Länder (ISO, groß). */
export function smsNummerPruefen(roh: string, extra: readonly string[] = []): SmsZiel | { abgelehnt: SmsAblehnung } {
  const p = parsePhoneNumberFromString(String(roh || "").trim());
  if (!p || !p.isValid() || !p.country) return { abgelehnt: "ungueltig" };
  const typ = p.getType();
  // USA und Kanada unterscheiden Handy und Festnetz nicht: dort zählt FIXED_LINE_OR_MOBILE als Handy
  if (typ !== "MOBILE" && typ !== "FIXED_LINE_OR_MOBILE") return { abgelehnt: "festnetz" };
  if (!SMS_LAENDER.has(p.country) && !extra.includes(p.country)) return { abgelehnt: "land" };
  return { e164: p.number, land: p.country };
}

/** Kernland (feste Liste)? Für zusätzlich freigeschaltete Länder gilt ein niedrigeres Tageslimit. */
export const istKernland = (land: string) => SMS_LAENDER.has(land);

/** Zusätzlich freigeschaltete Länder aus einer Einstellung wie "PT, gr;NL". */
export function laenderAusEinstellung(v: string | undefined): string[] {
  return String(v || "")
    .split(/[\s,;]+/)
    .map((c) => c.trim().toUpperCase())
    .filter((c) => /^[A-Z]{2}$/.test(c));
}
