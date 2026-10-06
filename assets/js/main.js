/* Standard Plus – Interaktionen der Website */
(function () {
  'use strict';

  /* ---------- Kopfzeile: Schatten beim Scrollen ---------- */
  var header = document.querySelector('.site-header');
  function onScroll() {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobiles Menü ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('nav');
  if (toggle && nav) {
    var useEl = toggle.querySelector('use');
    function setMenu(open) {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
      if (useEl) useEl.setAttribute('href', open ? '#i-x' : '#i-menu');
    }
    toggle.addEventListener('click', function () {
      setMenu(!nav.classList.contains('is-open'));
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setMenu(false);
    });
  }

  /* ---------- Einblenden beim Scrollen ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el, i) {
      el.style.transitionDelay = (i % 3) * 70 + 'ms';
      io.observe(el);
    });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- Jahreszahl ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---------- Paket-Buttons füllen das Formular vor ---------- */
  var paketSelect = document.getElementById('f-paket');
  document.querySelectorAll('[data-paket]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (paketSelect) paketSelect.value = btn.getAttribute('data-paket');
    });
  });

  /* ---------- Kontaktformular ---------- */
  var form = document.getElementById('kontaktformular');
  if (!form) return;

  var status = form.querySelector('.form-status');
  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

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
      msg = input.type === 'checkbox'
        ? 'Bitte bestätigen Sie die Datenschutzerklärung.'
        : 'Bitte füllen Sie dieses Feld aus.';
    } else if (input.type === 'email' && v && !emailRe.test(v)) {
      msg = 'Bitte geben Sie eine gültige E-Mail-Adresse ein.';
    }
    setError(input, msg);
    return !msg;
  }

  var requiredInputs = form.querySelectorAll('[required]');
  requiredInputs.forEach(function (input) {
    input.addEventListener('blur', function () { validate(input); });
    input.addEventListener('input', function () {
      if (fieldOf(input) && fieldOf(input).classList.contains('has-error')) validate(input);
    });
    input.addEventListener('change', function () { validate(input); });
  });

  function showStatus(kind, text) {
    status.className = 'form-status ' + (kind === 'ok' ? 'is-ok' : 'is-err');
    status.textContent = text;
  }

  function collect() {
    var fd = new FormData(form);
    return {
      fd: fd,
      get: function (k) { return (fd.get(k) || '').toString().trim(); }
    };
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var ok = true, firstBad = null;
    requiredInputs.forEach(function (input) {
      if (!validate(input)) { ok = false; firstBad = firstBad || input; }
    });
    if (!ok) {
      showStatus('err', 'Bitte prüfen Sie die markierten Felder.');
      if (firstBad) firstBad.focus();
      return;
    }

    var data = collect();
    if (data.get('website')) return; // Spam-Schutz (Honeypot)

    var endpoint = form.getAttribute('data-endpoint');
    var btn = form.querySelector('button[type="submit"]');

    if (endpoint) {
      /* Versand über einen Formular-Dienst / ein Server-Skript */
      btn.disabled = true;
      fetch(endpoint, { method: 'POST', body: data.fd, headers: { 'Accept': 'application/json' } })
        .then(function (res) {
          if (!res.ok) throw new Error(res.status);
          form.reset();
          showStatus('ok', 'Vielen Dank! Ihre Anfrage ist bei uns eingegangen. Wir melden uns schnellstmöglich bei Ihnen.');
        })
        .catch(function () {
          showStatus('err', 'Leider ist beim Senden ein Fehler aufgetreten. Bitte rufen Sie uns an: 0176 45258501 oder schreiben Sie an info@standard-aaa.de.');
        })
        .then(function () { btn.disabled = false; });
      return;
    }

    /* Ohne Server: fertige E-Mail im E-Mail-Programm öffnen */
    var lines = [
      'Anfrage als: ' + data.get('anfrage_als'),
      'Name: ' + data.get('name'),
      'Firma: ' + (data.get('firma') || '–'),
      'E-Mail: ' + data.get('email'),
      'Telefon: ' + (data.get('telefon') || '–'),
      'Adresse: ' + (data.get('adresse') || '–'),
      'Branche: ' + (data.get('branche') || '–'),
      'Interesse an: ' + (data.get('paket') || 'Noch offen / Beratung'),
      '',
      'Nachricht:',
      data.get('nachricht')
    ];
    var to = form.getAttribute('data-mailto');
    var href = 'mailto:' + to +
      '?subject=' + encodeURIComponent('Anfrage über die Website: ' + data.get('betreff')) +
      '&body=' + encodeURIComponent(lines.join('\n'));
    window.location.href = href;
    showStatus('ok', 'Ihr E-Mail-Programm wurde mit Ihrer Anfrage geöffnet – bitte dort nur noch auf „Senden“ klicken. Falls sich nichts öffnet, schreiben Sie uns direkt an ' + to + ' oder rufen Sie an: 0176 45258501.');
  });
})();
