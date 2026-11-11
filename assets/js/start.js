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

  /* ---------- Paket-Button: Paket ins Formular übernehmen ---------- */
  var form = document.getElementById('anfrage');
  if (!form) return;
  var nachricht = form.querySelector('#a-nachricht');
  var paket = '';
  var vorlage = '';
  document.querySelectorAll('[data-paket]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      paket = btn.getAttribute('data-paket');
      if (!nachricht.value.trim() || nachricht.value === vorlage) {
        vorlage = 'Ich interessiere mich für: ' + paket + '.\n';
        nachricht.value = vorlage;
      }
    });
  });

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
      'Branche: ' + (get('branche') || '–'),
      'Telefon: ' + get('telefon'),
      'Paket: ' + (paket || '–'),
      '',
      'Nachricht:',
      get('nachricht')
    ];
    window.location.href = 'mailto:' + to +
      '?subject=' + encodeURIComponent('Anfrage über die Website' + (paket ? ': ' + paket : '')) +
      '&body=' + encodeURIComponent(lines.join('\n'));
    show('ok', 'Ihr E-Mail-Programm wurde mit Ihrer Anfrage geöffnet – bitte dort nur noch auf „Senden“ klicken. Falls sich nichts öffnet, schreiben Sie uns an ' + to + ' oder rufen Sie an: 0152 28986993.');
  });
})();
