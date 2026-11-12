/* Standard Plus – Startseite: Ablauf, Preiszähler, Paket-Vorauswahl, Anfrageformular */
(function () {
  'use strict';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  /* ---------- Ablauf: Schritte nacheinander, Linie läuft mit ---------- */
  var steps = document.querySelector('[data-steps]');
  if (steps && hasIO && !reduce) {
    steps.classList.add('js-steps');
    var so = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { steps.classList.add('is-on'); so.disconnect(); }
      });
    }, { threshold: 0.25 });
    so.observe(steps);
  }

  /* ---------- Preise zählen einmal hoch, wenn sie erscheinen ---------- */
  var nf = new Intl.NumberFormat('de-DE');
  var counts = document.querySelectorAll('[data-count]');
  function countUp(el) {
    var end = Number(el.getAttribute('data-count'));
    var t0 = null, dur = 700;
    function frame(t) {
      if (t0 === null) t0 = t;
      var p = Math.min(1, (t - t0) / dur);
      var eased = 1 - Math.pow(1 - p, 4);            /* starkes Ease-out */
      el.textContent = nf.format(Math.round(end * (0.6 + 0.4 * eased)));
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  if (counts.length && hasIO && !reduce) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { countUp(e.target); co.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    counts.forEach(function (el) { co.observe(el); });
  }

  /* ---------- „Jetzt anfragen“: Auswahl anrufen / WhatsApp / Formular ---------- */
  var wahl = document.getElementById('anfrage-wahl');
  if (wahl && typeof wahl.showModal === 'function') {
    var ausloeser = document.querySelectorAll('[data-anfrage], .site-header .header-cta .btn');
    ausloeser.forEach(function (btn) {
      btn.addEventListener('click', function (e) { e.preventDefault(); wahl.showModal(); });
    });
    wahl.addEventListener('click', function (e) {
      if (e.target === wahl || e.target.closest('[data-ask-close]')) wahl.close();   /* Klick daneben oder auf Schließen */
    });
    wahl.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { wahl.close(); });
    });
  }

  /* ---------- Paket-Button: Paket ins Formular übernehmen ---------- */
  var form = document.getElementById('anfrage');
  if (!form) return;
  var nachricht = form.querySelector('#a-nachricht');
  var paket = '';
  var vorlage = '';
  document.querySelectorAll('[data-paket]').forEach(function (btn) {
    btn.addEventListener('click', function () { paketSetzen(btn.getAttribute('data-paket')); });
  });

  function paketSetzen(name) {
    paket = name;
    if (!nachricht.value.trim() || nachricht.value === vorlage) {
      vorlage = 'Ich interessiere mich für: ' + paket + '.\n';
      nachricht.value = vorlage;
    }
  }

  /* ---------- Vorschläge beim Tippen: Branche und gesuchter Beruf ---------- */
  var BERUFE = {
    'Landwirtschaft': ['Erntehelfer', 'Saisonarbeiter', 'Landwirtschaftshelfer', 'Hofhelfer', 'Stallhelfer', 'Melker', 'Tierpfleger', 'Herdenmanager', 'Schweinepfleger', 'Geflügelhelfer', 'Pferdepfleger', 'Traktorfahrer', 'Landmaschinenführer', 'Obstpflücker', 'Erdbeerpflücker', 'Spargelstecher', 'Gemüseerntehelfer', 'Weinlesehelfer', 'Gewächshaushelfer', 'Gärtner', 'Gartenbauhelfer', 'Baumschulhelfer', 'Sortierer und Verpacker', 'Forsthelfer', 'Landwirt (Fachkraft)'],
    'Häusliche Pflege': ['Betreuungskraft', '24-Stunden-Betreuung', 'Seniorenbetreuer', 'Alltagsbegleiter', 'Alltagshilfe', 'Haushaltshilfe', 'Haushälterin', 'Pflegehelfer', 'Pflegeassistent', 'Altenpflegehelfer', 'Altenpfleger', 'Krankenpflegehelfer', 'Pflegefachkraft', 'Demenzbetreuung', 'Nachtbetreuung', 'Einkaufshilfe', 'Begleitung zu Arztterminen', 'Kinderbetreuung'],
    'Bau': ['Bauhelfer', 'Maurer', 'Betonbauer', 'Eisenflechter', 'Schalungsbauer', 'Zimmerer', 'Dachdecker', 'Trockenbauer', 'Verputzer', 'Maler und Lackierer', 'Fliesenleger', 'Estrichleger', 'Bodenleger', 'Fassadenbauer', 'Isolierer', 'Fensterbauer', 'Tischler / Schreiner', 'Elektriker', 'Elektrohelfer', 'Anlagenmechaniker Sanitär und Heizung', 'Installateurhelfer', 'Schweißer', 'Schlosser', 'Gerüstbauer', 'Straßenbauer', 'Tiefbauhelfer', 'Pflasterer', 'Garten- und Landschaftsbauer', 'Baggerfahrer', 'Kranführer', 'Baumaschinenführer', 'Abbruchhelfer', 'Vorarbeiter', 'Polier'],
    'Gastronomie': ['Küchenhilfe', 'Spüler', 'Koch', 'Beikoch', 'Küchenchef', 'Pizzabäcker', 'Konditor', 'Bäcker', 'Servicekraft', 'Kellner', 'Runner', 'Barkeeper', 'Thekenkraft', 'Buffetkraft', 'Frühstücksservice', 'Bankettservice', 'Catering-Mitarbeiter', 'Imbissverkäufer', 'Restaurantleiter', 'Housekeeping', 'Zimmerreinigung', 'Reinigungskraft', 'Hausdame', 'Rezeptionist', 'Nachtportier', 'Hausmeister', 'Lieferfahrer'],
    'Lager und Logistik': ['Lagerhelfer', 'Kommissionierer', 'Verpacker', 'Sortierer', 'Versandmitarbeiter', 'Mitarbeiter Wareneingang', 'Mitarbeiter Warenausgang', 'Be- und Entlader', 'Staplerfahrer', 'Hochregalstaplerfahrer', 'Fachlagerist', 'Fachkraft für Lagerlogistik', 'Inventurhelfer', 'Produktionshelfer', 'Maschinenbediener', 'Schichtleiter Lager', 'Disponent', 'Paketzusteller', 'Kurierfahrer', 'Auslieferungsfahrer', 'Lkw-Fahrer', 'Berufskraftfahrer', 'Umzugshelfer']
  };
  var BRANCHEN = Object.keys(BERUFE).concat(['Andere Branche']);
  var branche = form.querySelector('#a-branche');
  var gesucht = form.querySelector('#a-gesucht');

  function norm(t) { return t.toLowerCase().replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 'ss'); }

  function combo(input, quelle) {
    var list = document.getElementById(input.getAttribute('aria-controls'));
    if (!list) return;
    var aktiv = -1, treffer = [];
    function schliessen() {
      list.hidden = true; aktiv = -1;
      input.setAttribute('aria-expanded', 'false');
      input.removeAttribute('aria-activedescendant');
    }
    function markieren(i) {
      aktiv = i;
      Array.prototype.forEach.call(list.children, function (li, n) {
        li.setAttribute('aria-selected', n === i ? 'true' : 'false');
        if (n === i) { input.setAttribute('aria-activedescendant', li.id); li.scrollIntoView({ block: 'nearest' }); }
      });
    }
    function waehlen(text) {
      input.value = text;
      schliessen();
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
    function zeigen() {
      var q = norm(input.value.trim());
      var alle = quelle();
      var vorn = alle.filter(function (t) { return norm(t).indexOf(q) === 0; });
      var mitte = alle.filter(function (t) { var i = norm(t).indexOf(q); return i > 0; });
      treffer = q ? vorn.concat(mitte) : alle;
      if (treffer.length === 1 && norm(treffer[0]) === q) treffer = [];      /* schon genau gewählt */
      list.textContent = '';
      treffer.forEach(function (t, n) {
        var li = document.createElement('li');
        li.id = list.id + '-' + n; li.setAttribute('role', 'option'); li.setAttribute('aria-selected', 'false');
        li.textContent = t;
        list.appendChild(li);
      });
      aktiv = -1;
      list.hidden = !treffer.length;
      input.setAttribute('aria-expanded', String(!!treffer.length));
      input.removeAttribute('aria-activedescendant');
    }
    input.addEventListener('focus', zeigen);
    input.addEventListener('input', function (e) { if (e.isTrusted) zeigen(); });
    input.addEventListener('blur', schliessen);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { if (!list.hidden) { e.preventDefault(); schliessen(); } return; }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        if (list.hidden) { zeigen(); if (list.hidden) return; }
        e.preventDefault();
        var n = treffer.length;
        markieren(e.key === 'ArrowDown' ? (aktiv + 1) % n : (aktiv - 1 + n) % n);
      } else if (e.key === 'Enter' && !list.hidden && aktiv > -1) {
        e.preventDefault(); waehlen(treffer[aktiv]);
      }
    });
    list.addEventListener('mousedown', function (e) { e.preventDefault(); });   /* Feld behält den Fokus */
    list.addEventListener('click', function (e) {
      var li = e.target.closest('[role="option"]');
      if (li) waehlen(li.textContent);
    });
  }

  if (branche && gesucht) {
    var standard = gesucht.getAttribute('placeholder');
    combo(branche, function () { return BRANCHEN; });
    combo(gesucht, function () {
      var eigene = BERUFE[branche.value.trim()];
      if (eigene) return eigene;
      return [].concat.apply([], Object.keys(BERUFE).map(function (k) { return BERUFE[k]; }));   /* keine Branche: alle Berufe */
    });
    branche.addEventListener('change', function () {
      var eigene = BERUFE[branche.value.trim()];
      gesucht.setAttribute('placeholder', eigene ? 'z. B. ' + eigene[0] + ', ' + eigene[1] : standard);
    });
  }

  /* ---------- Vorauswahl aus der Adresse: kontakt.html?paket=…&branche=… ---------- */
  try {
    var params = new URLSearchParams(window.location.search);
    var pPaket = (params.get('paket') || params.get('betreff') || '').slice(0, 120);
    var pBranche = (params.get('branche') || '').slice(0, 60);
    if (pPaket) paketSetzen(pPaket);
    if (pBranche && branche) { branche.value = pBranche; branche.dispatchEvent(new Event('change', { bubbles: true })); }
  } catch (e) { /* ältere Browser: Felder bleiben leer */ }

  /* ---------- Anfrageformular ---------- */
  var status = form.querySelector('.form-status');
  function fieldOf(input) { return input.closest('.field'); }
  function setError(input, msg) {
    var field = fieldOf(input);
    if (!field) return;
    field.classList.toggle('has-error', !!msg);
    var out = field.querySelector('.field__error');
    if (out) out.textContent = msg || '';
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  }
  function validate(input) {
    var v = (input.type === 'checkbox') ? input.checked : input.value.trim();
    var msg = '';
    if (input.required && !v) {
      msg = input.type === 'checkbox' ? 'Bitte bestätigen Sie die Datenschutzerklärung.' : 'Bitte füllen Sie dieses Feld aus.';
    } else if (input.type === 'tel' && v && v.replace(/\D/g, '').length < 6) {
      msg = 'Bitte geben Sie eine gültige Telefonnummer ein.';
    } else if (input.type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
      msg = 'Bitte geben Sie eine gültige E-Mail-Adresse ein.';
    }
    setError(input, msg);
    return !msg;
  }
  var required = form.querySelectorAll('[required]');
  required.forEach(function (input) {
    input.addEventListener('blur', function () { validate(input); });
    input.addEventListener('input', function () {
      if (fieldOf(input) && fieldOf(input).classList.contains('has-error')) validate(input);
    });
    input.addEventListener('change', function () { validate(input); });
  });
  function show(kind, text) {
    status.className = 'form-status ' + (kind === 'ok' ? 'is-ok' : 'is-err');
    status.textContent = text;
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = true, first = null;
    required.forEach(function (input) { if (!validate(input)) { ok = false; first = first || input; } });
    if (!ok) { show('err', 'Bitte prüfen Sie die markierten Felder.'); if (first) first.focus(); return; }
    var fd = new FormData(form);
    function get(k) { return (fd.get(k) || '').toString().trim(); }
    if (get('website')) return;                       /* Spam-Schutz */
    var to = form.getAttribute('data-mailto');
    var lines = [
      'Name: ' + get('name'),
      'Firma: ' + (get('firma') || '–'),
      'Telefon: ' + get('telefon'),
      'E-Mail: ' + get('email'),
      'Branche: ' + get('branche'),
      'Gesucht: ' + get('gesucht'),
      'Paket: ' + (paket || '–'),
      '',
      'Nachricht:',
      get('nachricht') || '–',
      '',
      'Bitte senden Sie mir passende Profile an meine E-Mail-Adresse.'
    ];
    window.location.href = 'mailto:' + to +
      '?subject=' + encodeURIComponent('Anfrage: ' + get('gesucht') + ' (' + get('branche') + ')' + (paket ? ' – ' + paket : '')) +
      '&body=' + encodeURIComponent(lines.join('\n'));
    show('ok', 'Ihr E-Mail-Programm wurde mit Ihrer Anfrage geöffnet – bitte dort nur noch auf „Senden“ klicken. Falls sich nichts öffnet, schreiben Sie uns an ' + to + ' oder rufen Sie an: 0152 28986993.');
  });
})();
