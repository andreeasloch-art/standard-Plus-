/* SMS-Codes zur Anmeldung und Registrierung – nur auf dem Server. Versand über Twilio Verify.
 *
 * Warum Twilio Verify statt einfacher SMS: Verify erzeugt und prüft den Code selbst, verschickt ihn in
 * der Sprache der Person und bringt mit „Fraud Guard“ einen eigenen Schutz gegen SMS-Pumping mit.
 * In der Twilio-Konsole außerdem unter Verify → Geo Permissions nur die Länder aus SMS_LAENDER erlauben.
 *
 * Kostenbremsen in Standard Plus selbst (alle schließen im Zweifel: Klappt die Zählung nicht, geht KEINE SMS raus):
 *   - je Nummer:           3 Codes pro Stunde, 5 pro Tag
 *   - je Internetadresse:  5 Codes pro Stunde, 15 pro Tag
 *   - je Land und Tag:     SMS_LAND_TAGESLIMIT (Kernländer, Standard 150), 25 für zusätzlich freigeschaltete Länder
 *   - insgesamt pro Tag:   SMS_TAGESLIMIT (Standard 300)
 *   - Prüfversuche:        5 pro Nummer und Stunde
 *   - Anmeldung nur für bekannte Nummern, Registrierung nur für neue Nummern und neue Personen/Firmen
 *   - optional Bot-Prüfung (Cloudflare Turnstile), sobald TURNSTILE_SECRET_KEY gesetzt ist
 * Bei 300 SMS am Tag und rund 5–10 Cent je SMS sind das höchstens etwa 15–30 € pro Tag, auch wenn es jemand
 * darauf anlegt. Für mehr Spielraum die Werte in Lovable unter Secrets erhöhen. */
import { getRequestHeader } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { istKernland, laenderAusEinstellung, smsNummerPruefen, type SmsAblehnung } from "@/lib/sms-regeln";

export type SmsFehler = SmsAblehnung | "aus" | "limit" | "budget" | "fehler" | "falsch" | "bot"
  | "unbekannt" | "vergeben" | "konto_existiert" | "angaben";
export type SmsZweck = "login" | "registrieren";
export type RegMeta = Record<string, string>;

const env = (k: string) => process.env[k] || "";
const zahl = (k: string, d: number) => {
  const v = Number(process.env[k]);
  return Number.isFinite(v) && v > 0 ? v : d;
};
const STUNDE = 3600_000;
const TAG = 24 * STUNDE;
const seit = (ms: number) => new Date(Date.now() - ms).toISOString();

export function smsEingerichtet() {
  return !!(env("TWILIO_ACCOUNT_SID") && env("TWILIO_AUTH_TOKEN") && env("TWILIO_VERIFY_SERVICE_SID"));
}

function clientIp() {
  const fwd = getRequestHeader("x-forwarded-for") || "";
  return fwd.split(",")[0]?.trim() || getRequestHeader("x-real-ip") || "unbekannt";
}

/** Datensparsam: nur ein gekürzter Hash, nie Nummer oder IP selbst. */
async function hash(v: string) {
  const salz = env("RATE_LIMIT_SALT") || "standard-plus-sms";
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${salz}:${v}`));
  return Array.from(new Uint8Array(buf).slice(0, 16), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Anzahl Einträge; bei einem Fehler „unendlich“, damit keine SMS rausgeht. */
async function zaehle(f: { art: "senden" | "pruefen"; spalte?: "nummer_hash" | "ip_hash" | "land"; wert?: string; ms: number }) {
  let q = supabaseAdmin.from("sms_log").select("id", { count: "exact", head: true }).eq("art", f.art).gte("created_at", seit(f.ms));
  if (f.spalte && f.wert) q = q.eq(f.spalte, f.wert);
  const { count, error } = await q;
  return error ? Number.POSITIVE_INFINITY : count ?? 0;
}

async function protokoll(art: "senden" | "pruefen", nummer: string, ip: string, land: string, ok: boolean) {
  await supabaseAdmin.from("sms_log").insert({ art, nummer_hash: nummer, ip_hash: ip, land, ok });
}

async function twilio(pfad: string, body: Record<string, string>) {
  const auth = btoa(`${env("TWILIO_ACCOUNT_SID")}:${env("TWILIO_AUTH_TOKEN")}`);
  const res = await fetch(`https://verify.twilio.com/v2/Services/${env("TWILIO_VERIFY_SERVICE_SID")}/${pfad}`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body).toString(),
  });
  const json = (await res.json().catch(() => ({}))) as { status?: string };
  return { ok: res.ok, status: json.status };
}

/** Bot-Prüfung (Cloudflare Turnstile). Ohne TURNSTILE_SECRET_KEY immer erlaubt. */
async function keinBot(token: string | undefined) {
  const geheim = env("TURNSTILE_SECRET_KEY");
  if (!geheim) return true;
  if (!token) return false;
  try {
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret: geheim, response: token, remoteip: clientIp() }).toString(),
    });
    const j = (await r.json()) as { success?: boolean };
    return j.success === true;
  } catch {
    return false;
  }
}

async function profilZuNummer(e164: string) {
  const { data } = await supabaseAdmin.from("profiles").select("id").eq("telefon", e164).maybeSingle();
  return data?.id ?? null;
}

/** Code verschicken, wenn alle Bremsen es erlauben. */
export async function codeSenden(roh: string, zweck: SmsZweck, meta: RegMeta | null, botToken: string | undefined, sprache: string):
  Promise<{ ok: true; nummer: string } | { fehler: SmsFehler }> {
  if (!smsEingerichtet()) return { fehler: "aus" };
  const ziel = smsNummerPruefen(roh, laenderAusEinstellung(env("SMS_EXTRA_LAENDER")));
  if ("abgelehnt" in ziel) return { fehler: ziel.abgelehnt };
  if (!(await keinBot(botToken))) return { fehler: "bot" };

  // Teure SMS nur, wenn sie zum Ziel führen kann
  const vorhanden = await profilZuNummer(ziel.e164);
  if (zweck === "login" && !vorhanden) return { fehler: "unbekannt" };
  if (zweck === "registrieren") {
    if (vorhanden) return { fehler: "vergeben" };
    if (!meta) return { fehler: "angaben" };
    const { data: frei, error } = await supabaseAdmin.rpc("konto_frei", {
      _rolle: meta["rolle"] ?? "arbeitnehmer", _vorname: meta["vorname"] ?? "", _nachname: meta["nachname"] ?? "",
      _geburtsdatum: meta["geburtsdatum"] || null, _register_nr: meta["register_nr"] ?? "",
    } as never);
    if (error) return { fehler: "fehler" };
    if (frei === false) return { fehler: "konto_existiert" };
  }

  const nr = await hash(ziel.e164);
  const ip = await hash(clientIp());
  const grenzen: [number, number][] = [
    [await zaehle({ art: "senden", spalte: "nummer_hash", wert: nr, ms: STUNDE }), 3],
    [await zaehle({ art: "senden", spalte: "nummer_hash", wert: nr, ms: TAG }), 5],
    [await zaehle({ art: "senden", spalte: "ip_hash", wert: ip, ms: STUNDE }), 5],
    [await zaehle({ art: "senden", spalte: "ip_hash", wert: ip, ms: TAG }), 15],
  ];
  if (grenzen.some(([n, max]) => n >= max)) return { fehler: "limit" };
  const jeLand = istKernland(ziel.land) ? zahl("SMS_LAND_TAGESLIMIT", 150) : 25;
  if ((await zaehle({ art: "senden", spalte: "land", wert: ziel.land, ms: TAG })) >= jeLand) return { fehler: "budget" };
  if ((await zaehle({ art: "senden", ms: TAG })) >= zahl("SMS_TAGESLIMIT", 300)) return { fehler: "budget" };

  // Erst zählen, dann senden: Auch ein Fehlversuch bei Twilio verbraucht Kontingent
  await protokoll("senden", nr, ip, ziel.land, true);
  const r = await twilio("Verifications", { To: ziel.e164, Channel: "sms", Locale: ["de", "en", "ro", "pl", "es", "fr", "it"].includes(sprache) ? sprache : "de" })
    .catch(() => ({ ok: false, status: undefined }));
  if (!r.ok) return { fehler: "fehler" };
  return { ok: true, nummer: ziel.e164 };
}

/** Eigener, kurzlebiger Zugang nur für das Ausstellen der Sitzung – NICHT der gemeinsame Admin-Zugang,
 *  denn verifyOtp merkt sich die Sitzung im Client und würde ihn sonst zum Nutzer-Zugang machen. */
function wegwerfClient() {
  const url = env("SUPABASE_URL");
  const key = env("SUPABASE_SERVICE_ROLE_KEY");
  const neu = key.startsWith("sb_secret_") || key.startsWith("sb_publishable_");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (neu && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

/* Konten mit Handynummer bekommen intern eine Ersatzadresse. An sie geht nie eine E-Mail
   (die Datenbank trägt sie nicht ins Profil ein, siehe intern.echte_email). Eine Nummer = ein Konto. */
const ERSATZ_DOMAIN = "sms.standard-plus.invalid";
const ersatzMail = (e164: string) => `p${e164.replace(/\D/g, "")}@${ERSATZ_DOMAIN}`;

/** Code prüfen; bei Erfolg Konto anlegen (Registrierung) bzw. finden (Anmeldung) und eine Sitzung ausstellen. */
export async function codePruefen(roh: string, code: string, zweck: SmsZweck, meta: RegMeta | null):
  Promise<{ access_token: string; refresh_token: string } | { fehler: SmsFehler }> {
  if (!smsEingerichtet()) return { fehler: "aus" };
  const ziel = smsNummerPruefen(roh, laenderAusEinstellung(env("SMS_EXTRA_LAENDER")));
  if ("abgelehnt" in ziel) return { fehler: ziel.abgelehnt };
  const token = String(code || "").replace(/\D/g, "");
  if (token.length < 4 || token.length > 10) return { fehler: "falsch" };

  const nr = await hash(ziel.e164);
  const ip = await hash(clientIp());
  if ((await zaehle({ art: "pruefen", spalte: "nummer_hash", wert: nr, ms: STUNDE })) >= 5) return { fehler: "limit" };
  const r = await twilio("VerificationCheck", { To: ziel.e164, Code: token }).catch(() => ({ ok: false, status: undefined }));
  const richtig = r.ok && r.status === "approved";
  await protokoll("pruefen", nr, ip, ziel.land, richtig);
  if (!richtig) return { fehler: "falsch" };

  let uid = await profilZuNummer(ziel.e164);
  let email = ersatzMail(ziel.e164);
  if (!uid) {
    if (zweck !== "registrieren" || !meta) return { fehler: "unbekannt" };
    // Anlegen löst handle_new_user aus: prüft Pflichtangaben, Mindestalter und „ein Konto pro Person/Firma“
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      phone: ziel.e164, phone_confirm: true, email, email_confirm: true, user_metadata: { ...meta, kanal: "telefon" },
    });
    if (error || !data.user) {
      const m = (error?.message ?? "").toLowerCase();
      return { fehler: m.includes("database") || m.includes("konto_existiert") || m.includes("already") ? "konto_existiert" : "fehler" };
    }
    uid = data.user.id;
  } else {
    const { data } = await supabaseAdmin.auth.admin.getUserById(uid);
    if (data.user?.email) email = data.user.email;
    // Ältere Konten ohne E-Mail (früher über den eingebauten SMS-Weg angelegt) bekommen die Ersatzadresse
    else await supabaseAdmin.auth.admin.updateUserById(uid, { email, email_confirm: true });
  }

  // Sitzung über einen Einmal-Link ausstellen (verlässt nie den Server, es bleibt kein Passwort übrig)
  const { data: link, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({ type: "magiclink", email });
  const hashToken = link?.properties?.hashed_token;
  if (linkErr || !hashToken) return { fehler: "fehler" };
  const { data: s } = await wegwerfClient().auth.verifyOtp({ type: "magiclink", token_hash: hashToken });
  if (!s.session) return { fehler: "fehler" };
  return { access_token: s.session.access_token, refresh_token: s.session.refresh_token };
}
