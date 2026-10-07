import { createFileRoute, Link } from "@tanstack/react-router";
import { Ph, Rechtstext } from "@/components/site/Rechtstext";

export const Route = createFileRoute("/datenschutz")({
  head: () => ({ meta: [
    { title: "Datenschutzerklärung – Standard Plus" },
    { name: "description", content: "Wie Standard Plus personenbezogene Daten verarbeitet: Hosting, Konto, Profile, Anfragen, Rechtsgrundlagen, Speicherdauer und Ihre Rechte." },
    { property: "og:title", content: "Datenschutzerklärung – Standard Plus" },
    { property: "og:description", content: "Datenschutz nach DSGVO – ohne externe Tracker, Schriften lokal gehostet." },
  ] }),
  component: Datenschutz,
});

function Datenschutz() {
  return (
    <Rechtstext titel="Datenschutzerklärung" stand="04.10.2026 (Version 2026-10-04)">
      <h2>1. Verantwortlicher</h2>
      <p><Ph>Firmenname</Ph>, <Ph>Anschrift</Ph>, E-Mail: <Ph>E-Mail-Adresse</Ph>, Telefon: <Ph>Telefonnummer</Ph>.</p>
      <p>Datenschutzbeauftragte/r: <Ph>Name und Kontakt – oder Satz streichen, falls keine Benennungspflicht</Ph></p>

      <h2>2. Hosting und Server-Logs</h2>
      <p>
        Die Website wird über die Plattform Lovable (Lovable Labs Incorporated, <Ph>Anschrift des Anbieters</Ph>) bereitgestellt.
        Datenbank, Anmeldung und Dateiablage laufen über „Lovable Cloud“, technisch betrieben mit Supabase (Supabase Inc., USA).
        Serverstandort: <Ph>Region/Land des Datenbankservers</Ph>.
      </p>
      <p>
        Mit den Anbietern besteht <Ph>ein Auftragsverarbeitungsvertrag nach Art. 28 DSGVO – bitte abschließen und bestätigen</Ph>.
        Eine Übermittlung in die USA kann nicht ausgeschlossen werden; sie stützt sich auf <Ph>Zertifizierung nach dem EU-US Data Privacy Framework und/oder EU-Standardvertragsklauseln – bitte prüfen</Ph>.
      </p>
      <p>
        Beim Aufruf verarbeiten die Server technisch notwendige Daten (IP-Adresse, Datum/Uhrzeit, aufgerufene Seite, Browser-Kennung) in Protokolldateien,
        um die Seite sicher auszuliefern. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an Betrieb und Sicherheit).
        Speicherdauer: <Ph>Dauer der Log-Aufbewahrung beim Anbieter</Ph>.
      </p>

      <h2>3. Registrierung und Konto</h2>
      <p>
        Für ein Konto benötigen wir Ihre Rolle (Fachkraft, Arbeitgeber oder Busunternehmen), Vor- und Nachnamen, bei Fachkräften das Geburtsdatum,
        bei Unternehmen Firmennamen und Handelsregister- bzw. USt-Nummer, sowie <em>entweder</em> Ihre Handynummer <em>oder</em> E-Mail-Adresse und Passwort
        (gespeichert als Hash). Name und Geburtsdatum bzw. Registernummer nutzen wir, um sicherzustellen, dass jede Person und jede Firma nur ein Konto hat
        (Schutz vor Mehrfach- und Scheinkonten) und dass Fachkräfte volljährig sind. Dafür vergleichen wir diese Angaben mit bestehenden Konten.
        Das Geburtsdatum ist nie öffentlich sichtbar; Rechtsgrundlage: Art. 6 Abs. 1 lit. b und f DSGVO. Bei der Handynummer schicken wir Ihnen einen einmaligen Code per SMS; Ihr Konto wird erst freigeschaltet und Ihr Profil erst sichtbar,
        wenn Sie diesen Code bestätigt haben. Unbestätigte Registrierungen löschen wir nach <Ph>z. B. 7 Tagen</Ph>.
        Wir speichern außerdem Zeitpunkt und Version Ihrer Zustimmung zur Datenschutzerklärung und zu den AGB bzw. Nutzungsbedingungen
        sowie bei Unternehmen die Bestätigung der Unternehmereigenschaft. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertrag) und lit. c (Nachweispflichten).
      </p>

      <h2>4. E-Mail- und SMS-Versand</h2>
      <p>
        Für Bestätigungs- und Passwort-Zurücksetzen-E-Mails wird Ihre E-Mail-Adresse über den Anmeldedienst von Lovable Cloud versendet.
        Für Anmelde-Codes per SMS übermitteln wir Ihre Handynummer an den Dienst Twilio Verify (Twilio Ireland Limited, 25–28 North Wall Quay,
        Dublin 1, Irland; Mutterunternehmen Twilio Inc., USA) als Auftragsverarbeiter. Twilio erzeugt den Code, verschickt ihn und prüft ihn.
        <Ph>Übermittlung in die USA und Garantien (EU-US Data Privacy Framework, Standardvertragsklauseln) – bitte prüfen</Ph>.
        Zum Schutz vor Kostenmissbrauch zählen wir, wie oft Codes angefordert werden. Dafür speichern wir nur gekürzte, nicht umkehrbare
        Prüfwerte (Hash) Ihrer Nummer und Ihrer IP-Adresse sowie das Land, nie die Nummer oder IP selbst, und löschen sie nach 30 Tagen
        (Art. 6 Abs. 1 lit. f DSGVO).
        Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO. Newsletter versenden wir nicht.
      </p>
      <p>
        <strong>Schutz vor Missbrauch:</strong> Damit niemand automatisiert massenhaft SMS oder E-Mails auslöst, verschicken wir SMS-Codes nur in
        ausgewählte Länder und prüfen vor dem Versand mit Cloudflare Turnstile (Cloudflare, Inc., 101 Townsend St., San Francisco, CA 94107, USA),
        ob ein Mensch die Seite bedient. Dabei werden technische Merkmale Ihres Browsers und Ihre IP-Adresse an Cloudflare übermittelt; es werden
        keine Werbe-Cookies gesetzt. Turnstile wird nur auf der Anmeldeseite geladen. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (Schutz vor
        Betrug und Kostenmissbrauch) und § 25 Abs. 2 Nr. 2 TDDDG. <Ph>Nur aufführen, wenn Turnstile eingeschaltet ist; Drittlandgarantien (EU-US Data Privacy Framework) bitte prüfen</Ph>.
      </p>
      <p>
        <strong>Benachrichtigungen:</strong> Über neue Einladungen, Zusagen, Vertragsbestätigungen, das Ergebnis der Ausweisprüfung und Fahrtanfragen
        informieren wir Sie in der App (Glocke). Die Nachrichten enthalten keine Namen oder Kontaktdaten der Gegenseite. Haben Sie eine E-Mail-Adresse
        hinterlegt, schicken wir dieselbe Nachricht zusätzlich per E-Mail über den Versanddienst <Ph>Resend, Inc., 2261 Market Street #5039, San Francisco, CA 94114, USA – Anschrift bitte prüfen</Ph> als
        Auftragsverarbeiter (<Ph>Garantien für die Übermittlung in die USA, z. B. EU-US Data Privacy Framework / Standardvertragsklauseln – bitte prüfen</Ph>).
        E-Mails können Sie jederzeit unter „Benachrichtigungen“ abbestellen. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO.
        Benachrichtigungen werden nach 180 Tagen gelöscht.
      </p>

      <h2>5. Profil- und Matching-Daten</h2>
      <p>
        Alle weiteren Profilangaben sind freiwillig (z. B. Name, Telefon, Wohnort, Beruf, Erfahrung, Deutschniveau, Sprachen, Werdegang, Skills;
        bei Unternehmen Firmendaten). Das Geburtsdatum dient der Prüfung des Mindestalters und der Ein-Konto-Regel (Abschnitt 3); Ihr Alter (nicht das Geburtsdatum) wird nur angezeigt, wenn Sie das im Profil ausdrücklich
        einschalten – freiwillig und jederzeit abschaltbar (Art. 6 Abs. 1 lit. a DSGVO). Staatsangehörigkeit dient nur der Einschätzung, ob eine Arbeitserlaubnis nötig ist, und ist nie öffentlich sichtbar. Besondere Kategorien personenbezogener Daten (z. B. Gesundheit, Religion) fragen wir nicht ab. Ein Profilfoto ist freiwillig (siehe Abschnitt 8).
      </p>
      <p>
        Arbeitnehmerprofile erscheinen in der Suche nur mit Ihrer ausdrücklichen, freiwilligen Einwilligung (Art. 6 Abs. 1 lit. a DSGVO) und nur pseudonymisiert
        (Vorname + Initial, Beruf, Orte, Deutschniveau, Erfahrung, Skills, Sprachen, Werdegang). Sie können die Einwilligung jederzeit im Profil widerrufen; die Rechtmäßigkeit
        der bis dahin erfolgten Anzeige bleibt unberührt.
      </p>
      <p>
        <strong>Keine automatisierte Entscheidung:</strong> Eine angezeigte „Übereinstimmung in Prozent“ ist lediglich eine Empfehlung zur Orientierung.
        Es findet keine ausschließlich automatisierte Entscheidung im Sinne von Art. 22 DSGVO statt – über Anfragen und Einstellungen entscheiden stets Menschen.
      </p>

      <h2>6. Anfragen und beidseitige Freigabe</h2>
      <p>
        Fragt ein Unternehmen ein Profil an, sieht die Fachkraft den Firmennamen und die Firmenangaben. Sagt die Fachkraft zu („Match“), findet das Interview über die Plattform statt.
        Nachname, Telefon und E-Mail der Fachkraft werden dem Unternehmen erst angezeigt, wenn beide Seiten den Vertragsabschluss bestätigt haben.
        Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (vorvertragliche Maßnahmen und Vertrag) bzw. lit. a (Freigabe).
      </p>

      <h2>7. Bewertungen</h2>
      <p>Nach einem Match können sich beide Seiten einmal gegenseitig bewerten (1–5 Sterne, optional Text). Sichtbar nur für die Beteiligten. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO.</p>

      <h2>8. Profilfoto</h2>
      <p>
        Arbeitnehmer können freiwillig ein Profilfoto hochladen. Das Bild wird bereits in Ihrem Browser verkleinert; dabei werden eingebettete Metadaten
        (z. B. Aufnahmeort, Kameradaten) entfernt. Es liegt in einem privaten Speicherbereich und ist nur über kurzlebige signierte Links abrufbar.
      </p>
      <p>
        Mit dem Hochladen stimmen Sie ausdrücklich zu, dass Ihr Foto für alle sichtbar ist – für Unternehmen und für Besucher ohne Anmeldung –,
        solange Ihr Profil in der Suche sichtbar ist (Art. 6 Abs. 1 lit. a DSGVO). Zeitpunkt der Zustimmung und des Widerrufs werden gespeichert. Bitte beachten Sie: Auf einem Foto sind Sie erkennbar – die Pseudonymisierung durch Vorname und Initial
        gilt für das Foto daher nicht. Sie widerrufen die Einwilligung jederzeit, indem Sie das Foto im Profil löschen; gelöschte oder ersetzte Fotos
        werden sofort aus dem Speicher entfernt. Aus dem Foto werden keine Merkmale automatisch ausgewertet.
      </p>
      <p>Andere Datei-Uploads bietet die Plattform derzeit nicht an.</p>

      <h2>9. Anreise</h2>
      <p>
        Wenn Sie eine Anreise anfragen, speichern wir Abfahrts- und Zielort, frühestes Reisedatum, Anzahl der Personen und Ihren freiwilligen Hinweis, um die Fahrt
        für Sie zu organisieren. Für die Buchung geben wir Ihren Namen und die Reisedaten an das jeweilige Beförderungsunternehmen weiter (<Ph>Busunternehmen/Partner benennen</Ph>).
        Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO. Speicherdauer: <Ph>z. B. 12 Monate nach dem Reisedatum</Ph>, bei Kontolöschung sofort.
      </p>

      <h2>8a. Ausweisprüfung</h2>
      <p>
        Vor dem Vertragsabschluss prüfen wir die Identität von Fachkräften: Sie laden ein Foto Ihres Ausweises oder Reisepasses hoch (Einwilligung, Art. 6 Abs. 1 lit. a DSGVO;
        zugleich vorvertragliche Maßnahme, lit. b). Nur geschulte Mitarbeitende unseres Teams sehen die Bilder und vergleichen Name und Geburtsdatum mit Ihrem Konto.
        Die Bilder liegen in einem privaten Speicher, werden <strong>unmittelbar nach der Entscheidung gelöscht</strong>, und es bleibt nur der Vermerk „geprüft am …“.
        Zugangsnummer (CAN) und Seriennummer dürfen Sie schwärzen. Eine automatische Auswertung (Texterkennung, Gesichtsabgleich) findet nicht statt.
        Unternehmen werden anhand der Registernummer und – bei Busunternehmen – der Konzession geprüft.
      </p>

      <h2>9b. Busreisen über Busunternehmen</h2>
      <p>
        <strong>Busunternehmen</strong> veröffentlichen auf Standard Plus Firmenname, Sitz, Telefon und E-Mail für Buchungen, ihre Fahrten und Bilder
        (Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO). Bilder liegen in einem privaten Speicher und werden über kurzlebige Links angezeigt; gelöschte Bilder werden sofort entfernt.
      </p>
      <p>
        <strong>Fragen Sie als Fachkraft eine Fahrt an</strong>, erhält das jeweilige Busunternehmen nur Ihren Namen, Ihre Handynummer, Reisedatum, Personenzahl und Ihre Nachricht –
        mit Ihrer Einwilligung bei der Anfrage (Art. 6 Abs. 1 lit. a und b DSGVO). Ihr Arbeitgeber sieht den Stand der Fahrt, wenn sie zu Ihrem Vertrag gehört.
        Fahrtvorschläge berechnen wir aus Ihrem Wohnort und dem Arbeitsort; es findet keine Entscheidung allein durch Software statt.
      </p>
      <p>
        <strong>Bewertungen</strong> von Fahrten sind nur nach einer als durchgeführt bestätigten Buchung möglich und werden öffentlich mit Vorname und Initial angezeigt.
        Speicherdauer: Buchungen und Bewertungen bis zur Löschung eines beteiligten Kontos.
      </p>

      <h2>9a. Kündigungen</h2>
      <p>
        Über das Kündigungsformular übermittelte Angaben (Art der Kündigung, Name, E-Mail, ggf. Firma und Vertragsnummer, Zeitpunkt, optional Grund) speichern wir zur Bearbeitung
        und als Nachweis über den Eingang der Kündigung. Löschen Sie Ihr Konto, bleibt die Kündigung ohne Verknüpfung zum Konto bis zum Ablauf der unten genannten Frist gespeichert.
        Rechtsgrundlage: Art. 6 Abs. 1 lit. b und c DSGVO sowie lit. f (Nachweis im Streitfall).
      </p>

      <h2>10. Schriften</h2>
      <p>Die Schriften „Inter“ und „Plus Jakarta Sans“ sind lokal auf unserem Server eingebunden. Es findet keine Verbindung zu Google oder anderen Schrift-Anbietern statt.</p>

      <h2>11. Speicherung im Browser (localStorage) und Einwilligungsverwaltung</h2>
      <ul>
        <li>Anmeldesitzung (Anmelde-Token von Lovable Cloud) – technisch erforderlich, bis zur Abmeldung.</li>
        <li>Farbmodus hell/dunkel (Schlüssel „theme“) – technisch erforderlich, bis Sie ihn löschen.</li>
        <li>Ihre Cookie-Einwilligung mit Datum und Version (Schlüssel „sp-consent“) – zum Nachweis Ihrer Wahl.</li>
      </ul>
      <p>
        Rechtsgrundlage: § 25 Abs. 2 Nr. 2 TDDDG (unbedingt erforderlich) sowie Art. 6 Abs. 1 lit. f bzw. lit. c DSGVO. Statistik-, Marketing- oder externe Mediendienste setzen wir derzeit nicht ein.
        Ihre Wahl können Sie jederzeit über „Cookie-Einstellungen“ im Seitenfuß ändern oder widerrufen.
      </p>

      <h2>12. Empfänger</h2>
      <p>Hosting- und Infrastrukturanbieter (Abschnitt 2) der SMS-Dienst und – sobald E-Mail-Benachrichtigungen aktiv sind – der E-Mail-Versanddienst (Abschnitt 4) als Auftragsverarbeiter; bei einer Fahrtanfrage das Busunternehmen (Abschnitt 9b); nach beidseitig bestätigtem Vertragsabschluss das jeweilige Unternehmen bzw. die Fachkraft; bei einer Anreise das Beförderungsunternehmen (Abschnitt 9); Behörden nur bei gesetzlicher Pflicht.</p>

      <h2>13. Speicherdauer</h2>
      <ul>
        <li>Konto- und Profildaten: bis zur Löschung des Kontos (jederzeit selbst im Profil möglich).</li>
        <li>Anfragen, Vertragsbestätigungen und Bewertungen: bis zur Löschung eines beteiligten Kontos.</li>
        <li>Anreise-Anfragen: siehe Abschnitt 9.</li>
        <li>Profilfoto: bis Sie es löschen oder ersetzen, spätestens bis zur Löschung des Kontos.</li>
        <li>Benachrichtigungen: 180 Tage, bei Kontolöschung sofort.</li>
        <li>Zählwerte zum SMS-Missbrauchsschutz (nur Hashes): 30 Tage.</li>
        <li>Einwilligungsnachweise: bis zur Löschung des Kontos.</li>
        <li>Kündigungen: <Ph>z. B. 3 Jahre nach Ende des Jahres, in dem die Kündigung eingegangen ist</Ph>, auch wenn das Konto vorher gelöscht wurde; danach werden sie gelöscht.</li>
        <li>Rechnungsrelevante Unterlagen: gesetzliche Aufbewahrung (bis zu 10 Jahre, § 147 AO, § 257 HGB).</li>
      </ul>

      <h2>14. Ihre Rechte</h2>
      <p>
        Sie haben das Recht auf Auskunft (Art. 15), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung (Art. 18), Datenübertragbarkeit (Art. 20) und
        Widerruf erteilter Einwilligungen (Art. 7 Abs. 3). Auskunft und Übertragbarkeit können Sie selbst über „Meine Daten exportieren“, die Löschung über „Konto löschen“
        im <Link to="/profil-bearbeiten">Profil</Link> ausüben.
      </p>
      <p>
        <strong>Widerspruchsrecht (Art. 21 DSGVO):</strong> Soweit wir Daten auf Grundlage berechtigter Interessen verarbeiten, können Sie aus Gründen, die sich aus Ihrer besonderen Situation ergeben, jederzeit widersprechen.
      </p>
      <p>Sie können sich bei einer Datenschutz-Aufsichtsbehörde beschweren, z. B. bei <Ph>zuständige Aufsichtsbehörde am Sitz des Unternehmens</Ph>.</p>
    </Rechtstext>
  );
}
