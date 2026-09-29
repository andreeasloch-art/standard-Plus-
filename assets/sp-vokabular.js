/* ============================================================
   Standard Plus - Wörterbuch für alle Eingabe- und Suchfelder
   ------------------------------------------------------------
   Eine einzige Quelle für Länder, Städte, Berufe, Branchen,
   Sprachen, Kenntnisse und Rechtsformen. Jedes Suchfeld der
   Seite bedient sich hier, damit überall dieselben Begriffe
   vorgeschlagen werden.

   Alles liegt im Browser. Es wird nichts nachgeladen und nichts
   übertragen - eine Eingabe verlässt dieses Gerät nicht.
   ============================================================ */
(function (w) {
  'use strict';
  var SP = w.SP;

  /* ---------- Länder mit ISO-Kürzel ---------- */
  var LAENDER = [
    ['DE', 'Deutschland'], ['AT', 'Österreich'], ['CH', 'Schweiz'],
    ['RO', 'Rumänien'], ['PL', 'Polen'], ['BG', 'Bulgarien'], ['HU', 'Ungarn'],
    ['HR', 'Kroatien'], ['SK', 'Slowakei'], ['CZ', 'Tschechien'], ['SI', 'Slowenien'],
    ['IT', 'Italien'], ['ES', 'Spanien'], ['PT', 'Portugal'], ['GR', 'Griechenland'],
    ['FR', 'Frankreich'], ['BE', 'Belgien'], ['NL', 'Niederlande'], ['LU', 'Luxemburg'],
    ['DK', 'Dänemark'], ['SE', 'Schweden'], ['FI', 'Finnland'], ['IE', 'Irland'],
    ['LT', 'Litauen'], ['LV', 'Lettland'], ['EE', 'Estland'], ['MT', 'Malta'],
    ['CY', 'Zypern'], ['RS', 'Serbien'], ['BA', 'Bosnien und Herzegowina'],
    ['MK', 'Nordmazedonien'], ['AL', 'Albanien'], ['ME', 'Montenegro'],
    ['MD', 'Republik Moldau'], ['UA', 'Ukraine'], ['TR', 'Türkei'],
    ['NO', 'Norwegen'], ['IS', 'Island'], ['GB', 'Vereinigtes Königreich']
  ];

  /* ---------- Städte, nach Land geordnet ---------- */
  var STAEDTE = {
    DE: ['Berlin', 'Hamburg', 'München', 'Köln', 'Frankfurt am Main', 'Stuttgart',
         'Düsseldorf', 'Leipzig', 'Dortmund', 'Essen', 'Bremen', 'Dresden', 'Hannover',
         'Nürnberg', 'Duisburg', 'Bochum', 'Wuppertal', 'Bielefeld', 'Bonn', 'Münster',
         'Karlsruhe', 'Mannheim', 'Augsburg', 'Wiesbaden', 'Mönchengladbach', 'Gelsenkirchen',
         'Braunschweig', 'Kiel', 'Chemnitz', 'Aachen', 'Halle (Saale)', 'Magdeburg',
         'Freiburg im Breisgau', 'Krefeld', 'Lübeck', 'Mainz', 'Erfurt', 'Oberhausen',
         'Rostock', 'Kassel', 'Hagen', 'Saarbrücken', 'Potsdam', 'Ludwigshafen', 'Oldenburg',
         'Osnabrück', 'Heidelberg', 'Solingen', 'Darmstadt', 'Regensburg', 'Ingolstadt',
         'Würzburg', 'Ulm', 'Heilbronn', 'Pforzheim', 'Göttingen', 'Wolfsburg', 'Koblenz',
         'Jena', 'Trier', 'Siegen', 'Cottbus', 'Schwerin', 'Flensburg', 'Konstanz',
         'Passau', 'Bamberg', 'Landshut', 'Rosenheim', 'Friedrichshafen'],
    AT: ['Wien', 'Graz', 'Linz', 'Salzburg', 'Innsbruck', 'Klagenfurt', 'Villach',
         'Wels', 'Sankt Pölten', 'Dornbirn', 'Wiener Neustadt', 'Bregenz'],
    CH: ['Zürich', 'Genf', 'Basel', 'Bern', 'Lausanne', 'Winterthur', 'Luzern',
         'Sankt Gallen', 'Lugano', 'Biel', 'Zug', 'Chur'],
    RO: ['Bukarest', 'Cluj-Napoca', 'Timișoara', 'Iași', 'Constanța', 'Craiova',
         'Brașov', 'Galați', 'Ploiești', 'Oradea', 'Brăila', 'Arad', 'Pitești',
         'Sibiu', 'Bacău', 'Târgu Mureș', 'Baia Mare', 'Buzău', 'Satu Mare', 'Suceava'],
    PL: ['Warschau', 'Krakau', 'Łódź', 'Breslau', 'Posen', 'Danzig', 'Stettin',
         'Bydgoszcz', 'Lublin', 'Katowice', 'Białystok', 'Gdynia', 'Częstochowa', 'Radom'],
    BG: ['Sofia', 'Plowdiw', 'Warna', 'Burgas', 'Russe', 'Stara Sagora', 'Plewen', 'Sliwen'],
    HU: ['Budapest', 'Debrecen', 'Szeged', 'Miskolc', 'Pécs', 'Győr', 'Nyíregyháza', 'Kecskemét'],
    HR: ['Zagreb', 'Split', 'Rijeka', 'Osijek', 'Zadar', 'Slavonski Brod', 'Pula', 'Karlovac'],
    SK: ['Bratislava', 'Košice', 'Prešov', 'Žilina', 'Nitra', 'Banská Bystrica', 'Trnava'],
    CZ: ['Prag', 'Brünn', 'Ostrava', 'Pilsen', 'Liberec', 'Olomouc', 'Budweis', 'Hradec Králové'],
    SI: ['Ljubljana', 'Maribor', 'Celje', 'Kranj', 'Koper'],
    IT: ['Rom', 'Mailand', 'Neapel', 'Turin', 'Palermo', 'Genua', 'Bologna', 'Florenz',
         'Bari', 'Catania', 'Venedig', 'Verona', 'Bozen', 'Triest'],
    ES: ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Saragossa', 'Málaga', 'Murcia',
         'Palma', 'Bilbao', 'Alicante', 'Córdoba', 'Valladolid'],
    PT: ['Lissabon', 'Porto', 'Braga', 'Coimbra', 'Faro', 'Funchal', 'Setúbal'],
    GR: ['Athen', 'Thessaloniki', 'Patras', 'Heraklion', 'Larisa', 'Volos'],
    FR: ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nizza', 'Nantes', 'Straßburg', 'Lille'],
    BE: ['Brüssel', 'Antwerpen', 'Gent', 'Charleroi', 'Lüttich', 'Brügge'],
    NL: ['Amsterdam', 'Rotterdam', 'Den Haag', 'Utrecht', 'Eindhoven', 'Groningen'],
    LU: ['Luxemburg', 'Esch-sur-Alzette', 'Differdingen'],
    LT: ['Vilnius', 'Kaunas', 'Klaipėda', 'Šiauliai'],
    LV: ['Riga', 'Daugavpils', 'Liepāja', 'Jelgava'],
    EE: ['Tallinn', 'Tartu', 'Narva', 'Pärnu'],
    RS: ['Belgrad', 'Novi Sad', 'Niš', 'Kragujevac', 'Subotica'],
    BA: ['Sarajevo', 'Banja Luka', 'Tuzla', 'Zenica', 'Mostar'],
    MK: ['Skopje', 'Bitola', 'Kumanovo'],
    AL: ['Tirana', 'Durrës', 'Vlora', 'Shkodra'],
    UA: ['Kyjiw', 'Lwiw', 'Charkiw', 'Odessa', 'Dnipro'],
    MD: ['Chișinău', 'Bălți', 'Tiraspol'],
    TR: ['Istanbul', 'Ankara', 'Izmir', 'Bursa', 'Antalya'],
    DK: ['Kopenhagen', 'Aarhus', 'Odense', 'Aalborg'],
    SE: ['Stockholm', 'Göteborg', 'Malmö', 'Uppsala'],
    NO: ['Oslo', 'Bergen', 'Trondheim', 'Stavanger'],
    FI: ['Helsinki', 'Espoo', 'Tampere', 'Turku'],
    IE: ['Dublin', 'Cork', 'Limerick', 'Galway'],
    GB: ['London', 'Manchester', 'Birmingham', 'Glasgow', 'Leeds', 'Liverpool']
  };

  /* ---------- Regionen, für die Suche nach grösseren Räumen ---------- */
  var REGIONEN = [
    'Baden-Württemberg', 'Bayern', 'Berlin', 'Brandenburg', 'Bremen', 'Hamburg',
    'Hessen', 'Mecklenburg-Vorpommern', 'Niedersachsen', 'Nordrhein-Westfalen',
    'Rheinland-Pfalz', 'Saarland', 'Sachsen', 'Sachsen-Anhalt', 'Schleswig-Holstein',
    'Thüringen', 'Ruhrgebiet', 'Rhein-Main-Gebiet', 'Rhein-Neckar', 'Bodenseeregion',
    'Oberbayern', 'Franken', 'Schwaben', 'Ostwestfalen', 'Niederrhein',
    'Tirol', 'Vorarlberg', 'Steiermark', 'Kärnten', 'Oberösterreich', 'Niederösterreich',
    'Deutschschweiz', 'Romandie', 'Tessin', 'Siebenbürgen', 'Banat', 'Moldauregion'
  ];

  /* ---------- Berufe, nach Branchenschlüssel ---------- */
  var BERUFE = {
    pflege: ['Pflegefachkraft', 'Gesundheits- und Krankenpfleger/in', 'Altenpfleger/in',
             'Pflegehelfer/in', 'Intensivpflegekraft', 'Operationstechnische/r Assistent/in',
             'Anästhesietechnische/r Assistent/in', 'Hebamme', 'Medizinische/r Fachangestellte/r',
             'Physiotherapeut/in', 'Ergotherapeut/in', 'Logopäde/Logopädin',
             'Rettungssanitäter/in', 'Notfallsanitäter/in', 'Stationsleitung',
             'Pflegedienstleitung', 'Heilerziehungspfleger/in', 'Betreuungskraft',
             'Zahnmedizinische/r Fachangestellte/r', 'Pharmazeutisch-kaufmännische/r Angestellte/r'],
    bau: ['Maurer/in', 'Polier/in', 'Bauleiter/in', 'Betonbauer/in', 'Stahlbetonbauer/in',
          'Zimmerer/Zimmerin', 'Dachdecker/in', 'Fliesenleger/in', 'Trockenbaumonteur/in',
          'Gerüstbauer/in', 'Elektroniker/in für Energie- und Gebäudetechnik',
          'Anlagenmechaniker/in SHK', 'Installateur/in', 'Maler/in und Lackierer/in',
          'Straßenbauer/in', 'Tiefbaufacharbeiter/in', 'Schweißer/in', 'Schlosser/in',
          'Metallbauer/in', 'Kranführer/in', 'Baugeräteführer/in', 'Bauhelfer/in',
          'Estrichleger/in', 'Glaser/in', 'Tischler/in', 'Schreiner/in'],
    it: ['Softwareentwickler/in', 'Frontend-Entwickler/in', 'Backend-Entwickler/in',
         'Fullstack-Entwickler/in', 'Systemadministrator/in', 'Netzwerkadministrator/in',
         'DevOps Engineer', 'Cloud Engineer', 'Datenbankadministrator/in', 'Data Engineer',
         'IT-Projektleiter/in', 'IT-Supportmitarbeiter/in', 'Fachinformatiker/in Systemintegration',
         'Fachinformatiker/in Anwendungsentwicklung', 'IT-Sicherheitsanalyst/in',
         'Testmanager/in', 'SAP-Berater/in', 'Webentwickler/in', 'Mobile-Entwickler/in'],
    gastro: ['Koch/Köchin', 'Chefkoch/Chefköchin', 'Sous-Chef', 'Beikoch/Beiköchin',
             'Restaurantfachkraft', 'Servicekraft', 'Kellner/in', 'Barkeeper/in',
             'Hotelfachkraft', 'Rezeptionist/in', 'Housekeeping-Kraft', 'Zimmermädchen',
             'Küchenhilfe', 'Bäcker/in', 'Konditor/in', 'Metzger/in', 'Fleischer/in',
             'Patissier/Patissière', 'Barista', 'Veranstaltungsleiter/in'],
    logistik: ['Berufskraftfahrer/in', 'LKW-Fahrer/in', 'Busfahrer/in', 'Kurierfahrer/in',
               'Staplerfahrer/in', 'Lagerist/in', 'Lagerhelfer/in', 'Kommissionierer/in',
               'Disponent/in', 'Speditionskaufmann/-frau', 'Logistikleiter/in',
               'Fachkraft für Lagerlogistik', 'Zusteller/in', 'Umzugshelfer/in',
               'Gefahrgutfahrer/in', 'Containerdisponent/in'],
    produktion: ['Produktionshelfer/in', 'Maschinenbediener/in', 'Anlagenführer/in',
                 'Industriemechaniker/in', 'Zerspanungsmechaniker/in', 'CNC-Fräser/in',
                 'CNC-Dreher/in', 'Mechatroniker/in', 'Elektroniker/in für Betriebstechnik',
                 'Montagehelfer/in', 'Qualitätsprüfer/in', 'Werkzeugmechaniker/in',
                 'Schichtleiter/in', 'Instandhalter/in', 'Verfahrensmechaniker/in',
                 'Kunststofftechnologe/-technologin', 'Lackierer/in'],
    buero: ['Sachbearbeiter/in', 'Bürokaufmann/-frau', 'Industriekaufmann/-frau',
            'Buchhalter/in', 'Lohnbuchhalter/in', 'Steuerfachangestellte/r',
            'Personalsachbearbeiter/in', 'Personalreferent/in', 'Recruiter/in',
            'Assistenz der Geschäftsführung', 'Teamassistenz', 'Empfangskraft',
            'Controller/in', 'Einkäufer/in', 'Vertriebsmitarbeiter/in',
            'Kundenberater/in', 'Callcenter-Agent/in', 'Projektassistenz',
            'Marketingreferent/in', 'Werkstudent/in']
  };

  /* ---------- Sprachen ---------- */
  var SPRACHEN = ['Deutsch', 'Englisch', 'Rumänisch', 'Polnisch', 'Bulgarisch', 'Ungarisch',
    'Kroatisch', 'Serbisch', 'Bosnisch', 'Slowakisch', 'Tschechisch', 'Slowenisch',
    'Italienisch', 'Spanisch', 'Portugiesisch', 'Französisch', 'Niederländisch',
    'Griechisch', 'Türkisch', 'Albanisch', 'Mazedonisch', 'Ukrainisch', 'Russisch',
    'Litauisch', 'Lettisch', 'Estnisch', 'Dänisch', 'Schwedisch', 'Norwegisch',
    'Finnisch', 'Arabisch', 'Philippinisch', 'Vietnamesisch', 'Hindi'];

  /* ---------- Kenntnisse, Nachweise und Zusatzqualifikationen ---------- */
  var FAEHIGKEITEN = [
    'Führerschein Klasse B', 'Führerschein Klasse BE', 'Führerschein Klasse C',
    'Führerschein Klasse C1', 'Führerschein Klasse CE', 'Führerschein Klasse D',
    'Fahrerkarte', 'Kennzahl 95', 'ADR-Schein Gefahrgut', 'Staplerschein',
    'Kranschein', 'Hubarbeitsbühnenschein', 'Erdbaumaschinenschein',
    'Schweißerprüfung MAG', 'Schweißerprüfung WIG', 'Schweißerprüfung E-Hand',
    'Höhentauglichkeit G41', 'Arbeitsmedizinische Vorsorge G25',
    'Erste-Hilfe-Kurs', 'Brandschutzhelfer', 'Sicherheitsunterweisung SCC',
    'Berufsanerkennung liegt vor', 'Anerkennungsverfahren läuft',
    'Beatmungspflege', 'Intensivpflege', 'Wundmanagement', 'Palliativpflege',
    'Demenzbetreuung', 'Praxisanleitung', 'Medikamentengabe', 'Injektionen',
    'Behandlungspflege LG1', 'Behandlungspflege LG2',
    'HACCP', 'Hygieneschulung', 'Lebensmittelbelehrung', 'Allergenkunde',
    'À-la-carte-Erfahrung', 'Bankettservice', 'Frühstücksservice',
    'CAD', 'AutoCAD', 'Revit', 'SPS Siemens S7', 'CNC Heidenhain', 'CNC Siemens',
    'Bauzeichnen', 'Aufmaß', 'Schalungsbau', 'Bewehrung',
    'SAP', 'DATEV', 'Lexware', 'MS Office', 'Excel fortgeschritten', 'ERP-Systeme',
    'Java', 'Python', 'JavaScript', 'TypeScript', 'React', 'Angular', 'Vue',
    'Node.js', 'PHP', 'C#', '.NET', 'SQL', 'Linux', 'Windows Server', 'Docker',
    'Kubernetes', 'AWS', 'Azure', 'Netzwerktechnik', 'IT-Sicherheit',
    'Schichtbereitschaft', 'Wochenendbereitschaft', 'Montagebereitschaft',
    'Reisebereitschaft', 'Umzugsbereit', 'Eigener PKW', 'Wohnung wird benötigt'
  ];

  /* ---------- Rechtsformen ---------- */
  var RECHTSFORMEN = ['GmbH', 'GmbH & Co. KG', 'UG (haftungsbeschränkt)', 'AG', 'SE',
    'e. K.', 'OHG', 'KG', 'GbR', 'eG', 'gGmbH', 'gAG', 'Einzelunternehmen',
    'Anstalt des öffentlichen Rechts', 'Körperschaft des öffentlichen Rechts',
    'Stiftung', 'e. V.', 'GmbH (Österreich)', 'AG (Schweiz)', 'SRL (Rumänien)'];

  /* ---------- Staatsangehörigkeiten ---------- */
  var STAATEN = ['deutsch', 'österreichisch', 'schweizerisch', 'rumänisch', 'polnisch',
    'bulgarisch', 'ungarisch', 'kroatisch', 'serbisch', 'bosnisch', 'slowakisch',
    'tschechisch', 'slowenisch', 'italienisch', 'spanisch', 'portugiesisch',
    'griechisch', 'französisch', 'belgisch', 'niederländisch', 'litauisch',
    'lettisch', 'estnisch', 'albanisch', 'nordmazedonisch', 'montenegrinisch',
    'moldauisch', 'ukrainisch', 'türkisch', 'kosovarisch', 'philippinisch',
    'indisch', 'vietnamesisch', 'brasilianisch'];

  /* ---------- Führerscheinklassen ---------- */
  var FUEHRERSCHEIN = [
    ['B', 'PKW bis 3,5 t'], ['BE', 'PKW mit Anhänger'], ['C1', 'LKW bis 7,5 t'],
    ['C1E', 'LKW bis 7,5 t mit Anhänger'], ['C', 'LKW über 3,5 t'],
    ['CE', 'LKW mit Anhänger'], ['D1', 'Kleinbus'], ['D', 'Bus'],
    ['T', 'Zugmaschine'], ['L', 'Landwirtschaft'], ['A', 'Motorrad'],
    ['AM', 'Kleinkraftrad']
  ];

  /* ---------- Leistungen, die Unternehmen anbieten ---------- */
  var LEISTUNGEN = ['Unterkunft wird gestellt', 'Zuschuss zur Wohnung',
    'Werkswohnung verfügbar', 'Fahrtkostenzuschuss', 'Anreise wird organisiert',
    'Deutschkurs im Betrieb', 'Sprachkurs wird bezahlt',
    'Unterstützung bei der Berufsanerkennung', 'Begleitung bei Behördengängen',
    'Unbefristeter Vertrag', 'Übernahme nach Probezeit', 'Tarifliche Vergütung',
    'Übertarifliche Bezahlung', 'Weihnachts- und Urlaubsgeld', 'Schichtzulagen',
    '30 Tage Urlaub', 'Betriebliche Altersvorsorge', 'Jobticket',
    'Dienstwagen', 'Firmenhandy', 'Betriebskindergarten',
    'Kantine oder Essenszuschuss', 'Arbeitskleidung wird gestellt',
    'Werkzeug wird gestellt', 'Fort- und Weiterbildung', 'Aufstiegsmöglichkeiten',
    'Feste Arbeitszeiten', 'Gleitzeit', 'Homeoffice möglich', 'Gesundheitsangebote'];

  /* ---------- Verfügbarkeit ---------- */
  var VERFUEGBAR = ['ab sofort', 'in 2 Wochen', 'in 4 Wochen', 'in 3 Monaten',
    'nach Absprache', 'zum Monatsersten', 'nach Kündigungsfrist'];

  /* ---------- Nachschlagen ---------- */
  var LAND_NAME = {};
  LAENDER.forEach(function (l) { LAND_NAME[l[0]] = l[1]; });

  var ALLE_STAEDTE = [];
  Object.keys(STAEDTE).forEach(function (code) {
    STAEDTE[code].forEach(function (stadt) {
      ALLE_STAEDTE.push({ text: stadt, land: code });
    });
  });

  var ALLE_BERUFE = [];
  Object.keys(BERUFE).forEach(function (br) {
    BERUFE[br].forEach(function (b) { ALLE_BERUFE.push({ text: b, branche: br }); });
  });

  /* Ersatzliste, falls die Seite ohne Datenbank auskommt (Startseite).
     So braucht das Woerterbuch keinen Zugriff auf den Speicher. */
  var BRANCHEN_FALLBACK = {
    pflege: 'Pflege und Gesundheit', bau: 'Bau und Handwerk', it: 'IT und Technologie',
    gastro: 'Gastronomie', logistik: 'Logistik', produktion: 'Industrie und Produktion',
    buero: 'Verwaltung und Büro'
  };

  function branchen() {
    return (SP.db && SP.db.BRANCHEN) || BRANCHEN_FALLBACK;
  }

  var BRANCHEN_ICON = {
    pflege: 'health', bau: 'helmet', it: 'code', gastro: 'utensils',
    logistik: 'truck', produktion: 'factory', buero: 'office'
  };

  function brancheName(schluessel) {
    return branchen()[schluessel] || schluessel;
  }

  /* ============================================================
     SP.vok.eintraege(typen)
     Liefert Vorschläge für die gewünschten Rubriken. Mögliche
     Werte: ort, region, land, beruf, branche, sprache, kenntnis,
     rechtsform, verfuegbar
     ============================================================ */
  function eintraege(typen) {
    var v = [];
    var will = {};
    (typen || []).forEach(function (t) { will[t] = true; });

    if (will.ort) {
      ALLE_STAEDTE.forEach(function (s) {
        v.push({ typ: 'Ort', text: SP.tInhalt(s.text), icon: 'pin', zusatz: SP.tInhalt(LAND_NAME[s.land] || s.land) });
      });
    }
    if (will.region) {
      REGIONEN.forEach(function (r) {
        v.push({ typ: 'Region', text: SP.tInhalt(r), icon: 'globe' });
      });
    }
    if (will.land) {
      LAENDER.forEach(function (l) {
        v.push({ typ: 'Land', text: SP.tInhalt(l[1]), icon: 'globe', zusatz: l[0], wert: l[0] });
      });
    }
    if (will.beruf) {
      ALLE_BERUFE.forEach(function (b) {
        v.push({ typ: 'Beruf', text: SP.tInhalt(b.text), icon: 'briefcase',
          zusatz: SP.tInhalt(brancheName(b.branche)), wert: b.branche });
      });
    }
    if (will.branche) {
      var b = branchen();
      Object.keys(b).forEach(function (k) {
        v.push({ typ: 'Branche', text: SP.tInhalt(b[k]), icon: BRANCHEN_ICON[k] || 'grid', wert: k });
      });
    }
    if (will.sprache) {
      SPRACHEN.forEach(function (s) { v.push({ typ: 'Sprache', text: SP.tInhalt(s), icon: 'globe' }); });
    }
    if (will.kenntnis) {
      FAEHIGKEITEN.forEach(function (f) { v.push({ typ: 'Kenntnis', text: SP.tInhalt(f), icon: 'check' }); });
    }
    if (will.rechtsform) {
      RECHTSFORMEN.forEach(function (r) { v.push({ typ: 'Rechtsform', text: SP.tInhalt(r), icon: 'building' }); });
    }
    if (will.verfuegbar) {
      VERFUEGBAR.forEach(function (t) { v.push({ typ: 'Verfügbar', text: SP.tInhalt(t), icon: 'calendar' }); });
    }
    if (will.staat) {
      STAATEN.forEach(function (t) { v.push({ typ: 'Staatsangehörigkeit', text: SP.tInhalt(t), icon: 'user' }); });
    }
    if (will.fuehrerschein) {
      FUEHRERSCHEIN.forEach(function (f) {
        v.push({ typ: 'Führerschein', text: f[0], icon: 'truck', zusatz: SP.tInhalt(f[1]) });
      });
    }
    if (will.leistung) {
      LEISTUNGEN.forEach(function (t) { v.push({ typ: 'Leistung', text: SP.tInhalt(t), icon: 'heart' }); });
    }
    return v;
  }

  SP.vok = {
    LAENDER: LAENDER, STAEDTE: STAEDTE, REGIONEN: REGIONEN, BERUFE: BERUFE,
    SPRACHEN: SPRACHEN, FAEHIGKEITEN: FAEHIGKEITEN, RECHTSFORMEN: RECHTSFORMEN,
    VERFUEGBAR: VERFUEGBAR, STAATEN: STAATEN, FUEHRERSCHEIN: FUEHRERSCHEIN,
    LEISTUNGEN: LEISTUNGEN, landName: function (c) { return SP.tInhalt(LAND_NAME[c] || c); },
    eintraege: eintraege,

    /* Quelle für SP.autocomplete: feste Begriffe, wahlweise mit
       zusätzlichen Einträgen aus der Datenbank davor. */
    quelle: function (typen, zusatzQuelle) {
      return function () {
        var aus_db = typeof zusatzQuelle === 'function' ? (zusatzQuelle() || []) : [];
        return aus_db.concat(eintraege(typen));
      };
    },

    /* Ein Feld in einem Rutsch verkabeln. */
    feld: function (el, typen, optionen) {
      if (!el || !SP.autocomplete) return;
      var o = optionen || {};
      o.quelle = SP.vok.quelle(typen, o.zusatz);
      if (o.max == null) o.max = 8;
      SP.autocomplete(el, o);
    }
  };

})(window);
