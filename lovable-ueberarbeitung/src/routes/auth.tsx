import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Building2, Bus, Mail, Smartphone, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { internationaleNummer, laenderListe } from "@/lib/laender";
import { CodeFeld, TelefonFeld } from "@/components/site/TelefonFeld";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { modus?: "registrieren"; rolle?: "busunternehmen" | "arbeitgeber" } => ({
    ...(s["modus"] === "registrieren" ? { modus: "registrieren" as const } : {}),
    ...(s["rolle"] === "busunternehmen" || s["rolle"] === "arbeitgeber" ? { rolle: s["rolle"] as "busunternehmen" | "arbeitgeber" } : {}),
  }),
  head: () => ({
    meta: [
      { title: "Anmelden oder registrieren – Standard Plus" },
      { name: "description", content: "Melden Sie sich an oder registrieren Sie sich kostenlos – mit Handynummer oder E-Mail." },
      { property: "og:title", content: "Anmelden – Standard Plus" },
      { property: "og:description", content: "Kostenlos registrieren als Arbeitgeber oder Arbeitnehmer." },
    ],
  }),
  component: AuthPage,
});

const loginSchema = z.object({
  email: z.string().trim().min(1, "Bitte E-Mail-Adresse eingeben.").email("Bitte eine gültige E-Mail-Adresse eingeben.").max(255),
  passwort: z.string().min(1, "Bitte Passwort eingeben."),
});
export const DATENSCHUTZ_VERSION = "2026-10-04";
export const BEDINGUNGEN_VERSION = "2026-09-29";
const zustimmungen = {
  datenschutz: z.literal("on", { errorMap: () => ({ message: "Bitte bestätigen Sie, dass Sie die Datenschutzerklärung gelesen haben." }) }),
  bedingungen: z.literal("on", { errorMap: () => ({ message: "Bitte akzeptieren Sie die Bedingungen." }) }),
  unternehmer: z.string().optional(),
  sichtbar: z.string().optional(),
};
const unternehmerPflicht = (d: { rolle: string; unternehmer?: string }) => d.rolle === "arbeitnehmer" || d.unternehmer === "on";
const unternehmerFehler = { path: ["unternehmer"], message: "Unsere Angebote richten sich ausschließlich an Unternehmer. Bitte bestätigen." };
const regSchema = z.object({
  rolle: z.enum(["arbeitgeber", "arbeitnehmer", "busunternehmen"], { errorMap: () => ({ message: "Bitte eine Rolle wählen." }) }),
  email: z.string().trim().min(1, "Bitte E-Mail-Adresse eingeben.").email("Bitte eine gültige E-Mail-Adresse eingeben.").max(255),
  passwort: z.string().min(8, "Das Passwort muss mindestens 8 Zeichen lang sein.").max(72, "Maximal 72 Zeichen."),
  ...zustimmungen,
}).refine(unternehmerPflicht, unternehmerFehler);
const regTelSchema = z.object({
  rolle: z.enum(["arbeitgeber", "arbeitnehmer", "busunternehmen"]),
  ...zustimmungen,
}).refine(unternehmerPflicht, unternehmerFehler);

const FELD_NAMEN: Record<string, string> = { email: "E-Mail", passwort: "Passwort", telefon: "Handynummer", code: "SMS-Code", datenschutz: "Datenschutzerklärung", bedingungen: "Bedingungen", unternehmer: "Unternehmer-Bestätigung", rolle: "Rolle" };

type Errors = Record<string, string>;
type Weg = "telefon" | "email";

/** Land aus der Browsersprache raten (z. B. „ro-RO“ → Rumänien), sonst Deutschland. */
function startLand() {
  try {
    const region = new Intl.Locale(navigator.language).maximize().region;
    if (region && laenderListe().some((l) => l.iso === region)) return region;
  } catch { /* egal */ }
  return "DE";
}

function smsFehler(msg: string) {
  const m = msg.toLowerCase();
  if (m.includes("rate") || m.includes("seconds")) return "Zu viele Versuche. Bitte warten Sie einen Moment.";
  if (m.includes("expired") || m.includes("invalid") || m.includes("token")) return "Der Code ist falsch oder abgelaufen.";
  if (m.includes("signups not allowed") || m.includes("user not found")) return "Zu dieser Nummer gibt es noch kein Konto. Bitte registrieren Sie sich.";
  if (m.includes("provider") || m.includes("disabled") || m.includes("unsupported")) return "Die Anmeldung per SMS ist gerade nicht verfügbar. Bitte nutzen Sie E-Mail.";
  if (m.includes("phone")) return "Diese Handynummer ist ungültig. Bitte Vorwahl und Nummer prüfen.";
  return "Das hat nicht geklappt. Bitte versuchen Sie es erneut.";
}

function AuthPage() {
  const search = Route.useSearch();
  const [modus, setModus] = useState<"login" | "registrieren">(search.modus === "registrieren" ? "registrieren" : "login");
  const [weg, setWeg] = useState<Weg>("telefon");
  const [rolle, setRolle] = useState<"arbeitgeber" | "arbeitnehmer" | "busunternehmen">(search.rolle ?? "arbeitnehmer");
  const [land, setLand] = useState("DE");
  const [nummer, setNummer] = useState("");
  const [codeAn, setCodeAn] = useState<string | null>(null); // internationale Nummer, an die der Code ging
  const [code, setCode] = useState("");
  const [warten, setWarten] = useState(0);
  const [letzteMeta, setLetzteMeta] = useState<Record<string, string> | undefined>(undefined);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [bestaetigen, setBestaetigen] = useState<string | null>(null);
  const [vergessen, setVergessen] = useState(false);
  const [linkGesendet, setLinkGesendet] = useState(false);
  const { session, ready } = useAuth();
  const navigate = useNavigate();
  const summaryRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (Object.keys(errors).length) summaryRef.current?.focus(); }, [errors]);
  useEffect(() => { setLand(startLand()); }, []);
  useEffect(() => { if (ready && session) navigate({ to: "/dashboard", replace: true }); }, [ready, session, navigate]);
  useEffect(() => {
    if (warten <= 0) return;
    const t = window.setTimeout(() => setWarten((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [warten]);

  const fehlerAus = (issues: z.ZodIssue[]) => {
    const errs: Errors = {};
    issues.forEach((i) => { errs[String(i.path[0])] ??= i.message; });
    setErrors(errs);
  };

  /** Schritt 1 (Handy): Code per SMS anfordern. Bei der Registrierung entsteht das Konto erst gesperrt. */
  const codeSenden = async (raw: Record<string, string>) => {
    const tel = internationaleNummer(laenderListe().find((l) => l.iso === land)?.vorwahl ?? "49", nummer);
    const errs: Errors = {};
    if (!tel) errs["telefon"] = "Bitte eine gültige Handynummer eingeben.";
    let meta: Record<string, string> | undefined;
    if (modus === "registrieren") {
      const p = regTelSchema.safeParse({ ...raw, rolle });
      if (!p.success) p.error.issues.forEach((i) => { errs[String(i.path[0])] ??= i.message; });
      else meta = {
        rolle: p.data.rolle, kanal: "telefon", datenschutz_version: DATENSCHUTZ_VERSION, bedingungen_version: BEDINGUNGEN_VERSION,
        unternehmer: p.data.rolle !== "arbeitnehmer" && p.data.unternehmer === "on" ? "true" : "false",
        sichtbar: p.data.rolle === "arbeitnehmer" && p.data.sichtbar === "on" ? "true" : "false",
      };
    }
    if (Object.keys(errs).length || !tel) return setErrors(errs);
    setErrors({});
    await otpSenden(tel, meta);
  };

  const otpSenden = async (tel: string, meta: Record<string, string> | undefined) => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      phone: tel,
      options: { channel: "sms", shouldCreateUser: modus === "registrieren", ...(meta ? { data: meta } : {}) },
    });
    setBusy(false);
    if (error) return toast.error(smsFehler(error.message));
    setLetzteMeta(meta);
    setCodeAn(tel);
    setCode("");
    setWarten(60);
    toast.success("Code per SMS gesendet.");
  };

  /** Schritt 2 (Handy): Code prüfen – erst jetzt ist das Konto freigeschaltet und man ist angemeldet. */
  const codePruefen = async () => {
    if (!codeAn) return;
    if (code.length !== 6) return setErrors({ code: "Bitte den 6-stelligen Code eingeben." });
    setErrors({});
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({ phone: codeAn, token: code, type: "sms" });
    setBusy(false);
    if (error) return setErrors({ code: smsFehler(error.message) });
    toast.success(modus === "registrieren" ? "Konto freigeschaltet. Willkommen!" : "Willkommen zurück!");
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const raw = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    if (weg === "telefon") {
      if (codeAn) return codePruefen();
      return codeSenden(raw);
    }
    const parsed = modus === "login" ? loginSchema.safeParse(raw) : regSchema.safeParse({ ...raw, rolle });
    if (!parsed.success) return fehlerAus(parsed.error.issues);
    setErrors({});
    setBusy(true);
    try {
      if (modus === "login") {
        const d = parsed.data as z.infer<typeof loginSchema>;
        const { error } = await supabase.auth.signInWithPassword({ email: d.email, password: d.passwort });
        if (error) throw new Error(error.message.includes("Invalid") ? "E-Mail oder Passwort ist falsch." : error.message.includes("confirmed") ? "Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse." : "Anmeldung fehlgeschlagen.");
        toast.success("Willkommen zurück!");
      } else {
        const d = parsed.data as z.infer<typeof regSchema>;
        const { data, error } = await supabase.auth.signUp({
          email: d.email, password: d.passwort,
          options: { emailRedirectTo: window.location.origin, data: {
            rolle: d.rolle, kanal: "email", datenschutz_version: DATENSCHUTZ_VERSION, bedingungen_version: BEDINGUNGEN_VERSION,
            unternehmer: d.rolle !== "arbeitnehmer" && d.unternehmer === "on" ? "true" : "false",
            sichtbar: d.rolle === "arbeitnehmer" && d.sichtbar === "on" ? "true" : "false",
          } },
        });
        if (error) throw new Error(error.message.includes("registered") ? "Diese E-Mail-Adresse ist bereits registriert." : error.message.includes("weak") || error.message.includes("pwned") ? "Dieses Passwort ist zu unsicher. Bitte wählen Sie ein anderes." : error.message.includes("not allowed") || error.message.includes("invalid") ? "Diese E-Mail-Adresse wird nicht akzeptiert. Bitte verwenden Sie eine echte Adresse." : error.message.includes("rate") ? "Zu viele Versuche. Bitte warten Sie einen Moment." : "Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.");
        if (!data.session) setBestaetigen(d.email);
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (bestaetigen) return (
    <div className="container-page max-w-md py-20">
      <div className="card-base p-8 text-center">
        <h1 className="text-2xl">Bitte bestätigen Sie Ihre E-Mail-Adresse</h1>
        <p className="mt-3 text-muted-foreground">Wir haben eine E-Mail an <strong className="text-foreground">{bestaetigen}</strong> geschickt. Klicken Sie auf den Link darin, um Ihr Konto zu aktivieren – danach können Sie sich anmelden.</p>
        <p className="mt-2 text-sm text-muted-foreground">Keine E-Mail erhalten? Prüfen Sie bitte auch Ihren Spam-Ordner.</p>
        <Button className="mt-6" onClick={() => { setBestaetigen(null); setModus("login"); }}>Zur Anmeldung</Button>
      </div>
    </div>
  );

  const sendeLink = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const r = loginSchema.shape.email.safeParse(new FormData(e.currentTarget).get("email") ?? "");
    if (!r.success) return setErrors({ email: r.error.issues[0]?.message ?? "Ungültige E-Mail-Adresse." });
    setErrors({});
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(r.data, { redirectTo: `${window.location.origin}/reset-password` });
    setBusy(false);
    if (error) return toast.error(error.message.includes("rate") ? "Zu viele Versuche. Bitte warten Sie kurz." : "Link konnte nicht gesendet werden.");
    setLinkGesendet(true);
  };

  if (vergessen) return (
    <div className="container-page max-w-md py-12 sm:py-20">
      <div className="card-base p-6 sm:p-8">
        <h1 className="text-2xl">Passwort vergessen</h1>
        {linkGesendet ? (
          <p className="mt-4 text-muted-foreground">Falls ein Konto mit dieser Adresse existiert, haben wir Ihnen einen Link zum Zurücksetzen geschickt.</p>
        ) : (
          <form onSubmit={sendeLink} noValidate className="mt-6 space-y-4">
            <p className="text-sm text-muted-foreground">Wir senden Ihnen einen Link, mit dem Sie ein neues Passwort festlegen können.</p>
            <Feld name="email" label="E-Mail" type="email" auto="email" error={errors["email"]} />
            <Button type="submit" size="lg" className="w-full" disabled={busy}>{busy ? "Wird gesendet …" : "Link senden"}</Button>
          </form>
        )}
        <Button variant="link" className="mt-4 px-0" onClick={() => { setVergessen(false); setLinkGesendet(false); setErrors({}); }}>Zurück zur Anmeldung</Button>
      </div>
    </div>
  );

  const wechsel = (fn: () => void) => { fn(); setErrors({}); setCodeAn(null); setCode(""); };
  const tab = (aktiv: boolean) => `flex items-center justify-center gap-2 rounded-md py-2 text-sm font-semibold transition-colors ${aktiv ? "bg-white text-tuerkis-800 shadow-soft dark:bg-card dark:text-tuerkis-200" : "text-muted-foreground hover:text-foreground"}`;
  const knopf = weg === "telefon"
    ? (codeAn ? (modus === "registrieren" ? "Bestätigen & Konto freischalten" : "Bestätigen & anmelden") : "Code per SMS senden")
    : (modus === "login" ? "Anmelden" : "Konto erstellen");

  return (
    <div className="container-page max-w-md py-10 sm:py-16">
      <div className="card-base p-6 sm:p-8">
        <div className="glas-knopf grid grid-cols-2 gap-1 rounded-lg p-1" role="tablist" aria-label="Anmelden oder registrieren">
          {(["login", "registrieren"] as const).map((m) => (
            <button key={m} type="button" role="tab" aria-selected={modus === m} onClick={() => wechsel(() => setModus(m))} className={tab(modus === m)}>
              {m === "login" ? "Anmelden" : "Registrieren"}
            </button>
          ))}
        </div>
        <h1 className="mt-6 text-3xl">{modus === "login" ? "Willkommen zurück" : "Kostenlos registrieren"}</h1>

        <div className="mt-5 grid grid-cols-2 gap-2" role="group" aria-label="Wie möchten Sie sich anmelden?">
          {([["telefon", "Mit Handynummer", Smartphone], ["email", "Mit E-Mail", Mail]] as const).map(([w, l, I]) => (
            <button key={w} type="button" aria-pressed={weg === w} onClick={() => wechsel(() => setWeg(w))}
              className={`flex items-center justify-center gap-2 rounded-lg border-2 px-3 py-2.5 text-sm font-semibold transition-colors ${weg === w ? "border-tuerkis-500 bg-tint text-tint-foreground" : "border-border hover:bg-accent"}`}>
              <I className="h-4 w-4" aria-hidden /> {l}
            </button>
          ))}
        </div>

        {Object.keys(errors).length > 0 && (
          <div ref={summaryRef} tabIndex={-1} role="alert" className="mt-6 rounded-xl border border-destructive p-4 text-sm">
            <p className="font-semibold text-destructive">Bitte korrigieren Sie {Object.keys(errors).length === 1 ? "folgende Angabe" : "folgende Angaben"}:</p>
            <ul className="mt-2 list-disc pl-5">
              {Object.entries(errors).map(([k, v]) => <li key={k}><a href={`#${k}`} className="underline">{FELD_NAMEN[k] ?? k}: {v}</a></li>)}
            </ul>
          </div>
        )}

        <form onSubmit={submit} noValidate className="mt-6 space-y-4" key={`${modus}-${weg}`}>
          {codeAn ? (
            <>
              <p className="text-sm text-muted-foreground">
                Wir haben einen 6-stelligen Code an <strong className="text-foreground">{codeAn}</strong> geschickt.
                {modus === "registrieren" && " Ihr Konto wird erst freigeschaltet, wenn Sie den Code bestätigen."}
              </p>
              <CodeFeld wert={code} onWert={(c) => { setCode(c); if (errors["code"]) setErrors({}); }} error={errors["code"]} />
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <button type="button" className="font-semibold text-info underline-offset-4 hover:underline" onClick={() => { setCodeAn(null); setCode(""); setErrors({}); }}>
                  Nummer ändern
                </button>
                <button type="button" disabled={warten > 0 || busy} className="font-semibold text-info underline-offset-4 hover:underline disabled:text-muted-foreground disabled:no-underline"
                  onClick={() => codeAn && void otpSenden(codeAn, letzteMeta)}
                  aria-live="polite">
                  {warten > 0 ? `Neuer Code in ${warten} s` : "Code erneut senden"}
                </button>
              </div>
            </>
          ) : (
            <>
              {modus === "registrieren" && (
                <fieldset>
                  <legend className="text-sm font-medium">Ich bin … <span aria-hidden>*</span></legend>
                  <div className="mt-1.5 grid grid-cols-3 gap-2">
                    {([["arbeitnehmer", "Fachkraft", UserRound], ["arbeitgeber", "Arbeitgeber", Building2], ["busunternehmen", "Busunternehmen", Bus]] as const).map(([v, l, I]) => (
                      <button type="button" key={v} onClick={() => setRolle(v)} aria-pressed={rolle === v}
                        className={`flex flex-col items-center gap-1 rounded-xl border-2 p-3 text-sm font-semibold transition-colors ${rolle === v ? "border-tuerkis-500 bg-tint text-tint-foreground" : "border-border hover:bg-accent"}`}>
                        <I className="h-5 w-5" aria-hidden />{l}
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}
              {weg === "telefon" ? (
                <TelefonFeld land={land} onLand={setLand} nummer={nummer} onNummer={setNummer} error={errors["telefon"]} />
              ) : (
                <>
                  <Feld name="email" label="E-Mail" type="email" auto="email" error={errors["email"]} />
                  <Feld name="passwort" label={modus === "login" ? "Passwort" : "Passwort (mind. 8 Zeichen)"} type="password" auto={modus === "login" ? "current-password" : "new-password"} error={errors["passwort"]} />
                </>
              )}
              {modus === "registrieren" && (
                <div className="space-y-3 rounded-xl bg-muted p-4">
                  <Check name="datenschutz" error={errors["datenschutz"]} pflicht>
                    Ich habe die <Link to="/datenschutz" target="_blank" className="underline">Datenschutzerklärung</Link> gelesen.
                  </Check>
                  {rolle !== "arbeitnehmer" ? (
                    <>
                      <Check name="bedingungen" error={errors["bedingungen"]} pflicht>
                        Ich akzeptiere die <Link to="/agb" target="_blank" className="underline">AGB für Unternehmen</Link>.
                      </Check>
                      <Check name="unternehmer" error={errors["unternehmer"]} pflicht>
                        Ich handle als Unternehmer im Sinne von § 14 BGB (nicht als Verbraucher).
                      </Check>
                    </>
                  ) : (
                    <>
                      <Check name="bedingungen" error={errors["bedingungen"]} pflicht>
                        Ich akzeptiere die <Link to="/nutzungsbedingungen" target="_blank" className="underline">Nutzungsbedingungen</Link>.
                      </Check>
                      <Check name="sichtbar">
                        Freiwillig: Mein pseudonymisiertes Profil darf Unternehmen in der Suche angezeigt werden. Jederzeit im Profil widerrufbar.
                      </Check>
                    </>
                  )}
                  <p className="text-xs text-muted-foreground">* Pflichtangabe. Alle weiteren Profilangaben sind freiwillig und können später ergänzt werden.</p>
                </div>
              )}
            </>
          )}
          <Button type="submit" className="w-full" size="lg" disabled={busy}>{busy ? "Bitte warten …" : knopf}</Button>
        </form>
        {modus === "login" && weg === "email" && (
          <Button variant="link" className="mt-2 px-0" onClick={() => { setVergessen(true); setErrors({}); }}>Passwort vergessen?</Button>
        )}
      </div>
    </div>
  );
}

function Check({ name, error, pflicht, children }: { name: string; error?: string | undefined; pflicht?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex gap-3">
        <input id={name} name={name} type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-info)]" aria-invalid={!!error} aria-required={pflicht || undefined} aria-describedby={error ? `${name}-err` : undefined} />
        <label htmlFor={name} className="text-sm">{children}{pflicht && <span aria-hidden> *</span>}</label>
      </div>
      {error && <p id={`${name}-err`} className="mt-1 pl-8 text-sm text-destructive">{error}</p>}
    </div>
  );
}

function Feld({ name, label, type = "text", auto, error }: { name: string; label: string; type?: string; auto?: string | undefined; error?: string | undefined }) {
  return (
    <div>
      <label htmlFor={name} className="text-sm font-medium">{label} <span aria-hidden>*</span></label>
      <input id={name} name={name} type={type} autoComplete={auto} required aria-required className="field mt-1.5" aria-invalid={!!error} aria-describedby={error ? `${name}-err` : undefined} />
      {error && <p id={`${name}-err`} className="mt-1 text-sm text-destructive">{error}</p>}
    </div>
  );
}
