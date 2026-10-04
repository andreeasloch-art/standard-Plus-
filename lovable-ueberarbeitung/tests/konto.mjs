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

// Registrierung mit Handynummer
await p.goto(base + "/auth?modus=registrieren", { waitUntil: "networkidle" });
ok(await p.getByRole("button", { name: "Mit Handynummer" }).getAttribute("aria-pressed") === "true", "Handynummer ist voreingestellt");
const anzahl = await p.locator("#land option").count();
ok(anzahl > 230, "Ländervorwahlen der Welt: " + anzahl + " Einträge");
ok((await p.locator("#land").inputValue()) === "DE", "Land aus Browsersprache: Deutschland");
await p.getByRole("button", { name: "Code per SMS senden" }).click();
ok(await p.getByRole("alert").isVisible(), "Ohne Angaben: Fehlerliste erscheint");
await p.screenshot({ path: R + "/handy-registrieren.png", fullPage: true });
await p.locator("#land").selectOption("RO");
await p.locator("#telefon").fill("0712 345 678");
await p.locator("#datenschutz").check();
await p.locator("#bedingungen").check();
await p.getByRole("button", { name: "Code per SMS senden" }).click();
await p.getByText("+40712345678").waitFor();
ok(true, "Code an +40712345678 (führende 0 entfernt, Vorwahl Rumänien)");
ok(await p.getByText("erst freigeschaltet, wenn Sie den Code bestätigen").isVisible(), "Hinweis: Konto erst nach Code freigeschaltet");
ok(/Neuer Code in \d+ s/.test(await p.getByRole("button", { name: /Neuer Code|Code erneut/ }).innerText()), "Erneut senden erst nach Wartezeit");
await p.locator("#code").fill("111111");
await p.getByRole("button", { name: "Bestätigen & Konto freischalten" }).click();
await p.getByText("Der Code ist falsch oder abgelaufen.").first().waitFor();
ok(true, "Falscher Code wird abgelehnt");
await p.locator("#code").fill("123456");
await p.screenshot({ path: R + "/handy-code.png", fullPage: true });
await p.getByRole("button", { name: "Bestätigen & Konto freischalten" }).click();
await p.getByText("Konto freigeschaltet").waitFor();
ok(true, "Richtiger Code → Konto freigeschaltet");

// Anmeldung mit Handynummer (ohne Zustimmungen)
await p.goto(base + "/auth", { waitUntil: "networkidle" });
await p.locator("#telefon").fill("+43 664 1234567");
await p.getByRole("button", { name: "Code per SMS senden" }).click();
await p.getByText("+436641234567").waitFor();
ok(true, "Anmeldung: Nummer mit + wird übernommen (+436641234567)");
await p.getByRole("button", { name: "Mit E-Mail" }).click();
ok(await p.locator("#email").isVisible() && await p.locator("#passwort").isVisible(), "E-Mail-Anmeldung weiterhin möglich");

// Dashboard Fachkraft
await p.evaluate(() => localStorage.setItem("test-rolle", "arbeitnehmer"));
await p.goto(base + "/dashboard", { waitUntil: "networkidle" });
ok(await p.getByText("Einladung offen").isVisible(), "Dashboard: Einladung offen");
ok(await p.getByText("mit Dolmetscher").first().isVisible(), "Interview-Details sichtbar (Video, Termin, Dolmetscher)");
await p.getByRole("button", { name: "Zusagen" }).click();
await p.waitForTimeout(400);
ok((await p.getByText("Match – Interview").count()) === 2, "Nach Zusage: Match");
p.once("dialog", (d) => d.accept());
await p.getByRole("button", { name: "Vertragsabschluss bestätigen" }).last().click();
await p.waitForTimeout(500);
ok(await p.getByText("Vertrag abgeschlossen – Kontaktdaten freigegeben").isVisible(), "Beide bestätigt → Kontaktdaten frei");
ok(await p.getByRole("link", { name: "+49891234567" }).isVisible(), "Telefon der Firma sichtbar");
ok((await p.getByText("Kontaktdaten werden erst sichtbar, wenn beide Seiten").count()) === 1, "Andere Anfrage: Kontaktdaten noch gesperrt");
await p.screenshot({ path: R + "/dashboard-fachkraft.png", fullPage: true });

// Anreise
await p.getByRole("link", { name: "Anreise anfragen" }).click();
await p.waitForURL(/anreise/);
await p.getByRole("button", { name: "Anreise anfragen" }).click();
ok(await p.getByText("Bitte Abfahrtsort eingeben.").isVisible(), "Anreise: Pflichtfelder geprüft");
await p.locator("#von_ort").fill("Cluj-Napoca, Rumänien");
await p.locator("#nach_ort").fill("München");
await p.locator("#datum").fill("2026-11-02");
await p.locator("#personen").fill("2");
await p.getByRole("button", { name: "Anreise anfragen" }).click();
await p.getByRole("article").first().waitFor();
ok(await p.getByText("(aktueller Stand)").count() === 1 && await p.getByText("Angefragt").first().isVisible(), "Anfrage mit Status „Angefragt“");
ok((await p.locator("#von_ort").inputValue()) === "", "Formular nach Erfolg geleert");
await p.screenshot({ path: R + "/anreise.png", fullPage: true });
p.once("dialog", (d) => d.accept());
await p.getByRole("button", { name: "Anfrage stornieren" }).click();
await p.waitForTimeout(400);
ok(await p.getByText("Storniert", { exact: true }).isVisible(), "Stornieren funktioniert");
ok(!(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth)), "Handy: keine seitliche Scrollleiste");
ok(logs.length === 0, "Keine Fehler" + (logs.length ? "\n   " + logs.join("\n   ") : ""));
await b.close();
console.log(fehler ? `\n${fehler} Prüfung(en) fehlgeschlagen` : "\nAlle Prüfungen bestanden");
