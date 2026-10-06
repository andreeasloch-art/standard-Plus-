// Verschickt offene Benachrichtigungen per E-Mail (Resend).
// Aufruf: minütlich per pg_cron (siehe README, „E-Mail-Benachrichtigungen einschalten“).
// Ohne RESEND_API_KEY passiert nichts – die Benachrichtigungen bleiben in der App sichtbar.
//
// Benötigte Secrets (Lovable Cloud → Secrets):
//   RESEND_API_KEY   – API-Schlüssel von resend.com
//   MAIL_ABSENDER    – z. B. "Standard Plus <hinweis@standard-plus.de>" (Domain bei Resend bestätigt)
//   CRON_SECRET      – beliebige lange Zeichenkette; derselbe Wert steht im Cron-Aufruf
//   SEITE_URL        – z. B. "https://standard-plus.de"
// SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY stellt Lovable Cloud automatisch bereit.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const env = (k: string) => Deno.env.get(k) ?? "";

function html(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function mail(vorname: string | null, titel: string, text: string | null, link: string, einstellungen: string) {
  const anrede = vorname ? `Hallo ${html(vorname)},` : "Hallo,";
  return `<!doctype html><html lang="de"><body style="margin:0;background:#f3f7f7;font-family:Arial,Helvetica,sans-serif;color:#1b2426">
  <div style="max-width:520px;margin:0 auto;padding:32px 20px">
    <p style="font-weight:700;color:#1f6166;letter-spacing:.04em;margin:0 0 20px">STANDARD PLUS</p>
    <div style="background:#fff;border-radius:14px;padding:24px;border:1px solid #dde7e8">
      <p style="margin:0 0 12px">${anrede}</p>
      <h1 style="font-size:20px;margin:0 0 8px">${html(titel)}</h1>
      ${text ? `<p style="margin:0 0 20px;line-height:1.5">${html(text)}</p>` : ""}
      <a href="${html(link)}" style="display:inline-block;background:#ffd84d;color:#1b2426;font-weight:700;text-decoration:none;padding:12px 20px;border-radius:10px">Jetzt ansehen</a>
    </div>
    <p style="font-size:12px;color:#5b6b6d;margin:20px 0 0;line-height:1.5">
      Sie erhalten diese E-Mail, weil Sie ein Konto bei Standard Plus haben. E-Mails abbestellen:
      <a href="${html(einstellungen)}" style="color:#1f6166">Einstellungen</a>.
    </p>
  </div></body></html>`;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Nur POST", { status: 405 });
  const geheim = env("CRON_SECRET");
  if (!geheim || req.headers.get("x-cron-secret") !== geheim) return new Response("Nicht erlaubt", { status: 401 });

  const schluessel = env("RESEND_API_KEY");
  if (!schluessel) return Response.json({ gesendet: 0, hinweis: "RESEND_API_KEY fehlt – nur In-App-Benachrichtigungen aktiv." });

  const db = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });
  const { data, error } = await db.rpc("mails_offen", { _limit: 50 });
  if (error) return Response.json({ fehler: error.message }, { status: 500 });

  const seite = env("SEITE_URL").replace(/\/$/, "") || "https://standard-plus.de";
  let gesendet = 0;
  for (const b of (data ?? []) as { id: string; email: string; vorname: string | null; titel: string; text: string | null; link: string | null }[]) {
    const ziel = seite + (b.link ?? "/dashboard");
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${schluessel}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: env("MAIL_ABSENDER") || "Standard Plus <onboarding@resend.dev>",
        to: [b.email],
        subject: b.titel,
        html: mail(b.vorname, b.titel, b.text, ziel, seite + "/benachrichtigungen"),
        text: `${b.titel}\n\n${b.text ?? ""}\n\n${ziel}`,
      }),
    });
    // Auch bei dauerhaftem Fehler (z. B. ungültige Adresse) markieren, damit nichts endlos wiederholt wird;
    // bei Überlast (429/5xx) nächste Minute erneut versuchen.
    if (r.ok || (r.status >= 400 && r.status < 500 && r.status !== 429)) {
      await db.from("benachrichtigungen").update({ email_gesendet_at: new Date().toISOString() }).eq("id", b.id);
      if (r.ok) gesendet++;
    }
  }
  return Response.json({ gesendet });
});
