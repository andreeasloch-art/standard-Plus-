import { chromium } from "playwright";
const base = "http://localhost:4173";
const R = "/home/user/standard-Plus-/lovable-ueberarbeitung/.impeccable/review";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
let fehler = 0;
const ok = (bed, t) => { console.log((bed ? "OK   " : "FEHLT") + " " + t); if (!bed) fehler++; };
const logs = [];
const neu = async (vp) => { const p = await (await b.newContext({ viewport: vp, locale: "de-DE" })).newPage(); p.on("pageerror", (e) => logs.push(e.message)); p.on("console", (m) => m.type() === "error" && logs.push(m.text())); return p; };

// Öffentliche Seite
let p = await neu({ width: 1280, height: 900 });
await p.goto(base + "/busreisen", { waitUntil: "networkidle" });
ok((await p.getByRole("article").count()) === 3, "Busreisen: 3 Beispiel-Fahrten");
ok(await p.getByRole("list", { name: /Route: Timișoara \(RO\), Arad, Budapest, Wien, Linz, München, Stuttgart/ }).isVisible(), "Route mit allen Halten");
ok(await p.getByText("89 €").isVisible() && await p.getByText("1 Fahrt über Standard Plus").isVisible(), "Preis und Fahrten über Standard Plus");
ok(await p.getByText("insgesamt ca. 1.200 (Angabe des Unternehmens)").isVisible(), "Eigene Angabe des Unternehmens gekennzeichnet");
await p.getByRole("button", { name: /5 von 5 Sternen/ }).click();
ok(await p.getByText("Pünktlich, sauber").isVisible(), "Bewertungen aufklappbar");
await p.locator("#von").fill("timisoara");
await p.locator("#nach").fill("Stuttgart");
await p.waitForTimeout(300);
ok((await p.getByRole("article").count()) === 1, "Suche Timisoara → Stuttgart (ohne Akzent) findet 1 Fahrt");
await p.locator("#von").fill("Wien"); await p.locator("#nach").fill("Arad");
await p.waitForTimeout(300);
ok((await p.getByRole("article").count()) === 0, "Falsche Richtung (Wien → Arad) findet nichts");
await p.locator("#von").fill(""); await p.locator("#nach").fill("München");
await p.waitForTimeout(300);
ok((await p.getByRole("article").count()) === 3, "Zwischenhalt München zählt mit");
await p.locator("#nach").fill("");
await p.screenshot({ path: R + "/busreisen.png", fullPage: true });

// Registrierung als Busunternehmen
await p.getByRole("link", { name: "Als Busunternehmen registrieren" }).click();
ok(await p.getByRole("button", { name: "Busunternehmen" }).getAttribute("aria-pressed") === "true", "Registrierung: Busunternehmen vorgewählt");
ok(await p.getByText("§ 14 BGB").isVisible(), "Busunternehmen bestätigt Unternehmereigenschaft");

// Busunternehmen-Bereich
await p.evaluate(() => localStorage.setItem("test-rolle", "busunternehmen"));
await p.goto(base + "/dashboard", { waitUntil: "networkidle" });
ok(await p.getByRole("heading", { name: "Meine Fahrten" }).isVisible() && await p.getByRole("heading", { name: "Bilder" }).isVisible(), "Busunternehmen-Bereich mit Fahrten, Bildern, Firmendaten");
await p.getByRole("button", { name: "Neue Fahrt" }).click();
await p.getByRole("button", { name: "Fahrt veröffentlichen" }).click();
ok(await p.getByText("Bitte Abfahrtsort eingeben.").isVisible(), "Fahrt: Pflichtfelder geprüft");
await p.locator("#fa-von_ort").fill("Timișoara (RO)");
await p.locator("#fa-nach_ort").fill("Nürnberg (DE)");
await p.locator("#fa-haltestellen").fill("Arad\nBudapest\nWien\nPassau");
await p.locator("#fa-abfahrt_info").fill("jeden Mittwoch 20:00");
await p.locator("#fa-preis_eur").fill("85");
await p.getByRole("button", { name: "Fahrt veröffentlichen" }).click();
await p.getByText("Timișoara (RO) → Nürnberg (DE)").waitFor();
ok(await p.getByRole("list", { name: /Route: Timișoara \(RO\), Arad, Budapest, Wien, Passau, Nürnberg/ }).isVisible(), "Neue Fahrt mit Halten gespeichert");
ok(await p.getByRole("checkbox", { name: /Rechte an den Bildern/ }).isVisible(), "Bild-Upload erst nach Rechte-Bestätigung");
await p.screenshot({ path: R + "/bus-dashboard.png", fullPage: true });

// Deal → Vorschläge für Fachkraft
p = await neu({ width: 390, height: 844 });
await p.goto(base + "/", { waitUntil: "networkidle" });
await p.evaluate(() => { localStorage.setItem("test-rolle", "arbeitnehmer"); sessionStorage.setItem("test-db", JSON.stringify({ ausweis_pruefungen: [{ user_id: "u-test", status: "geprueft" }] })); });
await p.goto(base + "/dashboard", { waitUntil: "networkidle" });
ok(await p.getByRole("heading", { name: "Anreise mit dem Bus" }).isVisible() === false, "Vor Vertragsabschluss: noch keine Fahrtvorschläge");
p.once("dialog", (d) => d.accept());
await p.getByRole("button", { name: "Vertragsabschluss bestätigen" }).last().click();
await p.getByRole("heading", { name: "Anreise mit dem Bus" }).waitFor();
const v = p.getByRole("article");
ok((await v.count()) >= 1 && /Banat Reisen/.test(await v.first().innerText()), "Nach Vertrag: passende Fahrt Timișoara → Stuttgart vorgeschlagen");
await p.getByRole("button", { name: "Fahrt anfragen" }).first().click();
ok(await p.getByRole("button", { name: "Anfrage senden" }).isDisabled(), "Anfrage erst nach Einwilligung (Name + Handynummer)");
await p.getByRole("checkbox", { name: /einverstanden, dass mein Name/ }).check();
await p.getByRole("button", { name: "Anfrage senden" }).click();
await p.getByText("Angefragt", { exact: true }).waitFor();
ok(true, "Fahrt angefragt – Status sichtbar beim Deal");
await p.screenshot({ path: R + "/deal-busvorschlag.png", fullPage: true });

// Busunternehmen sieht Anfrage, bestätigt, Fahrt durchgeführt → Bewertung möglich
await p.evaluate(() => localStorage.setItem("test-rolle", "busunternehmen"));
await p.goto(base + "/dashboard", { waitUntil: "networkidle" });
ok(await p.getByText("1 neu").isVisible(), "Busunternehmen: neue Anfrage");
ok(await p.getByRole("link", { name: "+40712345678" }).first().isVisible(), "Busunternehmen sieht Name + Handynummer des Reisenden");
await p.getByRole("button", { name: "Bestätigen" }).click();
await p.getByRole("button", { name: "Fahrt durchgeführt" }).click();
await p.waitForTimeout(300);
await p.evaluate(() => localStorage.setItem("test-rolle", "arbeitnehmer"));
await p.goto(base + "/dashboard", { waitUntil: "networkidle" });
ok(await p.getByText("Durchgeführt", { exact: true }).isVisible() && await p.getByRole("radiogroup", { name: "Sterne für die Fahrt" }).isVisible(), "Nach durchgeführter Fahrt: Bewertung möglich");
await p.getByRole("radiogroup", { name: "Sterne für die Fahrt" }).getByRole("radio", { name: "4 Sterne" }).click();
await p.getByRole("button", { name: "Senden", exact: true }).click();
await p.getByText("Ihre Bewertung der Fahrt: 4 von 5 Sternen").waitFor();
ok(true, "Fahrt bewertet");
ok(!(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth)), "Handy: keine seitliche Scrollleiste");
ok(logs.length === 0, "Keine Fehler" + (logs.length ? "\n   " + logs.join("\n   ") : ""));
await b.close();
console.log(fehler ? `\n${fehler} Prüfung(en) fehlgeschlagen` : "\nAlle Prüfungen bestanden");
