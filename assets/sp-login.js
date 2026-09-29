/* Standard Plus - Anmeldung und Registrierung
   Legt Konten in SP.db an und prueft sie beim Anmelden.
   Alle Pruefungen hier sind Komfort. Verbindlich ist ausschliesslich
   die serverseitige Pruefung (Passwortrichtlinie, Sperrfristen,
   TOTP-Verifikation, CSRF-Token). */
(function (w, d) {
  'use strict';
  var SP = w.SP;

  var $ = function (id) { return d.getElementById(id); };
  var panels = { login: $('panel-login'), reg: $('panel-reg'), mfa: $('panel-2fa') };
  var tabs = { login: $('tab-login'), reg: $('tab-reg') };

  var params = new URLSearchParams(w.location.search);
  var wartet = null;          /* Konto, das nach dem zweiten Faktor angemeldet wird */

  /* ---------- Ansichtswechsel ---------- */
  function show(which) {
    panels.login.hidden = which !== 'login';
    panels.reg.hidden = which !== 'reg';
    panels.mfa.hidden = which !== 'mfa';
    tabs.login.setAttribute('aria-selected', String(which === 'login'));
    tabs.reg.setAttribute('aria-selected', String(which === 'reg'));
    d.title = (which === 'reg' ? SP.t('Registrieren') : SP.t('Anmelden')) + ' – Standard Plus';
  }
  tabs.login.addEventListener('click', function () { show('login'); });
  tabs.reg.addEventListener('click', function () { show('reg'); schritt(1); });
  $('to-reg').addEventListener('click', function () { show('reg'); schritt(1); });
  $('to-login').addEventListener('click', function () { show('login'); });
  $('back-login').addEventListener('click', function () { show('login'); });

  if (params.get('tab') === 'registrieren') show('reg');
  if (params.get('grund') === 'timeout') $('timeout-note').classList.remove('hidden');

  /* ---------- Passwort ein- und ausblenden ---------- */
  d.querySelectorAll('[data-toggle-pw]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var f = $(btn.getAttribute('data-toggle-pw'));
      var zeigen = f.type === 'password';
      f.type = zeigen ? 'text' : 'password';
      btn.setAttribute('aria-label', zeigen ? SP.t('Passwort verbergen') : SP.t('Passwort anzeigen'));
      btn.replaceChildren(SP.icon(zeigen ? 'eyeoff' : 'eye'));
    });
  });

  /* ---------- Registrierung: Schritt 1 (Rolle) und Schritt 2 (Daten) ---------- */
  var rolle = 'arbeitgeber';
  function aktiveRolle() { return rolle; }

  var ROLLEN = {
    arbeitgeber: {
      titel: SP.t('Arbeitgeber'), text: SP.t('Ich suche Personal'), icon: 'building',
      untertitel: SP.t('Wir brauchen nur den Firmennamen, Ihren Namen und Zugangsdaten.'),
      nameLegende: SP.t('Ihre Ansprechperson'), mailLabel: SP.t('Geschäftliche E-Mail-Adresse')
    },
    arbeitnehmer: {
      titel: SP.t('Arbeitnehmer'), text: SP.t('Ich suche eine Stelle'), icon: 'user',
      untertitel: SP.t('Vier Angaben genügen - Ihr Profil füllen Sie danach in Ruhe aus.'),
      nameLegende: SP.t('Ihr Name'), mailLabel: SP.t('E-Mail-Adresse')
    },
    transport: {
      titel: SP.t('Beförderungsunternehmen'), text: SP.t('Ich fahre die Strecke'), icon: 'bus',
      untertitel: SP.t('Firmenname und Zugangsdaten genügen. Lizenz und Linien tragen Sie danach ein.'),
      nameLegende: SP.t('Ihre Ansprechperson'), mailLabel: SP.t('Geschäftliche E-Mail-Adresse')
    }
  };

  function schritt(nummer) {
    $('reg-schritt1').hidden = nummer !== 1;
    $('reg-schritt2').hidden = nummer !== 2;
    [1, 2, 3].forEach(function (i) {
      var li = $('sch' + i);
      li.classList.toggle('an', i === nummer);
      li.classList.toggle('fertig', i < nummer);
      var b = li.querySelector('b');
      if (i < nummer) b.replaceChildren(SP.icon('check'));
      else b.textContent = String(i);
    });
  }

  function rolleWaehlen(neueRolle) {
    rolle = neueRolle;
    var r = ROLLEN[rolle];
    $('rolle-titel').textContent = r.titel;
    $('rolle-text').textContent = r.text;
    var symbol = $('rolle-icon').querySelector('use');
    if (symbol) symbol.setAttribute('href', '#i-' + r.icon);
    $('reg-untertitel').textContent = r.untertitel;
    $('name-legende').textContent = r.nameLegende;
    $('mail-label').textContent = r.mailLabel;
    /* Arbeitnehmer brauchen kein Firmenfeld - Datenminimierung */
    var mitFirma = rolle === 'arbeitgeber' || rolle === 'transport';
    $('wrap-firma').hidden = !mitFirma;
    schritt(2);
    $(mitFirma ? 'reg-firma' : 'reg-vor').focus();
  }

  d.querySelectorAll('.rollenkarte').forEach(function (karte) {
    karte.addEventListener('click', function () {
      rolleWaehlen(karte.getAttribute('data-wahl'));
    });
  });
  $('rolle-wechseln').addEventListener('click', function () { schritt(1); });
  $('to-login2').addEventListener('click', function () { show('login'); });

  /* ---------- Passwortstaerke ---------- */
  var pwField = $('reg-pw');
  var bars = [$('pb1'), $('pb2'), $('pb3'), $('pb4')];
  pwField.addEventListener('input', function () {
    var res = SP.pwScore(pwField.value);
    bars.forEach(function (b, i) { b.className = i < res.score ? 'on' + res.score : ''; });
    d.querySelectorAll('#pw-rules li').forEach(function (li) {
      li.classList.toggle('ok', !!res.rules[li.getAttribute('data-rule')]);
    });
  });

  /* ---------- Hilfen ---------- */
  function markiere(el, msgId, fehler) {
    if (el) el.setAttribute('aria-invalid', fehler ? 'true' : 'false');
    var m = msgId && $(msgId);
    if (m) m.classList.toggle('show', fehler);
    return !fehler;
  }
  var mailRe = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
  var versuche = 0;

  /* ---------- Anmeldung ---------- */
  $('form-login').addEventListener('submit', function (e) {
    e.preventDefault();
    if ($('fax').value !== '') { SP.audit('Anmeldung blockiert', 'Honeypot ausgefuellt'); return; }

    var mail = $('login-mail').value.trim();
    var pw = $('login-pw').value;
    var ok = markiere($('login-mail'), 'err-mail', !mailRe.test(mail));
    ok = markiere($('login-pw'), 'err-pw', pw.length < 1) && ok;
    if (!ok) return;

    versuche++;
    if (versuche > 5) {
      SP.toast('err', SP.t('Zu viele Versuche'),
        SP.t('Aus Sicherheitsgründen ist der Zugang für 15 Minuten gesperrt.'));
      SP.audit('Anmeldung gesperrt', 'Ratenbegrenzung erreicht');
      return;
    }

    SP.db.konten.pruefen(mail, pw).then(function (konto) {
      if (!konto) {
        /* Bewusst unspezifisch: verraet nicht, ob die Adresse existiert */
        SP.toast('err', SP.t('Anmeldung fehlgeschlagen'), SP.t('E-Mail-Adresse oder Passwort ist falsch.'));
        SP.audit('Anmeldung fehlgeschlagen', 'Faktor 1');
        return;
      }
      wartet = konto;
      SP.audit('Anmeldeversuch', 'Faktor 1 erfolgreich');
      show('mfa');
      $('otp').querySelector('input').focus();
      SP.toast('info', SP.t('Zweiter Faktor erforderlich'), SP.t('Bitte Code aus der Authenticator-App eingeben.'));
    });
  });

  /* ---------- Registrierung ---------- */
  $('form-reg').addEventListener('submit', function (e) {
    e.preventDefault();
    var vor = SP.clean($('reg-vor').value, 60);
    var nach = SP.clean($('reg-nach').value, 60);
    var mail = $('reg-mail').value.trim();
    var pw = $('reg-pw').value;
    var gewaehlteRolle = aktiveRolle();

    var ok = true;
    ok = markiere($('reg-vor'), null, vor.length < 2) && ok;
    ok = markiere($('reg-nach'), null, nach.length < 2) && ok;
    ok = markiere($('reg-mail'), null, !mailRe.test(mail)) && ok;
    ok = markiere($('reg-pw'), null, SP.pwScore(pw).score < 4) && ok;
    ok = markiere(null, 'err-agb', !$('ok-agb').checked) && ok;

    if (!ok) {
      SP.toast('warn', SP.t('Bitte Eingaben prüfen'),
        SP.t('Das Passwort muss alle vier Kriterien erfüllen und die Zustimmung ist erforderlich.'));
      return;
    }

    SP.db.konten.anlegen({
      rolle: gewaehlteRolle, mail: mail, passwort: pw,
      name: vor + ' ' + nach, newsletter: $('ok-mail').checked
    }).then(function (konto) {
      var firma = SP.clean($('reg-firma').value, 80);
      if (gewaehlteRolle === 'arbeitgeber' && firma) SP.db.profile.speichern(konto.id, { firma: firma });
      wartet = konto;
      schritt(3);
      show('mfa');
      $('otp').querySelector('input').focus();
      SP.toast('ok', SP.t('Konto angelegt'), SP.t('Richten Sie jetzt die Zwei-Faktor-Authentifizierung ein.'));
    }).catch(function (fehler) {
      markiere($('reg-mail'), null, true);
      SP.toast('err', SP.t('Registrierung nicht möglich'), fehler.message);
    });
  });

  /* ---------- Zweiter Faktor ---------- */
  var otpInputs = Array.prototype.slice.call($('otp').querySelectorAll('input'));
  otpInputs.forEach(function (inp, i) {
    inp.addEventListener('input', function () {
      inp.value = inp.value.replace(/\D/g, '').slice(0, 1);
      if (inp.value && i < otpInputs.length - 1) otpInputs[i + 1].focus();
    });
    inp.addEventListener('keydown', function (ev) {
      if (ev.key === 'Backspace' && !inp.value && i > 0) otpInputs[i - 1].focus();
    });
    inp.addEventListener('paste', function (ev) {
      ev.preventDefault();
      var txt = (ev.clipboardData || w.clipboardData).getData('text').replace(/\D/g, '');
      otpInputs.forEach(function (f, k) { f.value = txt.charAt(k) || ''; });
      otpInputs[Math.min(txt.length, 5)].focus();
    });
  });

  $('form-2fa').addEventListener('submit', function (e) {
    e.preventDefault();
    var code = otpInputs.map(function (i) { return i.value; }).join('');
    if (code.length !== 6) { $('err-otp').classList.add('show'); return; }
    $('err-otp').classList.remove('show');
    if (!wartet) { show('login'); return; }

    var profil = SP.db.profile.holen(wartet.id);
    SP.session.start({
      kontoId: wartet.id,
      user: wartet.name,
      org: (profil && profil.firma) || kontoArt(wartet.rolle),
      role: wartet.rolle,
      mfa: true
    });

    /* Unvollstaendiges Profil zuerst ausfuellen lassen */
    var ziel = SP.safeHref(params.get('ziel') || '');
    if (ziel === '#') {
      ziel = SP.db.profile.vollstaendig(profil) < 60
        ? 'standardplus-profil.html?neu=1'
        : (wartet.rolle === 'arbeitnehmer' ? 'standardplus-profil.html' : 'standardplus-dashboard.html');
    }
    w.location.href = ziel;
  });

  /* Beschriftung des Kontos, solange noch kein Firmenname hinterlegt ist */
  function kontoArt(rolle) {
    if (rolle === 'arbeitgeber') return SP.t('Unternehmen');
    if (rolle === 'transport') return SP.t('Beförderungsunternehmen');
    return SP.t('Privatkonto');
  }

  /* ---------- Nebenfunktionen ---------- */
  $('forgot').addEventListener('click', function (e) {
    e.preventDefault();
    SP.toast('info', SP.t('Zurücksetzen angefordert'),
      SP.t('Produktiv wird ein einmaliger Link mit 30 Minuten Gültigkeit versendet – ohne Hinweis darauf, ob die Adresse existiert.'));
  });
  $('recovery').addEventListener('click', function () {
    SP.toast('info', SP.t('Wiederherstellungscode'),
      SP.t('Bei der Einrichtung erhalten Sie zehn Einmalcodes. Jeder Code ist genau einmal gültig.'));
  });

})(window, document);
