/* ============================================================
   Standard Plus - gemeinsame Anwendungslogik
   Schwerpunkte: Consent (DSGVO), Session-Schutz, sichere DOM-Ausgabe,
   Inaktivitaets-Sperre, Navigation zwischen allen Modulen.
   Hinweis: Prototyp ohne Backend. Sicherheitsrelevante Pruefungen
   MUESSEN serverseitig wiederholt werden (siehe SICHERHEIT.md).
   ============================================================ */
(function (w, d) {
  'use strict';

  /* Nicht ueberschreiben: sp-konfig.js legt den Namensraum unter
     Umstaenden schon vorher an. Sonst waere die Einstellungsdatei
     je nach Reihenfolge der Skripte wirkungslos. */
  var SP = w.SP = w.SP || {};

  /* ---------- 0. Sichere Helfer (XSS-Schutz) ---------- */
  /* Grundregel im gesamten Projekt: niemals innerHTML mit Daten,
     die von Nutzenden stammen. Ausgabe ausschliesslich ueber textContent. */
  SP.el = function (tag, cls, text) {
    var e = d.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = String(text);
    return e;
  };
  SP.icon = function (name, cls) {
    var ns = 'http://www.w3.org/2000/svg';
    var svg = d.createElementNS(ns, 'svg');
    svg.setAttribute('class', 'ic' + (cls ? ' ' + cls : ''));
    svg.setAttribute('aria-hidden', 'true');
    var use = d.createElementNS(ns, 'use');
    use.setAttribute('href', '#i-' + name);
    svg.appendChild(use);
    return svg;
  };
  /* ---------- Sprache und Basispfad ----------
     Die englische und rumaenische Fassung liegen in en/ und ro/. Von dort
     aus liegen Skripte und Offline-Speicher eine Ebene hoeher. Der Pfad
     wird am eingebundenen Stylesheet abgelesen, statt ihn fest zu setzen. */
  SP.sprache = (d.documentElement.getAttribute('lang') || 'de').slice(0, 2);
  SP.basis = (function () {
    var link = d.querySelector('link[href*="assets/sp-theme.css"]');
    var href = link ? link.getAttribute('href') : 'assets/sp-theme.css';
    return href.slice(0, href.indexOf('assets/sp-theme.css'));
  })();

  /* ---------- Uebersetzen ----------
     SP.t('Gespeichert')                       -> "Saved" / "Salvat"
     SP.t('Anfrage an {name}', { name: n })    -> Platzhalter werden gefuellt
     Schluessel ist der deutsche Text. Fehlt eine Uebersetzung, bleibt es
     beim Deutschen - die Seite bricht dadurch nie. Das Woerterbuch liefert
     assets/sp-i18n-en.js bzw. -ro.js, auf deutschen Seiten gibt es keins. */
  function deVor(zahl) {
    if (!zahl) return '';
    var rest = Math.abs(zahl) % 100;
    return (rest === 0 || rest >= 20) ? 'de ' : '';
  }
  SP.t = function (text, werte) {
    if (text == null) return text;
    var woerter = SP.woerter || null;
    var raus = (woerter && Object.prototype.hasOwnProperty.call(woerter, text)) ? woerter[text] : text;
    if (werte) {
      raus = String(raus).replace(/\{(\w+)\}/g, function (ganz, name) {
        if (Object.prototype.hasOwnProperty.call(werte, name)) return String(werte[name]);
        /* Rumaenische Pluralregel ohne SP.anzahl: aus {n} ableiten (auch "1000+") */
        if (name === 'de') return deVor(parseInt(werte.n, 10));
        return ganz;
      });
    }
    return String(raus).replace(/\{de\}/g, '');
  };
  /* Fuer Inhalte aus der Datenbank (Berufe, Beschreibungen der Beispielkonten):
     uebersetzt nur, was im Woerterbuch steht - Eingaben von Nutzenden bleiben
     so, wie sie geschrieben wurden. */
  SP.tInhalt = function (text) {
    if (text == null || text === '') return text;
    return SP.t(String(text));
  };
  /* ---------- Anzahl mit Einzahl und Mehrzahl ----------
     SP.anzahl(3, '{n} Profil', '{n} Profile')  ->  "3 Profile" / "3 profiles"
     Rumaenisch setzt ab 20 ein "de" vor das Nomen ("20 de profiluri"),
     ausser die letzten beiden Ziffern liegen zwischen 01 und 19. Die
     rumaenischen Mehrzahl-Texte enthalten dafuer den Platzhalter {de}. */
  SP.anzahl = function (n, einzahl, mehrzahl, werte) {
    var zahl = Number(n) || 0;
    var rest = Math.abs(zahl) % 100;
    var alle = { n: n, de: (zahl !== 0 && (rest === 0 || rest >= 20)) ? 'de ' : '' };
    if (werte) Object.keys(werte).forEach(function (k) { alle[k] = werte[k]; });
    return SP.t(zahl === 1 ? einzahl : mehrzahl, alle);
  };

  /* Dezimalzahl in der Schreibweise der Seite: 4,5 / 4.5 */
  SP.zahl = function (wert, stellen) {
    return Number(wert).toLocaleString(SP.gebiet || 'de-DE',
      { minimumFractionDigits: stellen || 0, maximumFractionDigits: stellen || 0 });
  };

  /* Datum in der Sprache der Seite */
  SP.gebiet = { de: 'de-DE', en: 'en-GB', ro: 'ro-RO' }[SP.sprache] || 'de-DE';

  /* Entfernt Steuer- und unsichtbare Zeichen, begrenzt die Laenge. */
  SP.clean = function (str, max) {
    return String(str == null ? '' : str)
      .replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u2028\u2029\uFEFF]/g, '')
      .trim()
      .slice(0, max || 2000);
  };
  /* Erlaubt nur projektinterne Ziele - blockiert javascript:, data:, fremde Hosts. */
  SP.safeHref = function (href) {
    var s = String(href || '');
    return /^[a-z0-9._-]+\.html(\?[^"'<>]*)?(#[^"'<>]*)?$/i.test(s) ? s : '#';
  };

  /* ============================================================
     Eine ganze Karte anklickbar machen
     ------------------------------------------------------------
     Der Klick auf die Karte fuehrt zum Profil. Knoepfe und Links
     innerhalb der Karte behalten ihre eigene Aufgabe - sonst wuerde
     z. B. "Anfrage senden" den Wechsel ausloesen.
     Fuer Tastatur und Screenreader bleibt der sichtbare Link in der
     Karte der Weg; die Karte selbst ist nur eine Mausbequemlichkeit
     und deshalb bewusst nicht fokussierbar.
     ============================================================ */
  SP.klickbar = function (karte, ziel) {
    /* Als Ziel ist auch der Link in der Karte erlaubt. Dann wird das
       Attribut gelesen, nicht die vom Browser aufgeloeste Volladresse -
       SP.safeHref laesst nur projektinterne, relative Ziele durch. */
    if (ziel && ziel.nodeType === 1) ziel = ziel.getAttribute('href');
    var href = SP.safeHref(ziel);
    if (!karte || href === '#') return karte;
    karte.classList.add('card-klick');
    karte.addEventListener('click', function (ev) {
      if (ev.target.closest('a,button,input,select,textarea,label')) return;
      if (w.getSelection && String(w.getSelection()).length > 2) return;
      w.location.href = href;
    });
    return karte;
  };

  /* ---------- 1. Consent-Manager (DSGVO Art. 6/7, TTDSG Par. 25) ---------- */
  var CKEY = 'sp.consent.v1';

  SP.consent = {
    get: function () {
      try {
        var raw = w.localStorage.getItem(CKEY);
        if (!raw) return null;
        var v = JSON.parse(raw);
        if (!v || typeof v !== 'object' || !v.cats) return null;
        return v;
      } catch (e) { return null; }
    },
    save: function (cats) {
      var rec = {
        cats: {
          essenziell: true,
          funktional: !!cats.funktional,
          statistik: !!cats.statistik,
          marketing: !!cats.marketing
        },
        ts: new Date().toISOString(),
        version: 1
      };
      try { w.localStorage.setItem(CKEY, JSON.stringify(rec)); } catch (e) {}
      var on = [];
      for (var k in rec.cats) { if (rec.cats[k]) on.push(k); }
      SP.audit('Einwilligung gespeichert', on.join(', '));
      try { d.dispatchEvent(new CustomEvent('wb:consent', { detail: rec })); } catch (e) {}
      return rec;
    },
    allowed: function (cat) {
      var c = SP.consent.get();
      return !!(c && c.cats && c.cats[cat]);
    },
    revoke: function () {
      try {
        w.localStorage.removeItem(CKEY);
        /* zusaetzlich alle funktional gespeicherten Werte loeschen */
        var kill = [];
        for (var i = 0; i < w.localStorage.length; i++) {
          var k = w.localStorage.key(i);
          if (k && k.indexOf('sp.f.') === 0) kill.push(k);
        }
        kill.forEach(function (k) { w.localStorage.removeItem(k); });
      } catch (e) {}
      SP.audit('Einwilligung widerrufen', 'alle nicht-essenziellen Kategorien gelöscht');
    }
  };

  /* Lokale Speicherung nur mit Einwilligung "funktional". */
  SP.store = {
    set: function (k, v) {
      if (!SP.consent.allowed('funktional')) return false;
      try { w.localStorage.setItem('sp.f.' + k, JSON.stringify(v)); return true; } catch (e) { return false; }
    },
    get: function (k, def) {
      if (!SP.consent.allowed('funktional')) return def;
      try { var r = w.localStorage.getItem('sp.f.' + k); return r ? JSON.parse(r) : def; } catch (e) { return def; }
    }
  };

  /* ---------- 2. Consent-Banner ---------- */
  var CATS = [
    ['essenziell', SP.t('Technisch notwendig'),
      SP.t('Anmeldung, Sitzungsschutz, CSRF-Token und Missbrauchserkennung. Ohne diese Daten funktioniert die Plattform nicht.'), true],
    ['funktional', SP.t('Funktional'),
      SP.t('Merkt sich Ansichtseinstellungen wie Filter, Sortierung und zuletzt geöffnete Module. Speicherung ausschließlich lokal in Ihrem Browser.'), false],
    ['statistik', SP.t('Statistik'),
      SP.t('Anonymisierte Reichweitenmessung auf eigenen Servern in der EU, ohne Profilbildung, ohne Weitergabe an Dritte.'), false],
    ['marketing', SP.t('Marketing'),
      SP.t('Derzeit nicht im Einsatz. Wird nur aktiviert, wenn wir künftig Kampagnen messen - und dann ausschließlich nach Ihrer Freigabe.'), false]
  ];

  function catRow(id, title, text, locked) {
    var row = SP.el('div', 'cc-cat');
    var txt = SP.el('div');
    txt.appendChild(SP.el('strong', null, title));
    txt.appendChild(SP.el('p', null, text));
    row.appendChild(txt);
    var lab = SP.el('label', 'switch');
    var inp = d.createElement('input');
    inp.type = 'checkbox';
    inp.id = 'cc-' + id;
    inp.setAttribute('aria-label', title);
    if (locked) { inp.checked = true; inp.disabled = true; }
    lab.appendChild(inp);
    lab.appendChild(SP.el('i'));
    row.appendChild(lab);
    return row;
  }

  function buildBanner() {
    if (d.getElementById('cc-banner')) return;

    var bd = SP.el('div', 'cc-backdrop');
    bd.id = 'cc-bd';
    d.body.appendChild(bd);

    var box = SP.el('section', 'cc-banner');
    box.id = 'cc-banner';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-labelledby', 'cc-h');

    var inner = SP.el('div', 'cc-in');
    var h = SP.el('h2'); h.id = 'cc-h';
    h.appendChild(SP.icon('shieldcheck'));
    h.appendChild(SP.el('span', null, SP.t('Datenschutz-Einstellungen')));
    inner.appendChild(h);

    inner.appendChild(SP.el('p', null,
      SP.t('Wir speichern nur, was Sie hier freigeben. Technisch notwendige Daten sichern Anmeldung und Schutz vor Missbrauch (Art. 6 Abs. 1 lit. f DSGVO, §. 25 Abs. 2 TTDSG). Alle übrigen Kategorien setzen Ihre Einwilligung voraus und sind jederzeit widerrufbar. Diese Anwendung lädt keine externen Dienste, Schriftarten, Karten oder Tracker.')));

    var cats = SP.el('div', 'cc-cats'); cats.id = 'cc-cats';
    CATS.forEach(function (c) { cats.appendChild(catRow(c[0], c[1], c[2], c[3])); });
    inner.appendChild(cats);

    var btns = SP.el('div', 'cc-btns');
    var bSet = SP.el('button', 'btn btn-outline', SP.t('Einstellungen'));
    /* Ablehnen gleichwertig zu Zustimmen gestalten - sonst ist die Einwilligung
       nach Auffassung der Aufsichtsbehoerden nicht freiwillig (Nudging). */
    var bDeny = SP.el('button', 'btn btn-primary', SP.t('Nur notwendige'));
    var bAll = SP.el('button', 'btn btn-primary', SP.t('Alle akzeptieren'));
    var bSave = SP.el('button', 'btn btn-gold', SP.t('Auswahl speichern'));
    [bSet, bDeny, bAll, bSave].forEach(function (b) { b.type = 'button'; btns.appendChild(b); });
    bSave.classList.add('hidden');
    inner.appendChild(btns);

    var links = SP.el('p', 'tiny muted');
    links.classList.add('cc-links');
    [['standardplus-datenschutz.html', SP.t('Datenschutzerklärung')],
     ['standardplus-sicherheit.html', SP.t('Sicherheit')],
     ['standardplus-impressum.html', SP.t('Impressum')]].forEach(function (l, i) {
      if (i) links.appendChild(d.createTextNode('  |  '));
      var a = SP.el('a', null, l[1]);
      a.href = l[0]; a.classList.add('u');
      links.appendChild(a);
    });
    inner.appendChild(links);

    box.appendChild(inner);
    d.body.appendChild(box);

    function open() { box.classList.add('show'); bd.classList.add('show'); }
    function close() { box.classList.remove('show'); bd.classList.remove('show'); }
    function expand() {
      cats.classList.add('show');
      bSave.classList.remove('hidden');
      bSet.classList.add('hidden');
    }

    bSet.addEventListener('click', expand);
    bAll.addEventListener('click', function () {
      SP.consent.save({ funktional: true, statistik: true, marketing: true });
      close();
      SP.toast('ok', SP.t('Einstellungen gespeichert'), SP.t('Änderung jederzeit im Datenschutz-Center möglich.'));
    });
    bDeny.addEventListener('click', function () {
      SP.consent.save({});
      close();
      SP.toast('ok', SP.t('Nur notwendige Daten'), SP.t('Es werden keine optionalen Daten gespeichert.'));
    });
    bSave.addEventListener('click', function () {
      SP.consent.save({
        funktional: d.getElementById('cc-funktional').checked,
        statistik: d.getElementById('cc-statistik').checked,
        marketing: d.getElementById('cc-marketing').checked
      });
      close();
      SP.toast('ok', SP.t('Auswahl gespeichert'), SP.t('Ihre Einwilligung wurde mit Zeitstempel protokolliert.'));
    });

    SP.openConsent = function () {
      expand();
      var c = SP.consent.get();
      if (c) {
        d.getElementById('cc-funktional').checked = !!c.cats.funktional;
        d.getElementById('cc-statistik').checked = !!c.cats.statistik;
        d.getElementById('cc-marketing').checked = !!c.cats.marketing;
      }
      open();
    };

    if (!SP.consent.get()) open();
  }

  /* ---------- 3. Toasts ---------- */
  SP.toast = function (type, title, text) {
    var box = d.getElementById('sp-toasts');
    if (!box) {
      box = SP.el('div', 'toasts');
      box.id = 'sp-toasts';
      box.setAttribute('aria-live', 'polite');
      d.body.appendChild(box);
    }
    var t = SP.el('div', 'toast ' + (type || ''));
    var ico = { ok: 'check', warn: 'alert', err: 'alert', info: 'info' }[type] || 'info';
    t.appendChild(SP.icon(ico));
    var c = SP.el('div');
    c.appendChild(SP.el('strong', null, title));
    if (text) c.appendChild(SP.el('span', null, text));
    t.appendChild(c);
    box.appendChild(t);
    setTimeout(function () {
      t.classList.add('fade');
      setTimeout(function () { t.remove(); }, 400);
    }, 4200);
  };

  /* ---------- 4. Demo-Session und Zugriffsschutz ---------- */
  var SKEY = 'sp.session';
  SP.session = {
    start: function (profile) {
      var s = {
        kontoId: profile.kontoId || null,
        user: SP.clean(profile.user, 80),
        org: SP.clean(profile.org, 80),
        role: profile.role || 'arbeitgeber',
        mfa: !!profile.mfa,
        since: Date.now(),
        last: Date.now()
      };
      try { w.sessionStorage.setItem(SKEY, JSON.stringify(s)); } catch (e) {}
      SP.audit('Anmeldung erfolgreich', s.user + ' - 2FA: ' + (s.mfa ? 'ja' : 'nein'));
      return s;
    },
    get: function () {
      try { var r = w.sessionStorage.getItem(SKEY); return r ? JSON.parse(r) : null; } catch (e) { return null; }
    },
    touch: function () {
      var s = SP.session.get(); if (!s) return;
      s.last = Date.now();
      try { w.sessionStorage.setItem(SKEY, JSON.stringify(s)); } catch (e) {}
    },
    end: function (reason) {
      SP.audit('Abmeldung', reason || 'manuell');
      try { w.sessionStorage.removeItem(SKEY); } catch (e) {}
      w.location.href = 'standardplus-login.html' + (reason === 'timeout' ? '?grund=timeout' : '');
    },
    /* Geschuetzte Seiten rufen dies beim Laden auf. */
    require: function () {
      var s = SP.session.get();
      if (!s) {
        var ziel = location.pathname.split('/').pop() || '';
        w.location.replace('standardplus-login.html?ziel=' + encodeURIComponent(ziel));
        return null;
      }
      return s;
    }
  };

  /* ---------- 5. Automatische Sperre bei Inaktivitaet ---------- */
  var IDLE_MS = 15 * 60 * 1000, WARN_MS = 60 * 1000, idleT = null, warnT = null;

  function throttle(fn, ms) {
    var last = 0;
    return function () { var n = Date.now(); if (n - last > ms) { last = n; fn(); } };
  }

  SP.guardIdle = function () {
    if (!SP.session.get()) return;

    function reset() {
      SP.session.touch();
      clearTimeout(idleT); clearTimeout(warnT);
      var m = d.getElementById('sp-idle');
      if (m) m.classList.remove('show');
      warnT = setTimeout(showWarn, IDLE_MS - WARN_MS);
      idleT = setTimeout(function () { SP.session.end('timeout'); }, IDLE_MS);
    }

    function showWarn() {
      var m = d.getElementById('sp-idle');
      if (!m) {
        m = SP.el('div', 'modal');
        m.id = 'sp-idle';
        m.setAttribute('role', 'alertdialog');
        var b = SP.el('div', 'modal-box');
        var h = SP.el('h2');
        h.appendChild(SP.icon('clock'));
        h.appendChild(SP.el('span', null, SP.t('Sitzung läuft ab')));
        b.appendChild(h);
        b.appendChild(SP.el('p', null,
          SP.t('Zu Ihrem Schutz wird die Sitzung nach 15 Minuten ohne Aktivität automatisch beendet. Sie werden in wenigen Sekunden abgemeldet.')));
        var row = SP.el('div', 'row mt');
        var keep = SP.el('button', 'btn btn-primary', SP.t('Angemeldet bleiben'));
        keep.addEventListener('click', reset);
        var out = SP.el('button', 'btn btn-outline', SP.t('Jetzt abmelden'));
        out.addEventListener('click', function () { SP.session.end('manuell'); });
        row.appendChild(keep); row.appendChild(out);
        b.appendChild(row);
        m.appendChild(b);
        d.body.appendChild(m);
      }
      m.classList.add('show');
    }

    ['click', 'keydown', 'mousemove', 'touchstart', 'scroll'].forEach(function (ev) {
      d.addEventListener(ev, throttle(reset, 5000), { passive: true });
    });
    reset();
  };

  /* ---------- 6. Audit-Log (nur Sitzungsspeicher) ---------- */
  SP.audit = function (action, detail) {
    try {
      var log = JSON.parse(w.sessionStorage.getItem('sp.audit') || '[]');
      log.unshift({ t: new Date().toISOString(), a: SP.clean(action, 120), d: SP.clean(detail, 200) });
      w.sessionStorage.setItem('sp.audit', JSON.stringify(log.slice(0, 60)));
    } catch (e) {}
  };
  SP.auditLog = function () {
    try { return JSON.parse(w.sessionStorage.getItem('sp.audit') || '[]'); } catch (e) { return []; }
  };

  /* ---------- 7. Gemeinsame UI und Navigation ---------- */
  function initials(name) {
    return String(name || '').split(/\s+/).filter(Boolean).slice(0, 2)
      .map(function (p) { return p.charAt(0); }).join('').toUpperCase();
  }
  SP.initials = initials;

  SP.ui = function () {
    var b = d.querySelector('.sp-burger'), nav = d.querySelector('.sp-nav');
    /* Auf dem Telefon passen Dashboard, Profil und Abmelden nicht mehr in
       die Kopfleiste. Sie erscheinen dann im aufklappbaren Menue - als
       Kopie derselben Verweise, damit Texte und Rechte identisch bleiben. */
    var act = d.querySelector('.sp-header-act');
    if (nav && act && !nav.querySelector('.nur-mobil')) {
      act.querySelectorAll('[data-auth]').forEach(function (x) {
        var li = SP.el('li', 'nur-mobil');
        var kopie = x.cloneNode(true);
        kopie.className = 'sp-nav-extra';
        li.appendChild(kopie);
        nav.appendChild(li);
      });
    }
    if (b && nav) {
      b.addEventListener('click', function () {
        var open = nav.classList.toggle('open');
        b.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    }
    var sb = d.querySelector('.side-toggle'), side = d.querySelector('.side');
    if (sb && side) sb.addEventListener('click', function () { side.classList.toggle('open'); });

    var here = location.pathname.split('/').pop() || 'standardplus-main.html';
    d.querySelectorAll('[data-nav]').forEach(function (a) {
      if (a.getAttribute('href') === here) a.setAttribute('aria-current', 'page');
    });
    d.querySelectorAll('[data-logout]').forEach(function (x) {
      x.addEventListener('click', function (e) { e.preventDefault(); SP.session.end('manuell'); });
    });
    d.querySelectorAll('[data-consent]').forEach(function (x) {
      x.addEventListener('click', function (e) { e.preventDefault(); if (SP.openConsent) SP.openConsent(); });
    });
    d.querySelectorAll('a[target="_blank"]').forEach(function (a) {
      a.setAttribute('rel', 'noopener noreferrer');
    });

    var s = SP.session.get();
    if (s) {
      d.querySelectorAll('[data-user]').forEach(function (x) { x.textContent = s.user; });
      d.querySelectorAll('[data-org]').forEach(function (x) { x.textContent = s.org; });
      d.querySelectorAll('[data-initials]').forEach(function (x) { x.textContent = initials(s.user); });
    }
    d.querySelectorAll('[data-anon]').forEach(function (x) { if (!s) x.hidden = false; });
    d.querySelectorAll('[data-auth]').forEach(function (x) { if (s) x.hidden = false; });
    /* Nur fuer eine Rolle bestimmte Bereiche ein- oder ausblenden.
       Achtung: data-rolle blendet aus, solange keine Sitzung besteht.
       Fuer Auswahlelemente vor der Anmeldung daher data-wahl verwenden. */
    d.querySelectorAll('[data-rolle]').forEach(function (x) {
      x.hidden = !s || x.getAttribute('data-rolle') !== s.role;
    });
  };

  /* ---------- 8. Passwortpruefung (lokal, nichts verlaesst den Browser) ---------- */
  SP.pwScore = function (v) {
    v = String(v || '');
    var r = {
      len: v.length >= 12,
      upper: /[A-Z]/.test(v) && /[a-z]/.test(v),
      num: /[0-9]/.test(v),
      spec: /[^A-Za-z0-9]/.test(v),
      common: !/^(passwort|password|123456|qwertz|willkommen|admin|sommer|winter)/i.test(v)
    };
    var n = (r.len ? 1 : 0) + (r.upper ? 1 : 0) + (r.num ? 1 : 0) + (r.spec ? 1 : 0);
    if (!r.common || v.length < 8) n = Math.min(n, 1);
    return { score: n, rules: r };
  };

  /* ---------- 8b. App: Offline-Speicher und Installation ----------
     Der Offline-Speicher laeuft nur ueber https oder auf dem eigenen
     Rechner (localhost) - so verlangen es die Browser. Er speichert
     ausschliesslich die Dateien dieser Anwendung, keine Eingaben und
     keine Profildaten. Die liegen wie bisher nur im Browserspeicher. */
  var sichererOrt = w.location.protocol === 'https:' ||
    w.location.hostname === 'localhost' || w.location.hostname === '127.0.0.1';

  if ('serviceWorker' in navigator && sichererOrt) {
    w.addEventListener('load', function () {
      navigator.serviceWorker.register(SP.basis + 'sw.js', { scope: SP.basis || './' }).catch(function () {
        /* Ohne Offline-Speicher laeuft die Seite ganz normal weiter */
      });
    });
  }

  /* Chrome, Edge und Android melden, wenn sich die Seite installieren
     laesst. Erst dann erscheint der Knopf - vorher waere er wirkungslos. */
  var installAngebot = null;
  w.addEventListener('beforeinstallprompt', function (ereignis) {
    ereignis.preventDefault();
    installAngebot = ereignis;
    var leiste = d.querySelector('.sp-header-act');
    if (!leiste || leiste.querySelector('.app-installieren')) return;

    var knopf = SP.el('button', 'btn btn-gold btn-sm app-installieren');
    knopf.type = 'button';
    knopf.appendChild(SP.icon('download'));
    knopf.appendChild(d.createTextNode(SP.t('App installieren')));
    knopf.addEventListener('click', function () {
      if (!installAngebot) return;
      installAngebot.prompt();
      installAngebot.userChoice.then(function (wahl) {
        if (wahl.outcome === 'accepted') {
          knopf.remove();
          SP.toast('ok', SP.t('App installiert'),
            SP.t('Standard Plus liegt jetzt bei Ihren Programmen und startet in einem eigenen Fenster.'));
        }
        installAngebot = null;
      });
    });
    leiste.insertBefore(knopf, leiste.firstChild);
  });
  w.addEventListener('appinstalled', function () {
    var k = d.querySelector('.app-installieren');
    if (k) k.remove();
  });

  /* ---------- 8c. Sprachumschalter ----------
     Fuehrt auf dieselbe Seite in der anderen Sprache. Adresszusatz und
     Sprungmarke bleiben erhalten - wer ein Profil offen hat, sieht danach
     dasselbe Profil. Gespeichert wird nichts: die Sprache ergibt sich aus
     dem Ordner der Seite, alle Verweise bleiben darin. */
  var SPRACHEN = [['de', 'DE', 'Deutsch'], ['en', 'EN', 'English'], ['ro', 'RO', 'Română']];

  function sprachAdresse(ziel) {
    var datei = w.location.pathname.split('/').pop() || 'standardplus-main.html';
    var rest = w.location.search + w.location.hash;
    var zurWurzel = SP.sprache === 'de' ? '' : '../';
    return zurWurzel + (ziel === 'de' ? '' : ziel + '/') + datei + rest;
  }

  function sprachumschalter() {
    var ort = d.querySelector('.sp-header-act') || d.querySelector('.topbar > .flex:last-child') ||
              d.querySelector('.authbox') || d.querySelector('.iv-top > .flex:last-child');
    if (!ort || ort.querySelector('.sprachwahl')) return;

    var nav = SP.el('nav', 'sprachwahl');
    nav.setAttribute('aria-label', SP.t('Sprache wählen'));
    SPRACHEN.forEach(function (sp) {
      var a = SP.el('a', null, sp[1]);
      a.href = sprachAdresse(sp[0]);
      a.setAttribute('hreflang', sp[0]);
      a.setAttribute('lang', sp[0]);
      a.setAttribute('title', sp[2]);
      if (sp[0] === SP.sprache) {
        a.setAttribute('aria-current', 'true');
      }
      nav.appendChild(a);
    });
    if (ort.classList.contains('authbox')) {
      nav.classList.add('sprachwahl-auth');
      ort.insertBefore(nav, ort.firstChild);
    } else {
      ort.insertBefore(nav, ort.firstChild);
    }
  }

  /* ---------- 9. Start ---------- */
  /* ---------- 8d. Vorschau-Hinweis ----------
     Solange es keinen Server gibt, werden Konten, Profile und Buchungen nur
     im Browser der Besucherin oder des Besuchers gespeichert. Das muss
     sichtbar gesagt werden - sonst glaubt jemand, er sei wirklich registriert
     (Irrefuehrung, Art. 5 und 13 DSGVO). Erst mit echtem Server auf false. */
  var VORSCHAU = false;   /* auf true setzen, solange ein Hinweis auf den Aufbau noetig ist */
  function vorschauHinweis() {
    if (!VORSCHAU || d.querySelector('.vorschau-hinweis')) return;
    var box = SP.el('div', 'vorschau-hinweis');
    box.setAttribute('role', 'note');
    box.appendChild(SP.icon('info', 'ic-sm'));
    box.appendChild(SP.el('span', null, SP.t('Vorschau: Diese Plattform befindet sich im Aufbau. Konten, Profile und Buchungen werden nur in Ihrem Browser gespeichert und nicht an uns übermittelt.')));
    var skip = d.querySelector('.sp-skip');
    if (skip && skip.nextSibling) d.body.insertBefore(box, skip.nextSibling);
    else d.body.insertBefore(box, d.body.firstChild);
  }

  /* ---------- 8e. "Weiter zu" - die Bereiche miteinander verbinden ----------
     Jede oeffentliche Seite endet mit zwei bis drei Verweisen auf die Bereiche,
     die inhaltlich dazugehoeren. So fuehrt jede Seite weiter, statt in einer
     Sackgasse zu enden. Gepflegt wird das nur hier, nicht in 18 Dateien. */
  var WEITER = {
    'standardplus-talente.html': ['suche', 'unternehmen', 'muster'],
    'standardplus-unternehmen.html': ['talente', 'suche', 'preise'],
    'standardplus-suche.html': ['talente', 'unternehmen', 'muster'],
    'standardplus-musterprofile.html': ['talente', 'unternehmen', 'registrieren'],
    'standardplus-transport.html': ['talente', 'dolmetscher', 'registrieren'],
    'standardplus-dolmetscher.html': ['interview', 'transport', 'preise'],
    'standardplus-preise.html': ['talente', 'unternehmen', 'registrieren'],
    'standardplus-sicherheit.html': ['datenschutz', 'zentrum', 'impressum'],
    'standardplus-interview.html': [],
    'standardplus-main.html': []
  };
  var ZIELE = {
    talente:     ['standardplus-talente.html', 'users', 'Fachkräfte ansehen', 'Geprüfte Profile aus ganz Europa, mit Nachweisen und Sprachniveau.'],
    unternehmen: ['standardplus-unternehmen.html', 'building', 'Unternehmen ansehen', 'Wer sucht gerade Personal – mit offenen Stellen und Leistungen.'],
    suche:       ['standardplus-suche.html', 'search', 'Freitextsuche', 'In einem Satz beschreiben, wen Sie suchen – mit Wischansicht.'],
    muster:      ['standardplus-musterprofile.html', 'portrait', 'Musterprofile', 'So sieht ein vollständiges Profil aus, ohne Anmeldung.'],
    transport:   ['standardplus-transport.html', 'bus', 'Busverbindungen', 'Feste Linien aus Südosteuropa, auch Teilstrecken buchbar.'],
    dolmetscher: ['standardplus-dolmetscher.html', 'translate', 'Live-Dolmetscher', 'Zwei Sprachen, ein Gespräch – Übersetzung in Echtzeit.'],
    interview:   ['standardplus-interview.html', 'video', 'Videointerview', 'Gespräch mit Live-Übersetzung und Protokoll.'],
    preise:      ['standardplus-preise.html', 'euro', 'Preise ansehen', 'Einmalzahlung je Vermittlung oder Abo mit Rundum-Betreuung.'],
    registrieren:['standardplus-login.html?tab=registrieren', 'user', 'Kostenlos registrieren', 'In vier Angaben angelegt – danach sehen Sie alle Profile.'],
    datenschutz: ['standardplus-datenschutz.html', 'shieldcheck', 'Datenschutzerklärung', 'Welche Daten wir verarbeiten, wie lange und wozu.'],
    zentrum:     ['standardplus-datenschutz-center.html', 'sliders', 'Datenschutz-Center', 'Auskunft, Export und Löschung – direkt im Browser.'],
    impressum:   ['standardplus-impressum.html', 'info', 'Impressum', 'Anbieter, Kontakt und Verantwortliche.']
  };

  function weiterZu() {
    var hier = location.pathname.split('/').pop() || 'standardplus-main.html';
    var liste = WEITER[hier];
    var fuss = d.querySelector('footer.sp-foot');
    if (!liste || !liste.length || !fuss || d.querySelector('.weiter')) return;

    var sek = SP.el('section', 'sec-tight weiter');
    var wrap = SP.el('div', 'wrap');
    wrap.appendChild(SP.el('h2', 'h3 weiter-kopf', SP.t('Weiter zu')));
    var reihe = SP.el('div', 'weiter-reihe');
    liste.forEach(function (schluessel) {
      var z = ZIELE[schluessel];
      if (!z) return;
      var a2 = SP.el('a', 'weiter-karte');
      a2.href = z[0];
      var ik = SP.el('span', 'weiter-ic');
      ik.appendChild(SP.icon(z[1]));
      a2.appendChild(ik);
      var txt = SP.el('span', 'weiter-text');
      txt.appendChild(SP.el('strong', null, SP.t(z[2])));
      txt.appendChild(SP.el('span', null, SP.t(z[3])));
      a2.appendChild(txt);
      a2.appendChild(SP.icon('arrowright', 'ic-sm'));
      reihe.appendChild(a2);
    });
    wrap.appendChild(reihe);
    sek.appendChild(wrap);
    fuss.parentNode.insertBefore(sek, fuss);
  }

  /* ---------- 8f. Sprungmarken, die erst spaeter entstehen ----------
     Viele Bereiche zeichnet erst das Skript (Anfragen, Stellen, Linien).
     Der Browser springt aber sofort nach dem Laden - und landet oben.
     Deshalb wird die Marke nachgefuehrt, bis der Inhalt steht. Sobald
     jemand selbst scrollt, hoert das auf. */
  function zuSprungmarke() {
    var id = '';
    try { id = decodeURIComponent((w.location.hash || '').slice(1)); } catch (e) { return; }
    if (!id) return;
    var selbst = false;
    var merken = function () { selbst = true; };
    ['wheel', 'touchstart', 'keydown'].forEach(function (art) {
      w.addEventListener(art, merken, { passive: true, once: true });
    });
    var lauf = 0;
    (function nachfuehren() {
      var ziel = d.getElementById(id);
      if (ziel && !selbst) {
        var kopf = d.querySelector('.sp-header') || d.querySelector('.topbar');
        var abstand = (kopf ? kopf.getBoundingClientRect().height : 0) + 14;
        var y = ziel.getBoundingClientRect().top + w.pageYOffset - abstand;
        if (Math.abs(y - w.pageYOffset) > 4) w.scrollTo(0, Math.max(0, y));
      }
      if (++lauf < 10 && !selbst) w.setTimeout(nachfuehren, 220);
      else ['wheel', 'touchstart', 'keydown'].forEach(function (art) { w.removeEventListener(art, merken); });
    })();
  }

  function boot() {
    vorschauHinweis();
    weiterZu();
    zuSprungmarke();
    buildBanner();
    SP.ui();
    sprachumschalter();
    if (d.body.hasAttribute('data-protected')) {
      if (SP.session.require()) SP.guardIdle();
    } else if (SP.session.get()) {
      SP.guardIdle();
    }
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', boot);
  else boot();

})(window, document);
