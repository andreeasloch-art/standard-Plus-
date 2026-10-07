import { db, aufrufe } from "./fake-supabase";
import { codeSenden, codePruefen } from "../src/lib/sms.server";
import { smsNummerPruefen, laenderAusEinstellung } from "../src/lib/sms-regeln";
let fehler = 0;
const ok = (b: boolean, t: string) => { console.log((b ? "OK   " : "FEHLT") + " " + t); if (!b) fehler++; };
const twilioAufrufe: string[] = [];
let twilioStatus = "approved";
(globalThis as any).fetch = async (url: string, init: any) => {
  twilioAufrufe.push(String(url).split("/").pop()!);
  return new Response(JSON.stringify({ status: String(url).endsWith("VerificationCheck") ? twilioStatus : "pending" }), { status: 200 });
};
const meta = { rolle: "arbeitnehmer", vorname: "Ana", nachname: "Pop", geburtsdatum: "1990-01-01", datenschutz_version: "x", bedingungen_version: "x", unternehmer: "false", sichtbar: "true" };

// Regeln
ok("e164" in smsNummerPruefen("+4915123456789"), "DE Handy erlaubt");
ok(JSON.stringify(smsNummerPruefen("+4930123456")) === '{"abgelehnt":"festnetz"}', "DE Festnetz abgelehnt");
ok(JSON.stringify(smsNummerPruefen("+499001234567")) === '{"abgelehnt":"festnetz"}', "DE 0900-Sondernummer abgelehnt");
ok("e164" in smsNummerPruefen("+40712345678"), "RO Handy erlaubt");
ok(JSON.stringify(smsNummerPruefen("+2348031234567")) === '{"abgelehnt":"land"}', "Nigeria abgelehnt");
ok("e164" in smsNummerPruefen("+2348031234567", ["NG"]), "Nigeria mit Freischaltung erlaubt");
ok(JSON.stringify(smsNummerPruefen("123")) === '{"abgelehnt":"ungueltig"}', "Unsinn abgelehnt");
ok(JSON.stringify(laenderAusEinstellung("ng, pt;xx1 BR")) === '["NG","PT","BR"]', "Länderliste aus Einstellung");

// Ohne Twilio-Zugang: "aus"
ok(JSON.stringify(await codeSenden("+4915123456789", "login", null, undefined, "de")) === '{"fehler":"aus"}', "Ohne Twilio: aus");
process.env["TWILIO_ACCOUNT_SID"] = "AC1"; process.env["TWILIO_AUTH_TOKEN"] = "t"; process.env["TWILIO_VERIFY_SERVICE_SID"] = "VA1";

// Anmeldung nur für bekannte Nummern – ohne SMS
let r: any = await codeSenden("+4915123456789", "login", null, undefined, "de");
ok(r.fehler === "unbekannt" && twilioAufrufe.length === 0, "Login unbekannte Nummer: keine SMS");

// Registrierung: Person existiert schon → keine SMS
db.frei = false;
r = await codeSenden("+4915123456789", "registrieren", meta, undefined, "de");
ok(r.fehler === "konto_existiert" && twilioAufrufe.length === 0, "Person schon registriert: keine SMS");
db.frei = true;

// Registrierung: 3 SMS pro Stunde, die 4. wird gebremst
for (let i = 0; i < 3; i++) r = await codeSenden("+4915123456789", "registrieren", meta, undefined, "de");
ok(r.ok === true && twilioAufrufe.filter((x) => x === "Verifications").length === 3, "3 SMS verschickt");
r = await codeSenden("+4915123456789", "registrieren", meta, undefined, "de");
ok(r.fehler === "limit" && twilioAufrufe.filter((x) => x === "Verifications").length === 3, "4. SMS je Nummer und Stunde gebremst");
ok(db.sms_log.every((z) => !String(z.nummer_hash).includes("4915") && z.ip_hash !== "203.0.113.7"), "Nur Hashes gespeichert, keine Nummer/IP");

// Fail-closed: Zählung kaputt → keine SMS
db.fehlerBeimZaehlen = true;
r = await codeSenden("+4915111111111", "registrieren", meta, undefined, "de");
ok(r.fehler === "limit", "Zählfehler: keine SMS (schließt im Zweifel)");
db.fehlerBeimZaehlen = false;

// Tageslimit gesamt
process.env["SMS_TAGESLIMIT"] = String(db.sms_log.filter((z) => z.art === "senden").length);
const kopf = (await import("./stub-server")).kopf; kopf["x-forwarded-for"] = "198.51.100.9";
r = await codeSenden("+4915222222222", "registrieren", meta, undefined, "de");
ok(r.fehler === "budget", "Tageslimit erreicht: keine SMS mehr");
delete process.env["SMS_TAGESLIMIT"];

// Bot-Prüfung, sobald Schlüssel gesetzt
process.env["TURNSTILE_SECRET_KEY"] = "geheim";
r = await codeSenden("+4915333333333", "registrieren", meta, undefined, "de");
ok(r.fehler === "bot", "Mit Turnstile-Schlüssel: ohne Token keine SMS");
delete process.env["TURNSTILE_SECRET_KEY"];

// Code prüfen
twilioStatus = "pending";
r = await codePruefen("+4915123456789", "123456", "registrieren", meta);
ok(r.fehler === "falsch", "Falscher Code abgelehnt");
twilioStatus = "approved";
r = await codePruefen("+4915123456789", "123456", "registrieren", meta);
ok(r.access_token === "A" && aufrufe.some((a) => a === "createUser:+4915123456789") && aufrufe.some((a) => a.startsWith("link:p4915123456789@sms.standard-plus.invalid")), "Richtiger Code: Konto angelegt, Sitzung ausgestellt");
// Danach Anmeldung mit derselben Nummer
r = await codeSenden("+4915123456789", "registrieren", meta, undefined, "de");
ok(r.fehler === "vergeben", "Nummer vergeben: Registrierung ohne SMS abgelehnt");
kopf["x-forwarded-for"] = "192.0.2.50";
r = await codeSenden("+4915123456789", "login", null, undefined, "de");
ok(r.fehler === "limit" || r.ok === true, "Login mit bekannter Nummer geht (bis zum Nummernlimit)");

console.log(fehler ? `\n${fehler} Prüfung(en) fehlgeschlagen` : "\nAlle Prüfungen bestanden");
process.exit(fehler ? 1 : 0);
