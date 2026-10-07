import { createFileRoute, Link } from "@tanstack/react-router";
import { Ph, Rechtstext } from "@/components/site/Rechtstext";

export const Route = createFileRoute("/agb-busunternehmen")({
  head: () => ({
    meta: [
      { title: "AGB für Busunternehmen – Standard Plus" },
      { name: "description", content: "Bedingungen für Busunternehmen, die Fahrten über Standard Plus anbieten." },
    ],
  }),
  component: AgbBus,
});

function AgbBus() {
  return (
    <Rechtstext titel="AGB für Busunternehmen" stand="06.10.2026">
      <h2>1. Geltungsbereich</h2>
      <p>
        Diese Bedingungen gelten für Unternehmen, die über die Plattform Standard Plus („Plattform“) Busfahrten anbieten („Busunternehmen“).
        Betreiber der Plattform ist <Ph>Firmenname, Anschrift – wie im Impressum</Ph> („wir“). Die Plattform richtet sich an Busunternehmen ausschließlich
        als Unternehmer im Sinne von § 14 BGB. Abweichende Bedingungen des Busunternehmens gelten nicht.
      </p>

      <h2>2. Was die Plattform leistet</h2>
      <ul>
        <li>Wir stellen Fahrten freigeschalteter Busunternehmen öffentlich dar (Strecke mit Haltestellen, Preis, Kontakt, Bilder, Anzahl Fahrten, Bewertungen).</li>
        <li>Nach einem Arbeitsvertragsabschluss schlagen wir Fachkräften und Arbeitgebern passende Fahrten vor.</li>
        <li>Fachkräfte können Fahrten anfragen. Das Busunternehmen erhält dann Name, Handynummer, Reisedatum und Personenzahl der Fachkraft.</li>
        <li>
          Der Beförderungsvertrag kommt ausschließlich zwischen Busunternehmen und Fahrgast zustande. Wir sind nicht Vertragspartei,
          nicht Reiseveranstalter und nehmen keine Zahlungen für die Fahrt entgegen.
        </li>
      </ul>

      <h2>3. Registrierung und Freischaltung</h2>
      <p>
        Jedes Unternehmen darf nur ein Konto führen. Bei der Registrierung sind Firmenname, Sitz, Handelsregister- bzw. Steuernummer und eine
        verantwortliche Person anzugeben. Fahrten werden erst öffentlich sichtbar, nachdem wir die Angaben geprüft und das Konto freigeschaltet haben.
        Wir können zur Prüfung Nachweise anfordern, insbesondere die Genehmigung bzw. Gemeinschaftslizenz für den Personenverkehr. Ein Anspruch auf
        Freischaltung besteht nicht.
      </p>

      <h2>4. Pflichten des Busunternehmens</h2>
      <ul>
        <li>
          Es besitzt alle erforderlichen Genehmigungen und Lizenzen (insbesondere nach dem Personenbeförderungsgesetz bzw. der Verordnung (EG)
          Nr. 1073/2009) sowie die vorgeschriebenen Versicherungen, und hält diese während der Nutzung aufrecht.
        </li>
        <li>Es hält die Fahrgastrechte nach der Verordnung (EU) Nr. 181/2011 sowie die Lenk- und Ruhezeiten ein.</li>
        <li>Alle Angaben zu Strecke, Haltestellen, Abfahrtszeiten und Preisen sind wahr und aktuell. Preise sind Endpreise inklusive aller Pflichtkosten.</li>
        <li>Es lädt nur Bilder hoch, an denen es die nötigen Rechte hat, und die keine Personen ohne deren Einwilligung zeigen.</li>
        <li>Es beantwortet Buchungsanfragen zeitnah, spätestens innerhalb von <Ph>z. B. 2 Werktagen</Ph>, und kennzeichnet durchgeführte Fahrten wahrheitsgemäß.</li>
        <li>Es nimmt keine Gegenleistungen von Fahrgästen dafür an, Bewertungen abzugeben, zu ändern oder zu unterlassen.</li>
      </ul>

      <h2>5. Daten der Fahrgäste</h2>
      <p>
        Das Busunternehmen verwendet die übermittelten Daten der Fahrgäste ausschließlich, um die angefragte Fahrt durchzuführen, und ist dafür selbst
        datenschutzrechtlich verantwortlich. Eine Nutzung für Werbung oder eine Weitergabe an Dritte ist ausgeschlossen. Die Daten sind zu löschen,
        sobald sie für die Fahrt und gesetzliche Aufbewahrungspflichten nicht mehr benötigt werden. Einzelheiten zur Verarbeitung durch uns stehen in
        der <Link to="/datenschutz">Datenschutzerklärung</Link>.
      </p>

      <h2>6. Bewertungen</h2>
      <p>
        Bewerten können nur Fahrgäste, deren Fahrt vom Busunternehmen als durchgeführt gekennzeichnet wurde. Wir veröffentlichen Bewertungen
        unverändert und unabhängig davon, ob sie positiv oder negativ sind, und prüfen sie nur auf Rechtsverstöße. Hält das Busunternehmen eine
        Bewertung für rechtswidrig, kann es sie uns melden; wir prüfen den Hinweis und entscheiden mit Begründung.
      </p>

      <h2>7. Entgelt</h2>
      <p>
        <Ph>Bitte festlegen: Die Nutzung ist derzeit kostenlos – ODER – Provision/Gebühr in Höhe von … je vermittelter Buchung, fällig …</Ph>.
        Änderungen kündigen wir mindestens 30 Tage vorher in Textform an; das Busunternehmen kann dann zum Änderungszeitpunkt kündigen.
      </p>

      <h2>8. Sperrung und Entfernung von Inhalten</h2>
      <p>
        Wir können Fahrten ausblenden oder das Konto sperren, wenn konkrete Anhaltspunkte für einen Verstoß gegen diese Bedingungen oder geltendes
        Recht vorliegen, insbesondere bei fehlenden Genehmigungen, irreführenden Angaben oder Beschwerden über Sicherheit. Wir informieren das
        Busunternehmen über die Gründe und geben Gelegenheit zur Stellungnahme, soweit dies nicht wegen Gefahr im Verzug ausgeschlossen ist.
      </p>

      <h2>9. Haftung</h2>
      <p>
        Für die Durchführung der Fahrt haftet allein das Busunternehmen. Wir haften unbeschränkt bei Vorsatz und grober Fahrlässigkeit sowie bei
        Verletzung von Leben, Körper oder Gesundheit; bei leicht fahrlässiger Verletzung wesentlicher Vertragspflichten begrenzt auf den
        vorhersehbaren, typischen Schaden. Im Übrigen ist die Haftung ausgeschlossen. Das Busunternehmen stellt uns von Ansprüchen Dritter frei,
        die auf seinen Angaben, Inhalten oder Fahrten beruhen.
      </p>

      <h2>10. Laufzeit und Kündigung</h2>
      <p>
        Die Nutzung läuft auf unbestimmte Zeit und kann von beiden Seiten jederzeit in Textform gekündigt werden; das Busunternehmen kann sein
        Konto zudem selbst löschen. Bereits angefragte Fahrten sind vom Busunternehmen ordnungsgemäß abzuwickeln oder den Fahrgästen abzusagen.
      </p>

      <h2>11. Schlussbestimmungen</h2>
      <p>
        Es gilt deutsches Recht unter Ausschluss des UN-Kaufrechts. Gerichtsstand ist, soweit zulässig, <Ph>Ort, z. B. Ludwigsburg</Ph>.
        Sollte eine Bestimmung unwirksam sein, bleibt der Rest wirksam.
      </p>
    </Rechtstext>
  );
}
