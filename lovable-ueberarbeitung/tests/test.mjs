import { chromium } from "playwright";

const base = "http://localhost:4173";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
let fehler = 0;
const ok = (bed, text) => { console.log((bed ? "OK   " : "FEHLT") + " " + text); if (!bed) fehler++; };

async function seite(vp) {
  const ctx = await b.newContext({ viewport: vp });
  const p = await ctx.newPage();
  const logs = [];
  p.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") logs.push(m.text()); });
  p.on("pageerror", (e) => logs.push("PAGEERROR " + e.message));
  p.on("request", (r) => { const u = new URL(r.url()); if (u.hostname !== "localhost") logs.push("EXTERN " + r.url()); });
  return { p, logs };
}
const zaehler = async (p) => (await p.locator("text=/\\d+ von \\d+/").first().innerText()).trim();

// ---------- Desktop ----------
{
  const { p, logs } = await seite({ width: 1280, height: 900 });
  await p.goto(base + "/", { waitUntil: "networkidle" });
  await p.screenshot({ path: "start-desktop.png", fullPage: true });

  const karten = p.locator('#profile a[href^="/profil/"]');
  ok((await karten.count()) === 6, `Startseite: zuerst 6 Profile (ist ${await karten.count()})`);
  const pos = await karten.evaluateAll((els) => els.slice(0, 3).map((e) => [Math.round(e.getBoundingClientRect().top), Math.round(e.getBoundingClientRect().left)]));
  ok(pos[0][0] === pos[1][0] && pos[0][1] === pos[2][1], "Startseite: 2 Karten nebeneinander");
  ok(await p.getByText("So funktioniert’s").isVisible(), "Startseite erklärt den Ablauf");
  ok(await p.getByText("Telefon-Interview · Live-Dolmetscher").isVisible(), "Dolmetscher-Beispiel sichtbar");
  await p.waitForTimeout(2800);
  ok((await p.getByText("Din noiembrie", { exact: false }).count()) > 0, "Dolmetscher-Beispiel läuft (2. Satz erscheint)");

  // Startseite: Wisch-Vorschau reagiert live auf die Suche
  const vorschau = p.getByRole("region", { name: "Wisch-Vorschau" });
  ok(await vorschau.isVisible(), "Wisch-Vorschau oben sichtbar");
  ok(await p.getByRole("link", { name: /Kostenlos Profil anlegen/ }).first().isVisible(), "Fachkraft-Aktion sichtbar");
  ok(/z\. B\./.test((await p.getByRole("combobox").getAttribute("placeholder")) ?? ""), "Suchfeld tippt Beispiele von selbst");
  await p.getByRole("combobox").fill("Pflege");
  await p.waitForTimeout(700);
  ok(/Treffer für „Pflege“/.test(await vorschau.innerText()), "Stapel mischt sich bei Suche neu (Trefferzahl)");
  await p.getByRole("combobox").fill("Polier");
  await p.waitForTimeout(600);
  await p.getByRole("button", { name: /Ion T\. gefällt mir/ }).click();
  await p.waitForTimeout(500);
  ok((await p.getByRole("link", { name: "Favoriten (1)" }).count()) > 0, "Startseite: Favorit per Stern-Knopf");
  await p.getByRole("combobox").fill("");
  await p.getByRole("button", { name: "Für Unternehmen" }).click();
  ok(await p.getByRole("heading", { name: "Schritt 1: Suchen" }).isVisible(), "Linienplan wechselt auf Unternehmens-Ablauf");
  // Suche mit Autovervollständigung → Wischansicht
  const box = p.getByRole("combobox");
  await box.fill("pf");
  await p.getByRole("option").first().waitFor();
  const texte = await p.getByRole("option").allInnerTexts();
  ok(texte.some((t) => t.includes("Pflegefachkraft")), "Autovervollständigung schlägt Pflegefachkraft vor");
  await box.press("Escape");
  await box.fill("Pflege");
  await box.press("Enter");
  await p.waitForURL(/\/talente\?q=Pflege/);
  await p.waitForTimeout(400);
  ok(/1 von \d+/.test(await zaehler(p)), "Nach Suche: Wischstapel startet bei " + (await zaehler(p)));
  await p.screenshot({ path: "wischen-desktop.png", fullPage: true });

  // Maus: nach rechts ziehen = Favorit
  const karte = p.locator('[aria-roledescription="Kartenstapel"] > div.cursor-grab');
  const bb = await karte.boundingBox();
  await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 3);
  await p.mouse.down();
  await p.mouse.move(bb.x + bb.width / 2 + 80, bb.y + bb.height / 3, { steps: 5 });
  await p.screenshot({ path: "wischen-ziehen.png" });
  await p.mouse.move(bb.x + bb.width / 2 + 220, bb.y + bb.height / 3, { steps: 5 });
  await p.mouse.up();
  await p.waitForTimeout(450);
  ok(/1 von/.test(await zaehler(p)), "Nach rechts ziehen → Karte bleibt und klappt auf");
  ok(await p.getByText("Gefällt Ihnen – hier sind mehr Infos.").isVisible(), "Gefällt mir → mehr Infos sichtbar");
  ok(await p.getByText(/erst bei Vertragsabschluss sichtbar/).isVisible(), "Hinweis: Kontaktdaten erst bei Vertragsabschluss");
  ok((await p.getByRole("link", { name: "Favoriten (2)" }).count()) > 0, "Nach rechts gezogen → 2 Favoriten");
  await p.screenshot({ path: "wischen-offen.png" });

  // Kurzes Ziehen schnappt zurück
  await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 3);
  await p.mouse.down(); await p.mouse.move(bb.x + bb.width / 2 + 30, bb.y + bb.height / 3, { steps: 3 }); await p.mouse.up();
  await p.waitForTimeout(400);
  ok(/1 von/.test(await zaehler(p)), "Kurzes Ziehen → Karte bleibt");

  // Tastatur: Pfeil links = weiter (aus der offenen Karte zur nächsten, dann überspringen)
  await p.locator('[aria-roledescription="Kartenstapel"]').focus();
  await p.keyboard.press("ArrowLeft");
  await p.waitForTimeout(450);
  ok(/2 von/.test(await zaehler(p)), "Pfeil links → nächste Karte");
  await p.keyboard.press("ArrowLeft");
  await p.waitForTimeout(450);
  ok(/3 von/.test(await zaehler(p)), "Pfeil links → übersprungen");

  // Rückgängig
  await p.getByRole("button", { name: "Letzte Entscheidung zurücknehmen" }).click();
  await p.waitForTimeout(200);
  ok(/2 von/.test(await zaehler(p)), "Rückgängig holt Karte zurück");

  // Haken-Knopf
  await p.getByRole("button", { name: /als Favorit merken/ }).click();
  await p.waitForTimeout(450);
  ok((await p.getByRole("link", { name: "Favoriten (3)" }).count()) > 0, "Haken-Knopf → 3 Favoriten");

  // Einladen
  await p.getByRole("button", { name: /zum Interview einladen/ }).click();
  const dlg = p.getByRole("dialog");
  ok(await dlg.isVisible(), "Einladungsfenster öffnet");
  await p.screenshot({ path: "einladen.png" });
  await dlg.getByText("Telefonanruf").click();
  await dlg.getByRole("button", { name: "Einladung senden" }).click();
  await dlg.getByText(/bekommt Ihre Einladung/).waitFor();
  ok(true, "Einladung gesendet (Bestätigung erscheint)");
  await p.keyboard.press("Escape");
  await p.waitForTimeout(200);
  ok(!(await dlg.isVisible()), "Escape schließt Fenster");

  // Liste umschalten
  await p.getByRole("button", { name: "Liste" }).click();
  await p.waitForTimeout(300);
  ok((await p.locator('a[href^="/profil/"]').count()) > 1, "Umschalten auf Liste zeigt Karten");

  // Favoriten-Seite
  await p.getByRole("link", { name: /^Favoriten \(3\)$/ }).first().click();
  await p.waitForTimeout(300);
  ok((await p.locator("main li").count()) === 3, "Favoriten-Seite zeigt 3 Profile (eingeladene Person automatisch dabei)");
  ok((await p.getByText("Eingeladen – wartet auf Match").count()) === 1, "Eingeladene Person markiert");
  await p.screenshot({ path: "favoriten.png", fullPage: true });

  // Ende des Stapels
  await p.goto(base + "/", { waitUntil: "networkidle" });
  await p.getByRole("button", { name: "IT & Software" }).click();
  await p.waitForTimeout(500);
  await p.getByRole("link", { name: /Alle wischen/ }).click();
  await p.waitForTimeout(400);
  ok(/1 von 1/.test(await zaehler(p)), "Chip „IT & Software“ → 1 Vorschlag");
  await p.locator('[aria-roledescription="Kartenstapel"]').focus();
  await p.keyboard.press("ArrowRight"); // gefällt mir → mehr Infos
  await p.waitForTimeout(300);
  await p.keyboard.press("ArrowRight"); // weiter
  await p.waitForTimeout(450);
  ok(await p.getByText("Alle 1 Vorschläge gesehen").isVisible(), "Ende des Stapels mit Zusammenfassung");

  for (const r of ["/preise", "/arbeitnehmer", "/unternehmen", "/ablauf", "/favoriten"]) {
    await p.goto(base + r, { waitUntil: "networkidle" });
    ok((await p.locator("h1").count()) === 1, `${r}: genau eine h1`);
  }
  ok(logs.filter((l) => !l.includes("favicon")).length === 0, "Desktop: keine Konsolenfehler, keine fremden Server" + (logs.length ? "\n   " + logs.join("\n   ") : ""));
}

// ---------- Handy ----------
{
  const { p, logs } = await seite({ width: 390, height: 844 });
  await p.goto(base + "/", { waitUntil: "networkidle" });
  await p.screenshot({ path: "start-mobil.png", fullPage: true });
  const karten = p.locator('#profile a[href^="/profil/"]');
  const pos = await karten.evaluateAll((els) => els.slice(0, 3).map((e) => [Math.round(e.getBoundingClientRect().top), Math.round(e.getBoundingClientRect().left)]));
  ok(pos[0][0] === pos[1][0] && pos[0][1] === pos[2][1], "Handy: 2 Karten nebeneinander");
  for (const r of ["/", "/talente", "/talente?ansicht=liste", "/favoriten", "/preise"]) {
    await p.goto(base + r, { waitUntil: "networkidle" });
    ok(!(await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)), `Handy ${r}: keine seitliche Scrollleiste`);
  }
  await p.goto(base + "/talente", { waitUntil: "networkidle" });
  const knopf = p.getByRole("button", { name: /als Favorit merken/ });
  const kb = await knopf.boundingBox();
  ok(kb && kb.y + kb.height <= 844, `Handy: Wisch-Knöpfe ohne Scrollen sichtbar (unten bei ${kb && Math.round(kb.y + kb.height)} px)`);
  await p.screenshot({ path: "wischen-mobil.png", fullPage: true });
  ok(logs.filter((l) => !l.includes("favicon")).length === 0, "Handy: keine Konsolenfehler" + (logs.length ? "\n   " + logs.join("\n   ") : ""));
}

await b.close();
console.log(fehler ? `\n${fehler} Prüfung(en) fehlgeschlagen` : "\nAlle Prüfungen bestanden");
process.exit(fehler ? 1 : 0);
