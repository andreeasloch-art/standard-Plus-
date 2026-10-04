/**
 * Ländervorwahlen der Welt (ITU-T E.164). Ländernamen kommen aus dem Browser (Intl.DisplayNames),
 * damit die Liste in jeder Sprache stimmt. Format: [ISO-Code, Vorwahl ohne „+“].
 * Länder mit gleicher Vorwahl (z. B. USA/Kanada „1“) stehen einzeln, damit man sein Land findet.
 */
const ROH: [string, string][] = [
  ["AF","93"],["AL","355"],["DZ","213"],["AS","1684"],["AD","376"],["AO","244"],["AI","1264"],["AG","1268"],["AR","54"],["AM","374"],
  ["AW","297"],["AU","61"],["AT","43"],["AZ","994"],["BS","1242"],["BH","973"],["BD","880"],["BB","1246"],["BY","375"],["BE","32"],
  ["BZ","501"],["BJ","229"],["BM","1441"],["BT","975"],["BO","591"],["BA","387"],["BW","267"],["BR","55"],["VG","1284"],["BN","673"],
  ["BG","359"],["BF","226"],["BI","257"],["KH","855"],["CM","237"],["CA","1"],["CV","238"],["KY","1345"],["CF","236"],["TD","235"],
  ["CL","56"],["CN","86"],["CO","57"],["KM","269"],["CG","242"],["CD","243"],["CK","682"],["CR","506"],["CI","225"],["HR","385"],
  ["CU","53"],["CW","599"],["CY","357"],["CZ","420"],["DK","45"],["DJ","253"],["DM","1767"],["DO","1809"],["EC","593"],["EG","20"],
  ["SV","503"],["GQ","240"],["ER","291"],["EE","372"],["SZ","268"],["ET","251"],["FK","500"],["FO","298"],["FJ","679"],["FI","358"],
  ["FR","33"],["GF","594"],["PF","689"],["GA","241"],["GM","220"],["GE","995"],["DE","49"],["GH","233"],["GI","350"],["GR","30"],
  ["GL","299"],["GD","1473"],["GP","590"],["GU","1671"],["GT","502"],["GN","224"],["GW","245"],["GY","592"],["HT","509"],["HN","504"],
  ["HK","852"],["HU","36"],["IS","354"],["IN","91"],["ID","62"],["IR","98"],["IQ","964"],["IE","353"],["IL","972"],["IT","39"],
  ["JM","1876"],["JP","81"],["JO","962"],["KZ","7"],["KE","254"],["KI","686"],["XK","383"],["KW","965"],["KG","996"],["LA","856"],
  ["LV","371"],["LB","961"],["LS","266"],["LR","231"],["LY","218"],["LI","423"],["LT","370"],["LU","352"],["MO","853"],["MG","261"],
  ["MW","265"],["MY","60"],["MV","960"],["ML","223"],["MT","356"],["MH","692"],["MQ","596"],["MR","222"],["MU","230"],["YT","262"],
  ["MX","52"],["FM","691"],["MD","373"],["MC","377"],["MN","976"],["ME","382"],["MS","1664"],["MA","212"],["MZ","258"],["MM","95"],
  ["NA","264"],["NR","674"],["NP","977"],["NL","31"],["NC","687"],["NZ","64"],["NI","505"],["NE","227"],["NG","234"],["NU","683"],
  ["KP","850"],["MK","389"],["MP","1670"],["NO","47"],["OM","968"],["PK","92"],["PW","680"],["PS","970"],["PA","507"],["PG","675"],
  ["PY","595"],["PE","51"],["PH","63"],["PL","48"],["PT","351"],["PR","1787"],["QA","974"],["RE","262"],["RO","40"],["RU","7"],
  ["RW","250"],["KN","1869"],["LC","1758"],["VC","1784"],["WS","685"],["SM","378"],["ST","239"],["SA","966"],["SN","221"],["RS","381"],
  ["SC","248"],["SL","232"],["SG","65"],["SX","1721"],["SK","421"],["SI","386"],["SB","677"],["SO","252"],["ZA","27"],["KR","82"],
  ["SS","211"],["ES","34"],["LK","94"],["SD","249"],["SR","597"],["SE","46"],["CH","41"],["SY","963"],["TW","886"],["TJ","992"],
  ["TZ","255"],["TH","66"],["TL","670"],["TG","228"],["TO","676"],["TT","1868"],["TN","216"],["TR","90"],["TM","993"],["TC","1649"],
  ["TV","688"],["UG","256"],["UA","380"],["AE","971"],["GB","44"],["US","1"],["UY","598"],["UZ","998"],["VU","678"],["VA","39"],
  ["VE","58"],["VN","84"],["VI","1340"],["WF","681"],["YE","967"],["ZM","260"],["ZW","263"],["GG","44"],["IM","44"],["JE","44"],
  ["BQ","599"],["BL","590"],["MF","590"],["PM","508"],["SH","290"],["AX","358"],["SJ","47"],["IO","246"],["NF","672"],["TK","690"],
];

/** Diese Länder stehen oben (häufig auf der Plattform). */
export const HAEUFIG = ["DE", "AT", "CH", "RO", "PL", "BG", "HR", "HU", "IT", "ES", "FR", "GB", "US", "MD", "UA", "RS"];

export type Land = { iso: string; vorwahl: string; name: string };

export function laenderListe(sprache = "de"): Land[] {
  let namen: Intl.DisplayNames | null = null;
  try { namen = new Intl.DisplayNames([sprache], { type: "region" }); } catch { /* sehr alter Browser */ }
  return ROH.map(([iso, vorwahl]) => ({ iso, vorwahl, name: namen?.of(iso) ?? iso }))
    .sort((a, b) => a.name.localeCompare(b.name, sprache));
}

/**
 * Baut eine internationale Nummer (E.164, z. B. „+491701234567“) aus Vorwahl und eingegebener Nummer.
 * Leerzeichen, Striche, Klammern und eine führende 0 werden entfernt. Gibt null zurück, wenn die Nummer nicht passt.
 */
export function internationaleNummer(vorwahl: string, eingabe: string): string | null {
  let ziffern = eingabe.replace(/[\s\-()./]/g, "");
  if (ziffern.startsWith("+")) {
    ziffern = ziffern.slice(1);
    if (!/^\d+$/.test(ziffern)) return null;
  } else if (ziffern.startsWith("00")) {
    ziffern = ziffern.slice(2);
  } else {
    if (!/^\d+$/.test(ziffern)) return null;
    ziffern = vorwahl + ziffern.replace(/^0+/, "");
  }
  if (!/^\d+$/.test(ziffern)) return null;
  // E.164: höchstens 15 Ziffern, mindestens Vorwahl + 4 Ziffern
  if (ziffern.length < 7 || ziffern.length > 15) return null;
  return "+" + ziffern;
}
