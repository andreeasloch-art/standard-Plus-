import { chromium } from "playwright";
const base = "http://localhost:4173";
const R = "/home/user/standard-Plus-/lovable-ueberarbeitung/.impeccable/review";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
let fehler = 0;
const ok = (bed, t) => { console.log((bed ? "OK   " : "FEHLT") + " " + t); if (!bed) fehler++; };
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: "de-DE" });
const p = await ctx.newPage();
const logs = [];
p.on("pageerror", (e) => logs.push(e.message));
p.on("console", (m) => { if (m.type() === "error") logs.push(m.text()); });

// Ohne Anmeldung: keine Glocke
await p.goto(base + "/", { waitUntil: "networkidle" });
ok(await p.getByRole("link", { name: /^Benachrichtigungen/ }).count() === 0, "Abgemeldet: keine Glocke");

// Als Fachkraft angemeldet
await p.evaluate(() => localStorage.setItem("test-rolle", "arbeitnehmer"));
await p.goto(base + "/dashboard", { waitUntil: "networkidle" });
const glocke = p.getByRole("link", { name: "Benachrichtigungen (2 neu)" });
ok(await glocke.isVisible(), "Glocke zeigt 2 ungelesene");
await glocke.click();
await p.getByRole("heading", { name: "Benachrichtigungen", level: 1 }).waitFor();
ok(await p.getByText("Neue Interview-Einladung").isVisible(), "Einladung wird angezeigt");
ok(await p.getByText("vor 5 Min.").isVisible(), "Zeitangabe relativ");
ok(await p.getByText("(ungelesen)").count() === 2, "Zwei als ungelesen markiert");
ok(await p.getByText("test@example.org").isVisible(), "E-Mail-Adresse für Benachrichtigungen sichtbar");
ok(!(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth)), "Handy: keine seitliche Scrollleiste");
await p.screenshot({ path: R + "/benachrichtigungen.png", fullPage: true });

await p.getByRole("button", { name: "Alle als gelesen markieren" }).click();
await p.waitForTimeout(400);
ok(await p.getByText("(ungelesen)").count() === 0, "Alle als gelesen markiert");
ok(await p.getByRole("link", { name: "Benachrichtigungen", exact: true }).isVisible(), "Glocke ohne Zähler");

const box = p.getByRole("checkbox", { name: "E-Mails erhalten" });
ok(await box.isChecked(), "E-Mails standardmäßig an");
await box.uncheck();
await p.waitForTimeout(400);
ok(await p.getByText("E-Mails sind ausgeschaltet.").isVisible(), "E-Mails abbestellbar");

// Klick auf eine Nachricht führt zum Ziel
await p.getByRole("link", { name: /Neue Interview-Einladung/ }).click();
await p.waitForURL("**/dashboard");
ok(true, "Klick auf Nachricht öffnet das Dashboard");

// AGB für Busunternehmen
await p.evaluate(() => localStorage.removeItem("test-rolle"));
await p.goto(base + "/auth?modus=registrieren&rolle=busunternehmen", { waitUntil: "networkidle" });
const agb = p.getByRole("link", { name: "AGB für Busunternehmen" });
ok(await agb.isVisible(), "Registrierung Busunternehmen verlinkt eigene AGB");
await p.goto(base + "/agb-busunternehmen", { waitUntil: "networkidle" });
ok(await p.getByRole("heading", { name: "AGB für Busunternehmen" }).isVisible(), "AGB-Seite für Busunternehmen");
ok(await p.getByText("Verordnung (EU) Nr. 181/2011").isVisible(), "Fahrgastrechte erwähnt");
await p.screenshot({ path: R + "/agb-busunternehmen.png" });

ok(logs.length === 0, "Keine Fehler" + (logs.length ? ": " + logs.join(" | ") : ""));
await b.close();
console.log(fehler ? `\n${fehler} Prüfung(en) fehlgeschlagen` : "\nAlle Prüfungen bestanden");
process.exit(fehler ? 1 : 0);
