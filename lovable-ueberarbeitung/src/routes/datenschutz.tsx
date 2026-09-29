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
    <Rechtstext titel="Datenschutzerklärung" stand="01.10.2026 (Version 2026-10-01)">
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
        Für ein Konto benötigen wir nur E-Mail-Adresse, Passwort (gespeichert als Hash) und Ihre Rolle (Unternehmen oder Arbeitnehmer).
        Wir speichern außerdem Zeitpunkt und Version Ihrer Zustimmung zur Datenschutzerklärung und zu den AGB bzw. Nutzungsbedingungen
        sowie bei Unternehmen die Bestätigung der Unternehmereigenschaft. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertrag) und lit. c (Nachweispflichten).
      </p>

      <h2>4. E-Mail-Versand</h2>
      <p>
        Für Bestätigungs- und Passwort-Zurücksetzen-E-Mails wird Ihre E-Mail-Adresse über den Anmeldedienst von Lovable Cloud versendet.
        Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO. Newsletter versenden wir nicht.
      </p>

      <h2>5. Profil- und Matching-Daten</h2>
      <p>
        Alle weiteren Profilangaben sind freiwillig (z. B. Name, Telefon, Wohnort, Beruf, Erfahrung, Deutschniveau, Sprachen, Werdegang, Skills;
        bei Unternehmen Firmendaten). Geburtsjahr dient nur der Prüfung des Mindestalters, Staatsangehörigkeit nur der Einschätzung, ob eine Arbeitserlaubnis nötig ist;
        beides ist nie öffentlich sichtbar. Besondere Kategorien personenbezogener Daten (z. B. Gesundheit, Religion) fragen wir nicht ab. Ein Profilfoto ist freiwillig (siehe Abschnitt 8).
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
        Fragt ein Unternehmen ein Profil an, sieht die Fachkraft den Firmennamen und die Firmenangaben. Nachname, Telefon und E-Mail der Fachkraft werden dem Unternehmen erst angezeigt,
        wenn beide Seiten die Anfrage freigegeben haben. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (vorvertragliche Maßnahmen) bzw. lit. a (Freigabe).
      </p>

      <h2>7. Bewertungen</h2>
      <p>Nach beidseitiger Freigabe können sich beide Seiten einmal gegenseitig bewerten (1–5 Sterne, optional Text). Sichtbar nur für die Beteiligten. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO.</p>

      <h2>8. Profilfoto</h2>
      <p>
        Arbeitnehmer können freiwillig ein Profilfoto hochladen. Das Bild wird bereits in Ihrem Browser verkleinert; dabei werden eingebettete Metadaten
        (z. B. Aufnahmeort, Kameradaten) entfernt. Es liegt in einem privaten Speicherbereich und ist nur über kurzlebige signierte Links abrufbar.
      </p>
      <p>
        Unternehmen und Besucher sehen das Foto nur, wenn Sie der Anzeige gesondert zugestimmt haben und Ihr Profil in der Suche sichtbar ist
        (Art. 6 Abs. 1 lit. a DSGVO). Bitte beachten Sie: Auf einem Foto sind Sie erkennbar – die Pseudonymisierung durch Vorname und Initial
        gilt für das Foto daher nicht. Sie können die Einwilligung jederzeit im Profil widerrufen oder das Foto löschen; gelöschte oder ersetzte Fotos
        werden sofort aus dem Speicher entfernt. Aus dem Foto werden keine Merkmale automatisch ausgewertet.
      </p>
      <p>Andere Datei-Uploads bietet die Plattform derzeit nicht an.</p>

      <h2>9. Kündigungen</h2>
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
      <p>Hosting- und Infrastrukturanbieter (Abschnitt 2) als Auftragsverarbeiter; im Rahmen der Freigabe das jeweils anfragende Unternehmen bzw. die Fachkraft; Behörden nur bei gesetzlicher Pflicht.</p>

      <h2>13. Speicherdauer</h2>
      <ul>
        <li>Konto- und Profildaten: bis zur Löschung des Kontos (jederzeit selbst im Profil möglich).</li>
        <li>Anfragen und Bewertungen: bis zur Löschung eines beteiligten Kontos.</li>
        <li>Profilfoto: bis Sie es löschen oder ersetzen, spätestens bis zur Löschung des Kontos.</li>
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
