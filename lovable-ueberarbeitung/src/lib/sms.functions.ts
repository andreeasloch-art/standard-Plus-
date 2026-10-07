/* Anmeldung und Registrierung per SMS-Code (Server-Funktionen). Regeln und Kostenbremsen in
 * lib/sms.server.ts und lib/sms-regeln.ts. Ist kein SMS-Dienst eingerichtet, antwortet der Server
 * mit "aus"; die App nimmt dann den eingebauten Weg von Lovable Cloud (falls dort ein SMS-Anbieter
 * hinterlegt ist) oder bietet E-Mail an. */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SmsFehler } from "@/lib/sms.server";

const metaSchema = z.object({
  rolle: z.enum(["arbeitnehmer", "arbeitgeber", "busunternehmen"]),
  vorname: z.string().trim().min(1).max(60),
  nachname: z.string().trim().min(1).max(60),
  geburtsdatum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  firma: z.string().trim().max(120).optional(),
  register_nr: z.string().trim().max(60).optional(),
  datenschutz_version: z.string().max(20),
  bedingungen_version: z.string().max(20),
  unternehmer: z.enum(["true", "false"]),
  sichtbar: z.enum(["true", "false"]),
  kanal: z.literal("telefon").optional(),
}).strict();

const eingabe = z.object({
  telefon: z.string().max(32),
  zweck: z.enum(["login", "registrieren"]),
  meta: metaSchema.nullable(),
  botToken: z.string().max(4096).optional(),
  sprache: z.string().max(5).optional(),
});

const metaOderNull = (m: z.infer<typeof metaSchema> | null) =>
  m ? Object.fromEntries(Object.entries(m).filter(([, v]) => v !== undefined)) as Record<string, string> : null;

export const smsCodeSenden = createServerFn({ method: "POST" })
  .inputValidator((d) => eingabe.parse(d))
  .handler(async ({ data }): Promise<{ ok: true; nummer: string } | { fehler: SmsFehler }> => {
    const { codeSenden } = await import("@/lib/sms.server");
    if (data.zweck === "registrieren" && !data.meta) return { fehler: "angaben" };
    return codeSenden(data.telefon, data.zweck, metaOderNull(data.meta), data.botToken, data.sprache ?? "de");
  });

export const smsCodePruefen = createServerFn({ method: "POST" })
  .inputValidator((d) => eingabe.extend({ code: z.string().max(12) }).omit({ botToken: true, sprache: true }).parse(d))
  .handler(async ({ data }): Promise<{ access_token: string; refresh_token: string } | { fehler: SmsFehler }> => {
    const { codePruefen } = await import("@/lib/sms.server");
    return codePruefen(data.telefon, data.code, data.zweck, metaOderNull(data.meta));
  });
